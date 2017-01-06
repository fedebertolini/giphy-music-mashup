const path = require('path');
const fs = require('fs');
const ffmpeg = require('../src/services/ffmpeg');
const sampleVideoPath = process.cwd() + '/__tests__/videos/SampleVideo.mp4';
const sampleVideoCopyPath = process.cwd() + '/__tests__/videos/SampleVideoCopy.mp4';
const tempPath = process.cwd() + '/temp/';

afterEach(() => {
    // delete all files in temp, except .gitkeep
    const files = fs.readdirSync(tempPath);
    files.forEach(file => {
        if (path.extname(file)) {
            fs.unlinkSync(tempPath + file);
        }
    });
});

test('get video metadata', () => {
    return ffmpeg.getVideoMetadata(sampleVideoPath).then((metadata) => {
        expect(metadata).toBeTruthy();
    });
});

test('resize video', () => {
    const outputPath = tempPath + 'resize-video-test.mp4';
    return ffmpeg.resizeVideo(sampleVideoPath, outputPath).then(() => {
        expect(fs.existsSync(outputPath)).toBeTruthy();
    });
});

test('concat videos', () => {
    const outputPath = tempPath + 'concat-video-test.mp4';
    const paths = [sampleVideoPath, sampleVideoCopyPath];

    return ffmpeg.concatVideos(paths, outputPath, tempPath).then(() => {
        expect(fs.existsSync(outputPath)).toBeTruthy();
    });
});
