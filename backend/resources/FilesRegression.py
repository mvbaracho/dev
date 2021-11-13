import os
from IPython.core.display import JSON
from flask_restful import Resource
from dask.distributed import Client
from flask import Blueprint
from io import BytesIO
from flask import send_from_directory

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

        images_regression = ['cooks', 'error', 'learning_curve', 'real x predict', 'residuals']
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
        top5_models_parameters = 'top5_models_and_parameters - ' + id + '.txt'

        return send_from_directory(temp_folder, top5_models_parameters, as_attachment = True)

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