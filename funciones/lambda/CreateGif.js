'use strict';

const AWS = require('aws-sdk');
const { spawnSync, exec } = require('child_process');
const { readFileSync, writeFileSync, unlinkSync } = require('fs');

const ffmpegPath = '/opt/ffmpeg-static/ffmpeg';

const allowedTypes = ['mov', 'mpg', 'mpeg', 'mp4', 'wmv', 'avi', 'webm'];
const width = 480
const height = -1

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

    // Object key may have spaces or unicode non-ASCII characters.
    const srcKey = decodeURIComponent(snsMsgObject.Records[0].s3.object.key).replace(/\+/g, ' ');
    const srcBucket = snsMsgObject.Records[0].s3.bucket.name;

    const gifBucket = "fjk2-bucket-gif";
    const dstKey    = srcKey.split('.')[0] + '.gif';

    let fileType = srcKey.match(/\.\w+$/);

    if (!fileType) {
        throw new Error(`invalid file type found for key: ${srcKey}`);
    }

    fileType = fileType[0].slice(1);

    if (allowedTypes.indexOf(fileType) === -1) {
        throw new Error(`fileType: ${fileType} is not an allowed type`);

    }

    exec("rm tmp/*", function (error, stdout, stderr) {
        if(error)
            console.log('Directory Empty', error);
        else
            console.log("Files Deleted");
    });

    // Download the video from the S3 source bucket. 

    try { 
    
        const params = {
                Bucket: srcBucket,
                Key: srcKey
            };
        // get the video    
        const video = await s3.getObject(params).promise();

        // write the file to disk
        writeFileSync(`/tmp/${srcKey}`, video.Body);
        
        // get gif from video
        const ffmpegArgs = [
        '-ss', '0',
        '-t', '5',
        '-i', `/tmp/${srcKey}`,
        '-f', 'gif',
        '-filter_complex', `[0:v] fps=12,scale=w=${width}:h=${height},split [a][b];[a] palettegen=stats_mode=single [p];[b][p] paletteuse=new=1`,
        `/tmp/${dstKey}`
        ];

        const ffmpeg = spawnSync(ffmpegPath, ffmpegArgs, { stdio: "inherit" });
            
    } catch (error) {
        console.log(error);
        return;
    } 

    // Upload the gif to the destination bucket
    try {

        // read gif from disk
        const gitFile = readFileSync(`/tmp/${dstKey}`);

        // delete the temp files
        unlinkSync(`/tmp/${dstKey}`);
        unlinkSync(`/tmp/${srcKey}`);
        
        const destparams = {
            Bucket: gifBucket,
            Key: dstKey,
            Body: gitFile
        };

        const putResult = await s3.putObject(destparams).promise(); 
        
    } catch (error) {
        console.log(error);
        return;
    } 
        
    console.log('Successfully gif ' + srcBucket + '/' + srcKey +
        ' and uploaded to ' + gifBucket + '/' + dstKey); 
};
