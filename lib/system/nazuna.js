const axios = require('axios');

module.exports = class Nazu {
    constructor() {
        this.baseURL = process.env.API_ENDPOINTS
        //this.apiKey = process.env.API_KEYS
    }

    nazuna = (endpoint, options = {}) => {
        const { data, ...params } = options;
        const method = data ? 'POST' : 'GET';

        const config = {
            baseURL: this.baseURL,
            url: endpoint,
            method: method,
            headers: {
                //Authorization: this.apiKey,
                accept: '*/*'
            },
            ...(method === 'GET' && { params: params }),
            ...(method === 'POST' && { data: data })
        };

        return new Promise((resolve, reject) => {
            axios.request(config)
                .then(response => {
                    resolve(response.data);
                })
                .catch(e => {
                    if (e.response) {
                        reject(e.response.data);
                    } else {
                        reject(e);
                    }
                });
        });
    }
}