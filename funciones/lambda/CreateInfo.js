"use strict";

const AWS = require("aws-sdk");
const { spawnSync } = require('child_process');

const ffprobePath = "/opt/ffmpeg-static/ffprobe";
const allowedTypes = ["mov", "mpg", "mpeg", "mp4", "wmv", "avi", "webm"];

// get reference to S3 client
const s3 = new AWS.S3();

function getSNSMessageObject(msgString) {
   var x = msgString.replace(/\\/g,'');
   var y = x.substring(1,x.length-1);
   var z = JSON.parse(y);
   
   return z;
}

module.exports.handler = async (event, context) => {

    var snsMsgString = JSON.stringify(event.Records[0].Sns.Message);
    var snsMsgObject = getSNSMessageObject(snsMsgString);

    const srcKey = decodeURIComponent(snsMsgObject.Records[0].s3.object.key).replace(/\+/g, ' ');
    const srcBucket = snsMsgObject.Records[0].s3.bucket.name;

    const video = s3.getSignedUrl('getObject', { Bucket: srcBucket, Key: srcKey, Expires: 1000 })        
    const infoBucket = "fjk2-bucket-info";
    const id = srcKey.split('.')[0];

    let fileType = srcKey.match(/\.\w+$/);

    if (!fileType) {
        throw new Error(`invalid file type found for key: ${srcKey}`);
    }

    fileType = fileType[0].slice(1);

    if (allowedTypes.indexOf(fileType) === -1) {
        throw new Error(`filetype: ${fileType} is not an allowed type`);
    }

    try { 
        var ffprobe = spawnSync(ffprobePath, [
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nw=1:nk=1",
            '-sexagesimal',
            video
          ]);

        const duration = ffprobe.stdout.toString().split(':')
        const minutes = Math.round(duration[1]);
        const seconds = Math.round(duration[2]);

        const ffprobeArgs = [
            "-v",
            "error",
            "-show_entries",
            "format_tags=title",
            "-of",
            "default=nw=1:nk=1",
            video
        ];

        ffprobe = spawnSync(ffprobePath, ffprobeArgs);

        const title = ffprobe.stdout.toString("utf8");

        const dateObj = new Date();
        const month = dateObj.getUTCMonth() + 1; 
        const day = dateObj.getUTCDate();
        const year = dateObj.getUTCFullYear();

        const date = day + "/" + month + "/" + year;
        const hour = new Date().toISOString().split('T')[1].split('.')[0];

        const information = {
            video: Number(`${id}`),
            titulo: `${title}`,
            fecha: `${date} ${hour}`,
            duracion: `${minutes}:${seconds}`
        };

        var json = Buffer.from(JSON.stringify(information, null, 4));
            
    } catch (error) {
        console.log(error);
        return;
    } 
      
    try {
        const destparams = {
            Bucket: infoBucket,
            Key: `${id}.json`,
            Body: json,
            ContentType: 'application/json'
        };

        const putResult = await s3.putObject(destparams).promise(); 
        
    } catch (error) {
        console.log(error);
        return;
    } 

}