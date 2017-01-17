require('dotenv').config();

const giphy = require('./services/giphy');
const ffmpeg = require('./services/ffmpeg');
const fileDownload = require('./services/fileDownload');
const fs = require('fs');
const ccmixter = require('ccmixter-js');
const args = require('minimist')(process.argv.slice(2));

const giphySearchPhrase = args.giphy || 'trippy';
const ccmixterSearchPhrase = args.ccmixter || 'psychedelic';
const videoCount = 5;
const maxGiphyVideoDuration = 5;
let songDuration = 0;
let songPath = '';
const tempFiles = [];
const videosMetadata = [];

console.log('Starting mashup');
console.log(`Giphy search term: ${giphySearchPhrase}`);
console.log(`ccmixter search term: ${ccmixterSearchPhrase}`);

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

const getRandomSong = phrase => {
    return ccmixter.searchSongs({
        searchPhrase: phrase,
        limit: 50,
    }).then(result => {
        const items = result.items.filter(item => item.files.length > 0);
        const random = Math.floor(Math.random() * items.length);
        return items[random].files[0];
    });
};

const downloadSong = songInfo => {
    const destPath = `${process.cwd()}/temp/${songInfo.file_name}`;
    tempFiles.push(destPath);
    return fileDownload(songInfo.download_url, destPath).then(() => destPath);
}

const deleteFiles = (files) => {
    files.forEach((file) => {
        try {
            fs.unlinkSync(file);
        } catch (e) {
            // ignore error and continue
        }
    });
};

const shuffleArray = (array) => {
    const a = array.slice(0);
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
    return a;
};

getRandomSong(ccmixterSearchPhrase)
.then(songInfo => {
    console.log(`Downloading random song: ${songInfo.file_name}`);
    return downloadSong(songInfo);
})
.then(path => {
    songPath = path;
    console.log(`Song downloaded successfully. Retrieving song metadata.`)
    return ffmpeg.getFileMetadata(path);
})
.then(metadata => {
    songDuration = Math.ceil(metadata.format.duration);

    console.log(`Searching giphys`);
    return Promise.all([
        giphy.search(giphySearchPhrase, 100 , 0),
        giphy.search(giphySearchPhrase, 100 , 100),
        giphy.search(giphySearchPhrase, 100 , 200),
    ]).then(result => result[0].items.concat(result[1].items).concat(result[2].items));
})
.then(items => downloadVideosUntilAudioDurationIsMet(shuffleArray(items), songDuration))
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
    return ffmpeg.addSongToVideo(songPath, loopedVideoPath, videoWithMusicPath);
})
.then(() => {
    deleteFiles(tempFiles);
    console.log('video processing complete!');
})
.catch((error) => {
    deleteFiles(tempFiles);
    console.log(error);
});
