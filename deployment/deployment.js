const {getDeploymentNetwork, runCommands, scripts} = require('./execution.js')
const protocolNetworkData = require('./deploymentConfigurations.json');
const args = require('minimist')(process.argv.slice(2));

const protocolNetworkMap = JSON.parse(JSON.stringify(protocolNetworkData))['subgraphs'] 

let allScripts = new Map()
let results = "RESULTS:\n"


if (!args.subgraph || !args.location) {
    console.log('Please provide at least --SUBGRAPH and --LOCATION')
} else if (args.subgraph && args.protocol && args.network && args.location) {
    if (args.subgraph in protocolNetworkMap == false) {
        console.log('Error: please specify a a valid subgraph directory or add to configurations (e.g. uniswap-forks, compound-forks, qidao, etc')
    } else if (args.protocol in protocolNetworkMap[args.subgraph] == false) {
        console.log('Error: please specify a valid protocol as 1st argument or add to configurations  (i.e. uniswap-v2, sushiswap, etc.)')
        console.log('To deploy a protocol to a specific network, pass 3 arguements (protocol/network/location)')
    } else if (args.network in protocolNetworkMap[args.subgraph][args.protocol] == false) {
        console.log('Error: please specify a valid network as 2nd argument or add to configurations  (i.e. mainnet, ropsten, etc.)')
        console.log('To deploy a protocol to a specific network, pass 3 arguements (protocol/network/location)')
    } else {
        let protocol = args.protocol
        let network = args.network
        let template = protocolNetworkMap[args.subgraph][protocol][network]['template']
        let location = ""
        let prepareConstants = protocolNetworkMap[args.subgraph][protocol][network]['prepare:constants']
        
        // Get location for configurations or derive using standard naming convention
        if (args.location in protocolNetworkMap[args.subgraph][protocol][network]) {
            location = protocolNetworkMap[args.subgraph][protocol][network][args.location]
        } else {
            location = args.location + '/' + protocol + '-' + getDeploymentNetwork(network)
        }

        // Check if deployment is ignored in configurations
        if ([true, undefined].includes(protocolNetworkMap[args.subgraph][protocol][network]['deploy-on-merge']) | args.location != 'messari') {
            allScripts.set(location, scripts(protocol, network, template, location, prepareConstants))
        }else {
            results += "Ignored in Deployment Configurations: " + location + '\n'
        }
        runCommands(allScripts, results, args, function(results) {});
    } 
} else if (args.subgraph && args.protocol && args.location) {
    if (args.subgraph in protocolNetworkMap == false) {
        console.log('Error: please specify a a valid subgraph directory or add to configurations  (e.g. uniswap-forks, compound-forks, qidao, etc')
    } else if (args.protocol in protocolNetworkMap[args.subgraph] == false) {
        console.log('Error: please specify a valid protocol as 1st argument or add to configurations  (i.e. uniswap-v2, sushiswap, etc.)')
        console.log('To deploy all networks of a specified protocol, pass 2 arguements (protocol/location)')
    } else {
        let protocol = args.protocol

        for (const network in protocolNetworkMap[args.subgraph][protocol]) {

            let template = protocolNetworkMap[args.subgraph][protocol][network]['template']
            let location = ""
            let prepareConstants = protocolNetworkMap[args.subgraph][protocol][network]['prepare:constants']

            // Get location for configurations or derive using standard naming convention
            if (args.location in protocolNetworkMap[args.subgraph][protocol][network]) {
                location = protocolNetworkMap[args.subgraph][protocol][network][args.location]
            } else {
                location = args.location + '/' + protocol + '-' + getDeploymentNetwork(network)
            }
            
            // Check if deployment is ignored in configurations
            if ([true, undefined].includes(protocolNetworkMap[args.subgraph][protocol][network]['deploy-on-merge']) | args.location != 'messari') {
                allScripts.set(location, scripts(protocol, network, template, location, prepareConstants))
            } else {
                results += "Ignored in Deployment Configurations: " + location + '\n'
            }
        } 

        runCommands(allScripts, results, args, function(results) {});
    }
} else if (args.subgraph && args.location) {
    if (args.subgraph in protocolNetworkMap == false) {
        console.log('Error: please specify a a valid subgraph directory or add to configurations  (e.g. uniswap-forks, compound-forks, qidao, etc')
    } else {
        for (const protocol in protocolNetworkMap[args.subgraph]) {
            for (const network in protocolNetworkMap[args.subgraph][protocol]) {

                let template = protocolNetworkMap[args.subgraph][protocol][network]['template']
                let location = ""
                let prepareConstants = protocolNetworkMap[args.subgraph][protocol][network]['prepare:constants']

                // Get location for configurations or derive using standard naming convention
                if (args.location in protocolNetworkMap[args.subgraph][protocol][network]) {
                    location = protocolNetworkMap[args.subgraph][protocol][network][args.location]
                } else {
                    location = args.location + '/' + protocol + '-' + getDeploymentNetwork(network)
                }
                
                // Check if deployment is ignored in configurations
                if ([true, undefined].includes(protocolNetworkMap[args.subgraph][protocol][network]['deploy-on-merge']) | args.location != 'messari') {
                    allScripts.set(location, scripts(protocol, network, template, location, prepareConstants))
                } else {
                    results += "Ignored in Deployment Configurations: " + location + '\n'
                }
            }
        } 

        runCommands(allScripts, results, args, function(results) {});
    }
} else {
    console.log('UNKOWN - Please post issue on github.')
}
