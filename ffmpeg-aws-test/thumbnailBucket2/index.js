'use strict';

const AWS = require('aws-sdk')
const { spawnSync, exec } = require('child_process')
const { readFileSync, writeFileSync, unlinkSync } = require('fs');

const ffprobePath = '/opt/ffmpeg-static/ffprobe';
const ffmpegPath = '/opt/ffmpeg-static/ffmpeg';

const allowedTypes = ['mov', 'mpg', 'mpeg', 'mp4', 'wmv', 'avi', 'webm']
const width = 480
const height = -1
const interval = 14 //seconds

// get reference to S3 client
const s3 = new AWS.S3()

module.exports.handler = async (event, context) => {

  const srcBucket = event.Records[0].s3.bucket.name;	
  const srcKey = decodeURIComponent(event.Records[0].s3.object.key).replace(/\+/g, ' ');  
  const thumbnailBucket = srcBucket + "-thumbnail";

  let fileType = srcKey.match(/\.\w+$/)

  if (!fileType) {
    throw new Error(`invalid file type found for key: ${srcKey}`)
  }

  fileType = fileType[0].slice(1)

  if (allowedTypes.indexOf(fileType) === -1) {
    throw new Error(`filetype: ${fileType} is not an allowed type`)
  }

  // ffmpeg -i prueba.mp4 -f image2 -vf "select='eq(pict_type,PICT_TYPE_I)', scale=480:-1" -vsync vfr out%03d.png -v quiet -stats 2> result.txt

  try {

	  const params = {
		            Bucket: srcBucket,
		            Key: srcKey
		        };
	  // get the video    
	  const video = await s3.getObject(params).promise();

	  // write the file to disk
	  writeFileSync(`/tmp/${srcKey}`, video.Body);

  } catch (error) {
    console.log(error);
    return;
  } 

  function createThumbnail(seek, x) {
      const ffmpeg = spawnSync(ffmpegPath, [
        '-i', `/tmp/${srcKey}`,
        '-ss', seek,      
         '-vf', `thumbnail,scale=${width}:${height}`,
        '-qscale:v', '2',
        '-vframes', '1',
        '-f', 'image2',
        '-c:v', 'mjpeg',
        `/tmp/${x}.jpg`
      ])      
  }

  function uploadThumbnail(x, minutes, seconds) {
	  return new Promise((resolve, reject) => {
	
      const image = readFileSync(`/tmp/${x}.jpg`);

      unlinkSync(`/tmp/${x}.jpg`);

	    let dstKey = `${x}_${minutes}_${seconds}.jpg`;

	    const destparams = {
        Bucket: thumbnailBucket,
        Key: dstKey,
        Body: image,
        ContentType: "image"
      }

	    s3.upload(destparams, function(err, data) {
        if (err) {
          console.log(err)
          reject()
        }
        console.log(`successful upload to ${thumbnailBucket}/${dstKey}`)
        resolve()
      })
    })
  }


  var ffprobe = spawnSync(ffprobePath, [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=nw=1:nk=1',
    `/tmp/${srcKey}`,
  ])

  const result = ffprobe.stdout.toString()
  const duration = Math.ceil(result)

  var minutes = 0;
  var seconds = 0;
  var i = 1;

  for(var s = interval; s < duration; s+=interval) {
    seconds = s;
    minutes = Math.trunc(s/60);

    if (s>=60) {
      seconds = s%60;
    }

    createThumbnail(s, i);
    await uploadThumbnail(i, minutes, seconds);
	  i++;
  } 

  unlinkSync(`/tmp/${srcKey}`);
}