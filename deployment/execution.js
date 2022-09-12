const exec = require("child_process").exec;
const fs = require("fs");

/**
 * @param {string[]} array - Protocol that is being deployed
 * @param {string} callback
 */
async function executeDeployment(deployment, callback) {
  let logs = "";
  let results = "RESULTS:\n";
  var deploymentIndex = 0;
  var scriptIndex = 0;
  var httpCounter = 0;
  let allDeployments = Array.from(deployment.scripts.keys());

  function next() {
    if (deploymentIndex < allDeployments.length) {
      exec(
        deployment.scripts.get(allDeployments[deploymentIndex])[scriptIndex++],
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
              httpCounter < 3
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
              if (deployment.getDeploy() == false) {
                results +=
                  "Build Failed: " + allDeployments[deploymentIndex] + "\n";
              } else {
                results +=
                  "Deployment Failed: " +
                  allDeployments[deploymentIndex] +
                  "\n";
              }
              logs = logs + "error: " + error;
              deploymentIndex++;
              scriptIndex = 0;
              httpCounter = 0;
            }
          } else if (
            scriptIndex ==
            deployment.scripts.get(allDeployments[deploymentIndex]).length
          ) {
            if (deployment.getDeploy() == false) {
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
      if (deployment.printlogs) {
        console.log(logs);
      }
      console.log("\n" + results + "END" + "\n\n");
      callback(results);
    }
  }

  // start the first iteration
  next();
}

module.exports = { executeDeployment };
