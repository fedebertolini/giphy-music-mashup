require('dotenv').config();

const giphy = require('./services/giphy');
const ffmpeg = require('./services/ffmpeg');
const fileDownload = require('./services/fileDownload');
const fs = require('fs');

const sampleSongPath = `${process.cwd()}/__tests__/music/jonathan-mann-i-wont-lock-it-down.mp3`;
const giphySearchPhrase = 'trippy';
const videoCount = 5;
const maxGiphyVideoDuration = 5;
let songDuration = 0;
const tempFiles = [];
const videosMetadata = [];

const downloadVideos = videos => Promise.all(videos.map((video) => {
    const url = video.images.original.mp4;
    const destPath = `${process.cwd()}/temp/${video.slug}.mp4`;
    tempFiles.push(destPath);
    return fileDownload(url, destPath)
            .then(() => destPath)
            .catch(() => null); // ignore error
})).then(filePaths => filePaths.filter(path => !!path));

const resizeVideos = filePaths => Promise.all(filePaths.map((filePath) => {
    const resizeVideoPath = filePath.replace('.mp4', '-resized.mp4');
    tempFiles.push(resizeVideoPath);
    return ffmpeg.resizeVideo(filePath, resizeVideoPath, maxGiphyVideoDuration).then(() => resizeVideoPath);
}));

const concatVideos = (filePaths) => {
    const timestamp = (new Date()).getTime();
    const concatedVideoPath = `${process.cwd()}/temp/_${timestamp}.mp4`;
    tempFiles.push(concatedVideoPath);
    return ffmpeg.concatVideos(filePaths, concatedVideoPath, `${process.cwd()}/temp/`).then(() => concatedVideoPath);
};

const getFilesMetadata = filePaths => Promise.all(filePaths.map(file => ffmpeg.getFileMetadata(file).catch(() => {
    console.log(`Error getting metadata: ${file}`);
    return null;
})));

const downloadVideosUntilAudioDurationIsMet = (fileUrls, remainingSongDuration) => {
    const items = fileUrls.slice(0, videoCount);
    return downloadVideos(items).then((videoPaths) => {
        console.log('videos downloaded');
        return getFilesMetadata(videoPaths);
    }).then((metadatas) => {
        console.log('metadata retrieved');
        let currentDuration = remainingSongDuration;
        metadatas.forEach((metadata) => {
            if (metadata && currentDuration > 0) {
                videosMetadata.push(metadata);
                currentDuration -= Math.max(metadata.format.duration, maxGiphyVideoDuration);
            }
        });

        if (currentDuration > 0 && metadatas.length) {
            console.log(`current duration: ${currentDuration}`);
            const newFileUrls = fileUrls.slice(videoCount - 1, fileUrls.length);
            return downloadVideosUntilAudioDurationIsMet(newFileUrls, currentDuration);
        }
        return false;
    });
};

const loopVideo = videoPath => ffmpeg.getFileMetadata(videoPath).then((metadata) => {
    const loopTimes = Math.ceil(songDuration / metadata.format.duration);
    if (loopTimes > 1) {
        const loopPaths = Array(loopTimes).fill(videoPath);
        return concatVideos(loopPaths);
    }
    return videoPath;
});

const deleteFiles = (files) => {
    files.forEach((file) => {
        try {
            fs.unlinkSync(file);
        } catch (e) {
            // ignore error and continue
        }
    });
};

ffmpeg.getFileMetadata(sampleSongPath)
.then((metadata) => {
    songDuration = Math.ceil(metadata.format.duration);

    return giphy.search(giphySearchPhrase);
}).then(result => downloadVideosUntilAudioDurationIsMet(result.items, songDuration))
.then(() => {
    console.log('resizing videos');
    const filePaths = videosMetadata.map(metadata => metadata.format.filename);
    return resizeVideos(filePaths);
})
.then((filePaths) => {
    console.log('concatenating videos');
    return concatVideos(filePaths);
})
.then((concatedVideoPath) => {
    console.log('looping video');
    return loopVideo(concatedVideoPath);
})
.then((loopedVideoPath) => {
    console.log('adding audio to looped video');
    const videoWithMusicPath = loopedVideoPath.replace('.mp4', '-music.mp4');
    return ffmpeg.addSongToVideo(sampleSongPath, loopedVideoPath, videoWithMusicPath);
})
.then(() => {
    deleteFiles(tempFiles);
    console.log('video processing complete!');
})
.catch((error) => {
    deleteFiles(tempFiles);
    console.log(error);
});
