import * as protocolNetworkData from './deploymentConfigurations.json' assert {type: "json"}
import {runCommands, scripts} from './execution.js'

const protocolNetworkMap = JSON.parse(JSON.stringify(protocolNetworkData))['default']['protocols'] 
const configurations = JSON.parse(JSON.stringify(protocolNetworkData))['default']['configurations'] 

if (process.argv.length == 2) {
    console.log('Error: please at least specify hosted service account to deploy all subgraphs (i.e. messari, steegecs, etc.)')
} else if (process.argv.length == 3) {
    if (!process.argv[4] in configurations['deployment']['locations']) {
        console.log('Error: please specify a deployment location only to deploy all subgraphs (i.e. steegecs, messari, etc.)')
    } else {
        for (const protocol in protocolNetworkMap) {
            for (const network in protocolNetworkMap[protocol]) {

                let template = protocolNetworkMap[process.argv[2]][process.argv[3]]['template']
                let location = protocolNetworkMap[process.argv[2]][process.argv[3]][process.argv[4]]

                runCommands(scripts(protocol, network, template, location), function() {});
            }
        }
    }
} else if (process.argv.length == 4) {
    if (!process.argv[2] in protocolNetworkMap) {
        console.log('Error: please specify a valid protocol as 1st argument (i.e. uniswap-v2, sushiswap, etc.)')
        console.log('To deploy all networks of a specified protocol, pass 2 arguements (protocol/location)')
    } else if (!process.argv[3] in configurations['deployment']['locations']) {
        console.log('Error: please specify a deployment location as 2nd argument (i.e. steegecs, messari, etc.)')
        console.log('To deploy all networks of a specified protocol, pass 2 arguements (protocol/location)')
    } else {
        let protocol = process.argv[2]
        for (const network in protocolNetworkMap[process.argv[2]]) {
            let template = protocolNetworkMap[protocol][network]['template']
            let location = protocolNetworkMap[protocol][network][process.argv[3]]

            runCommands(scripts(protocol, network, template, location), function() {});
        }
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
        let template = protocolNetworkMap[process.argv[2]][process.argv[3]]['template']
        let location = protocolNetworkMap[process.argv[2]][process.argv[3]][process.argv[4]]

        runCommands(scripts(protocol, network, template, location), function() {});
    }
} else {
    console.log('Error: Too many arguments')
}