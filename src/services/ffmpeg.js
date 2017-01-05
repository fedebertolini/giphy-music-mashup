const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');

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
