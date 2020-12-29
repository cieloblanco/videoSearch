"use strict";

const AWS = require("aws-sdk");
const { spawnSync } = require('child_process');

const ffprobePath = "/opt/ffmpeg-static/ffprobe";
const allowedTypes = ["mov", "mpg", "mpeg", "mp4", "wmv", "avi", "webm"];
const interval = 2 //seconds

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

    const input = s3.getSignedUrl('getObject', { Bucket: srcBucket, Key: srcKey, Expires: 1000 })        
    const infoBucket = "fjk2-bucket-jsonvideo";
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
            input
          ]);

        const result = ffprobe.stdout.toString()
        const duration = Math.ceil(result)

        const information = {} 
        const video = 'video';
        const frames = 'frames';
        information[video] = Number(`${id}`); 
        information[frames] = []

        var frame = 0;
        var minutes = 0;
        var seconds = 0;

        for(var s = interval; s < duration; s+=interval) {

            seconds = s;
            minutes = Math.trunc(s/60);

            if (s>=60) {
                seconds = s%60;
            }

            frame = {
                minuto: Number(`${minutes}`),
                segundo:  Number(`${seconds}`),
            }; 

            information[frames].push(frame);
        }

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