const ffmpeg = require('../src/services/ffmpeg');
const sampleVideoPath = process.cwd() + '/__tests__/videos/SampleVideo.mp4';

test('get video metadata', () => {
    return ffmpeg.getVideoMetadata(sampleVideoPath).then((metadata) => {
        expect(metadata).toBeTruthy();
    });
});
