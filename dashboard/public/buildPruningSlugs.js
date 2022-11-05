const https = require('https')
const fs = require('fs')
var path = require('path');

const url = "https://raw.githubusercontent.com/messari/subgraphs/master/deployment/deployment.json";
const slugsArr = [];
https.get(url, res => {
    let data = '';
    res.on('data', chunk => {
        data += chunk;
    });
    res.on('end', () => {
        data = JSON.parse(data);
        const protocolKeys = Object.keys(data);
        protocolKeys.forEach(x => {
            if (data[x].schema === 'governance') {
                return;
            }
            const deploymentsOnProtocolKeys = Object.keys(data[x].deployments);
            deploymentsOnProtocolKeys.forEach(y => {
                const deployment = data[x].deployments[y].services['hosted-service']?.slug;
                if (data[x].deployments[y].network === 'cronos' || !deployment) {
                    return;
                }
                slugsArr.push('messari/' + deployment);
            })
        });

        try {
            const jsonPath = path.join(__dirname, 'prune.json');
            fs.writeFileSync(jsonPath, JSON.stringify(slugsArr, null, '\t'));
        } catch (err) {
            console.error(err);
        }
    })
}).on('error', err => {
    console.log(err.message);
}).end()
