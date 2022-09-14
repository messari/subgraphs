/////////////////////////////////////////
//// Tests deployment.json structure ////
/////////////////////////////////////////

// Run tests before each build in CI/CD
function validateDeploymentJson(deploymentJsonMap) {
  // Checks if all necessary fields exist and contain valid values in the deployment.json
  for (const [protocol, protocolData] of Object.entries(deploymentJsonMap)) {
    // Check if protocol data is valid
    checkSchemaPresentAndValid(protocol, protocolData);
    checkBasePresent(protocol, protocolData);
    checkProtocolPresent(protocol, protocolData);
    checkDeploymentsPresent(protocol, protocolData);

    for (const [deployment, deploymentData] of Object.entries(
      protocolData["deployments"]
    )) {
      // Check if deployment data is valid
      checkNetworkPresentAndValid(protocol, deployment, deploymentData);
      checkStatusPresentAndValid(protocol, deployment, deploymentData);
      checkVersionsPresentAndValid(protocol, deployment, deploymentData);
      checkDeploymentsIDsPresentAndValid(protocol, deployment, deploymentData);
      checkTemplatePresent(protocol, deployment, deploymentData);
      checkOptionsPresent(protocol, deployment, deploymentData);
    }
  }

  // Check for duplicate deployment IDs and duplicate protocol/deploymentID combinations
  checkDuplicateIDs(deploymentJsonMap);
}

let networks = new Set([
  "arbitrum",
  "arweave-mainnet",
  "aurora",
  "avalanche",
  "boba",
  "bsc",
  "celo",
  "clover",
  "cosmos",
  "cronos",
  "ethereum",
  "fantom",
  "fuse",
  "harmony",
  "juno",
  "moonbeam",
  "moonriver",
  "near-mainnet",
  "optimism",
  "osmosis",
  "polygon",
  "gnosis",
]);

function checkSchemaPresentAndValid(protocol, protocolData) {
  if (!protocolData["schema"]) {
    throw "Please specifiy schema in deployment.json for protocol: " + protocol;
  }
  if (
    ![
      "lending",
      "yield-aggregator",
      "dex-amm",
      "network",
      "governance",
      "generic",
      "erc721",
    ].includes(protocolData["schema"])
  ) {
    throw (
      "Invalid schema type in deployment.json for protocol: " +
      protocol +
      " schema: " +
      protocolData["schema"]
    );
  }
}

function checkBasePresent(protocol, protocolData) {
  if (!protocolData["base"]) {
    throw "Please specifiy base in deployment.json for protocol: " + protocol;
  }
}

function checkProtocolPresent(protocol, protocolData) {
  if (!protocolData["protocol"]) {
    throw (
      "Please specifiy protocol in deployment.json for protocol: " + protocol
    );
  }
}

function checkDeploymentsPresent(protocol, protocolData) {
  if (!protocolData["deployments"]) {
    throw (
      "Please specifiy deployments in deployment.json for protocol: " + protocol
    );
  }

  if (Object.keys(protocolData["deployments"]).length == 0) {
    throw (
      "Please specifiy at least one deployment in deployment.json for protocol: " +
      protocol
    );
  }
}

function checkNetworkPresentAndValid(protocol, deployment, deploymentData) {
  if (!deploymentData["network"]) {
    throw (
      "Please specifiy network in deployment.json for protocol: " +
      protocol +
      " deployment: " +
      deployment
    );
  }

  if (!networks.has(deploymentData["network"])) {
    throw (
      "Invalid network in deployment.json for protocol: " +
      protocol +
      " deployment: " +
      deployment +
      " network: " +
      deploymentData["network"]
    );
  }
}

function checkStatusPresentAndValid(protocol, deployment, deploymentData) {
  if (!deploymentData["status"]) {
    throw (
      "Please specifiy status in deployment.json for protocol: " +
      protocol +
      " deployment: " +
      deployment
    );
  }

  if (!["prod", "dev"].includes(deploymentData["status"])) {
    throw (
      "Invalid status in deployment.json for protocol: " +
      protocol +
      " deployment: " +
      deployment
    );
  }
}

function checkVersionsPresentAndValid(protocol, deployment, deploymentData) {
  if (!deploymentData["versions"]) {
    throw (
      "Please specifiy versions in deployment.json for protocol: " +
      protocol +
      " deployment: " +
      deployment
    );
  }

  if (!deploymentData["versions"]["schema"]) {
    throw (
      "Please specifiy schema version in deployment.json for protocol: " +
      protocol +
      " deployment: " +
      deployment
    );
  }

  if (!deploymentData["versions"]["subgraph"]) {
    throw (
      "Please specifiy subgraph version in deployment.json for protocol: " +
      protocol +
      " deployment: " +
      deployment
    );
  }

  if (!deploymentData["versions"]["methodology"]) {
    throw (
      "Please specifiy methodology version in deployment.json for protocol: " +
      protocol +
      " deployment: " +
      deployment
    );
  }

  checkValidVersion(deploymentData["versions"]["schema"]);
  checkValidVersion(deploymentData["versions"]["subgraph"]);
  checkValidVersion(deploymentData["versions"]["methodology"]);
}

function checkDeploymentsIDsPresentAndValid(
  protocol,
  deployment,
  deploymentData
) {
  if (!deploymentData["deployment-ids"]) {
    throw (
      "Please specify deployment-ids in deployment.json for protocol: " +
      protocol +
      " deployment: " +
      deployment
    );
  }

  // Make sure there is at least one deployment ID
  if (Object.keys(deploymentData["deployment-ids"]).length == 0) {
    throw (
      "Please specify at least one deployment-id in deployment.json for protocol: " +
      protocol +
      " deployment: " +
      deployment
    );
  }

  // Make sure all deployment IDs are valid
  for (const [deploymentID, location] of Object.entries(
    deploymentData["deployment-ids"]
  )) {
    if (
      !["hosted-service", "cronos-portal", "decentralized-network"].includes(
        deploymentID
      )
    ) {
      throw (
        "Invalid deployment-id in deployment.json for protocol: " +
        protocol +
        " deployment: " +
        deployment +
        " deployment-id: " +
        deploymentID
      );
    }

    if (!location) {
      throw (
        "Please specify deployment-id in deployment.json for protocol: " +
        protocol +
        " deployment: " +
        deployment +
        " deployment-id: " +
        deploymentID
      );
    }
  }
}

// Makes sure the version specified in the json file is valid.
function checkValidVersion(version) {
  if (!version) {
    throw "See deployment.json: (0) version is missing";
  }

  // Make sure version lenght is 3 (major.minor.patch)
  if (version.split(".").length != 3) {
    throw "See deployment.json: (1) version is not valid - should be 3 integers separated by periods - must be in format x.x.x (e.g. 1.3.1)";
  }

  // Make sure each integer is valid
  let array = version.split(".");
  if (
    !array.every((element) => {
      return !isNaN(element);
    })
  ) {
    throw "See deployment.json: (2) version is not valid - make sure to use integers between the periods - must be in format x.x.x (e.g. 1.3.1)";
  }
}

function checkTemplatePresent(protocol, deployment, deploymentData) {
  if (!deploymentData["files"]) {
    throw (
      "Please specify files in deployment.json for protocol: " +
      protocol +
      " deployment: " +
      deployment
    );
  }

  // Also check that the template is present since it is required for subgraph prep.
  if (!deploymentData["files"]["template"]) {
    throw (
      "Please specify template in deployment.json for protocol: " +
      protocol +
      " deployment: " +
      deployment
    );
  }
}

function checkOptionsPresent(protocol, deployment, deploymentData) {
  if (!deploymentData["options"]) {
    throw (
      "Please specify options in deployment.json for protocol: " +
      protocol +
      " deployment: " +
      deployment
    );
  }
}

function checkDuplicateIDs(deploymentJsonMap) {
  let deploymentIDs = new Set();
  let protocols = new Set();

  // Check for duplicate deployment IDs
  for (const [protocol, protocolData] of Object.entries(deploymentJsonMap)) {
    protocols.add(protocol);
    for (const [deployment, deploymentData] of Object.entries(
      protocolData["deployments"]
    )) {
      if (deploymentIDs.has(deployment)) {
        throw "There is a duplicate id for deployment id: " + deployment;
      }
      deploymentIDs.add(deployment);
    }
  }

  // Check deployment IDs do not match a protocol. Necessary because we use protocol as a deployment ID in CI/CD scripts.
  for (const protocol of protocols) {
    if (deploymentIDs.has(protocol)) {
      throw (
        "There is is a deployment id that is the same as a protocol: " +
        protocol
      );
    }
  }
}

module.exports = { validateDeploymentJson };
