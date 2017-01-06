require('dotenv').config();

const giphy = require('./services/giphy');
const ffmpeg = require('./services/ffmpeg')
const fs = require('fs');;

const giphySearchPhrase = 'snow';
const videoCount = 5;

giphy.search(giphySearchPhrase).then((result) => {
    const items = result.items.slice(0, videoCount);
    const tempFiles = [];
    Promise.all(items.map(item => {
        const url = item.images.original.mp4;
        const destPath = `${process.cwd()}/temp/${item.slug}.mp4`;
        tempFiles.push(destPath);
        return ffmpeg.downloadVideo(url, destPath).then(() => {
            const resizeVideoPath = `${process.cwd()}/temp/resized-${item.slug}.mp4`;
            tempFiles.push(resizeVideoPath);
            return ffmpeg.resizeVideo(destPath, resizeVideoPath).then(() => resizeVideoPath);
        });
    }))
    .then(filePaths => {
        const timestamp = (new Date()).getTime();
        return ffmpeg.concatVideos(filePaths, `${process.cwd()}/temp/_${timestamp}.mp4`, `${process.cwd()}/temp/`);
    })
    .then(() => {
        tempFiles.forEach(tempFile => {
            fs.unlinkSync(tempFile);
        });
    })
    .catch(error => {
        console.log(error);
    });
});
