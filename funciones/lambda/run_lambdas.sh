#!/bin/bash

# delete all elements no bucket
aws s3 rm s3://fjk2-bucket-video --recursive
#aws s3 rm s3://fjk2-bucket-gif --recursive
#aws s3 rm s3://fjk2-bucket-img --recursive
#aws s3 rm s3://fjk2-bucket-info --recursive
#aws s3 rm s3://fjk2-bucket-jsonvideo --recursive

# create zip of the dependencies
zip function.zip CreateThumbnail.js
#zip function.zip CreateGif.js
#zip function.zip CreateInfo.js
#zip function.zip CreateJsonvideo.js

# Update code of the lambda function
aws lambda update-function-code --function-name CreateThumbnail --zip-file fileb://function.zip
#aws lambda update-function-code --function-name CreateGif --zip-file fileb://function.zip
#aws lambda update-function-code --function-name CreateInfo --zip-file fileb://function.zip
#aws lambda update-function-code --function-name CreateJsonvideo --zip-file fileb://function.zip

# upload video to bucket 
aws s3 cp 5231.mp4 s3://fjk2-bucket-video

# show elements of the bucket
aws s3 ls s3://fjk2-bucket-video  

# Waits 10 seconds.
sleep 10s 

# show elements of the bucket
aws s3 ls s3://fjk2-bucket-img
#aws s3 ls s3://fjk2-bucket-gif
#aws s3 ls s3://fjk2-bucket-info
#aws s3 ls s3://fjk2-bucket-jsonvideo

# donwload img from bucket
aws s3 cp s3://fjk2-bucket-img/1_0_28.jpg ./
#aws s3 cp s3://fjk2-bucket-gif/5231.gif ./
#aws s3 cp s3://fjk2-bucket-info/5231.json ./
#aws s3 cp s3://fjk2-bucket-jsonvideo/5231.json ./
