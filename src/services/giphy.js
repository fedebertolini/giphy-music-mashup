const giphy = require('giphy-api')(process.env.GIPHY_KEY);

exports.search = (phrase) => {
    return giphy.search(phrase).then(result => {
        return {
            items: result.data,
            totalCount: result.pagination.total_count,
        };
    });
};
