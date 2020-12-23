import boto3
import os
import sys
import uuid
from urllib.parse import unquote_plus

import json

s3_client = boto3.client('s3')
rekognition_client = boto3.client('rekognition')

def lambda_handler(event, context):
    
    for record in event['Records']:
        
        bucket = record['s3']['bucket']['name']
        
        key = unquote_plus(record['s3']['object']['key'])
        
        download_path = '/tmp/{}{}'.format(uuid.uuid4(), key)
        s3_client.download_file(bucket, key, download_path)
        
        videoBatch = indexarJsonVideo(download_path, 2)
    
        upload_path = '/tmp/out-{}'.format(videoBatch)
        
        s3_client.upload_file(upload_path, '{}'.format("fjk-bucket-index"), videoBatch)

def indexarJsonVideo(jsonVideo, instante):
    
    # json que contiene los frames del video (los min y seg
    #  donde aparece)
    videoYframes = json.load(open(jsonVideo))
    
    cantFrames = 0 #5
    
    # etiquetas que acumulan las apariciones de los objetos
    #  en los frames a nivel de todo el video
    # {"alpaca":[3,23,45,123], "auto":[5] }
    etiquetaMinsSegs = {}
    
    frames = videoYframes["frames"]
    video = videoYframes["video"]
    
    for frame in frames:
        
        cantFrames += 1
                
        minuto = frame["minuto"]
        segundo = frame["segundo"]
        img = str(video)+"_"+str(minuto)+"_"+str(segundo)+".jpg"
        
        minSeg = minuto*100 + segundo
        etiquetas = etiquetarFrame("fjk-bucket-img", img)
        
        for etiqueta in etiquetas:
            
            if etiqueta not in etiquetaMinsSegs:
                etiquetaMinsSegs[etiqueta] = []            
            
            etiquetaMinsSegs[etiqueta].append(minSeg)        
    
    # valoresEtiquetas:
    #  valor de cada etiqueta, un mayor valor significa que en ese
    #      video aparece varias veces esa etiqueta
    #       {"alpaca":13, "auto":5 }
    #
    # etiquetaTiempos:
    #  se hallan las marcas representativas de tiempo de las etiquetas
    #   {"alpaca":[3,45], "auto":[5] }
    #
    # los resultados se usan para contruir el indexbatchIndexVideo     
    etiquetaTiempos, etiquetaValor = etiquetaTiemposValor(etiquetaMinsSegs, instante)
    
    
    # para cada etiqueta generamos el bloque de indexbatchIndexVideo
    #  que le corresponde
    
    batch = []
    
    for etiqueta, valor in etiquetaValor.items():
        
        bloque = {}
    
        bloque["etiqueta"] = etiqueta
        #para ordenar por valor y luego por reciencia
        bloque["valorVideo"] = str(valor).zfill(7) + "," + str(video).zfill(7)
        
        tiempos = []
        for t in etiquetaTiempos[etiqueta]:
            m, s = divmod(t,100)
            tiempos.append({"minuto": m, "segundo": s})
                    
        bloque["tiempos"] = tiempos
        
        batch.append(bloque)

    jsonBatch = guardar_en_bucketIndex(video, batch)
    
    return jsonBatch


def etiquetarFrame(bucket, imagen):

    response = rekognition_client.detect_labels(Image={'S3Object':{'Bucket':bucket,'Name':imagen}}, MaxLabels=10)

    etiquetas = set()

    for label in response['Labels']:
        etiquetas.add(label['Name'])
        for parent in label['Parents']:
            etiquetas.add(parent['Name'])
    
    return list(etiquetas) #["alpaca","auto"]

def etiquetaTiemposValor(etiquetaMinsSegs, instante):
    
    # etiquetaMinsSegs: {"alpaca":[3,23,45,123], "auto":[5] }
    
    # etiquetaTiempos: {"alpaca":[3,45], "auto":[5] }
    
    # etiquetaValor: {"alpaca": 13, "auto": 5 }
    
    etiquetaTiempos = {}
    etiquetaValor = {}
    
    for etiqueta, minSeg in etiquetaMinsSegs.items():
        
        tiempoValor = []
        count = 1
        tiempo = 0
        
        for t in range(len(minSeg)):
            if ( t+1<len(minSeg) and minSeg[t]+instante == minSeg[t+1]):
                count+=1
            else:
                tiempoValor.append((minSeg[tiempo], count))                
                tiempo = t+1
                count = 1
                       
        tiempoValor = sorted(tiempoValor, key=lambda x:x[1], reverse=True)
        
        etiquetaTiempos[etiqueta] = [i[0] for i in tiempoValor]
        etiquetaValor[etiqueta] = len(minSeg)
        
    return etiquetaTiempos, etiquetaValor
    
def guardar_en_bucketIndex(video, batch):
    
    videoBatch = str(video)+".json"
    
    json_object = json.dumps(batch, indent = 4)
    
    f = open('/tmp/out-{}'.format(videoBatch),"w")
    f.write(json_object)
    f.close()
    
    return videoBatch

'''
import boto3
import os
import sys
import uuid
from urllib.parse import unquote_plus

s3_client = boto3.client('s3')

def indexarJsonVideo(inputFile):

    videoBatch = "1.json"

    f = open('/tmp/out-{}'.format(videoBatch), "w")
    f.write("ok2")
    f.close()
    
    return videoBatch
    

def lambda_handler(event, context):
    
    for record in event['Records']:
        
        bucket = record['s3']['bucket']['name']
        
        key = unquote_plus(record['s3']['object']['key'])
        
        download_path = '/tmp/{}{}'.format(uuid.uuid4(), key)
        s3_client.download_file(bucket, key, download_path)
        
        videoBatch = indexarJsonVideo(download_path)
    
        upload_path = '/tmp/out-{}'.format(videoBatch)
        
        s3_client.upload_file(upload_path, '{}'.format("bucket-index1"), videoBatch)
'''
