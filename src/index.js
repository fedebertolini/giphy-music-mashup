require('dotenv').config();

const giphy = require('./services/giphy');
const ffmpeg = require('./services/ffmpeg');

giphy.search('berlin').then((result) => {
    const items = result.items.slice(0, 5);
    Promise.all(items.map(item => {
        const url = item.images.original.mp4;
        const destPath = process.cwd() + '/temp/' + item.slug + '.mp4';
        return ffmpeg.downloadVideo(url, destPath).then(() => {
            const resizeVideoPath = process.cwd() + '/temp/resized-' + item.slug + '.mp4';
            return ffmpeg.resizeVideo(destPath, resizeVideoPath).then(() => resizeVideoPath);
        });
    }))
    .then(filePaths => {
        ffmpeg.concatVideos(filePaths, process.cwd() + '/temp/concated.mp4');
    })
    .catch(error => {
        console.log(error);
    });
});
