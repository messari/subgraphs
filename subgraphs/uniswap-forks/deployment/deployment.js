import * as protocolNetworkData from './deploymentLocations.json' assert {type: "json"}
import { exec } from 'child_process';


const protocolNetworkMap = JSON.parse(JSON.stringify(protocolNetworkData))['default']; // req.body = [Object: null prototype] { title: 'product' }

console.log('//////////' + process.argv[3]) // prints ['path/node', 'path/foo.js', 'bar']

exec('npm run deploy --protocol=' + process.argv[3] + ' --network=' + process.argv[4] + ' --location=' + process.argv[2],
    function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });



// if (process.argv.length == 2) {
//     console.log('Error: please specify hosted service account (i.e. messari, steegecs, etc.)')
// } else if (process.argv.length == 3) {
//     for (const key in protocolNetworkMap) {
//         for (const network in protocolNetworkMap[key]) {

//             exec('npm run deploy --protocol=' + key + ' --network=' + protocolNetworkMap[key][network] + ' --location=' + process.argv[2],
//                 function (error, stdout, stderr) {
//                     console.log('stdout: ' + stdout);
//                     console.log('stderr: ' + stderr);
//                     if (error !== null) {
//                         console.log('exec error: ' + error);
//                     }
//                 });
//         }
//     }
// } else if (process.argv.length == 4) {
//     if (!process.argv[3] in protocolNetworkMap) {
//         console.log('Error: please specify a valid protocol (i.e. uniswap-v2, sushiswap, etc.)')
//     } else {
//         for (const network in protocolNetworkMap[process.argv[3]]) {

//             exec('npm run deploy --protocol=' + process.argv[3] + ' --network=' + protocolNetworkMap[process.argv[3]][network] + ' --location=' + process.argv[2],
//                 function (error, stdout, stderr) {
//                     console.log('stdout: ' + stdout);
//                     console.log('stderr: ' + stderr);
//                     if (error !== null) {
//                         console.log('exec error: ' + error);
//                     }
//                 });
//         }
//     }
//  } else if (process.argv.length == 5) {
//     if (!protocolNetworkMap.has(process.argv[3])) {
//         console.log('Error: please specify a valid protocol (i.e. uniswap-v2, sushiswap, etc.)')
//     } else if (!protocolNetworkMap[process.argv[3]].has(process.argv[4])) {
//         console.log('Error: please specify a valid network (i.e. mainnet, ropsten, etc.)')
//     } else {

//     exec('npm run deploy --protocol=' + process.argv[3] + ' --network=' + process.argv[4] + ' --location=' + process.argv[2],
//          function (error, stdout, stderr) {
//             console.log('stdout: ' + stdout);
//             console.log('stderr: ' + stderr);
//             if (error !== null) {
//                 console.log('exec error: ' + error);
//             }
//         });
//     }
// } else {
//     console.log('Error: Too many arguments')
// }