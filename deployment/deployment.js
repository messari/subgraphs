const {
  executeDeployment,
} = require("./execution.js");
const {
  Deployment,
} = require("./class.js");
const deploymentJsonData = require("./deployment.json");
const args = require("minimist")(process.argv.slice(2));

const deploymentJsonMap = JSON.parse(JSON.stringify(deploymentJsonData));

let deployment = new Deployment(deploymentJsonMap, args);

deployment.prepare()

executeDeployment(deployment, function (results) {});
