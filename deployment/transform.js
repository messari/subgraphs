const fs = require("fs");
const deploymentJsonData = require("./deployment.json");

// Input json transformation script below

// for (const [protocol, protocolData] of Object.entries(deploymentJsonData)) {
//     for (const [deployment, deploymentData] of Object.entries(protocolData['deployments'])) {
//         let services = {}
//         console.log(deployment)
//         for (const [service, slug] of Object.entries(deploymentData['deployment-ids'])) {
//             services[service] = {"slug": slug, "query-id": slug}
//         }
//         console.log(services)
//         delete deploymentJsonData[protocol]["deployments"][deployment]['deployment-ids']
//         deploymentJsonData[protocol]["deployments"][deployment]['services'] = services
//     }
// }

const data = JSON.stringify(deploymentJsonData, null, 2);

// write JSON string to a file
fs.writeFile("new_deployment.json", data, (err) => {
  if (err) {
    throw err;
  }
  console.log("JSON data is saved.");
});

console.log(deploymentJsonData);
