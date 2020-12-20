# crear la tabla vacia en dynamodb

import boto3

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

