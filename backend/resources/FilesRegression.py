import os
from IPython.core.display import JSON
from flask_restful import Resource
from dask.distributed import Client
from flask import Blueprint
from io import BytesIO
from flask import send_from_directory
from zipfile import ZipFile


import traceback
from flask import request, current_app, make_response, jsonify, Response
from flask_jwt_extended import jwt_required
from flask import send_file
import base64
from PIL import Image

def get_response_image(image_path):
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read())
        return encoded_string.decode('utf-8')

# @jwt_requiredKP
files_regression = Blueprint('files_regression', __name__, url_prefix='/api')

@files_regression.route('/images-regression/<string:id>', methods=['GET'])
def get_images_regression(id):
    try:
        
        if not id:
            return {'msg': f'{id} is empty'}, 500

        images_regression = ['cooks', 'error', 'learning_curve', 'real_predict', 'residuals']
        temp_folder = current_app.config.get('TEMP_FOLDER')
        resp = {}
        for image_name in images_regression:
            path_image = temp_folder + '/' + image_name + ' - ' + id + '.png'
            encoded_image = get_response_image(path_image)
            resp[image_name] = str(encoded_image) 
        
        response = make_response(
            jsonify(
                resp
            ),
            200
        )
        return response

    except:
        traceback.print_exc()
        return {"msg": "Error on POST Train"}, 500


@files_regression.route('/result/<string:id>', methods=['GET'])
def result_regression(id):
    try:
        
        if not id:
            return {'msg': f'{id} is empty'}, 500
        

        temp_folder = current_app.config.get('TEMP_FOLDER')
        file_name = 'Resultado - ' + id + '.csv'
        return send_from_directory(temp_folder, file_name, as_attachment = True)

    except:
        traceback.print_exc()
        return {"msg": "Error on POST Train"}, 500


@files_regression.route('/score-grid-models/<string:id>', methods=['GET'])
def score_models_regression(id):
    try:
        
        if not id:
            return {'msg': f'{id} is empty'}, 500
        

        temp_folder = current_app.config.get('TEMP_FOLDER')
        best_grid_csv = 'Score-grid - ' + id + '.csv'
        return send_from_directory(temp_folder, best_grid_csv, as_attachment = True)

    except:
        traceback.print_exc()
        return {"msg": "Error on POST Train"}, 500

@files_regression.route('/best-model/<string:id>', methods=['GET'])
def best_model_regression(id):
    try:
        
        if not id:
            return {'msg': f'{id} is empty'}, 500
        

        temp_folder = current_app.config.get('TEMP_FOLDER')
        modelSaved = 'model-saved - '+ id + '.pkl'

        return send_from_directory(temp_folder, modelSaved, as_attachment = True)

    except:
        traceback.print_exc()
        return {"msg": "Error on POST Train"}, 500

@files_regression.route('/top-five/<string:id>', methods=['GET'])
def top5_regression(id):
    try:
        
        if not id:
            return {'msg': f'{id} is empty'}, 500
        

        temp_folder = current_app.config.get('TEMP_FOLDER')
        compare_table = 'compare_table - ' + id + '.csv'


        return send_from_directory(temp_folder, compare_table, as_attachment = True)

    except:
        traceback.print_exc()
        return {"msg": "Error on POST Train"}, 500

@files_regression.route('/best-parameters-model/<string:id>', methods=['GET'])
def best_parameters_model_regression(id):
    try:
        
        if not id:
            return {'msg': f'{id} is empty'}, 500
        

        temp_folder = current_app.config.get('TEMP_FOLDER')
        best_model_parameters = 'best_model_and_parameters - ' + id + '.txt'


        return send_from_directory(temp_folder, best_model_parameters, as_attachment = True)

    except:
        traceback.print_exc()
        return {"msg": "Error on POST Train"}, 500

@files_regression.route('/rmse/<string:id>', methods=['GET'])
def rmse(id):
    try:
        
        if not id:
            return {'msg': f'{id} is empty'}, 500
        

        temp_folder = current_app.config.get('TEMP_FOLDER')
        best_model_parameters = 'rmse - ' + id + '.txt'


        return send_from_directory(temp_folder, best_model_parameters, as_attachment = True)

    except:
        traceback.print_exc()
        return {"msg": "Error on POST Train"}, 500


@files_regression.route('/files-download/<string:id>', methods=['GET'])
def get_zip_files(id):
    try:
        
        if not id:
            return {'msg': f'{id} is empty'}, 500
        

        temp_folder = current_app.config.get('TEMP_FOLDER')
        resultCsv = temp_folder + '/Resultado - '+ id + '.csv'
        compare_table = temp_folder + '/compare_table - ' + id + '.csv'
        real_predicted = temp_folder + '/real_predict - '+ id +'.png'
        errorImage = temp_folder + '/error - ' + id + '.png'
        cooksImage = temp_folder + '/cooks - ' + id + '.png'
        residualsImage = temp_folder + '/residuals - ' + id + '.png'
        learning_curve = temp_folder + '/learning_curve - ' + id + '.png'
        modelSaved = temp_folder + '/model-saved - '+ id + '.pkl'
        rmseName = temp_folder + '/rmse - ' + id + '.txt'    

        zipfile = 'files - ' + id + '.zip'
        best_model_parameters = temp_folder + '/best_model_and_parameters - ' + id + '.txt'
        
        files = [resultCsv, compare_table, real_predicted, errorImage, cooksImage, residualsImage, learning_curve, modelSaved, best_model_parameters, rmseName]
        zipObj = ZipFile(zipfile, 'w')
        for file in files:
            zipObj.write(file)
        zipObj.close()

        os.rename(os.path.join(os.path.abspath(os.curdir),  zipfile), os.path.join(os.path.abspath(os.curdir), temp_folder + '/' + zipfile))


        return send_from_directory(temp_folder, zipfile, mimetype="application/zip", as_attachment = True)

    except:
        traceback.print_exc()
        return {"msg": "Error on POST Train"}, 500