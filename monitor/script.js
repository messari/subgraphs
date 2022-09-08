import axios from "axios";
import { getDiscordMessages, sendDiscordMessage } from "./messageDiscord.js";
import 'dotenv/config'
import { protocolLevel } from "./protocolLevel.js";
import { errorsObj, protocolErrors } from "./errorSchemas.js";
import { lendingPoolLevel } from "./poolLevel/lendingPoolLevel.js";
import { vaultPoolLevel } from "./poolLevel/vaultPoolLevel.js";
import { dexPoolLevel } from "./poolLevel/dexPoolLevel.js";
import { alertFailedIndexing, alertPoolLevelErrors, alertProtocolErrors } from "./alerts.js";
import { sleep } from "./util.js";


executionFlow();

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

        const deploymentsKey = nameStr.split("/")[1];
        deployments[deploymentsKey] = {
          indexingError: null,
          indexedPercentage: 0,
          url: deploymentString,
          protocolType: protocolType,
        };
        deployments[deploymentsKey].protocolErrors = JSON.parse(JSON.stringify(protocolErrors));
        if (protocolType && deploymentsKey && Object.keys(errorsObj).includes(protocolType)) {
          deployments[deploymentsKey].poolErrors = JSON.parse(JSON.stringify(errorsObj[protocolType]));
        }
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
      return;
    }

    if (parseFloat(deployments[realNameString]?.indexedPercentage) < 10) {
      invalidDeployments.push(realNameString);
      delete deployments[realNameString];
    }

  });
  deployments = await protocolLevel(deployments);
  let queriesToAttempt = [];
  const discordMessages = await getDiscordMessages([]);
  await alertFailedIndexing(discordMessages, deployments);
  queriesToAttempt = await alertProtocolErrors(discordMessages, deployments, queriesToAttempt);
  // deployments = await deploymentsOnPoolLevel(deployments);
  // await sleep(5000);
  // queriesToAttempt = await alertPoolLevelErrors(discordMessages, deployments, "lending", queriesToAttempt);
  // await sleep(5000);
  // queriesToAttempt = await alertPoolLevelErrors(discordMessages, deployments, "vaults", queriesToAttempt);
  // await sleep(5000);
  // queriesToAttempt = await alertPoolLevelErrors(discordMessages, deployments, "exchanges", queriesToAttempt);
  await sleep(5000);

  if (queriesToAttempt.length > 0) {
    // Need to pull refreshed list of alert messages, in case posted but error was thrown as well.
    const updatedDiscordMessages = await getDiscordMessages([]);
    await resolveQueriesToAttempt(queriesToAttempt, updatedDiscordMessages);
  }

  return executionFlow();
}

async function resolveQueriesToAttempt(queriesToAttempt, updatedDiscordMessages) {
  // Take the first 5 queries to attempt
  let useQueries = queriesToAttempt.slice(0, 5);
  const newQueriesArray = [...queriesToAttempt.slice(5)];
  try {
    // map useQueries and within filter updatedDiscordMessages.includes(useQueries[x].slice(0,80)) 
    useQueries = useQueries.filter(query => {
      const hasMsg = updatedDiscordMessages.filter(msg => {
        return msg.content.includes(query.slice(0, 80));
      })
      return hasMsg.length === 0;
    })
    await Promise.allSettled(useQueries.map(messageToSend => sendDiscordMessage(messageToSend)));
  } catch (err) {
    console.log(err)
  }

  await sleep(5000);
  if (newQueriesArray.length > 0) {
    resolveQueriesToAttempt(newQueriesArray, updatedDiscordMessages);
    return;
  }
  return;
}

async function deploymentsOnPoolLevel(deployments) {
  deployments = await lendingPoolLevel(deployments);
  deployments = await vaultPoolLevel(deployments);
  deployments = await dexPoolLevel(deployments);
  return deployments;
}
