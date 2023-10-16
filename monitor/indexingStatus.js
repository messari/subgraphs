import axios from "axios";
import { errorNotification, postAlert } from "./messageDiscord.js";

const queryContents = `
subgraph
synced
fatalError {
  message
  block {
    number
  }
}
chains {
  chainHeadBlock {
    number
  }
  earliestBlock {
    number
  }
  latestBlock {
    number
  }
}`;

export async function generateProtocolToBaseMap(data) {
  const protocolToBaseMap = {};
  if (Object.keys(data)?.length > 0) {
    Object.keys(data).forEach((protocolName) => {
      const protocol = data[protocolName];
      protocolToBaseMap[protocolName] = protocol.base;
    });
  }
  return protocolToBaseMap;
}

export async function generateDecenEndpoints(data) {
  const hostedEndpointToDecenNetwork = {};
  try {
    if (Object.keys(data)?.length > 0) {
      Object.keys(data).forEach((protocolName) => {
        const protocol = data[protocolName];
        if (!protocol.schema) {
          return;
        }
        Object.values(protocol.deployments).forEach((depoData) => {
          let hostedServiceId = "";
          const hostedServiceObject = depoData?.services["hosted-service"];
          if (!!hostedServiceObject) {
            hostedServiceId = hostedServiceObject?.slug;
          }
          const decenObj = depoData?.services["decentralized-network"];
          if (!!decenObj) {
            hostedEndpointToDecenNetwork[
              "https://api.thegraph.com/subgraphs/name/messari/" +
                hostedServiceId
            ] = decenObj?.["query-id"];
          }
        });
      });
    }
  } catch (err) {
    errorNotification("ERROR LOCATION 1 " + err.message);
  }
  return hostedEndpointToDecenNetwork;
}

export async function generateEndpoints(data) {
  try {
    const subgraphEndpoints = {};
    if (Object.keys(data)?.length > 0) {
      Object.keys(data).forEach((protocolName) => {
        const protocol = data[protocolName];
        if (!protocol.schema) {
          return;
        }
        if (!Object.keys(subgraphEndpoints).includes(protocol.schema)) {
          subgraphEndpoints[protocol.schema] = {};
        }
        if (
          !Object.keys(subgraphEndpoints[protocol.schema]).includes(
            protocolName
          )
        ) {
          subgraphEndpoints[protocol.schema][protocolName] = {};
        }
        Object.values(protocol.deployments).forEach((depoData) => {
          let hostedServiceId = "";
          if (!!depoData?.services["hosted-service"]) {
            hostedServiceId = depoData?.services["hosted-service"]?.slug;
          }
          subgraphEndpoints[protocol.schema][protocolName][depoData.network] =
            "https://api.thegraph.com/subgraphs/name/messari/" +
            hostedServiceId;
        });
      });
    }
    return subgraphEndpoints;
  } catch (err) {
    errorNotification("ERROR LOCATION 1 " + err.message);
  }
}

export async function queryDecentralizedIndex(data) {
  if (!process.env.GRAPH_API_KEY) {
    return {};
  }

  const decenSubgraphHashToIndexingObj = {};
  try {
    if (Object.keys(data)?.length > 0) {
      Object.keys(data).forEach((protocolName) => {
        const protocol = data[protocolName];

        Object.values(protocol.deployments).forEach((depoData) => {
          const decenObj = depoData.services["decentralized-network"];
          if (decenObj) {
            const subgraphID = decenObj["query-id"];
            const healthObj = decenObj["health"][0];

            if (healthObj) {
              const deploymentID = healthObj["deployment-id"];
              let indexedPercentage =
                ((healthObj["latest-block"] - healthObj["start-block"]) /
                  (healthObj["chain-head-block"] - healthObj["start-block"])) *
                100;
              if (indexedPercentage > 99.5) {
                indexedPercentage = 100;
              }

              if (!healthObj["is-healthy"] && !isNaN(indexedPercentage)) {
                const errorBlock = healthObj["error"]["block-number"];
                const errorMessage = healthObj["error"]["message"];

                decenSubgraphHashToIndexingObj[subgraphID] = {
                  endpoint:
                    "https://gateway-arbitrum.network.thegraph.com/api/" +
                    process.env.GRAPH_API_KEY +
                    "/subgraphs/id/" +
                    subgraphID,
                  hash: deploymentID,
                  indexingErrorMessage: errorMessage,
                  indexingErrorBlock: errorBlock,
                  indexingPercentage: indexedPercentage.toFixed(2),
                };
              }
            }
          }
        });
      });
    }
  } catch (err) {
    postAlert("ERROR HANDLING INDEXING STATUS RESPONSE - " + err.message);
  }

  return decenSubgraphHashToIndexingObj;
}

export async function indexStatusFlow(data, deployments) {
  try {
    deployments = JSON.parse(JSON.stringify(deployments));

    if (Object.keys(data)?.length > 0) {
      Object.keys(data).forEach((protocolName) => {
        const protocol = data[protocolName];

        Object.keys(protocol.deployments).forEach((depoName) => {
          const depoObj =
            protocol.deployments[depoName]["services"]["hosted-service"];
          if (depoObj) {
            let depoSlug = depoObj["slug"];
            const healthObj = depoObj["health"];

            if (healthObj.length == 0) {
              delete deployments[depoSlug];
            }

            // Indexed Deployment
            if (healthObj.length > 0) {
              const healthObjIndexed = healthObj[0];
              let indexedPercentage =
                ((healthObjIndexed["latest-block"] -
                  healthObjIndexed["start-block"]) /
                  (healthObjIndexed["chain-head-block"] -
                    healthObjIndexed["start-block"])) *
                100;
              if (indexedPercentage > 99.5) {
                indexedPercentage = 100;
              }

              if (deployments[depoSlug]) {
                deployments[depoSlug].indexedPercentage =
                  indexedPercentage.toFixed(2);

                let errorBlock = null;
                let errorMessage = "";
                if (
                  !healthObjIndexed["is-healthy"] &&
                  !isNaN(indexedPercentage)
                ) {
                  errorBlock = healthObjIndexed["error"]["block-number"];
                  errorMessage = healthObjIndexed["error"]["message"];
                  deployments[depoSlug].indexingErrorMessage = errorMessage;
                }
                deployments[depoSlug].indexingError = errorBlock;

                if (parseFloat(indexedPercentage) < 10) {
                  delete deployments[depoSlug];
                }
              }
            }

            // Pending Deployment
            if (healthObj.length > 1) {
              const healthObjPending = healthObj[1];
              const deploymentID = healthObjPending["deployment-id"];
              let indexedPercentage =
                ((healthObjPending["latest-block"] -
                  healthObjPending["start-block"]) /
                  (healthObjPending["chain-head-block"] -
                    healthObjPending["start-block"])) *
                100;
              if (indexedPercentage > 99.5) {
                indexedPercentage = 100;
              }

              const depoSlugPending = depoSlug + "-pending";
              if (deployments[depoSlug]) {
                deployments[depoSlugPending] = JSON.parse(
                  JSON.stringify({ ...deployments[depoSlug] })
                );
                deployments[depoSlugPending].pending = true;

                deployments[depoSlugPending].url =
                  "https://api.thegraph.com/subgraphs/id/" + deploymentID;
                deployments[depoSlugPending].hash = deploymentID;
                deployments[depoSlugPending].indexedPercentage =
                  indexedPercentage.toFixed(2);

                let errorBlock = null;
                let errorMessage = "";
                if (
                  !healthObjPending["is-healthy"] &&
                  !isNaN(indexedPercentage)
                ) {
                  errorBlock = healthObjPending["error"]["block-number"];
                  errorMessage = healthObjPending["error"]["message"];
                  deployments[depoSlugPending].indexingErrorMessage =
                    errorMessage;
                }
                deployments[depoSlugPending].indexingError = errorBlock;

                if (parseFloat(indexedPercentage) < 10) {
                  delete deployments[depoSlugPending];
                }
              }
            }
          }
        });
      });
    }

    return deployments;
  } catch (err) {
    errorNotification("ERROR LOCATION 2 " + err.message);
  }
}
