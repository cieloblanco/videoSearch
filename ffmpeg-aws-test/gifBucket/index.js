'use strict';

const AWS = require('aws-sdk');
const { spawnSync, exec } = require('child_process');
const { readFileSync, writeFileSync, unlinkSync } = require('fs');

const ffprobePath = '/opt/ffmpeg-static/ffprobe';
const ffmpegPath = '/opt/ffmpeg-static/ffmpeg';

const allowedTypes = ['mov', 'mpg', 'mpeg', 'mp4', 'wmv', 'avi', 'webm'];

// get reference to S3 client
const s3 = new AWS.S3();

exports.handler = async (event, context, callback) => {

    const srcBucket = event.Records[0].s3.bucket.name;

    // Object key may have spaces or unicode non-ASCII characters.
    const srcKey    = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    const gifBucket = srcBucket + "-resized";
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

    //const scriptArgs = ['myScript.sh', 'arg1', 'arg2', 'youGetThePoint'];
	//const child = spawn('sh', scriptArgs);

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
        
        const ffmpegArgs = [
        '-ss', '61.0',
        '-t', '2.5',
		'-i', `/tmp/${srcKey}`,
		'-f', 'gif',
	    '-filter_complex', "[0:v] fps=12,scale=w=480:h=-1,split [a][b];[a] palettegen=stats_mode=single [p];[b][p] paletteuse=new=1",
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

        //exec("echo `ls -l -R /tmp`",
        //  function (error, stdout, stderr) {
        //      console.log("stdout: " + stdout) 
        //});

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


// aws s3 ls s3://source18-resized
// aws s3 cp s3://source18-resized/prueba.gif ./