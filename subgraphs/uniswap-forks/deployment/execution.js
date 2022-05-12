import { exec } from 'child_process';

/**
 * @param {string} protocol - Protocol that is being deployed
 * @param {string} network - Network that the protocol is being deployed to
 * @param {string} template - Template location that will be used to create subgraph.yaml
 * @param {string} location - Location in the subgraph will be deployed to {e.g. messari/uniswap-v2-ethereum}
*/
export function scripts(protocol, network, template, location) {
    let prepareYaml = 'npm run prepare:yaml --PROTOCOL=' + protocol + ' --NETWORK=' + network + ' --TEMPLATE=' + template
    let prepareConstants = 'npm run prepare:constants --PROTOCOL=' + protocol + ' --NETWORK=' + network
    let prepareBuild = 'yarn codegen && yarn build'
    let deployment = 'npm run deploy:subgraph --LOCATION=' + location
    return [prepareYaml, prepareConstants, prepareBuild, deployment]
}

/**
 * @param {string[]} array - Protocol that is being deployed
 * @param {string} callback 
*/
export function runCommands(array, callback) {

    var index = 0;
    var results = [];

    function next() {
        if (index < array.length) {
            exec(array[index++], function(error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            } 
            if (error) return callback(error);
            // do the next iteration
            results.push(stdout);
            next();
           });
       } else {
           // all done here
           callback(null, results);
       }
    }
    // start the first iteration
    next();
}
