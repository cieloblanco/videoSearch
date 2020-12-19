# aws cloudSearch ya debe estar corriendo, 
# 	tomó los json indexadores de bucket-index

# indexa el video en cloudSearch y 
# 	guarda el json indexador en bucket-index

import json

def etiquetarFrame(imagen):
	return ["alpaca","auto"]

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

def indexar(bucketJsonVideo, jsonVideo, instante, bucketImg):
	
	# json que contiene los frames del video (los min y seg
	#  donde aparece)
	videoYframes = json.load(open(bucketJsonVideo+"/"+jsonVideo))
	
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
		etiquetas = etiquetarFrame(bucketImg+"/"+img)		
		
		for etiqueta in etiquetas:
			
			if etiqueta not in etiquetaMinsSegs:
				etiquetaMinsSegs[etiqueta] = []			
			
			etiquetaMinsSegs[etiqueta].append(minSeg)		
				
		print(etiquetaMinsSegs)
	
	# valoresEtiquetas:
	#  valor de cada etiqueta, un mayor valor significa que en ese
	#  	video aparece varias veces esa etiqueta
	#  	 {"alpaca":13, "auto":5 }
	#
	# etiquetaTiempos:
	#  se hallan las marcas representativas de tiempo de las etiquetas
	#   {"alpaca":[3,45], "auto":[5] }
	#
	# los resultados se usan para contruir el indexbatchIndexVideo	 
	etiquetaTiempos, etiquetaValor = etiquetaTiemposValor(etiquetaMinsSegs, instante)
	
	
	# para cada etiqueta generamos el bloque de indexbatchIndexVideo
	#  que le corresponde
	
	batch_to_add = []
	
	for etiqueta, valor in etiquetaValor.items():
		
		bloque = {}
		bloque["type"] = "add"
		bloque["id"] = str(video)+etiqueta
		
		fields = {}
		fields["video"] = video
		fields["etiqueta"] = etiqueta
		fields["valor"] = valor
		
		tiempos = []
		for t in etiquetaTiempos[etiqueta]:
			m, s = divmod(t,100)
			tiempos.append({"minuto": m, "segundo": s})
					
		fields["tiempos"] = tiempos
		
		bloque["fields"] = fields
		
		batch_to_add.append(bloque)
	
	# colocar json en cloudSearch
	
	# guardar archivo en bucket-index
	
	print(json.dumps(batch_to_add,indent=4))

indexar("bucket-jsonVideo", "523.json", 2, "bucket-img")
