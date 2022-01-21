import os
import traceback
import numpy as np
import uuid
import pandas as pd
from pycaret.regression import *
from utils import utils
import matplotlib.pyplot as plt
from flask_restful import Resource
from flask import request, current_app
from flask_jwt_extended import jwt_required
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from yellowbrick.regressor import PredictionError, ResidualsPlot, CooksDistance
from yellowbrick.model_selection import LearningCurve

class TrainTestRegression(Resource):
    def get_dataframe_from_csv(self, file, sep):
        df = pd.read_csv(file, sep=sep, na_values='?')
        return df

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

    # helper function to get a nice model name
    def get_model_name(self, e) :
        mn = str(e).split("(")[0]
        return mn

    def save_residuals_plot(self, model, X_train, y_train, X_test, y_test, temp_folder, id):
        visualizer_residuals = ResidualsPlot(model)
        visualizer_residuals.fit(X_train, np.squeeze(y_train))
        visualizer_residuals.score(X_test, np.squeeze(y_test)) 
        visualizer_residuals.show(outpath=temp_folder + '/residuals - ' + id + '.png')
        plt.clf()
        return

    def save_learning_curve_plot(self, best, X_train, y_train, temp_folder, id):
        visualizerLearningCurve = LearningCurve(best, scoring='r2')
        visualizerLearningCurve.fit(X_train, y_train)
        visualizerLearningCurve.show(outpath=temp_folder + '/learning_curve - ' + id + '.png')
        plt.clf()
        return

    def save_prediction_error_plot(self, best, X_train, y_train, X_test, y_test, temp_folder, id):
        visualizer_prediction_error = PredictionError(best)
        visualizer_prediction_error.fit(X_train, np.squeeze(y_train))
        visualizer_prediction_error.score(X_test, np.squeeze(y_test)) 
        visualizer_prediction_error.show(outpath=temp_folder + '/error - ' + id + '.png')
        plt.clf()
        return

    def save_cooks_distance_plot(self, X_train, y_train, temp_folder, id):
        visualizer = CooksDistance()
        visualizer.fit(X_train, np.squeeze(y_train))
        visualizer.show(outpath=temp_folder + '/cooks - ' + id + '.png')
        plt.clf()
        return

    def save_real_predicted_plot(self, result, y_test_desnormalized, y_pred_desnormalized, temp_folder, id):
        plt.plot(result.index, y_test_desnormalized, color = 'red', label = 'Real value')
        plt.plot(result.index, y_pred_desnormalized, color = 'blue', label = 'Predicted value')
        plt.legend()
        real_predicted = 'real_predict - '+ id +'.png'
        plt.savefig(temp_folder+"/"+real_predicted)
        plt.close()
        return

    def save_plots(self, best, X_train, y_train, X_test, y_test, temp_folder, id):
        self.save_residuals_plot(best, X_train, y_train, X_test, y_test, temp_folder, id)
        self.save_learning_curve_plot(best, X_train, y_train, temp_folder, id)
        self.save_prediction_error_plot(best, X_train, y_train, X_test, y_test, temp_folder, id)
        self.save_cooks_distance_plot(X_train, y_train, temp_folder, id)
        return

    def save_csv_result(self, result, temp_folder, id):
        resultCsv = 'Resultado - '+ id + '.csv'
        result.to_csv(os.path.join(temp_folder, resultCsv), index = False, header=True, sep = ';')
        return

    def save_best_model(self, best_model_results, temp_folder, id):
        best_models_csv = 'Score-grid - ' + id + '.csv'
        best_model_results[best_model_results.index.isin([0,1,2,3,4])].to_csv(os.path.join(temp_folder, best_models_csv), index = False, header=True, sep = ';')
        return

    def save_top5(self, top5, temp_folder, id):
        top5_models_parameters = 'top5_models_and_parameters - ' + id + '.csv'
        arquivo = open(top5_models_parameters, 'a')
        to5Array = []
        for model in top5:
            to5Array.append(self.get_model_name(model))
        top5df = pd.DataFrame(to5Array)
        top5df.to_csv(top5_models_parameters, header=['Modelo'], sep=';')
        os.rename(os.path.join(os.path.abspath(os.curdir), top5_models_parameters), os.path.join(os.path.abspath(os.curdir), temp_folder + '/' + top5_models_parameters))
        return top5df

    def save_compare_table(self, top5_df, best_model_results, temp_folder, id):
        compare_table = 'compare_table - ' + id + '.csv'
        compare_top5 = best_model_results[best_model_results.index.isin([0,1,2,3,4])].combine_first(top5_df)
        compare_top5.to_csv(compare_table, header=['Modelo','MAE','MAPE','MSE','R2','RMSE','RMSLE'], sep=';', index = False)
        os.rename(os.path.join(os.path.abspath(os.curdir), compare_table), os.path.join(os.path.abspath(os.curdir), temp_folder + '/' +  compare_table))
        return

    def save_best_model(self, best, temp_folder, id):
        best_model_parameters = 'best_model_and_parameters - ' + id + '.txt'
        arquivo = open(best_model_parameters, 'a')
        arquivo.write(str(best))
        arquivo.close()
        os.rename(os.path.join(os.path.abspath(os.curdir), best_model_parameters), os.path.join(os.path.abspath(os.curdir), temp_folder + '/' +  best_model_parameters))
        return
    
    def save_rmse(self, y_test, y_pred, temp_folder, id):
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        rmseName = 'rmse - ' + id + '.txt'
        arquivo = open(rmseName, 'a')
        arquivo.write(str(rmse))
        arquivo.close()
        os.rename(os.path.join(os.path.abspath(os.curdir), rmseName), os.path.join(os.path.abspath(os.curdir), temp_folder + '/' + rmseName))
        return

    def get_data(self, file, separator, target, train, scaler):
        df = self.get_dataframe_from_csv(file, separator)
        df_without_categoric = self.get_df_without_one_hot_encoding(df, target)
        df = scaler.fit_transform(df_without_categoric)
        df_normalized = self.get_normalize_data(df, target)
        df_train = pd.DataFrame()
        X_train, X_test, y_train, y_test = train_test_split(df_normalized['X'].values.reshape(-1,1), df_normalized[target].values.reshape(-1,1),train_size=train,shuffle=False)
        df_train['X'] = np.squeeze(X_train)
        df_train[target] = np.squeeze(y_train)
        return df_train, X_train, X_test, y_train, y_test

    @jwt_required
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

            temp_folder = current_app.config.get('TEMP_FOLDER')
            id = str(uuid.uuid4())
            scaler = MinMaxScaler()

            df_train, X_train, X_test, y_train, y_test = self.get_data(file, separator, target, train, scaler)
            
            clf1 = setup(df_train, target = target, silent = True)

            top5 = compare_models(n_select=5, exclude=['omp'])

            # tune top 3 base models
            tuned_top5 = [tune_model(i, n_iter=50) for i in top5]
            # ensemble top 3 tuned models
            bagged_top5 = [ensemble_model(i) for i in tuned_top5]
            # blend top 3 base models
            blender = blend_models(estimator_list = top5)
            # select best model
            best = automl(optimize = 'RMSE')

            y_pred = best.predict(X_test)
            y_test_desnormalized = scaler.inverse_transform(y_test)
            y_pred_desnormalized = scaler.inverse_transform(y_pred.reshape(-1, 1))

            result = pd.DataFrame()
            result['real'] = y_test_desnormalized[:,0].tolist()
            result['predicted'] = y_pred_desnormalized[:,0].tolist()

            self.save_plots(best, X_train, y_train, X_test, y_test, temp_folder, id)
            self.save_real_predicted_plot(result, y_test_desnormalized, y_pred_desnormalized, temp_folder, id)
            self.save_csv_result(result, temp_folder, id)
            best_model_results = pull()
            self.save_best_model(best_model_results, temp_folder, id)
            top5_df = self.save_top5(top5, temp_folder, id)
            self.save_compare_table(top5_df, best_model_results, temp_folder, id)

            self.save_best_model(best, temp_folder, id)

            self.save_rmse(y_test, y_pred, temp_folder, id)

            nameModel = 'model-saved - '+ id
            save_model(best, nameModel)
            modelSaved = temp_folder + '/' + nameModel + '.pkl'
            os.rename(os.path.join(os.path.abspath(os.curdir),  nameModel + '.pkl'), os.path.join(os.path.abspath(os.curdir), modelSaved))

            return {
                'id': id
            }

        except:
            traceback.print_exc()
            return {"msg": "Error on POST Train"}, 500