# subir nueva data de bucket-index a la tabla de dynamodb

import json
import boto3
from decimal import Decimal

data_file =  open("bucket-index"+"/"+"523.json")

data = json.load(data_file, parse_float=Decimal)

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

tabla = dynamodb.Table('etiquetaVideo')

for etiquetaVideo in data:
	tabla.put_item(Item=etiquetaVideo)

