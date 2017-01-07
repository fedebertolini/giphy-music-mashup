const giphy = require('giphy-api')(process.env.GIPHY_KEY);

exports.search = (phrase, limit = 100, offset = 0) => {
    const options = {
        q: phrase,
        limit: limit,
        offset: offset
    };
    return giphy.search(phrase).then(result => {
        return {
            items: result.data,
            totalCount: result.pagination.total_count,
        };
    });
};
