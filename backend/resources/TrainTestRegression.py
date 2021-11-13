import os
import traceback
import numpy as np
import uuid
import pandas as pd
from pycaret.regression import *
from utils import utils
import matplotlib.pyplot as plt
from flask_restful import Resource
from dask.distributed import Client
from flask import request, current_app
from flask_jwt_extended import jwt_required
from sklearn.metrics import make_scorer, SCORERS
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from flask import Response
from utils.utils import get_extension_from_path, delete_file

class TrainTestRegression(Resource):
    
    def get_dataframe_from_csv(self, file, sep):
        df = pd.read_csv(file, sep=sep, na_values='?')
        return df

    def get_filename_from_path(self, extension):
        payload = request.get_json()
        path = payload['path']
        filename = os.path.basename(path).replace('.csv', extension)

        return filename

    def get_df_without_one_hot_encoding(self, df, target):
        df_categoric = df.copy()
        df_categoric = df_categoric.select_dtypes(include=['object'])
        df = df.drop(df_categoric.columns, axis=1)
        df_x = df.copy()
        return df_x

    def get_normalize_data(self, df, target):
        X = df[:,0]
        y = [0,0]
        for i in range(len(X)-2):
            y.append(X[i+1])
        y = np.array(y)
        return pd.DataFrame({'X': X, target:y})

    def save_file(self, file):
        extension = get_extension_from_path(file.filename)
        upload_folder = current_app.config.get('UPLOAD_FOLDER')
        file_id = f"{str(uuid.uuid4())}{extension}"

        if file and self.allowed_file(file.filename):
            file.save(os.path.join(upload_folder, file_id))
        return os.path.join(upload_folder, file_id)

    # @jwt_requiredKP
    def post(self):
        try:
            payload = {
                'file': request.files['file'],
                'separator': request.form['separator'],
                'train': request.form['train'],
                'target': request.form['target']
            }
            mandatory_fields = ['file','separator', 'train', 'target']

            for field in mandatory_fields:
                if field not in payload:
                    return {'msg': f'{field} not found'}, 500
            
            train = int(payload['train']) / 100            
            target = payload['target']
            file = request.files['file']
            separator = payload['separator']
            # generations = payload['generations']

            df = self.get_dataframe_from_csv(file, separator)

            df_without_categoric = self.get_df_without_one_hot_encoding(df, target)
            scaler = MinMaxScaler()
            df = scaler.fit_transform(df_without_categoric)

            df_normalized = self.get_normalize_data(df, target)

            df_train = pd.DataFrame()
            df_train = df_normalized[:int(len(df_normalized)*train)]

            clf1 = setup(df_train, target = target, silent = True)
            top5 = compare_models(n_select=5, exclude=['omp'])

            # tune top 3 base models
            tuned_top5 = [tune_model(i) for i in top5]
            # ensemble top 3 tuned models
            bagged_top5 = [ensemble_model(i) for i in tuned_top5]
            # blend top 3 base models 
            blender = blend_models(estimator_list = top5)
            # select best model 
            best = automl(optimize = 'R2')


            df_test = pd.DataFrame()
            df_test = df_normalized[int(len(df_normalized)*train):]
            y_pred = best.predict(df_test['X'].values.reshape(-1, 1))
            y_test_desnormalized = scaler.inverse_transform([df_test[target]])
            y_pred_desnormalized = scaler.inverse_transform([y_pred])

            result = pd.DataFrame()
            result['real'] = y_test_desnormalized.tolist()[0]
            result['predicted'] = y_pred_desnormalized.tolist()[0]

            temp_folder = current_app.config.get('TEMP_FOLDER')

            id = str(uuid.uuid4()) 

            resultCsv = 'Resultado - '+ id + '.csv'
            result.to_csv(os.path.join(temp_folder, resultCsv), index = False, header=True, sep = ';')

            plot_model(best, 'error', save=True)
            errorImage = temp_folder + '/error - ' + id + '.png'
            print(errorImage)
            os.rename(os.path.join(os.path.abspath(os.curdir), 'Prediction Error.png'), os.path.join(os.path.abspath(os.curdir), errorImage))

            plot_model(best, 'cooks', save=True)
            cooksImage = temp_folder + '/cooks - ' + id + '.png'
            os.rename(os.path.join(os.path.abspath(os.curdir), 'Cooks Distance.png'), os.path.join(os.path.abspath(os.curdir), cooksImage))

            plot_model(best, 'residuals', save=True)
            residualsImage = temp_folder + '/residuals - ' + id + '.png'
            os.rename(os.path.join(os.path.abspath(os.curdir), 'Residuals.png'), os.path.join(os.path.abspath(os.curdir), residualsImage))

            plot_model(best, plot='learning', save=True)
            residualsImage = temp_folder + '/learning_curve - ' + id + '.png'
            os.rename(os.path.join(os.path.abspath(os.curdir), 'Learning Curve.png'), os.path.join(os.path.abspath(os.curdir), residualsImage))

            nameModel = 'model-saved - '+ id
            save_model(best, nameModel)
            modelSaved = temp_folder + '/' + nameModel + '.pkl'
            os.rename(os.path.join(os.path.abspath(os.curdir),  nameModel + '.pkl'), os.path.join(os.path.abspath(os.curdir), modelSaved))
            
            best_model_results = pull()
            best_models_csv = 'Score-grid - ' + id + '.csv'
            best_model_results[best_model_results.index.isin([0,1,2,3,4])].to_csv(os.path.join(temp_folder, best_models_csv), index = False, header=True, sep = ';')

            top5_models_parameters = 'top5_models_and_parameters - ' + id + '.txt'
            arquivo = open(top5_models_parameters, 'a')
            arquivo.write(str(top5))
            arquivo.close()
            os.rename(os.path.join(os.path.abspath(os.curdir), top5_models_parameters), os.path.join(os.path.abspath(os.curdir), 'data/tmp/' + top5_models_parameters))


            best_model_parameters = 'best_model_and_parameters - ' + id + '.txt'
            arquivo = open(best_model_parameters, 'a')
            arquivo.write(str(best))
            arquivo.close()
            os.rename(os.path.join(os.path.abspath(os.curdir), best_model_parameters), os.path.join(os.path.abspath(os.curdir), 'data/tmp/' + best_model_parameters))

            df = pd.DataFrame()
            df['real'] = y_test_desnormalized.tolist()[0]
            df['predicted'] = y_pred_desnormalized.tolist()[0]
            plt.plot(df.index, y_test_desnormalized[0], color = 'red', label = 'Real value')
            plt.plot(df.index, y_pred_desnormalized[0], color = 'blue', label = 'Predicted value')
            real_predicted = 'real x predict - '+ id +'.png'
            plt.savefig(real_predicted)
            os.rename(os.path.join(os.path.abspath(os.curdir), real_predicted), os.path.join(os.path.abspath(os.curdir), 'data/tmp/' + real_predicted))


            

            return {
                'id': id
            }

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
