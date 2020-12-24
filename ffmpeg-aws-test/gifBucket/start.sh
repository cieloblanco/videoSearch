#!/bin/bash

# delete all elements no bucket
aws s3 rm s3://source18 --recursive
aws s3 rm s3://source18-resized --recursive

# create zip of the dependencies
zip function.zip index.js

# Update code of the lambda function
aws lambda update-function-code --function-name CreateThumbnail --zip-file fileb://function.zip

# upload video to bucket 
aws s3 cp 523.mp4 s3://source18

# show elements of the bucket
aws s3 ls s3://source18  

sleep 10s # Waits 5 seconds.

# show elements of the bucket
aws s3 ls s3://source18-resized

# donwload gif from bucket
aws s3 cp s3://source18-resized/523.gif ./


