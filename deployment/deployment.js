import * as protocolNetworkData from './deploymentConfigurations.json'
import {getDeploymentNetwork, runCommands, scripts} from './execution.js'

const protocolNetworkMap = JSON.parse(JSON.stringify(protocolNetworkData))['default']['protocols'] 
const configurations = JSON.parse(JSON.stringify(protocolNetworkData))['default']['configurations'] 

let allScripts = new Map()
let results = "RESULTS:\n"

if (process.argv.length == 2) {
    console.log('Error: please at least specify hosted service account to deploy all subgraphs (i.e. messari, steegecs, etc.)')
} else if (process.argv.length == 3) {
    if (!process.argv[2] in configurations['deployment']['locations']) {
        console.log('Error: please specify a deployment location only to deploy all subgraphs (i.e. steegecs, messari, etc.)')
    } else {
        for (const protocol in protocolNetworkMap) {
            for (const network in protocolNetworkMap[protocol]) {

                let template = protocolNetworkMap[protocol][network]['template']
                let location = ""
                let prepareConstants = protocolNetworkMap[protocol][network]['prepare:constants']

                // Get location for configurations or derive using standard naming convention
                if (process.argv[2] in protocolNetworkMap[protocol][network]) {
                    location = protocolNetworkMap[protocol][network][process.argv[2]]
                } else {
                    location = process.argv[2] + '/' + protocol + '-' + getDeploymentNetwork(network)
                }
                
                // Check if deployment is ignored in configurations
                if ([true, undefined].includes(protocolNetworkMap[protocol][network]['deploy-on-merge']) | process.argv[2] != 'messari') {
                    allScripts.set(location, scripts(protocol, network, template, location, prepareConstants))
                } else {
                    results += "Ignored in Deployment Configurations: " + location + '\n'
                }
            }
        } 

        runCommands(allScripts, results, function(results) {});

    }
} else if (process.argv.length == 4) {
    if (!process.argv[2] in protocolNetworkMap) {
        console.log('Error: please specify a valid protocol as 1st argument (i.e. uniswap-v2, sushiswap, etc.)')
        console.log('To deploy all networks of a specified protocol, pass 2 arguements (protocol/location)')
    } else if (!process.argv[3] in configurations['deployment']['locations']) {
        console.log('Error: please specify a deployment location as 3rd argument (i.e. steegecs, messari, etc.)')
        console.log('To deploy a protocol to a specific network, pass 3 arguements (protocol/network/location)')
    } else {
        let protocol = process.argv[2]
        for (const network in protocolNetworkMap[protocol]) {
            let template = protocolNetworkMap[protocol][network]['template']
            let location = ""
            let prepareConstants = protocolNetworkMap[protocol][network]['prepare:constants']

            // Get location for configurations or derive using standard naming convention
            if (process.argv[3] in protocolNetworkMap[protocol][network]) {
                location = protocolNetworkMap[protocol][network][process.argv[3]]
            } else {
                location = process.argv[3] + '/' + protocol + '-' + getDeploymentNetwork(network)
            }
            
            // Check if deployment is ignored in configurations
            if ([true, undefined].includes(protocolNetworkMap[protocol][network]['deploy-on-merge']) | process.argv[3] != 'messari') {
                allScripts.set(location, scripts(protocol, network, template, location, prepareConstants))
            } else {
                results += "Ignored in Deployment Configurations: " + location + '\n'
            }
        } 

        runCommands(allScripts, results, function(results) {});
    }
 } else if (process.argv.length == 5) {
    if (!process.argv[2] in protocolNetworkMap) {
        console.log('Error: please specify a valid protocol as 1st argument (i.e. uniswap-v2, sushiswap, etc.)')
        console.log('To deploy a protocol to a specific network, pass 3 arguements (protocol/network/location)')
    } else if (!process.argv[3] in protocolNetworkMap[process.argv[2]]) {
        console.log('Error: please specify a valid network as 2nd argument (i.e. mainnet, ropsten, etc.)')
        console.log('To deploy a protocol to a specific network, pass 3 arguements (protocol/network/location)')
    } else if (!process.argv[4] in configurations['deployment']['locations']) {
        console.log('Error: please specify a deployment location as 3rd argument (i.e. steegecs, messari, etc.)')
        console.log('To deploy a protocol to a specific network, pass 3 arguements (protocol/network/location)')
    } else {
        let protocol = process.argv[2]
        let network = process.argv[3]
        let template = protocolNetworkMap[protocol][network]['template']
        let location = ""
        let prepareConstants = protocolNetworkMap[protocol][network]['prepare:constants']
        
        // Get location for configurations or derive using standard naming convention
        if (process.argv[4] in protocolNetworkMap[protocol][network]) {
            location = protocolNetworkMap[protocol][network][process.argv[4]]
        } else {
            location = process.argv[4] + '/' + protocol + '-' + getDeploymentNetwork(network)
        }

        // Check if deployment is ignored in configurations
        if ([true, undefined].includes(protocolNetworkMap[protocol][network]['deploy-on-merge']) | process.argv[4] != 'messari') {
            allScripts.set(location, scripts(protocol, network, template, location, prepareConstants))
        }else {
            results += "Ignored in Deployment Configurations: " + location + '\n'
        }
        runCommands(allScripts, results, function(results) {});
    } 
} else {
    console.log('Error: Too many arguments')
}
