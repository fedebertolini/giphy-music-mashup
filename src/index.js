require('dotenv').config();

const giphy = require('./services/giphy');
const ffmpeg = require('./services/ffmpeg')
const fs = require('fs');;

const sampleSongPath = `${process.cwd()}/__tests__/music/jonathan-mann-i-wont-lock-it-down.mp3`;
const giphySearchPhrase = 'snow';
const videoCount = 5;

giphy.search(giphySearchPhrase).then((result) => {
    const items = result.items.slice(0, videoCount);
    const tempFiles = [];

    Promise.all(items.map(item => {
        // Download videos
        const url = item.images.original.mp4;
        const destPath = `${process.cwd()}/temp/${item.slug}.mp4`;
        tempFiles.push(destPath);
        return ffmpeg.downloadVideo(url, destPath).then(() => destPath);
    }))
    .then(filePaths => {
        // Resize Videos
        return Promise.all(filePaths.map(filePath => {
            const resizeVideoPath = filePath.replace('.mp4', '-resized.mp4');
            tempFiles.push(resizeVideoPath);
            return ffmpeg.resizeVideo(filePath, resizeVideoPath).then(() => resizeVideoPath);
        }));
    })
    .then(filePaths => {
        // Concat Videos
        const timestamp = (new Date()).getTime();
        const concatedVideoPath = `${process.cwd()}/temp/_${timestamp}.mp4`;
        tempFiles.push(concatedVideoPath);
        return ffmpeg.concatVideos(filePaths, concatedVideoPath, `${process.cwd()}/temp/`).then(() => concatedVideoPath);
    })
    .then((concatedVideoPath) => {
        // Add Audio to Video
        let videoWithMusicPath = concatedVideoPath.replace('.mp4', '-music.mp4');
        return ffmpeg.addSongToVideo(sampleSongPath, concatedVideoPath, videoWithMusicPath);
    })
    .then(() => {
        deleteFiles(tempFiles);
    })
    .catch(error => {
        deleteFiles(tempFiles);
        console.log(error);
    });
});

const deleteFiles = (files) => {
    files.forEach(file => {
        try {
            fs.unlinkSync(file);
        } catch (e) {

        }
    });
};
