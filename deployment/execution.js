const exec = require("child_process").exec;
const fs = require("fs");

/**
 * @param {string} protocol - Protocol that is being deployed
 * @param {string} network - Network that the protocol is being deployed to
 * @param {string} template - Template location that will be used to create subgraph.yaml
 * @param {string} location - Location in the subgraph will be deployed to {e.g. messari/uniswap-v2-ethereum}
 */
function scripts(protocol, network, template, location, constants, type) {
  let scripts = [];
  let removeGenerated = "rm -rf generated";
  let removeBuild = "rm -rf build";
  let removeResults = "rm -rf results.txt";
  let removeConfig = "rm -rf configurations/configure.ts";
  let removeSubgraphYaml = "rm -rf subgraph.yaml";
  let prepareYaml =
    "npm run prepare:yaml --PROTOCOL=" +
    protocol +
    " --NETWORK=" +
    network +
    " --TEMPLATE=" +
    template;
  let prepareConstants =
    "npm run prepare:constants --PROTOCOL=" +
    protocol +
    " --NETWORK=" +
    network;
  let codegen = "graph codegen";
  let build = "graph build";
  let deployment = "npm run deploy:subgraph --LOCATION=" + location;

  scripts.push(removeGenerated);
  scripts.push(removeBuild);
  scripts.push(removeResults);
  scripts.push(removeConfig);
  scripts.push(removeSubgraphYaml);
  scripts.push(prepareYaml);
  if (constants == true) {
    scripts.push(prepareConstants);
  }
  scripts.push(codegen);

  // Null value for type assumes you want to deploy
  if (["deploy", ""].includes(type.toLowerCase())) {
    scripts.push(deployment);
  } else if (type.toLowerCase() == "build") {
    scripts.push(build);
  } else {
    console.log("Error: invalid type - Neither build nor deploy");
  }

  return scripts;
}

function getDeploymentNetwork(network) {
  let deployNetwork = "";
  switch (network) {
    case "mainnet":
      deployNetwork = "ethereum";
      break;
    case "xdai":
      deployNetwork = "gnosis";
      break;
    case "matic":
      deployNetwork = "polygon";
      break;
    default:
      deployNetwork = network;
  }
  return deployNetwork;
}

/**
 * @param {string[]} array - Protocol that is being deployed
 * @param {string} callback
 */
async function runCommands(allScripts, results, args, callback) {
  let logs = "";
  var deploymentIndex = 0;
  var scriptIndex = 0;
  var httpCounter = 1;
  let allDeployments = Array.from(allScripts.keys());

  function next() {
    if (deploymentIndex < allDeployments.length) {
      exec(
        allScripts.get(allDeployments[deploymentIndex])[scriptIndex++],
        function (error, stdout, stderr) {
          logs = logs + "stdout: " + stdout;
          logs = logs + "stderr: " + stderr;
          if (stderr.includes("HTTP error")) {
            if (httpCounter >= 2) {
              deploymentIndex++;
              scriptIndex = 0;
            }
            httpCounter++;
          }
          if (error !== null) {
            if (
              stderr.includes("HTTP error deploying the subgraph") &&
              httpCounter <= 3
            ) {
              httpCounter++;
              console.log(
                "HTTP error on deployment " +
                  httpCounter.toString() +
                  " for " +
                  allDeployments[deploymentIndex] +
                  ". Trying Again..."
              );
            } else {
              logs = logs + "Exec error: " + error;

              if (args.type == "build") {
                results +=
                  "Build Failed: " + allDeployments[deploymentIndex] + "\n";
              } else {
                results +=
                  "Deployment Failed: " +
                  allDeployments[deploymentIndex] +
                  "\n";
              }

              console.log(error);
              deploymentIndex++;
              scriptIndex = 0;
              httpCounter = 1;
            }
          } else if (
            scriptIndex ==
            allScripts.get(allDeployments[deploymentIndex]).length
          ) {
            if (args.type == "build") {
              results +=
                "Build Successful: " + allDeployments[deploymentIndex] + "\n";
            } else {
              results +=
                "Deployment Successful: " +
                allDeployments[deploymentIndex] +
                "\n";
            }
            deploymentIndex++;
            scriptIndex = 0;
            httpCounter = 1;
          }

          // do the next iteration
          next();
        }
      );
    } else {
      // all done here
      fs.writeFile(
        "results.txt",
        logs.replace(/\u001b[^m]*?m/g, ""),
        function (err) {
          if (err) throw err;
        }
      );

      // Print the logs if printlogs is 't' or 'true'
      if (["true", "t"].includes(args.printlogs.toLowerCase())) {
        console.log(logs);
      }
      console.log("\n" + results + "END" + "\n\n");
      callback(results);
    }
  }

  // start the first iteration
  next();
}

module.exports = { scripts, getDeploymentNetwork, runCommands };
