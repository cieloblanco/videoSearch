# guarda el json indexador en bucket-index

import json
import boto3

def principal():
    indexar("bucket-jsonVideo/523.json", 2)

def indexar(jsonVideo, instante):
    
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
        etiquetas = etiquetarFrame("bucket-img1", img)        
        print(etiquetas)
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

    client = boto3.client('rekognition')

    response = client.detect_labels(Image={'S3Object':{'Bucket':bucket,'Name':imagen}}, MaxLabels=10)

    etiquetas = set()

    for label in response['Labels']:
        etiquetas.add(label['Name'])
        for parent in label['Parents']:
            etiquetas.add(parent['Name'])        

    return etiquetas #["alpaca","auto"]

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
    
    json_object = json.dumps(batch, indent = 4)
    
    videoBatch = open("bucket-index/"+str(video)+".json","w")
    videoBatch.write(json_object)
    videoBatch.close()
    
    return str(video)+".json"

principal()
