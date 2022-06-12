import { exec } from 'child_process';
import fs from 'fs';

/**
 * @param {string} protocol - Protocol that is being deployed
 * @param {string} network - Network that the protocol is being deployed to
 * @param {string} template - Template location that will be used to create subgraph.yaml
 * @param {string} location - Location in the subgraph will be deployed to {e.g. messari/uniswap-v2-ethereum}
*/
export function scripts(protocol, network, template, location, constants) {
    let scripts = [];
    let removeConfig = "rm -rf configurations/configure.ts"
    let removeSubgraphYaml = "rm -rf subgraph.yaml"
    let prepareYaml = "npm run prepare:yaml --PROTOCOL=" + protocol + " --NETWORK=" + network + " --TEMPLATE=" + template
    let prepareConstants = "npm run prepare:constants --PROTOCOL=" + protocol + " --NETWORK=" + network
    let prepareBuild = "graph codegen && graph build"
    let deployment = "npm run deploy:subgraph --LOCATION=" + location

    scripts.push(removeConfig)
    scripts.push(removeSubgraphYaml)
    scripts.push(prepareYaml)
    if (constants == true) {
        scripts.push(prepareConstants)
    }
    scripts.push(prepareBuild)
    scripts.push(deployment)
    
    return scripts
}

export function getDeploymentNetwork(network) {
    let deployNetwork = "";
    switch (network) {
        case "mainnet":
            deployNetwork = "ethereum"
            break;
        case "xdai":
            deployNetwork = "gnosis"
            break;
        case "matic":
            deployNetwork = "polygon"
            break;
        default: 
            deployNetwork = network
    }
    return deployNetwork
}
            
/**
 * @param {string[]} array - Protocol that is being deployed
 * @param {string} callback 
*/
export async function runCommands(allScripts, results, callback) {

    let logs = ""
    var index = 0;
    var index2 = 0;
    let protocols = Array.from( allScripts.keys() );

    function next() {
        if (index < protocols.length) {
            exec(allScripts.get(protocols[index])[index2++], function(error, stdout, stderr) {
            logs = logs + "stdout: "  + stdout
            logs = logs + "stderr: "  + stderr
            if (error !== null) {
                logs = logs + "Exec error: "  + error
                results += 'Deployment Failed: ' + protocols[index] + '\n'
                console.log(error)
                index++;
                index2 = 0;
            } else if (index2 == allScripts.get(protocols[index]).length) {
                results += 'Deployment Successful: ' + protocols[index] + '\n'
                index++;
                index2 = 0;
            }

            // do the next iteration
            next();
        });
        } else {
            // all done here
            fs.writeFile('results.txt', logs.replace(/\u001b[^m]*?m/g,""), function (err) {
                if (err) throw err;
              });
            console.log(results + "END")
            callback(results);
        }
    }

    // start the first iteration
    next();
}