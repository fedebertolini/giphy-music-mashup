const dotenv = require('dotenv');
const giphy = require('../src/services/giphy');

beforeAll(() => {
    dotenv.config();
});

test('giphy search returns results', (done) => {
    giphy.search('test').then((result) => {
        expect(result.items.length).toBeGreaterThan(0);
        expect(result.totalCount).toBeGreaterThanOrEqual(result.items.length);
        done();
    });
});
