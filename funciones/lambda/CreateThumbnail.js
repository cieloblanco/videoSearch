'use strict';

const AWS = require('aws-sdk')
const { spawn, spawnSync, exec } = require('child_process')
const { createReadStream, createWriteStream } = require('fs')

const s3 = new AWS.S3()
const ffprobePath = '/opt/ffmpeg-static/ffprobe';
const ffmpegPath = '/opt/ffmpeg-static/ffmpeg';

const allowedTypes = ['mov', 'mpg', 'mpeg', 'mp4', 'wmv', 'avi', 'webm']
const width = 480
const height = -1
var interval = 2 //seconds
var minutes = 0;
var seconds = 0;
var id = Number(process.env.id_key);

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
  const bucket = snsMsgObject.Records[0].s3.bucket.name;
  const id_img    = srcKey.split('.')[0];
  
  const thumbnailBucket = "fjk2-bucket-img";

  const video = s3.getSignedUrl('getObject', { Bucket: bucket, Key: srcKey, Expires: 1000 })
  let fileType = srcKey.match(/\.\w+$/)

  if (!fileType) {
    throw new Error(`invalid file type found for key: ${srcKey}`)
  }

  fileType = fileType[0].slice(1)

  if (allowedTypes.indexOf(fileType) === -1) {
    throw new Error(`filetype: ${fileType} is not an allowed type`)
  }

  exec("rm /tmp/*", function (error, stdout, stderr) {
  if(error)
      console.log('Directory Empty', error);
    else
      console.log("Files Deleted");
  });

  function createThumbnail(seek) {
    return new Promise((resolve, reject) => {

      seconds = seek;
      minutes = Math.trunc(seek/60);

      if (seek>=60) {
        seconds = seek%60;
      }

      let tmpFile = createWriteStream('/tmp/thumbnail.jpg')
      const ffmpeg = spawn(ffmpegPath, [
        '-ss', seek,
        '-i', video, 
        '-vf', `thumbnail,scale=${width}:${height}`,  
        '-qscale:v', '2',
        '-frames:v', '1',
        '-f', 'image2',
        '-c:v', 'mjpeg',
        'pipe:1'
      ])

      ffmpeg.stdout.pipe(tmpFile)

      ffmpeg.on('close', function(code) {
        tmpFile.end()
        resolve()
      })

      ffmpeg.on('error', function(err) {
        console.log(err)
        reject()
      })
      
    })
  }

  function uploadThumbnail(x) {
    return new Promise((resolve, reject) => {
      let tmpFile = createReadStream('/tmp/thumbnail.jpg')

      let dstKey = `${id_img}_${minutes}_${seconds}.jpg`;

      var params = {
        Bucket: thumbnailBucket,
        Key: dstKey,
        Body: tmpFile,
        ContentEncoding: 'base64',
        ContentType: `image/jpg`
      }

      s3.upload(params, function(err, data) {
        if (err) {
          console.log(err)
          reject()
        }
        console.log(`successful upload to ${thumbnailBucket}/${dstKey}`)
        resolve()
      })
    })
  }

  const ffprobe = spawnSync(ffprobePath, [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=nw=1:nk=1',
    video
  ])

  const duration = Math.ceil(ffprobe.stdout.toString())

  for(var s = interval; s < duration; s+=interval) {

    await createThumbnail(s)
    await uploadThumbnail(id)

    id++;

  }
  
  process.env.id_key = id.toString();

}
