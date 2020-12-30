from flask import Flask, render_template, request
from pprint import pprint
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

app = Flask(__name__)

@app.route('/',methods=['GET', 'POST'])
	def principal():
	return render_template('index.html')

@app.route('/resultados',methods=['POST','GET'])
def resultados():
	text = request.form['textin']
	dynamodb = boto3.resource('dynamodb',region_name='us-east-1')
	tabla = dynamodb.Table('etiquetaVideo')
	response = tabla.query(
	KeyConditionExpression = Key('etiqueta').eq(text),
	ScanIndexForward=False
	)
	respuesta = response['Items']
	return render_template('video.html',list=respuesta)

@app.route('/inicio',methods=['POST','GET'])
def inicio():
	return render_template('index.html')

@app.route('/upload',methods=['POST','GET'])
def upload():
	f=open("num.txt",'r')
	fnum=f.read()
	fnumformat=fnum+".mp4"
	f.close()
	s3 = boto3.resource('s3')
	filevideo = request.files['myfile']
	s3.Bucket('fjk2-bucket-video').put_object(Key=fnumformat,Body=filevideo)
	fnum2=int(fnum)+1
	f2=open('num.txt','w')
	f2.write(str(fnum2))
	f2.close()
	return render_template('index.html')

if __name__ == '__main__':
	app.run(host='0.0.0.0',port=8080)
