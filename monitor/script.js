import axios from "axios";
import { clearThread, constructEmbedMsg, errorNotification, getAllThreadsToClear, getDiscordMessages, postError, sendMessageToAggThread } from "./messageDiscord.js";
import 'dotenv/config'
import { protocolDerivedFields, protocolLevel } from "./protocolLevel.js";
import { errorsObj, protocolErrors } from "./errorSchemas.js";
import { pullMessagesByThread, resolveQueriesToAttempt, resolveThreadCreation } from "./resolutions.js";
import { generateEndpoints, indexStatusFlow } from "./indexingStatus.js";

const hourMs = 3600000;

try {
  executionFlow();
  setInterval(executionFlow, hourMs);
} catch (err) {
  errorNotification("ERROR LOCATION 21 " + err.message + ' MAIN LOGIC script.js');
}

let protocolNameToBaseMapping = {};

async function executionFlow() {
  console.log('START');
  postError('TEST ERROR POST')
  let data = null;
  try {
    const result = await axios.get(
      "https://raw.githubusercontent.com/messari/subgraphs/master/deployment/deployment.json"
    );
    data = result.data;
  } catch (err) {
    console.log(err.message)
  }
  const loopDeploymentJSON = await generateEndpoints(data, protocolNameToBaseMapping);
  const subgraphEndpoints = loopDeploymentJSON.subgraphEndpoints;
  protocolNameToBaseMapping = loopDeploymentJSON.protocolNameToBaseMapping;

  // Generate deployments object which holds the issues/metadata for each deployment
  let deployments = {};
  const protocolNames = [];

  Object.entries(subgraphEndpoints).forEach(([protocolType, protocolsOnType]) => {
    Object.entries(protocolsOnType).forEach(([protocolName, protocolObj]) => {
      Object.entries(protocolObj).forEach(([network, deploymentString]) => {
        const deploymentData = Object.values(data[protocolName]?.deployments)?.find(x => x.network === network);
        const status = deploymentData?.status || 'dev';
        const versions = deploymentData?.versions || { "schema": "N/A", "subgraph": "N/A", "methodology": "N/A" };
        const nameStr =
          deploymentString.split("name/")[1];
        const deploymentsKey = nameStr.split("/")[1];
        if (!deploymentsKey) {
          return;
        }
        deployments[deploymentsKey] = {
          status: status,
          protocolName: protocolName,
          indexingError: null,
          indexedPercentage: 0,
          url: deploymentString,
          protocolType: protocolType,
          versions: versions,
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

  await getAllThreadsToClear(Date.now() - (86400000 * 7), process.env.CHANNEL_ID);

  const indexStatusFlowObject = await indexStatusFlow(deployments);
  deployments = indexStatusFlowObject.deployments;
  const invalidDeployments = indexStatusFlowObject.invalidDeployments;

  // pass invalid deployments arr to protocolLevel, before execution check if depo key is included in array
  deployments = await protocolLevel(deployments, invalidDeployments);
  deployments = await protocolDerivedFields(deployments, invalidDeployments);
  const currentDiscordMessages = await getDiscordMessages([]);

  const protocolThreadsToStart = [];
  let protocolNameToChannelMapping = {};
  protocolNames.forEach(protocolName => {
    const existingProtocolThread = currentDiscordMessages.find(msg => (msg.content.includes(protocolName + " (Base")));
    if (existingProtocolThread) {
      protocolNameToChannelMapping[protocolName] = existingProtocolThread?.id;
    } else {
      protocolThreadsToStart.push({ protocolName: protocolName });
    }
  })

  const channelMapping = await resolveThreadCreation(protocolThreadsToStart, protocolNameToChannelMapping, protocolNameToBaseMapping);
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
  let messagesToPost = protocolNames.map(protocolName => {
    let channelId = protocolNameToChannelMapping[protocolName] || null;
    if (!channelId) {
      return null;
    }
    const deploymentSet = Object.values(deployments).filter(depo => depo.protocolName === protocolName);
    const protocolIssuesOnThread = channelToProtocolIssuesMapping[channelId];
    let indexDeploymentIssues = channelToIndexIssuesMapping[channelId];
    if (!indexDeploymentIssues) {
      indexDeploymentIssues = [];
    }
    const embeddedMessages = constructEmbedMsg(protocolName, deploymentSet, protocolIssuesOnThread, indexDeploymentIssues);
    return { message: embeddedMessages, protocolName: protocolName, channel: channelId };
  });
  if (messagesToPost.length > 0) {
    await clearThread(Date.now() - (86400000), process.env.PROD_CHANNEL);
    const aggThread = currentDiscordMessages.find(x => x.content.includes('Production Ready Subgraph Indexing Failure'));
    const aggThreadId = aggThread?.id || "";
    if (aggThreadId) {
      await clearThread(Date.now() - (86400000), aggThreadId);
    }
    await sendMessageToAggThread(aggThreadId);
    messagesToPost = messagesToPost.filter((msg, idx) => {
      if (!msg?.channel && !!msg) {
        messagesToPost[idx].channel = protocolNameToChannelMapping[msg?.protocolName];
      }
      return !!msg;
    });
    await resolveQueriesToAttempt(messagesToPost);
  }
  console.log('FINISH')
  return;
}
