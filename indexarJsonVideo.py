# aws cloudSearch ya debe estar corriendo, 
# 	tomó los json indexadores de bucket-index

# indexa el video en cloudSearch y 
# 	guarda el json indexador en bucket-index

import json

def indexar(bucketJsonVideo, jsonVideo, segundosEntreFrames, bucketImg):
	
	# json que contiene los frames del video (los min y seg
	#  donde aparece)
	jsonVideo = json.load(open(bucketJsonVideo+"/"+jsonVideo))
	
	cantFrames = 0 #5
	
	# etiquetas que acumulan las apariciones de los objetos
	#  en los frames a nivel de todo el video
	# {"alpaca":[3,23,45,123], "auto":[5] }
	etiquetasMinSeg = {}
	
	frames = jsonVideo["frames"]
	video = jsonVideo["video"]
	for frame in frames:
		
		cantFrames += 1
				
		minuto = frame["minuto"]
		segundo = frame["segundo"]
		img = str(video)+"_"+str(minuto)+"_"+str(segundo)+".jpg"
		
		tiempo = minuto*100 + segundo
		etiquetas = etiquetarFrame(bucketImg+"/"+img)		
		
		for etiqueta in etiquetas:
			
			if etiqueta not in etiquetasMinSeg:
				etiquetasMinSeg[etiqueta] = []			
			
			etiquetasMinSeg[etiqueta].append(tiempo)		
				
		print(etiquetasMinSeg)
	
	# valoresEtiquetas:
	#  valor de cada etiqueta, un mayor valor significa que en ese
	#  	video aparece varias veces esa etiqueta
	#  	 {"alpaca":13, "auto":5 }
	#
	# etiquetasTiempo:
	#  se hallan las marcas representativas de tiempo de las etiquetas
	#   {"alpaca":[3,45], "auto":[5] }
	#
	# los resultados se usan para contruir el indexBatch	 
	etiquetasTiempo, valoresEtiquetas = etiquetasTimestamp(etiquetasMinSeg, segundosEntreFrames)
	
	
	# para cada etiqueta generamos el bloque de indexBatch
	#  que le corresponde
	
	
	
	idAdd = str(jsonVideo["video"])	#faltacompletarconsuetiqueta
	
	indexBatch = json.loads("[]")	
	indexBatch.append({"type": "add"})
	
	print(indexBatch)

def etiquetasTimestamp(etiquetasMinSeg, segundosEntreFrames):
	
	# etiquetasMinSeg: {"alpaca":[3,23,45,123], "auto":[5] }
	
	etiquetasTiempo = {}
	valoresEtiquetas = {}
	
	for etiqueta, tiempos in etiquetasMinSeg.items():
		
		timestamp = []
		count = 1
		tiempo = 0
		
		for i in range(len(tiempos)):
			if ( i+1<len(tiempos) and tiempos[i]+segundosEntreFrames == tiempos[i+1]):
				count+=1
			else:
				timestamp.append((tiempos[tiempo], count))				
				tiempo = i+1
				count = 1
		
		sorted(timestamp, key=lambda x:x[1])
		
		etiquetasTiempo[etiqueta] = [i[0] for i in timestamp]
		valoresEtiquetas[etiqueta] = len(etiquetasMinSeg[etiqueta])
		
	return etiquetasTiempo, valoresEtiquetas

def etiquetarFrame(imagen):
	return ["alpaca","auto"]
	
indexar("bucket-jsonVideo", "523.json", 2, "bucket-img")
