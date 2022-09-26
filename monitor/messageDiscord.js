import axios from 'axios';
import moment from "moment";
import { protocolErrorMessages } from './errorSchemas.js';
import { monitorVersion, ProtocolTypeEntityName, sleep, colorsArray } from './util.js';

// Error handling functions

export async function errorNotification(error, channelId = process.env.CHANNEL_ID) {
    await sleep(5000);
    try {
        const baseURL = "https://discordapp.com/api/channels/1019063880040861806/messages";
        const headers = {
            "Authorization": "Bot " + process.env.BOT_TOKEN,
            "Content-Type": "application/json",
        }
        const postJSON = JSON.stringify({ "content": `**Subgraph Bot Monitor on Channel ${channelId}- Errors detected**\n` + error });
        const data = await axios.post(baseURL, postJSON, { "headers": { ...headers } });
        return null;
    } catch (err) {
        errorNotification("ERROR LOCATION 6 " + err.message);
    }
}

// Functions involved in fetching messages/channels

export async function getDiscordMessages(messages, channelId = process.env.CHANNEL_ID) {
    try {
        const tempMessages = await fetchMessages(messages[messages.length - 1]?.id || "", channelId);
        messages = [...messages, ...tempMessages];
        if (messages.length % 100 === 0 && messages.length !== 0 && tempMessages.length !== 0) {
            await sleep(1000);
            return getDiscordMessages(messages, channelId);
        } else {
            return messages;
        }
    } catch (err) {
        errorNotification("ERROR LOCATION 7 " + err?.message + ' URL: ' + err?.response?.config?.url + ' ' + err?.response?.config?.data + ' ' + err?.response?.data?.message, channelId);
    }
}

export async function fetchMessages(before, channelId = process.env.CHANNEL_ID) {
    let beforeQueryParam = "";
    if (before) {
        beforeQueryParam = "&before=" + before;
    }
    const baseURL = "https://discordapp.com/api/channels/" + channelId + "/messages?limit=100" + beforeQueryParam;
    const headers = {
        "Authorization": "Bot " + process.env.BOT_TOKEN,
        "Content-Type": "application/json",
    }

    try {
        const data = await axios.get(baseURL, { "headers": { ...headers } });
        const timeAgo = new Date(Date.now() - ((86400000 * 7)));
        const previousWeekMessages = data.data.filter(obj => {
            return moment(new Date(obj.timestamp)).isSameOrAfter(timeAgo);
        });
        return previousWeekMessages;
    } catch (err) {
        errorNotification("ERROR LOCATION 8 " + err?.message + ' URL: ' + err?.response?.config?.url + ' ' + err?.response?.config?.data + ' ' + err?.response?.data?.message, channelId);
    }
}

export async function getChannel(channelId = process.env.CHANNEL_ID) {
    let baseURL = "https://discordapp.com/api/channels/" + channelId;
    const headers = {
        "Authorization": "Bot " + process.env.BOT_TOKEN,
        "Content-Type": "application/json",
    }

    try {
        const data = await axios.get(baseURL, { "headers": { ...headers } });
    } catch (err) {
        errorNotification("ERROR LOCATION 9 " + err?.message + ' ' + err?.response?.config?.url + ' ' + err?.response?.config?.data + ' ' + err?.response?.data?.message, channelId);
    }
}

// functions involved with deleting messages/threads/channels

export async function clearChannel(channelId = process.env.CHANNEL_ID) {
    // This function is called to clear the main channel of all threads within it
    try {
        const msgs = await getDiscordMessages([], channelId);
        const baseURL = "https://discordapp.com/api/channels/";
        const headers = {
            "Authorization": "Bot " + process.env.BOT_TOKEN,
            "Content-Type": "application/json",
        }

        const deletions = msgs.map(msg => {
            return axios.delete(baseURL + msg.id, { "headers": { ...headers } }).catch(err => console.log(err.message));
        });

        await Promise.allSettled(deletions);
        clearMessages(channelId);
    } catch (err) {
        errorNotification("ERROR LOCATION 10 " + err?.message + ' ' + err?.response?.config?.url + ' ' + err?.response?.config?.data + ' ' + err?.response?.data?.message, channelId);
    }
}

export async function clearMessages(channelId = process.env.CHANNEL_ID) {
    // This function is called to clear all the messages within a thread or channel
    // Note that this does not delete threads but only the message which heads the thread
    try {
        const msgs = await getDiscordMessages([], channelId);
        const baseURL = "https://discordapp.com/api/channels/" + channelId;
        const headers = {
            "Authorization": "Bot " + process.env.BOT_TOKEN,
            "Content-Type": "application/json",
        }

        const postJSON = JSON.stringify({ "messages": msgs.map(x => x.id).slice(0, 100) });
        await axios.post(baseURL + "/messages/bulk-delete", postJSON, { "headers": { ...headers } });
    } catch (err) {
        errorNotification("ERROR LOCATION 11 " + err?.message + ' ' + err?.response?.config?.url + ' ' + err?.response?.config?.data + ' ' + err?.response?.data?.message, channelId);
    }
}

export async function deleteSingleMessage(messageId, channelId = process.env.CHANNEL_ID) {
    try {
        const headers = {
            "Authorization": "Bot " + process.env.BOT_TOKEN,
            "Content-Type": "application/json",
        };
        const baseURL = "https://discordapp.com/api/channels/" + channelId + "/messages/" + messageId;
        await axios.delete(baseURL, { "headers": { ...headers } });
        return;
    } catch (err) {
        errorNotification("ERROR LOCATION 22 " + err?.message + ' ' + err?.response?.config?.url + ' ' + err?.response?.config?.data + ' ' + err?.response?.data?.message, channelId);
    }
}

// Message Posting functions

let colorIndex = 0;
export async function sendDiscordMessage(messageObjects, protocolName, channelId = process.env.CHANNEL_ID) {
    if (!Object.keys(messageObjects)?.length > 0 || !messageObjects) {
        return null;
    }
    const baseURL = "https://discordapp.com/api/channels/" + channelId + "/messages";
    const headers = {
        "Authorization": "Bot " + process.env.BOT_TOKEN,
        "Content-Type": "application/json",
    }

    let color = 0x32CD32;
    colorIndex += 1;
    if (colorIndex < colorsArray.length) {
        color = colorsArray[colorIndex];
    } else {
        color = colorsArray[colorIndex % colorsArray.length]
    }

    messageObjects = messageObjects.map(x => {
        x.color = color;
        return x;
    });

    const postJSON = JSON.stringify({ "content": `**Subgraph Bot Monitor - Errors detected on ${protocolName}**\n`, "embeds": messageObjects });
    try {
        const data = await axios.post(baseURL, postJSON, { "headers": { ...headers } });
        return null;
    } catch (err) {
        if (err.response.status === 429) {
            return messageObjects;
        } else {
            errorNotification("ERROR LOCATION 12 " + err?.message + ' ' + err?.response?.config?.url + ' ' + err?.response?.config?.data + ' ' + err?.response?.data?.message, channelId);
            return null;
        }
    }
}

export async function startProtocolThread(protocolName, base, channelId = process.env.CHANNEL_ID) {
    let baseURL = "https://discordapp.com/api/channels/" + channelId + "/messages";
    const headers = {
        "Authorization": "Bot " + process.env.BOT_TOKEN,
        "Content-Type": "application/json",
    }

    let postJSON = JSON.stringify({ "content": protocolName + ' (Base: ' + base + ')' });
    let msgId = ""
    try {
        const data = await axios.post(baseURL, postJSON, { "headers": { ...headers } });
        msgId = data.data.id;
    } catch (err) {
        errorNotification("ERROR LOCATION 13 " + err?.message + ' ' + err?.response?.config?.url + ' ' + err?.response?.config?.data + ' ' + err?.response?.data?.message, channelId);
    }

    baseURL = "https://discordapp.com/api/channels/" + channelId + "/messages/" + msgId + "/threads";

    postJSON = JSON.stringify({ "name": protocolName + ' ISSUES' });

    try {
        const data = await axios.post(baseURL, postJSON, { "headers": { ...headers } });
        return { channel: data.data.id, protocolName: protocolName };
    } catch (err) {
        if (!!msgId) {
            deleteSingleMessage(msgId, channelId);
        }
        errorNotification("ERROR LOCATION 14 " + err?.message + ' ' + err?.response?.config?.url + ' ' + err?.response?.config?.data + ' ' + err?.response?.data?.message, channelId);
    }
}

export function constructEmbedMsg(protocol, deploymentsOnProtocol, issuesOnThread, indexDeploymentIssues) {
    try {
        const embedObjects = [];
        const indexingErrorEmbed = {
            title: "Indexing Errors",
            description: 'These subgraphs encountered a fatal error in indexing',
            fields: [{ name: 'Chain', value: '\u200b', inline: true }, { name: 'Indexed %', value: '\u200b', inline: true }, { name: '\u200b', value: '\u200b', inline: false }],
            footer: { text: monitorVersion }
        };

        const placeholderColor = colorsArray[Math.floor(Math.random() * 8)];

        deploymentsOnProtocol.forEach((depo) => {
            let networkString = depo.network;
            let issuesSet = [];
            if (!!issuesOnThread) {
                issuesSet = issuesOnThread[networkString];
                if (depo.pending) {
                    issuesSet = issuesOnThread[networkString + '-pending'];
                    networkString += ' (PENDING)';
                }
            }
            const protocolErrorEmbed = {
                title: `Protocol Level Errors on ${protocol}-${networkString}`,
                color: placeholderColor,
                description: 'After mapping through all of the subgraph deployments for this protocol, The errors listed in this section were detected within protocol level data.',
                fields: [],
                footer: { text: monitorVersion }
            };
            if (!!depo.indexingError && !indexDeploymentIssues.includes(networkString)) {
                indexingErrorEmbed.color = placeholderColor;
                indexingErrorEmbed.fields.push({ name: '\u200b', value: networkString, inline: true }, { name: '\u200b', value: depo.indexedPercentage + '%', inline: true }, { name: '\u200b', value: '\u200b', inline: false });
            }
            let errorsOnDeployment = false;
            Object.entries(depo.protocolErrors).forEach(([errorType, errorArray]) => {
                if (issuesSet?.includes(errorType)) {
                    return;
                }
                const protocolRows = [];
                if (errorArray.length > 0) {
                    if (errorsOnDeployment === false) {
                        errorsOnDeployment = true;
                    }
                    errorArray.forEach((error) => {
                        protocolRows.push({ name: 'Field', value: errorType, inline: true }, { name: 'Value', value: error, inline: true }, { name: 'Description', value: protocolErrorMessages[errorType].split("'Protocol'").join(`"${ProtocolTypeEntityName[depo.protocolType]}"`), inline: true }, { name: '\u200b', value: '\u200b', inline: false })
                    });
                }
                protocolErrorEmbed.fields = [...protocolErrorEmbed.fields, ...protocolRows];
            });
            if (protocolErrorEmbed.fields.length > 1) {
                protocolErrorEmbed.url = `https://subgraphs.messari.io/subgraph?endpoint=${depo.url}&tab=protocol`;
                embedObjects.push(protocolErrorEmbed);
            }
        });

        if (indexingErrorEmbed.fields.length > 3) {
            embedObjects.unshift(indexingErrorEmbed);
        }

        if (embedObjects.length > 0) {
            return embedObjects;
        }
        return null;
    } catch (err) {
        errorNotification("ERROR LOCATION 15 " + err.message);
    }
}