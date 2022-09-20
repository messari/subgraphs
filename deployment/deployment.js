const args = require("minimist")(process.argv.slice(2));
const { executeDeployment } = require("./execution.js");
const {
  validateDeploymentJson,
} = require("./validation/validateDeploymentJson.js");
const { Deployment } = require("./deploymentClass.js");
const deploymentJsonData = require("./deployment.json");

validateDeploymentJson(deploymentJsonData);

if (
  args.deploy === undefined ||
  args.token === undefined ||
  args.id === undefined ||
  args.service === undefined ||
  args.target === undefined ||
  args.span === undefined ||
  args.slug === undefined ||
  args.printlogs === undefined
) {
  throw new Error(
    "Please check package.json scripts in local subgraph folder. This error is being thrown because it is missing a parameter in the 'build' script. You can find an updated version of the scripts in the deployments folder at the head of the directory."
  ).message;
}

const deploymentJsonMap = JSON.parse(JSON.stringify(deploymentJsonData));

const deployment = new Deployment(deploymentJsonMap, args);

deployment.prepare();
executeDeployment(deployment, () => {});
