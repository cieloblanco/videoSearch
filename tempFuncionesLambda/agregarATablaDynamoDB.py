import boto3
import os
import sys
import uuid
from urllib.parse import unquote_plus

import json
from decimal import Decimal

s3_client = boto3.client('s3')

def lambda_handler(event, context):
    
    for record in event['Records']:
        
        bucket = record['s3']['bucket']['name']
        
        key = unquote_plus(record['s3']['object']['key'])
        
        download_path = '/tmp/{}{}'.format(uuid.uuid4(), key)
        s3_client.download_file(bucket, key, download_path)
        
        agregarATablaDynamoDB(download_path)
        
def agregarATablaDynamoDB(jsonBatch):
    
    data_file =  open(jsonBatch)

    data = json.load(data_file, parse_float=Decimal)
    
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    
    tabla = dynamodb.Table('etiquetaVideo')
    
    for etiquetaVideo in data:
        tabla.put_item(Item=etiquetaVideo)
    
    return 0
