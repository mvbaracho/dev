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
files_clustering = Blueprint('files_clustering', __name__, url_prefix='/api')

# Função que obtém as imagens dos gráficos de clusterização, de acordo com o algoritmo escolhido
@files_clustering.route('/images-clustering/<string:id>/<string:algorithm>', methods=['GET'])
def get_images_clustering(id, algorithm):
    try:
        
        if not id:
            return {'msg': f'{id} is empty'}, 500
        
        if not algorithm:
            return {'msg': f'{algorithm} is empty'}, 500

        if (algorithm != 'dbscan' and algorithm != 'hclust'):
            images_clustering = ['cluster', 'distribution', 'elbow', 'silhouette']
        else:
            # DBSCAN só suporta gráficos de cluster e distribution
            if algorithm == 'dbscan':
                images_clustering = ['cluster', 'distribution']
            # hclust só suporta gráficos de cluster, distribution e elbow
            if algorithm == 'hclust':
                images_clustering = ['cluster', 'distribution', 'elbow']

        temp_folder = current_app.config.get('TEMP_FOLDER')
        resp = {}
        for image_name in images_clustering:
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



# Função que retorna o excel clusterizado para o front end
@files_clustering.route('/result/<string:id>', methods=['GET'])
def result_clustering(id):
    try:
        
        if not id:
            return {'msg': f'{id} is empty'}, 500
        

        temp_folder = current_app.config.get('TEMP_FOLDER')
        file_name = 'Resultado - ' + id + '.csv'
        return send_from_directory(temp_folder, file_name, as_attachment = True)

    except:
        traceback.print_exc()
        return {"msg": "Error on GET Download"}, 500

