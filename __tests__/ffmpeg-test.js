const path = require('path');
const fs = require('fs');
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('../src/services/ffmpeg');

const sampleVideoPath = `${process.cwd()}/__tests__/videos/SampleVideo.mp4`;
const sampleVideoCopyPath = `${process.cwd()}/__tests__/videos/SampleVideoCopy.mp4`;
const sampleSongPath = `${process.cwd()}/__tests__/music/jonathan-mann-i-wont-lock-it-down.mp3`;
const tempPath = `${process.cwd()}/temp/`;

afterEach(() => {
    // delete all files in temp, except .gitkeep
    const files = fs.readdirSync(tempPath);
    files.forEach((file) => {
        if (path.extname(file)) {
            fs.unlinkSync(tempPath + file);
        }
    });
});

test('get file metadata', () => {
    ffmpeg.getFileMetadata(sampleVideoPath)
        .then((metadata) => {
            expect(metadata).toBeTruthy();
        })
        .catch((error) => {
            if (error.message.indexOf('EACCES') >= 0) {
                console.log('Permission denied to execute ffprobe');
                console.log(`Please check the execution permissions of ${ffprobePath}`);
            }
            throw error;
        });
});

test('resize video', () => {
    const outputPath = `${tempPath}resize-video-test.mp4`;
    return ffmpeg.resizeVideo(sampleVideoPath, outputPath).then(() => {
        expect(fs.existsSync(outputPath)).toBeTruthy();
    });
});

test('concat videos', () => {
    const outputPath = `${tempPath}concat-video-test.mp4`;
    const paths = [sampleVideoPath, sampleVideoCopyPath];

    return ffmpeg.concatVideos(paths, outputPath, tempPath).then(() => {
        expect(fs.existsSync(outputPath)).toBeTruthy();
    });
});

test('add song to video', () => {
    const outputPath = `${tempPath}song-video-test.mp4`;
    return ffmpeg.addSongToVideo(sampleSongPath, sampleVideoPath, outputPath).then(() => {
        expect(fs.existsSync(outputPath)).toBeTruthy();
    });
});
