const axios = require('axios');

const API_URL = 'https://api.giphy.com/v1/gifs/search';

exports.search = (phrase, limit = 100, offset = 0) => {
    const KEY = process.env.GIPHY_KEY;
    const url = `${API_URL}?api_key=${KEY}&q=${phrase}&limit=${limit}&offset=${offset}`;
    return axios.get(url).then((result) => ({
        items: result.data.data,
        totalCount: result.data.pagination.total_count,
    }));
};
