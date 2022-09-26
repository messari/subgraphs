import axios from "axios";
import { fetchMessages, constructEmbedMsg, errorNotification, getDiscordMessages, sendDiscordMessage, startProtocolThread } from "./messageDiscord.js";
import 'dotenv/config'
import { protocolLevel } from "./protocolLevel.js";
import { errorsObj, protocolErrors } from "./errorSchemas.js";
import { sleep } from "./util.js";
import fs from 'fs'
import path from 'path'

const dayMs = 3600000 * 24;

try {
  executionFlow();
  setInterval(executionFlow, dayMs);
} catch (err) {
  errorNotification(err.message + ' MAIN LOGIC script.js');
}

const protocolNameToBaseMapping = {};

async function executionFlow() {
  const { data } = await axios.get(
    "https://subgraphs.messari.io/deployment.json"
  );
  // deployments holds the errors for every protocol
  const subgraphEndpoints = {};

  if (Object.keys(data)?.length > 0) {
    Object.keys(data).forEach((protocolName) => {
      const protocol = data[protocolName];
      protocolNameToBaseMapping[protocolName] = protocol.base;
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
        subgraphEndpoints[protocol.schema][protocolName][depoData.network] = "https://api.thegraph.com/subgraphs/name/messari/" + depoData["deployment-ids"]["hosted-service"];
      });
    });
  }

  let deployments = {};
  const protocolNames = [];
  Object.entries(subgraphEndpoints).forEach(([protocolType, protocolsOnType]) => {
    Object.entries(protocolsOnType).forEach(([protocolName, protocolObj]) => {
      Object.entries(protocolObj).forEach(([network, deploymentString]) => {
        const nameStr =
          deploymentString.split("name/")[1];

        const deploymentsKey = nameStr.split("/")[1];
        deployments[deploymentsKey] = {
          protocolName: protocolName,
          indexingError: null,
          indexedPercentage: 0,
          url: deploymentString,
          protocolType: protocolType,
          network: network
        };
        deployments[deploymentsKey].protocolErrors = JSON.parse(JSON.stringify(protocolErrors));
        if (protocolType && deploymentsKey && Object.keys(errorsObj).includes(protocolType)) {
          deployments[deploymentsKey].poolErrors = JSON.parse(JSON.stringify(errorsObj[protocolType]));
        }
        if (!protocolNames.includes(protocolName)) {
          protocolNames.push(protocolName);
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
    deployments[name + "-pending"] = JSON.parse(JSON.stringify({ ...deployments[name] }));
    deployments[name + "-pending"].pending = true;
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
    .catch((err) => errorNotification(err.message + ' executionFlow() script.js'));

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
  const protocolThreadsToStart = [];
  const currentDiscordMessages = await getDiscordMessages([], "");

  let protocolNameToChannelMapping = {};
  protocolNames.forEach(protocolName => {
    if (currentDiscordMessages.find(msg => msg.content.includes(protocolName))) {
      const channel_id = currentDiscordMessages.find(msg => msg.content.includes(protocolName)).id;
      protocolNameToChannelMapping[protocolName] = channel_id;
    } else {
      protocolThreadsToStart.push({ protocolName: protocolName });
    }
  })

  const channelMapping = await resolveThreadCreation(protocolThreadsToStart, protocolNameToChannelMapping);
  protocolNameToChannelMapping = { ...protocolNameToChannelMapping, ...channelMapping };
  let channelToProtocolIssuesMapping = {};
  let channelToIndexIssuesMapping = {};

  Object.keys(protocolNameToChannelMapping).forEach(protocolName => {
    const channelId = protocolNameToChannelMapping[protocolName];
    channelToProtocolIssuesMapping[channelId] = {};
    channelToIndexIssuesMapping[channelId] = [];
    Object.keys(deployments).filter(x => {
      return deployments[x].protocolName === protocolName;
    }).forEach(x => {
      if (deployments[x].pending) {
        channelToProtocolIssuesMapping[channelId][deployments[x].network + '-pending'] = [];
      } else {
        channelToProtocolIssuesMapping[channelId][deployments[x].network] = [];
      }
    });
  });

  const issuesMapping = await pullMessagesByThread(Object.keys(channelToProtocolIssuesMapping), channelToProtocolIssuesMapping, channelToIndexIssuesMapping);
  channelToProtocolIssuesMapping = issuesMapping.channelToProtocolIssuesMapping;
  channelToIndexIssuesMapping = issuesMapping.channelToIndexIssuesMapping;
  const messagesToPost = protocolNames.map(protocolName => {
    let channel_id = protocolNameToChannelMapping[protocolName] || null;

    const deploymentSet = Object.values(deployments).filter(depo => depo.protocolName === protocolName);
    const protocolIssuesOnThread = channelToProtocolIssuesMapping[channel_id];
    const indexDeploymentIssues = channelToIndexIssuesMapping[channel_id];
    const embeddedMessages = constructEmbedMsg(protocolName, deploymentSet, protocolIssuesOnThread, indexDeploymentIssues);
    return { message: embeddedMessages, protocolName: protocolName, channel: channel_id };
  })
  if (messagesToPost.length > 0) {
    messagesToPost.forEach((msg, idx) => {
      if (!msg.channel) {
        messagesToPost[idx].channel = protocolNameToChannelMapping[msg.protocolName];
      }
    });
    await resolveQueriesToAttempt(messagesToPost);
  }
  console.log('FINISH')
  return;
}

async function pullMessagesByThread(channelIdList, channelToProtocolIssuesMapping, channelToIndexIssuesMapping) {
  const channelToProtocolIssuesMappingCopy = JSON.parse(JSON.stringify(channelToProtocolIssuesMapping));
  const channelIdsListCopy = JSON.parse(JSON.stringify([...channelIdList]));

  const useQueries = channelIdsListCopy.slice(0, 5);
  const newQueriesArray = [...channelIdsListCopy.slice(5)];
  try {
    const fetchMessagesPromiseArr = useQueries.map(channelId => {
      return fetchMessages("", channelId);
    });
    const promiseSettle = await Promise.allSettled(fetchMessagesPromiseArr);

    promiseSettle.forEach((res) => {
      if (res?.value?.length > 0) {
        res.value.forEach(protocolMessageObject => {
          const networkList = Object.keys(channelToProtocolIssuesMappingCopy[protocolMessageObject.channel_id]);
          if (networkList.length === 0) {
            return;
          }
          networkList.forEach(chain => {
            const chainStr = chain.split('-pending')[0];
            const isPending = chain.split('-pending').length > 1;

            const embedObjectOnChain = protocolMessageObject.embeds.find(x => x.title.includes(chainStr) && x.title.toUpperCase().includes("PROTOCOL LEVEL ERRORS") && ((x.title.toUpperCase().includes("PENDING") && isPending) || (!x.title.toUpperCase().includes("PENDING") && !isPending)));
            if (!embedObjectOnChain) {
              return;
            }
            const fieldCells = embedObjectOnChain.fields.filter(cell => cell.name === "Field").map(x => x.value);
            if (fieldCells) {
              channelToProtocolIssuesMappingCopy[protocolMessageObject.channel_id][chainStr] = fieldCells;
            }
          });
          const indexingErrorObject = protocolMessageObject.embeds.find(x => x.title.toUpperCase().includes("INDEXING ERRORS"));
          if (!indexingErrorObject) {
            return;
          }
          channelToIndexIssuesMapping[protocolMessageObject.channel_id] = indexingErrorObject.fields.filter(x => {
            return x.value.toUpperCase() !== x.value;
          }).map(x => x.value);
          if (!channelToIndexIssuesMapping[protocolMessageObject.channel_id]) {
            channelToIndexIssuesMapping[protocolMessageObject.channel_id] = [];
          }
        });
      }
    });
  } catch (err) {
    console.log(err);
    errorNotification(err.message + ' pullMessagesByThread() script.js');
  }

  await sleep(5000);
  if (newQueriesArray.length > 0) {
    return pullMessagesByThread(newQueriesArray, channelToProtocolIssuesMappingCopy, channelToIndexIssuesMapping);
  }

  return { channelToProtocolIssuesMapping: channelToProtocolIssuesMappingCopy, channelToIndexIssuesMapping };
}

async function resolveThreadCreation(protocols, threadsCreated) {
  const threadsCreatedCopy = { ...threadsCreated };
  let useQueries = [...protocols];
  useQueries = useQueries.slice(0, 5);
  const newQueriesArray = [...protocols.slice(5)];
  try {
    const promiseSettle = await Promise.allSettled(useQueries.map(object => {
      const base = protocolNameToBaseMapping[object.protocolName];
      return startProtocolThread(object.protocolName, base);
    }));
    promiseSettle.forEach(res => {
      if (res?.value) {
        threadsCreatedCopy[res?.value?.protocolName] = res?.value?.channel;
      }
    })
  } catch (err) {
    errorNotification(err.message + ' resolveThreadCreation() script.js');
  }

  await sleep(5000);
  if (newQueriesArray.length > 0) {
    return resolveThreadCreation(newQueriesArray, threadsCreatedCopy);
  }
  return threadsCreatedCopy;
}

async function resolveQueriesToAttempt(queriesToAttempt) {
  // Take the first 5 queries to attempt
  let useQueries = queriesToAttempt.slice(0, 5);
  const newQueriesArray = [...queriesToAttempt.slice(5)];
  try {
    await Promise.allSettled(useQueries.map(object => sendDiscordMessage(object.message, object.protocolName, object.channel)));
  } catch (err) {
    errorNotification(err.message + ' resolveQueriesToAttempt() script.js');
  }
  await sleep(5000);
  if (newQueriesArray.length > 0) {
    resolveQueriesToAttempt(newQueriesArray);
    return;
  }
  return;
}
