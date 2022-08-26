import axios from "axios";
import { getDiscordMessages, sendDiscordMessage } from "./DiscordMessages.js";
import 'dotenv/config'
import { protocolLevel, alertProtocolErrors } from "./protocolLevel.js";

// Hour in milliseconds
const hourMs = 3600000;

executionFlow();
setInterval(executionFlow, hourMs);

async function executionFlow() {
  const { data } = await axios.get(
    "https://subgraphs.messari.io/deployments.json"
  );

  // deployments holds the errors for every protocol
  let deployments = {};

  Object.entries(data).forEach(([protocolType, protocolsOnType]) => {
    Object.values(protocolsOnType).forEach((protocolObj) => {
      Object.values(protocolObj).forEach((deploymentString) => {
        const nameStr =
          deploymentString.split("name/")[1];

        deployments[nameStr.split("/")[1]] = {
          indexingError: null,
          indexedPercentage: 0,
          protocolErrors: {
            tvlRange: [],
            cumulativeSupplySideRev: [],
            cumulativeProtocolSideRev: [],
            cumulativeTotalRev: [],
            cumulativeVol: [],
            cumulativeUniqueUsers: [],
            totalPoolCount: [],
            cumulativeUniqueDepos: [],
            cumulativeUniqueBorrowers: [],
            cumulativeUniqueLiquidators: [],
            cumulativeUniqueLiquidatees: [],
            openPositionCount: [],
            cumulativePositionCount: [],
            totalDepoBal: [],
            cumulativeDepo: [],
            totalBorrowBal: [],
            cumulativeLiquidate: [],
          },
          poolErrors: {
            totalValueLockedUSD: [],
            cumulativeSupplySideRevenueUSD: [],
            cumulativeProtocolSideRevenueUSD: [],
            cumulativeTotalRevenueUSD: [],
            cumulativeDepositUSD: [],
            cumulativeBorrowUSD: [],
            cumulativeLiquidateUSD: [],
            totalBorrowBalanceUSD: [],
            totalDepositBalanceUSD: [],
            outputTokenSupply: [],
            outputTokenPriceUSD: [],
          },
          url: deploymentString,
          protocolType: protocolType,
        };
      });
    });
  });

  const fullCurrentQueryArray = ["query Status {"];
  const fullPendingQueryArray = ["query Status {"];

  const queryContents = `
  subgraph
  node
  synced
  health
  fatalError {
    message
    handler
  }
  nonFatalErrors {
    message
    handler
  }
  chains {
    network
    chainHeadBlock {
      number
    }
    earliestBlock {
      number
    }
    latestBlock {
      number
    }
    lastHealthyBlock {
      number
    }
  }
  entityCount`;

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

  const currentStateDepos = deployments;
  Object.keys(currentStateDepos).forEach((name) => {
    deployments[name + "-pending"] = { ...deployments[name] };
  });

  const indexingStatusQueries = [
    ...fullCurrentQueryArray,
    ...fullPendingQueryArray,
  ].map((query) =>
    axios.post("https://api.thegraph.com/index-node/graphql", { query: query })
  );
  let indexData = [];
  await Promise.all(indexingStatusQueries)
    .then(
      (response) =>
      (indexData = response.map(
        (resultData) => (resultData.data.data)
      ))
    )
    .catch((err) => console.log(err));

  indexData = { ...indexData[0], ...indexData[1] };

  // invalidDeployments array holds the namestrings of all deployments that have failed indexing. These will not attempt further validation
  const invalidDeployments = [];
  Object.keys(indexData).forEach((indexDataName) => {
    const realNameString = indexDataName.split("_").join("-");
    if (indexDataName.includes("pending")) {
      deployments[realNameString].url =
        "https://api.thegraph.com/subgraphs/id/" +
        indexData[indexDataName]?.subgraph;
    }

    let indexedPercentage = ((indexData[indexDataName]?.chains[0]?.latestBlock?.number - indexData[indexDataName]?.chains[0]?.earliestBlock?.number) / (indexData[indexDataName]?.chains[0]?.chainHeadBlock?.number - indexData[indexDataName]?.chains[0]?.earliestBlock?.number)) || 0;
    indexedPercentage = indexedPercentage * 100;
    if (indexedPercentage > 99.5) {
      indexedPercentage = 100;
    }
    deployments[realNameString].indexedPercentage = indexedPercentage.toFixed(2);

    if (
      (!indexData[indexDataName] && !indexDataName.includes("pending")) ||
      !!indexData[indexDataName]?.fatalError
    ) {
      invalidDeployments.push(realNameString);
      deployments[realNameString].indexingError = indexData[indexDataName]?.fatalError?.message;
    } else if (!indexData[indexDataName] && indexDataName.includes("pending")) {
      delete deployments[realNameString];
    }
  });

  deployments = await protocolLevel(deployments);
  // deployments = await lendingPoolLevel(deployments);

  const discordMessages = await getDiscordMessages();
  alertFailedIndexing(discordMessages, deployments);
  alertProtocolErrors(discordMessages, deployments);
}

async function alertFailedIndexing(discordMessages, deployments) {
  // Get the indexing error message objects from the last week 
  const indexingErrorMessageObjs = discordMessages.filter(x => x.content.includes("**INDEXING ERRORS:**"))

  const indexingErrorDeposListStr = indexingErrorMessageObjs.map(msgObj => {
    return msgObj.content.split("LIST:")[1];
  })

  // For testing, loop through deployments and take the deployments which have an indexing error and construct a message
  const indexErrs = [];
  Object.keys(deployments).forEach(depo => {
    if (!!deployments[depo].indexingError && !indexingErrorDeposListStr.join('-').includes(depo) && indexErrs.join(" - ").length < 1400) {
      indexErrs.push(`Name: "${depo}", Indexed: ${deployments[depo].indexedPercentage}%, Endpoint: ${deployments[depo].url}`);
    }
  })

  const newIndexingErrorDiscordMessage = `
**INDEXING ERRORS:**
    
The following deployments have encountered errors indexing. Fatal Errors were detected and stopped execution. This list is of deployments that have stopped deployment as of the past 7 days or failed deployments that have not been alerted in the prior week. 
  
LIST:
  
${indexErrs.join(",\n")}
  `;

  if (indexErrs.length > 0) {
    const sendIndexingErrorDiscord = await sendDiscordMessage(newIndexingErrorDiscordMessage);
  }
}
