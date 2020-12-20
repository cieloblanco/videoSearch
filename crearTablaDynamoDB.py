# crear la tabla vacia en dynamodb

import boto3

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

if (dynamodb==None):
	
	tabla = dynamodb.create_table(
		TableName = 'etiquetaVideo',
		KeySchema = [
			{
				'AttributeName': 'etiqueta',
				'KeyType': 'HASH'
			},
			{
				'AttributeName': 'video',
				'KeyType': 'RANGE'
			}
		],
		AttributeDefinitions = [
			{
				'AttributeName': 'etiqueta',
				'AttributeType': 'S'
			},
			{
				'AttributeName': 'video',
				'AttributeType': 'N'
			}
		],
		ProvisionedThroughput = {
			'ReadCapacityUnits': 4,
			'WriteCapacityUnits': 4
		}
	)

	tabla.meta.client.get_waiter('table_exists').wait(TableName='etiquetaVideo')
	
else:
	
	tabla = dynamodb.Table('etiquetaVideo')

