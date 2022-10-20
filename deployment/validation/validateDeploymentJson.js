/// //////////////////////////////////////
/// / Tests deployment.json structure ////
/// //////////////////////////////////////

const networks = new Set([
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
  if (!protocolData.schema) {
    throw new Error(
      `Please specifiy schema in deployment.json for protocol: ${protocol}`
    );
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
      "erc20",
      "nft-marketplace",
    ].includes(protocolData.schema)
  ) {
    throw new Error(
      `Invalid schema type in deployment.json for protocol: ${protocol} schema: ${protocolData.schema}`
    );
  }
}

function checkBasePresent(protocol, protocolData) {
  if (!protocolData.base) {
    throw new Error(
      `Please specifiy base in deployment.json for protocol: ${protocol}`
    );
  }
}

function checkProtocolPresent(protocol, protocolData) {
  if (!protocolData.protocol) {
    throw new Error(
      `Please specifiy protocol in deployment.json for protocol: ${protocol}`
    );
  }
}

function checkDeploymentsPresent(protocol, protocolData) {
  if (!protocolData.deployments) {
    throw new Error(
      `Please specifiy deployments in deployment.json for protocol: ${protocol}`
    );
  }

  if (Object.keys(protocolData.deployments).length === 0) {
    throw new Error(
      `Please specifiy at least one deployment in deployment.json for protocol: ${protocol}`
    );
  }
}

function checkNetworkPresentAndValid(protocol, deployment, deploymentData) {
  if (!deploymentData.network) {
    throw new Error(
      `Please specifiy network in deployment.json for protocol: ${protocol} deployment: ${deployment}`
    );
  }

  if (!networks.has(deploymentData.network)) {
    throw new Error(
      `Invalid network in deployment.json for protocol: ${protocol} deployment: ${deployment} network: ${deploymentData.network}`
    );
  }
}

function checkStatusPresentAndValid(protocol, deployment, deploymentData) {
  if (!deploymentData.status) {
    throw new Error(
      `Please specifiy status in deployment.json for protocol: ${protocol} deployment: ${deployment}`
    );
  }

  if (!["prod", "dev"].includes(deploymentData.status)) {
    throw new Error(
      `Invalid status in deployment.json for protocol: ${protocol} deployment: ${deployment}`
    );
  }
}

// Makes sure the version specified in the json file is valid.
function checkValidVersion(version) {
  if (!version) {
    throw new Error("See deployment.json: (0) version is missing");
  }

  // Make sure version length is 3 (major.minor.patch)
  if (version.split(".").length !== 3) {
    throw new Error(
      "See deployment.json: (1) version is not valid - should be 3 integers separated by periods - must be in format x.x.x (e.g. 1.3.1)"
    );
  }

  // Make sure each integer is valid
  const array = version.split(".");
  if (!array.every((element) => !element.isNaN)) {
    throw new Error(
      "See deployment.json: (2) version is not valid - make sure to use integers between the periods - must be in format x.x.x (e.g. 1.3.1)"
    );
  }
}

function checkVersionsPresentAndValid(protocol, deployment, deploymentData) {
  if (!deploymentData.versions) {
    throw new Error(
      `Please specifiy versions in deployment.json for protocol: ${protocol} deployment: ${deployment}`
    );
  }

  if (!deploymentData.versions.schema) {
    throw new Error(
      `Please specifiy schema version in deployment.json for protocol: ${protocol} deployment: ${deployment}`
    );
  }

  if (!deploymentData.versions.subgraph) {
    throw new Error(
      `Please specifiy subgraph version in deployment.json for protocol: ${protocol} deployment: ${deployment}`
    );
  }

  if (!deploymentData.versions.methodology) {
    throw new Error(
      `Please specifiy methodology version in deployment.json for protocol: ${protocol} deployment: ${deployment}`
    );
  }

  checkValidVersion(deploymentData.versions.schema);
  checkValidVersion(deploymentData.versions.subgraph);
  checkValidVersion(deploymentData.versions.methodology);
}

function checkDeploymentsIDsPresentAndValid(
  protocol,
  deployment,
  deploymentData
) {
  if (!deploymentData["services"]) {
    throw new Error(
      `Please specify services in deployment.json for protocol: ${protocol} deployment: ${deployment}`
    );
  }

  // Make sure there is at least one deployment ID
  if (Object.keys(deploymentData["services"]).length === 0) {
    throw new Error(
      `Please specify at least one services in deployment.json for protocol: ${protocol} deployment: ${deployment}`
    );
  }

  // Make sure all deployment IDs are valid
  for (const [service, serviceData] of Object.entries(
    deploymentData["services"]
  )) {
    if (
      !["hosted-service", "cronos-portal", "decentralized-network"].includes(
        service
      )
    ) {
      throw new Error(
        `Invalid service in deployment.json for protocol: ${protocol} deployment: ${deployment} service: ${service}`
      );
    }

    if (!serviceData["slug"]) {
      throw new Error(
        `Missing slug for service in deployment.json for protocol: ${protocol} deployment: ${deployment} service: ${service}`
      );
    }

    if (!serviceData["query-id"]) {
      throw new Error(
        `Missing query id for service in deployment.json for protocol: ${protocol} deployment: ${deployment} service: ${service}`
      );
    }
  }
}

function checkTemplatePresent(protocol, deployment, deploymentData) {
  if (!deploymentData.files) {
    throw new Error(
      `Please specify files in deployment.json for protocol: ${protocol} deployment: ${deployment}`
    );
  }

  // Also check that the template is present since it is required for subgraph prep.
  if (!deploymentData.files.template) {
    throw new Error(
      `Please specify template in deployment.json for protocol: ${protocol} deployment: ${deployment}`
    );
  }
}

function checkOptionsPresent(protocol, deployment, deploymentData) {
  if (!deploymentData.options) {
    throw new Error(
      `Please specify options in deployment.json for protocol: ${protocol} deployment: ${deployment}`
    );
  }
}

function checkDuplicateIDs(deploymentJsonMap) {
  const deploymentIDs = new Set();
  const protocols = new Set();

  // Check for duplicate deployment IDs
  for (const [protocol, protocolData] of Object.entries(deploymentJsonMap)) {
    protocols.add(protocol);
    for (const deployment of Object.keys(protocolData.deployments)) {
      if (deploymentIDs.has(deployment)) {
        throw new Error(
          `There is a duplicate id for deployment id: ${deployment}`
        );
      }
      deploymentIDs.add(deployment);
    }
  }

  // Check deployment IDs do not match a protocol. Necessary because we use protocol as a deployment ID in CI/CD scripts.
  for (const protocol of protocols) {
    if (deploymentIDs.has(protocol)) {
      throw new Error(
        `There is is a deployment id that is the same as a protocol: ${protocol}`
      );
    }
  }
}

function checkProtocolArgumentCount(protocol, protocolData) {
  if (Object.keys(protocolData).length !== 4) {
    throw new Error(
      `Invalid number of arguments for protocol: ${protocol} - must have 4 arguments: schema, base, protocol, deployments`
    );
  }
}

function checkDeploymentsArgumentCount(protocol, deployment, deploymentData) {
  if (Object.keys(deploymentData).length !== 6) {
    throw new Error(
      `Invalid number of arguments for protocol: ${protocol} deployment: ${deployment} - must have 6 arguments: versions, services, files, options, status, networks`
    );
  }
}

function checkVersionsArgumentsCount(protocol, deployment, deploymentData) {
  if (Object.keys(deploymentData.versions).length !== 3) {
    throw new Error(
      `Invalid number of arguments for protocol: ${protocol} deployment: ${deployment} versions - must have 3 arguments: schema, subgraph, methodology`
    );
  }
}

// Run tests before each build in CI/CD
function validateDeploymentJson(deploymentJsonMap) {
  // Checks if all necessary fields exist and contain valid values in the deployment.json
  for (const [protocol, protocolData] of Object.entries(deploymentJsonMap)) {
    // Check if protocol data is valid
    checkSchemaPresentAndValid(protocol, protocolData);
    checkBasePresent(protocol, protocolData);
    checkProtocolPresent(protocol, protocolData);
    checkDeploymentsPresent(protocol, protocolData);
    checkProtocolArgumentCount(protocol, protocolData);

    for (const [deployment, deploymentData] of Object.entries(
      protocolData.deployments
    )) {
      // Check if deployment data is valid
      checkNetworkPresentAndValid(protocol, deployment, deploymentData);
      checkStatusPresentAndValid(protocol, deployment, deploymentData);
      checkVersionsPresentAndValid(protocol, deployment, deploymentData);
      checkDeploymentsIDsPresentAndValid(protocol, deployment, deploymentData);
      checkTemplatePresent(protocol, deployment, deploymentData);
      checkOptionsPresent(protocol, deployment, deploymentData);
      checkDeploymentsArgumentCount(protocol, deployment, deploymentData);
      checkVersionsArgumentsCount(protocol, deployment, deploymentData);
    }
  }

  // Check for duplicate deployment IDs and duplicate protocol/deploymentID combinations
  checkDuplicateIDs(deploymentJsonMap);
}

module.exports = { validateDeploymentJson };
