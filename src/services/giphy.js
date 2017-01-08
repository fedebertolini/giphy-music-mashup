const giphy = require('giphy-api')(process.env.GIPHY_KEY);

exports.search = (phrase, limit = 100, offset = 0) => {
    const options = {
        q: phrase,
        limit,
        offset,
    };
    return giphy.search(options).then(result => ({
        items: result.data,
        totalCount: result.pagination.total_count,
    }));
};
