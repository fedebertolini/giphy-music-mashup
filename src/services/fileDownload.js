const url = require('url');
const http = require('http');
const https = require('https');
const fs = require('fs');

module.exports = (fileUrl, filePath) => {
    const urlObject = url.parse(fileUrl);
    const file = fs.createWriteStream(filePath);
    return new Promise((resolve, reject) => {
        let responseSent = false;
        const httpClient = urlObject.protocol === 'http:' ? http : https;

        httpClient.get(fileUrl, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    if (responseSent) return;
                    responseSent = true;
                    resolve();
                });
            });
        }).on('error', (err) => {
            if (responseSent) return;
            responseSent = true;
            reject(`Error downloading ${fileUrl} - ${err}`);
        });
    });
};
