'use strict';

const AWS = require('aws-sdk')
const { spawn, spawnSync, exec } = require('child_process')
const { readFileSync, writeFileSync, unlinkSync, readdir } = require('fs');

const ffprobePath = '/opt/ffmpeg-static/ffprobe';
const ffmpegPath = '/opt/ffmpeg-static/ffmpeg';

const allowedTypes = ['mov', 'mpg', 'mpeg', 'mp4', 'wmv', 'avi', 'webm']
const width = 480
const height = -1
const time = 60 //seconds

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

exec("rm /tmp/*", function (error, stdout, stderr) {
	if(error)
     	console.log('Directory Empty', error);
  	else
    	console.log("Files Deleted");
});

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

function uploadThumbnail(x) {
	return new Promise((resolve, reject) => {
	
    const image = readFileSync(`/tmp/${x}.jpg`);

    unlinkSync(`/tmp/${x}.jpg`);

	let dstKey = `${x}.jpg`;

	const destparams = {
        Bucket: thumbnailBucket,
        Key: dstKey,
        Body: image,
        ContentType: "image"
        //ContentType: `image/jpg`
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
    'format=duration, filename',
    '-of',
    'default=nw=1:nk=1',
    //'-sexagesimal',
    `/tmp/${srcKey}`,
  ])

  const values = ffprobe.stdout.toString().split('\n')
  console.log(values)
  const duration = Math.ceil(values[1])
  console.log(duration);

  var ffprobeArgs = [
	'-v',
    'error',
    '-show_entries',
    'format_tags=comment',
    '-of',
    'default=nw=1:nk=1',
    `/tmp/${srcKey}`,
  	]

ffprobe = spawnSync(ffprobePath, ffprobeArgs)

console.log(ffprobe.stdout.toString('utf8').split('\n')[0])  

var i = 1;
  for(var s = 0; s < duration; s+=time){
    createThumbnail(s, i);
	  await uploadThumbnail(i);
  	i++;
  }

  unlinkSync(`/tmp/${srcKey}`);
}

/*
function show_files() {
	const testFolder = '/tmp/';

	readdir(testFolder, (err, files) => {
	  files.forEach(file => {
	    console.log(file);
	  });
	});	
}
*/