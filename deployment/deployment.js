const { executeDeployment } = require("./execution.js");
const { Deployment } = require("./deploymentClass.js");
const deploymentJsonData = require("./deployment.json");
const args = require("minimist")(process.argv.slice(2));

if (
  args.type == undefined ||
  args.access == undefined ||
  args.fork == undefined ||
  args.service == undefined ||
  args.protocol == undefined ||
  args.network == undefined ||
  args.target == undefined ||
  args.printlogs == undefined ||
  args.merge == undefined
) {
  throw new Error(
    "Please check package.json scripts in local subgraph folder. This error is being thrown becuase it is missing a parameteter in the 'deploy' script. You can find an updated version of the scripts in the deployments folder at the head of the directory."
  );
}

const deploymentJsonMap = JSON.parse(JSON.stringify(deploymentJsonData));

let deployment = new Deployment(deploymentJsonMap, args);

deployment.prepare();
executeDeployment(deployment, function (results) {});
