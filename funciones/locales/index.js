'use strict';

const { spawnSync, exec } = require('child_process');
const { readFileSync, writeFileSync, unlinkSync } = require('fs');
const path = require('path')

const ffprobePath = path.resolve(__dirname, 'ffmpeg-static', 'ffprobe')
const ffmpegPath = path.resolve(__dirname, 'ffmpeg-static', 'ffmpeg')

const srcKey = '5231.mp4'
const width = 480
const height = -1  
const time = 60 //seconds

// ffmpeg -i 5231.mp4 -f image2 -vf "select='eq(pict_type,PICT_TYPE_I)', scale=480:-1" -vsync vfr out%03d.png -v quiet -stats 2> result.txt

exec("rm tmp/*", function (error, stdout, stderr) {
	if(error)
     	console.log('Directory Empty', error);
  	else
    	console.log("Files Deleted");
});


function createThumbnail(seek, x) {
      
      const ffmpeg = spawnSync(ffmpegPath, [
        '-i', srcKey, 
        '-ss', seek,      
        '-vf', `thumbnail,scale=${width}:${height}`,
        '-qscale:v', '2',
        '-vframes', '1',
        '-f', 'image2',
        '-c:v', 'mjpeg',
        `tmp/${x}.jpg`
      ])      
  }

//function uploadThumbnail() {

//}


  var ffprobe = spawnSync(ffprobePath, [
    '-v',
    'error',
    '-show_entries',
    'format=duration, filename',
    '-of',
    'default=nw=1:nk=1',
    //'-sexagesimal',
    srcKey
  ])

  const values = ffprobe.stdout.toString().split('\n')
  console.log(values)
  const duration = Math.ceil(values[1])
  console.log(duration);

  var ffprobeArgs = [
	'-v',
    'error',
    '-show_entries',
    'format_tags=title',
    '-of',
    'default=nw=1:nk=1',
    srcKey
  	]

ffprobe = spawnSync(ffprobePath, ffprobeArgs)

console.log(ffprobe.stdout.toString('utf8'))  

var i = 1;
  for(var s = 0; s < duration; s+=time){
    createThumbnail(s, i);
	//uploadThumbnail(i);
  	i++;
  }


/*
function show_files() {
	const testFolder = 'tmp/';

	fs.readdir(testFolder, (err, files) => {
	  files.forEach(file => {
	    console.log(file);
	  });
	});	
}
*/