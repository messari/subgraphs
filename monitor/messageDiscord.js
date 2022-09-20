import axios from 'axios';
import moment from "moment";
import { protocolErrorMessages } from './errorSchemas.js';
import { monitorVersion, ProtocolTypeEntityName, sleep } from './util.js';

let colorIndex = 0;
const colorsArray = [
    0x32CD32,
    0xff0000,
    0x0000FF,
    0xFFFF00,
    0x800080,
    0xFFA500,
    0xFFFFFF,
    0x964B00,
    0xADD8E6,
    0x006400,
    0x30D5C8,
    0xFF6700,
    0xCBC3E3,
    0x953553,
];

export async function errorNotification(error) {

    await sleep(5000);
    try {
        const baseURL = "https://discordapp.com/api/channels/1019063880040861806/messages";
        const headers = {
            "Authorization": "Bot " + process.env.BOT_TOKEN,
            "Content-Type": "application/json",
        }
        const postJSON = JSON.stringify({ "content": `**Subgraph Bot Monitor - Errors detected**\n` + error });
        const data = await axios.post(baseURL, postJSON, { "headers": { ...headers } });
        return null;
    } catch (err) {
        errorNotification(err.message, 'errorNotification')
    }
}

export async function getDiscordMessages(messages, channel_id) {
    try {
        const tempMessages = await fetchMessages(messages[messages.length - 1]?.id || "", channel_id);
        messages = [...messages, ...tempMessages];
        if (messages.length % 100 === 0 && messages.length !== 0 && tempMessages.length !== 0) {
            await sleep(1000);
            return getDiscordMessages(messages, channel_id);
        } else {
            return messages;
        }
    } catch (err) {
        errorNotification(err?.message + ' ' + err?.response?.config?.url + ' ' + err?.response?.config?.data + ' ' + err?.response?.data?.message + ' getDiscordMessages() messageDiscord.js');
    }
}

export async function fetchMessages(before, channel_id) {
    let beforeQueryParam = "";
    if (before) {
        beforeQueryParam = "&before=" + before;
    }
    let baseURL = "https://discordapp.com/api/channels/" + process.env.CHANNEL_ID + "/messages?limit=100" + beforeQueryParam;
    if (channel_id) {
        baseURL = "https://discordapp.com/api/channels/" + channel_id + "/messages?limit=100" + beforeQueryParam;
    }
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
        errorNotification(channel_id + ' ' + err?.message + ' ' + err?.response?.config?.url + ' ' + err?.response?.config?.data + ' ' + err?.response?.data?.message + ' fetchMessages() messageDiscord.js');
    }
}

export async function clearChannel(channel_id) {
    try {
        const msgs = await getDiscordMessages([], channel_id);
        let baseURL = "https://discordapp.com/api/channels/" + process.env.CHANNEL_ID + "/messages/bulk-delete";
        if (channel_id) {
            baseURL = "https://discordapp.com/api/channels/" + channel_id + "/messages/bulk-delete";
        }
        const headers = {
            "Authorization": "Bot " + process.env.BOT_TOKEN,
            "Content-Type": "application/json",
        }

        const postJSON = JSON.stringify({ "messages": msgs.map(x => x.id).slice(0, 100) });

        const data = await axios.post(baseURL, postJSON, { "headers": { ...headers } });
    } catch (err) {
        errorNotification(err?.message + ' ' + err?.response?.config?.url + ' ' + err?.response?.config?.data + ' ' + err?.response?.data?.message + ' clearChannel() messageDiscord.js');
    }
}

export async function sendDiscordMessage(messageObjects, protocolName, channel_id) {
    if (!Object.keys(messageObjects)?.length > 0 || !messageObjects) {
        return null;
    }
    const baseURL = "https://discordapp.com/api/channels/" + channel_id + "/messages";
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
            errorNotification(err?.message + ' ' + err?.response?.config?.url + ' ' + err?.response?.config?.data + ' ' + err?.response?.data?.message + ' sendDiscordMessage() messageDiscord.js')
            return null;
        }
    }
}

export async function startProtocolThread(protocolName, base) {
    let baseURL = "https://discordapp.com/api/channels/" + process.env.CHANNEL_ID + "/messages";
    let headers = {
        "Authorization": "Bot " + process.env.BOT_TOKEN,
        "Content-Type": "application/json",
    }


    let postJSON = JSON.stringify({ "content": protocolName + ' (Base: ' + base + ')' });
    let msgId = ""
    try {
        const data = await axios.post(baseURL, postJSON, { "headers": { ...headers } });
        msgId = data.data.id;
    } catch (err) {
        errorNotification(err);
    }

    baseURL = "https://discordapp.com/api/channels/" + process.env.CHANNEL_ID + "/messages/" + msgId + "/threads";

    headers = {
        "Authorization": "Bot " + process.env.BOT_TOKEN,
        "Content-Type": "application/json",
    };

    postJSON = JSON.stringify({ "name": protocolName + ' ISSUES' });

    try {
        const data = await axios.post(baseURL, postJSON, { "headers": { ...headers } });
        return { channel: data.data.id, protocolName: protocolName };
    } catch (err) {
        errorNotification(err);
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
        errorNotification(err);
    }
}