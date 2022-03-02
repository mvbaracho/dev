import os
import sys
import joblib
import wget
import traceback
import uuid
import time
import base64
from html2image import Html2Image
import numpy as np
import imgkit
from sklearn.decomposition import PCA
import pandas as pd
import matplotlib.pyplot as plt
from utils import utils
from flask_restful import Resource
from dask.distributed import Client
from flask import request, current_app
from Model import FileModel, FileModelSchema
from flask_jwt_extended import jwt_required
from sklearn.metrics import make_scorer, SCORERS
from pycaret.clustering import *

# Aqui o algoritmo é treinado através de pycaret para retornar os dados necessários7
# OBS.: Ao rodar o algoritmo novamente, o gráfico elbow pode não aparecer. Isso é um
# bug a ser resolvido. Esse bug só não acontece se der refresh(Ctrl + S) no arquivo TrainClustering
# antes de rodar novamente
class TrainClustering(Resource):


    def get_dataframe_from_csv(self, file_from_db):
        # foi necessário utilizar engine=python para reconhecer o separador
        df = pd.read_csv(file_from_db, sep=None, engine="python", na_values='?')
        columns = df.columns
        return df, columns

    def get_df_without_one_hot_encoding(self, target):
        df = self.get_dataframe_from_csv()
        df_categoric = df.copy()
        df_categoric = df_categoric.select_dtypes(include=['object'])
        df = df.drop(df_categoric.columns, axis=1)
        df_x = df.copy()

        del df_x[target]

        return df, df_x

    def get_filename_from_path(self, extension):
        payload = request.get_json()
        path = payload['path']
        filename = os.path.basename(path).replace('.csv', extension)

        return filename

    def save_split(self, df, split_type):
        filename = self.get_filename_from_path('.csv')
        filename = f"{current_app.config.get(split_type)}/{filename}"

        df.to_csv(filename, index=False)

# FEITO POR DANIEL
    def checkDistributionFeature(self, distrib_feature, columns):
        if distrib_feature not in columns or distrib_feature == "":
            print("A feature não existe ou está vazia")
            distrib_feature = None

        return distrib_feature

    def getNumericFeat(self,num_features, columns):

        if num_features == "":
            num_feat = []
        else:
            num_feat  = num_features.split(',')
            num_feat = [x.rstrip().lstrip() for x in num_feat]
        
        try:
            for elem in num_feat:
                if elem not in columns:
                    sys.exit("(Value Error): Numeric feature doesn't exist")
        except:
                traceback.print_exc()
                return {"msg": "Error on get Numeric Features"}, 500   
        else:
            return num_feat
    
    # Obtém as features a ignorar
    def getFeaturesToIgnore(self,selectedFeatures, columns):
        # o "set" serve para eliminar caso haja coluna duplicada
        s_features = list(set(selectedFeatures))
        ignored = [x for x in columns if x not in s_features]
        return ignored

    # Inicializa o ambiente pycaret e pré-processa os dados
    def start_clustering(self, data, normalize, normalizationtype, num_features, features_ignored):
        
        print('Tipo:  ' , type(features_ignored))
        print('Features a ignorar: ', features_ignored)
        #print('esses são os dados', data)
        print('Normalizar: ', normalize)
        print('Features numéricas', num_features)
        exp_clu101 = setup(data, normalize=normalize, normalize_method=normalizationtype, log_experiment=True, numeric_features=num_features, ignore_features=features_ignored, session_id=123, silent=True)
        return exp_clu101

    # Cria o modelo para usar posteriormente
    def create_clustering(self, algorithm, num_clusters):
        if algorithm != 'dbscan':
            if num_clusters == '':
                num_clusters = 4
            model = create_model(algorithm, num_clusters=int(num_clusters))
        else:
            model = create_model(algorithm)

        return model
        
    # atribui as labels dos clusters e retorna um dataframe
    def assign_model(self, model):
        model_results = assign_model(model)
        return model_results

    def get_metrics(self):
        metrics = {}
        logs = get_logs()
        metrics['Silhouette'] = logs['metrics.Silhouette'][0]
        metrics['DaviesBouldin'] = logs['metrics.Davies-Bouldin'][0]
        metrics['CalinskiHarabasz'] = logs['metrics.Calinski-Harabasz'][0]
        return metrics

    def getFile(self, id):
        try: # Essa query obtém a fonte de dados, retornando o path dela, a ser usada para o pandas dataframe
            query = f"""SELECT files.file_id FROM files INNER JOIN datasources
                        ON (files.id = datasources.file_id)
                        WHERE datasources.id = {id};
                    """

            temp = utils.execute_query(query)
            # junta a upload folder "data/upload" com o path do arquivo
            path = f"{current_app.config.get('UPLOAD_FOLDER')}/{temp[0]['file_id']}"
            return path

        except:
            traceback.print_exc()
            return {'msg': f"Error on get file"}, 500    

    #@jwt_required
    def post(self):
        try:    
        
            payload = request.get_json()

            mandatory_fields = ['algorithm','normalize','id']

            for field in mandatory_fields:
                if field not in payload:
                    return {'msg': f'{field} not found'}, 500

            
            num_clusters = payload['num_clusters']
            normalize = payload['normalize']
            normalizationtype = payload['normalizationtype']
            algorithm = payload['algorithm']
            file_id = payload['id']
            selectedFeatures = payload['featuresList']
            #obtém o path do banco para ser usado quando for ler o dataframe
            file_from_db = self.getFile(file_id)
            #Cria uma pasta temporária a ser usada depois
            temp_folder = current_app.config.get('TEMP_FOLDER')

            df, columns = self.get_dataframe_from_csv(file_from_db)
            features_to_ignore = self.getFeaturesToIgnore(selectedFeatures,columns)
            print('NOVO TESTE FEATURES: ', features_to_ignore)
            distrib_feature = self.checkDistributionFeature(payload['distrib_feature'], columns)
            numeric_features = self.getNumericFeat(payload['num_features'], columns)
            #inicia o setup para realizar a clusterização
            clust_21 = self.start_clustering(df, normalize, normalizationtype, numeric_features, features_to_ignore)
            #cria o modelo de acordo com o algoritmo passado
            model = self.create_clustering(algorithm, num_clusters)
            #Obtém as métricas do modelo
            metrics = self.get_metrics()
            print('As métricas são: ' , metrics)
            # chama a função para atribuir as labels dos clusters ao dataframe
            df_cluster = self.assign_model(model)
            # retorna o dataframe já com os grupos atribuídos
            print(df_cluster)
            #gera um id aleatório
            id = str(uuid.uuid4())

            # Gera  para CSV o dataframe resultante do modelo
            ClusteringCsv = 'Resultado - '+ id + '.csv'
            df_cluster.to_csv(os.path.join(temp_folder, ClusteringCsv), index = False, header=True, sep = ';')
            
            # gera o plot cluster e joga na pasta tmp
            plot_model(model, plot='cluster', save=True)
            clusterImage = temp_folder + '/cluster - ' + id + '.png'
            hti = Html2Image()
            hti.screenshot(other_file='Cluster.html',size = (1000, 600))
            print(clusterImage)
            os.rename(os.path.join(os.path.abspath(os.curdir), 'screenshot.png'), os.path.join(os.path.abspath(os.curdir), clusterImage))

            # gera o plot distribution e joga na pasta tmp
            plot_model(model, plot='distribution', feature=distrib_feature, save=True)
            distributionImage = temp_folder + '/distribution - ' + id + '.png'
            hti = Html2Image()
            hti.screenshot(other_file='Distribution.html',size = (1000, 600))
            os.rename(os.path.join(os.path.abspath(os.curdir), 'screenshot.png'), os.path.join(os.path.abspath(os.curdir),distributionImage))
            

            if algorithm != 'dbscan':
                # dbscan não utiliza elbow
                plot_model(model, plot='elbow', save=True)
                elbowImage = temp_folder + '/elbow - ' + id + '.png'
                os.rename(os.path.join(os.path.abspath(os.curdir), 'Elbow.png'), os.path.join(os.path.abspath(os.curdir), elbowImage))
            
            # salva o modelo numa pasta específica
            modelName = 'model-saved - ' + id
            save_model(model, modelName)
            savedModel = temp_folder + '/' + modelName + '.pkl'
            os.rename(os.path.join(os.path.abspath(os.curdir),  modelName + '.pkl'), os.path.join(os.path.abspath(os.curdir), savedModel))

            if (algorithm != 'dbscan' and algorithm != 'hclust'):
                # dbscan e hclust não suportam silhouette
                plot_model(model, plot='silhouette', save=True)
                silhouetteImage = temp_folder + '/silhouette - ' + id + '.png'
                os.rename(os.path.join(os.path.abspath(os.curdir), 'Silhouette.png'), os.path.join(os.path.abspath(os.curdir), silhouetteImage))


            return {"saida":df_cluster['Cluster'].to_json(orient="split"), "metricas": metrics, "id": id}
        
        except:
            traceback.print_exc()
            return {"msg": "Error on POST Train"}, 500

    @jwt_required
    def delete(self):
        try:
            filename = self.get_filename_from_path('')
            utils.delete_model_files(filename)

            return {'msg': 'Deleted with successful'}

        except:
            traceback.print_exc()
            return {"msg": "Error on DELETE Train"}, 500

            
