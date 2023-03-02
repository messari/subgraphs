import axios from "axios";
import { errorNotification } from "./messageDiscord.js";

export async function generateEndpoints(data, protocolNameToBaseMapping) {
  try {
    const protocolNameToBaseMappingCopy = JSON.parse(JSON.stringify(protocolNameToBaseMapping));
    const subgraphEndpoints = {};
    if (Object.keys(data)?.length > 0) {
      Object.keys(data).forEach((protocolName) => {
        const protocol = data[protocolName];
        protocolNameToBaseMappingCopy[protocolName] = protocol.base;
        if (!protocol.schema) {
          return;
        }
        if (!Object.keys(subgraphEndpoints).includes(protocol.schema)) {
          subgraphEndpoints[protocol.schema] = {};
        }
        if (!Object.keys(subgraphEndpoints[protocol.schema]).includes(protocolName)) {
          subgraphEndpoints[protocol.schema][protocolName] = {};
        }
        Object.values(protocol.deployments).forEach((depoData) => {
          let hostedServiceId = "";
          if (!!depoData?.services["hosted-service"]) {
            hostedServiceId = depoData?.services["hosted-service"]?.slug;
          }
          subgraphEndpoints[protocol.schema][protocolName][depoData.network] = "https://api.thegraph.com/subgraphs/name/messari/" + hostedServiceId;
        });
      });
    }
    return { subgraphEndpoints, protocolNameToBaseMapping: protocolNameToBaseMappingCopy };
  } catch (err) {
    errorNotification("ERROR LOCATION 1 " + err.message);
  }
};

export async function indexStatusFlow(deployments) {
  try {
    const generateIndexStatus = await generateIndexStatusQuery(deployments);
    deployments = JSON.parse(JSON.stringify(generateIndexStatus.deployments));

    const indexingStatusQueriesArray = generateIndexStatus.indexingStatusQueries;
    const indexData = await getIndexingStatusData(indexingStatusQueriesArray);
    const invalidDeployments = [];
    Object.keys(indexData).forEach((indexDataName) => {
      const realNameString = indexDataName.split("_").join("-");
      if (!indexData[indexDataName] && indexDataName.includes("pending")) {
        delete deployments[realNameString];
        return;
      }
      if (indexDataName.includes("pending")) {
        deployments[realNameString].url =
          "https://api.thegraph.com/subgraphs/id/" +
          indexData[indexDataName]?.subgraph;
        deployments[realNameString].hash = indexData[indexDataName]?.subgraph;
      }

      let indexedPercentage = ((indexData[indexDataName]?.chains[0]?.latestBlock?.number - indexData[indexDataName]?.chains[0]?.earliestBlock?.number) / (indexData[indexDataName]?.chains[0]?.chainHeadBlock?.number - indexData[indexDataName]?.chains[0]?.earliestBlock?.number)) || 0;
      indexedPercentage = indexedPercentage * 100;
      if (indexedPercentage > 99.5) {
        indexedPercentage = 100;
      }
      deployments[realNameString].indexedPercentage = indexedPercentage.toFixed(2);

      if (!!indexData[indexDataName]?.fatalError) {
        deployments[realNameString].indexingError = indexData[indexDataName]?.fatalError?.block?.number;
        deployments[realNameString].indexingErrorMessage = indexData[indexDataName]?.fatalError?.message;
      }

      if (
        !indexData[indexDataName]
      ) {
        invalidDeployments.push(realNameString);
      }

      if (parseFloat(deployments[realNameString]?.indexedPercentage) < 10) {
        invalidDeployments.push(realNameString);
      }
    });
    return { invalidDeployments, deployments };
  } catch (err) {
    errorNotification("ERROR LOCATION 2 " + err.message);
  }
}

export async function getIndexingStatusData(indexingStatusQueriesArray) {
  try {
    const indexingStatusQueries = indexingStatusQueriesArray.map((query) =>
      axios.post("https://api.thegraph.com/index-node/graphql", { query: query })
    );
    let indexData = [];
    await Promise.all(indexingStatusQueries)
      .then((response) => {
        return (indexData = response.map(
          (resultData) => (resultData.data.data)
        ))
      })
      .catch((err) => {
        errorNotification("ERROR LOCATION 3 " + err.message)
      });

    let dataObjectToReturn = {};
    indexData.forEach(dataset => {
      dataObjectToReturn = { ...dataObjectToReturn, ...dataset };
    });
    return dataObjectToReturn;
  } catch (err) {
    errorNotification("ERROR LOCATION 4 " + err.message)
  }
}

export async function generateIndexStatusQuery(deployments) {
  const fullCurrentQueryArray = ["query Status {"];
  const fullPendingQueryArray = ["query Status {"];

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

  try {

    Object.keys(deployments).forEach((name) => {
      fullCurrentQueryArray[fullCurrentQueryArray.length - 1] += `        
              ${name
          .split("-")
          .join(
            "_"
          )}: indexingStatusForCurrentVersion(subgraphName: "messari/${name}") {
                ${queryContents}
              }
          `;
      fullPendingQueryArray[fullPendingQueryArray.length - 1] += `        
            ${name
          .split("-")
          .join(
            "_"
          )}_pending: indexingStatusForPendingVersion(subgraphName: "messari/${name}") {
              ${queryContents}
            }
        `;
      if (fullCurrentQueryArray[fullCurrentQueryArray.length - 1].length > 80000) {
        fullCurrentQueryArray[fullCurrentQueryArray.length - 1] += "}";
        fullCurrentQueryArray.push(" query Status {");
      }
      if (fullPendingQueryArray[fullPendingQueryArray.length - 1].length > 80000) {
        fullPendingQueryArray[fullPendingQueryArray.length - 1] += "}";
        fullPendingQueryArray.push(" query Status {");
      }
    });
    fullCurrentQueryArray[fullCurrentQueryArray.length - 1] += "}";
    fullPendingQueryArray[fullPendingQueryArray.length - 1] += "}";
    const currentStateDepos = JSON.parse(JSON.stringify(deployments));
    Object.keys(currentStateDepos).forEach((name) => {
      deployments[name + "-pending"] = JSON.parse(JSON.stringify({ ...deployments[name] }));
      deployments[name + "-pending"].pending = true;
    });
    const indexingStatusQueries = [
      ...fullCurrentQueryArray,
      ...fullPendingQueryArray,
    ];
    return { deployments, indexingStatusQueries };
  } catch (err) {
    errorNotification("ERROR LOCATION 5 " + err.message);
  }
}