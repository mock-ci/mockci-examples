const axios = require('axios').default

module.exports = {
    startSession: async (apiKey = null, prefab = {}) => {
        let qs = ''
        if (apiKey) {
            qs = `?api_key=${apiKey}`
        }
        let resp = await axios({
            method: 'post',
            url: `https://session.mockci.cloud/start${qs}`,
            data: prefab
        })
        let data = resp.data
        if(!data.ready) {
            throw new Error(`Created session is not ready, poll /check-session if it keeps happening`)
        }
        return resp.data.dynamodbEndpoint
    }
}