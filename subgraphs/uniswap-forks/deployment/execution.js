
import { exec } from 'child_process';

/**
 * @param {string} protocol - Protocol that is being deployed
 * @param {string} network - Network that the protocol is being deployed to
 * @param {string} template - Template location that will be used to create subgraph.yaml
*/
async function executePrepareYaml(protocol, network, template) {
    exec('npm run prepare:yaml --PROTOCOL=' + protocol + ' --NETWORK=' + network + ' --TEMPLATE=' + template,
        function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            } 
        });
}

/**
 * @param {string} protocol - Protocol that is being deployed
 * @param {string} network - Network that the protocol is being deployed to
*/
async function executePrepareConstants(protocol, network) {
    exec('npm run prepare:constants --PROTOCOL=' + protocol + ' --NETWORK=' + network,
        function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            } 
        });
}

async function executePrepareBuild() {
    exec('yarn codegen && yarn build',
        function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            } 
        });
}

/**
 * @param {string} location - Location in the subgraph will be deployed to {e.g. messari/uniswap-v2-ethereum}
 */
async function executeDeployment(location) {
    exec('npm run deploy:subgraph --LOCATION=' + location,
        function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            } 
        });
}

/**
 * @param {string} protocol - Protocol that is being deployed
 * @param {string} network - Network that the protocol is being deployed to
 * @param {string} template - Template location that will be used to create subgraph.yaml
 * @param {string} location - Location in the subgraph will be deployed to {e.g. messari/uniswap-v2-ethereum}
*/
export function execute(protocol, network, template, location) {
    console.log('Deploying ' + protocol + ' on ' + network + ' to ' + location + '...')
    executePrepareYaml(protocol, network, template);
    executePrepareConstants(protocol, network);
    // executePrepareBuild();
    executeDeployment(location);
}
