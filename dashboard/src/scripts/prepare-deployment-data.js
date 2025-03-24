const fs = require("fs");
const path = require("path");
const https = require("https");

// GitHub raw URL for deployment.json
const GITHUB_DEPLOYMENT_URL = "https://raw.githubusercontent.com/messari/subgraphs/master/deployment/deployment.json";

// Output path
const DEST_PATH = path.resolve(__dirname, "../deployment-formatted.json");

// Function to download the deployment.json from GitHub
function downloadDeploymentJson() {
  return new Promise((resolve, reject) => {
    console.log("Downloading deployment.json from GitHub...");
    https
      .get(GITHUB_DEPLOYMENT_URL, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            const parsedData = JSON.parse(data);
            console.log("Successfully downloaded deployment.json from GitHub");
            resolve(parsedData);
          } catch (e) {
            reject(new Error("Failed to parse downloaded JSON"));
          }
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

// Process the deployment data
async function processDeploymentData() {
  try {
    // Always download from GitHub
    const deploymentData = await downloadDeploymentJson();

    console.log(`Processing ${Object.keys(deploymentData).length} protocols...`);

    // Transform the data to match the API response format
    Object.keys(deploymentData).forEach((protocolName) => {
      const protocol = deploymentData[protocolName];

      if (protocol.deployments) {
        Object.keys(protocol.deployments).forEach((deploymentKey) => {
          const deployment = protocol.deployments[deploymentKey];

          // Ensure services object exists
          if (!deployment.services) {
            deployment.services = {};
          }

          // Ensure hosted-service exists if needed
          if (!deployment.services["hosted-service"]) {
            deployment.services["hosted-service"] = {
              slug: deploymentKey,
              "query-id": deploymentKey,
              health: [
                {
                  "start-block": "N/A",
                  "latest-block": "N/A",
                  "chain-head-block": "N/A",
                  "entity-count": "N/A",
                  synced: false,
                  "indexed-percentage": "N/A",
                  "has-been-enhanced": true,
                },
              ],
            };
          } else if (deployment.services["hosted-service"] && !deployment.services["hosted-service"].health) {
            deployment.services["hosted-service"].health = [
              {
                "start-block": "N/A",
                "latest-block": "N/A",
                "chain-head-block": "N/A",
                "entity-count": "N/A",
                synced: false,
                "indexed-percentage": "N/A",
                "has-been-enhanced": true,
              },
            ];
          }

          // Ensure decentralized-network exists if needed
          if (!deployment.services["decentralized-network"]) {
            deployment.services["decentralized-network"] = {
              slug: deploymentKey,
              "query-id": "todo",
              health: [
                {
                  "start-block": "N/A",
                  "latest-block": "N/A",
                  "chain-head-block": "N/A",
                  "entity-count": "N/A",
                  synced: false,
                  "indexed-percentage": "N/A",
                  "has-been-enhanced": true,
                },
              ],
            };
          } else if (
            deployment.services["decentralized-network"] &&
            !deployment.services["decentralized-network"].health
          ) {
            deployment.services["decentralized-network"].health = [
              {
                "start-block": "N/A",
                "latest-block": "N/A",
                "chain-head-block": "N/A",
                "entity-count": "N/A",
                synced: false,
                "indexed-percentage": "N/A",
                "has-been-enhanced": true,
              },
            ];
          }
        });
      }
    });

    // Write the transformed data to the destination file
    fs.writeFileSync(DEST_PATH, JSON.stringify(deploymentData, null, 2));
    console.log("Successfully wrote formatted deployment data to:", DEST_PATH);
  } catch (error) {
    console.error("Error processing deployment data:", error);
    process.exit(1);
  }
}

// Run the main function
processDeploymentData();
