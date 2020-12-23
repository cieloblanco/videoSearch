# subir nueva data de bucket-index a la tabla de dynamodb

import json
import boto3
from decimal import Decimal

data_file =  open("/home/kevin/Documentos/video search/fjk-bucket-index"+"/"+"2323.json")

data = json.load(data_file, parse_float=Decimal)

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

dynamodb_client = boto3.client('dynamodb', region_name='us-east-1')

try:
    
    response = dynamodb_client.describe_table(TableName='etiquetaVideo')
    
except dynamodb_client.exceptions.ResourceNotFoundException:

    tabla = dynamodb.create_table(
        TableName = 'etiquetaVideo',
        KeySchema = [
            {
                'AttributeName': 'etiqueta',
                'KeyType': 'HASH'
            },
            {
                'AttributeName': 'valorVideo',
                'KeyType': 'RANGE'
            }
        ],
        AttributeDefinitions = [
            {
                'AttributeName': 'etiqueta',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'valorVideo',
                'AttributeType': 'S'
            }
        ],
        ProvisionedThroughput = {
            'ReadCapacityUnits': 4,
            'WriteCapacityUnits': 4
        }
    )
    
    tabla.meta.client.get_waiter('table_exists').wait(TableName='etiquetaVideo')

tabla = dynamodb.Table('etiquetaVideo')

for etiquetaVideo in data:
    tabla.put_item(Item=etiquetaVideo)
        


