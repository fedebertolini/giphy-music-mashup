const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
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
        }).save(outputPath);
    });
}
