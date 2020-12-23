#!/bin/bash

# delete all elements no bucket
aws s3 rm s3://source18 --recursive
aws s3 rm s3://source18-thumbnail --recursive

# create zip of the dependencies
zip function.zip index.js

# Update code of the lambda function
aws lambda update-function-code --function-name CreateThumbnail --zip-file fileb://function.zip

# upload video to bucket 
aws s3 cp 523.mp4 s3://source18

# show elements of the bucket
aws s3 ls s3://source18  

# Waits 10 seconds.
sleep 10s 

# show elements of the bucket
aws s3 ls s3://source18-thumbnail

# donwload gif from bucket
# aws s3 cp s3://source18-thumbnail/523.gif ./


