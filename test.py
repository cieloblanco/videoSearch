from pprint import pprint
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

tabla = dynamodb.Table('etiquetaVideo')

#read
'''
try:
	response = tabla.get_item(Key={'etiqueta': "alpaca", 'video': 523})
except ClientError as e:
	print(e.response['Error']['Message'])
else:
	print(response['Item'])
'''

#query
response = tabla.query(
	KeyConditionExpression = Key('etiqueta').eq("alpaca"),
	ScanIndexForward=False
)
print(response['Items'])

tabla.delete()
