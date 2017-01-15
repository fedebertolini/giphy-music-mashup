const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

exports.getFileMetadata = videoSrc => new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoSrc, (error, metadata) => {
        if (error) {
            reject(error);
        }
        resolve(metadata);
    });
});

exports.resizeVideo = (videoSrc, outputPath, maxDuration) => {
    const command = ffmpeg(videoSrc);
    let executedCommand = '';

    const vfOptions = [
        'scale=500:500:force_original_aspect_ratio=decrease',
        'pad=500:500:(ow-iw)/2:(oh-ih)/2',
        'setsar=1:1',
        'setdar=1:1',
    ].join(',');

    command.addOption('-vf', vfOptions);

    if (maxDuration) {
        command.outputOptions(`-to ${maxDuration}`);
    }

    return new Promise((resolve, reject) => {
        command.on('end', () => {
            resolve();
        }).on('error', (error) => {
            console.log(executedCommand);
            reject(error);
        })
        .on('start', (commandLine) => {
            executedCommand = ffmpegPath + commandLine.replace('ffmpeg', '');
        })
        .save(outputPath);
    });
};

exports.concatVideos = (videoSrcs, outputPath, tempPath) => {
    const command = ffmpeg();
    let executedCommand = '';

    videoSrcs.forEach((videoSrc) => {
        command.addInput(videoSrc);
    });

    return new Promise((resolve, reject) => {
        command.on('end', () => {
            resolve();
        }).on('start', (commandLine) => {
            executedCommand = ffmpegPath + commandLine.replace('ffmpeg', '');
        }).on('error', (error) => {
            console.log(executedCommand);
            reject(error);
        }).mergeToFile(outputPath, tempPath);
    });
};

exports.addSongToVideo = (songPath, videoPath, outputPath) => {
    const command = ffmpeg().addInput(songPath).addInput(videoPath);
    command.addOption('-vcodec', 'copy');
    command.addOption('-vcodec', 'copy');
    command.addOption('-map', '0:0');
    command.addOption('-map', '1:0');
    command.addOption('-shortest');

    let executedCommand = '';

    return new Promise((resolve, reject) => {
        command.on('end', () => {
            resolve();
        }).on('error', (error) => {
            console.log(executedCommand);
            reject(error);
        })
        .on('start', (commandLine) => {
            executedCommand = ffmpegPath + commandLine.replace('ffmpeg', '');
        })
        .save(outputPath);
    });
};
