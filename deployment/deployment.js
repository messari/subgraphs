const { executeDeployment } = require("./execution.js");
const { validateDeploymentJson } = require("./validation/validateDeploymentJson.js");
const { Deployment } = require("./deploymentClass.js");
const deploymentJsonData = require("./deployment.json");
const args = require("minimist")(process.argv.slice(2));

validateDeploymentJson(deploymentJsonData);

if (
  args.deploy == undefined ||
  args.token == undefined ||
  args.id == undefined ||
  args.service == undefined ||
  args.target == undefined ||
  args.span == undefined ||
  args.slug == undefined ||
  args.printlogs == undefined ||
  args.merge == undefined
) {
  throw "Please check package.json scripts in local subgraph folder. This error is being thrown becuase it is missing a parameteter in the 'deploy' script. You can find an updated version of the scripts in the deployments folder at the head of the directory.";
}

const deploymentJsonMap = JSON.parse(JSON.stringify(deploymentJsonData));

let deployment = new Deployment(deploymentJsonMap, args);

deployment.prepare();
executeDeployment(deployment, function (results) {});
