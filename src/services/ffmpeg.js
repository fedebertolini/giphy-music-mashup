const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
const url = require('url');
const http = require('http');
const https = require('https');
const fs = require('fs');
const maxWidth = 500;
const maxHeight = 500;
const videoResolution = maxWidth + 'x' + maxHeight;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

exports.getVideoMetadata = (videoSrc) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoSrc, function(error, metadata) {
            if (error) {
                reject(error);
            }
            resolve(metadata);
        });
    });
};

exports.resizeVideo = (videoSrc, outputPath) => {
    const command = ffmpeg(videoSrc).size(videoResolution).autopad();

    return new Promise((resolve, reject) => {
        command.on('end', () => {
            resolve();
        }).on('error', function(error) {
            reject(error);
        })
        .save(outputPath);
    });
}

exports.concatVideos = (videoSrcs, outputPath) => {
    const command = ffmpeg();
    videoSrcs.forEach(videoSrc => {
        command.addInput(videoSrc);
    });

    return new Promise((resolve, reject) => {
        command.on('end', () => {
            resolve();
        }).on('error', function(error) {
            reject(error);
        }).mergeToFile(outputPath);
    });
};

exports.downloadVideo = (fileUrl, filePath) => {
    const urlObject = url.parse(fileUrl);
    const file = fs.createWriteStream(filePath);
    return new Promise((resolve, reject) => {
        let responseSent = false;
        const httpClient = urlObject.protocol === 'http:' ? http : https;

        httpClient.get(fileUrl, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    if (responseSent) return;
                    responseSent = true;
                    resolve();
                });
            });
        }).on('error', err => {
            if (responseSent) return;
            responseSent = true;
            reject(err);
        });
    });
};
