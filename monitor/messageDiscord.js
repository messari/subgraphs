import axios from 'axios';
import moment from "moment";
import { protocolErrorMessages } from './errorSchemas.js';
import { monitorVersion, sleep } from './util.js';

export async function getDiscordMessages(messages) {
    const tempMessages = await fetchMessages(messages[messages.length - 1]?.id || "");

    messages = [...messages, ...tempMessages];
    if (messages.length % 100 === 0 && messages.length !== 0 && tempMessages.length !== 0) {
        await sleep(1000);
        return getDiscordMessages(messages);
    } else {
        return messages;
    }
}

export async function fetchMessages(before) {
    let beforeQueryParam = "";
    if (before) {
        beforeQueryParam = "&before=" + before;
    }
    const baseURL = "https://discordapp.com/api/channels/" + process.env.CHANNEL_ID + "/messages?limit=100" + beforeQueryParam;
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
        console.log(err);
    }
}

export async function clearChannel() {
    const msgs = await getDiscordMessages([]);
    const baseURL = "https://discordapp.com/api/channels/" + process.env.CHANNEL_ID + "/messages/bulk-delete";
    const headers = {
        "Authorization": "Bot " + process.env.BOT_TOKEN,
        "Content-Type": "application/json",
    }

    const postJSON = JSON.stringify({ "messages": msgs.map(x => x.id).slice(0, 100) });

    try {
        const data = await axios.post(baseURL, postJSON, { "headers": { ...headers } });
    } catch (err) {
        console.log('ERROR', err)
    }
}

export async function sendDiscordMessage(message) {
    if (!Object.keys(message)?.length > 0 || !message) {
        return null;
    }
    const baseURL = "https://discordapp.com/api/channels/" + process.env.CHANNEL_ID + "/messages";
    const headers = {
        "Authorization": "Bot " + process.env.BOT_TOKEN,
        "Content-Type": "application/json",
    }

    const postJSON = JSON.stringify({ "content": "TEST", "embeds": message });
    try {
        const data = await axios.post(baseURL, postJSON, { "headers": { ...headers } });
        return null;
    } catch (err) {
        console.log('ERROR', err.response)
        if (err.response.status === 429) {
            return message;
        } else {
            console.log(err.response.data.message)
            return null;
        }
    }
}

export function constructEmbedMsg(protocol, deploymentsOnProtocol) {

    const embedObjects = [];
    const indexingErrorEmbed = {
        title: "Indexing Errors",
        description: 'These subgraphs encountered a fatal error in indexing',
        fields: [{ name: 'Chain', value: '\u200b', inline: true }, { name: 'Indexed %', value: '\u200b', inline: true }, { name: '\u200b', value: '\u200b', inline: false }],
        timestamp: new Date().toISOString(),
    };
    const protocolErrorEmbed = {
        title: "Protocol Errors",
        description: 'After mapping through all of the subgraph deployments for this protocol, The errors listed in this section were detected within protocol level data.',
        fields: [{ name: 'Chain', value: '\u200b', inline: true }, { name: 'Type', value: '\u200b', inline: true }, { name: 'Value', value: '\u200b', inline: true }, { name: 'Issue Description', value: '\u200b', inline: true }, { name: '\u200b', value: '\u200b', inline: false }],
        timestamp: new Date().toISOString(),
    };

    deploymentsOnProtocol.forEach(depo => {
        if (!!depo.indexingError && indexingErrorEmbed.fields.join(" - ").length < 1400) {
            indexingErrorEmbed.fields.push({ name: '\u200b', value: depo.network, inline: true }, { name: '\u200b', value: depo.indexedPercentage + '%', inline: true }, { name: '\u200b', value: '\u200b', inline: false });
        }
        Object.entries(depo.protocolErrors).forEach(([errorType, errorArray]) => {
            const protocolRows = [];
            if (errorArray.length > 0) {
                errorArray.forEach((error, idx) => {
                    let networkCol = '\u200b';
                    if (idx === 0) {
                        networkCol = depo.network;
                    }
                    protocolRows.push({ name: '\u200b', value: networkCol, inline: true }, { name: '\u200b', value: errorType, inline: true }, { name: '\u200b', value: error, inline: true }, { name: '\u200b', value: protocolErrorMessages[errorType], inline: true }, { name: '\u200b', value: '\u200b', inline: false })
                });
            }
            protocolErrorEmbed.fields = [...protocolErrorEmbed.fields, ...protocolRows]
        });
    });

    if (indexingErrorEmbed.fields.length > 3) {
        embedObjects.push(indexingErrorEmbed);
    }

    if (protocolErrorEmbed.fields.length > 5) {
        embedObjects.push(protocolErrorEmbed);
    }




    // Object.keys(deploymentsOnProtocol).forEach(depo => {
    //     if (!!deploymentsOnProtocol[depo].indexingError && protocolErrors.join(" - ").length < 1400) {
    //         protocolErrors.push({ value: depo, inline: true }, { value: deploymentsOnProtocol[depo].indexedPercentage + '%', inline: true }, { name: '\u200b', value: '\u200b', inline: false });
    //     }
    // });

    // if (protocolErrors.length > 3) {
    //     protocolErrorEmbed.fields = protocolErrors;
    // }

    // Dont send a message/content for each issue category
    // In script.js create an array? of the different protocols
    // Pass depos obj to this function, get all depos with key including the current protocol name


    // Create a section for each issue type 

    // Display all errors on embedded message, read messages should check if a message has been made on this protocol in the last week. No need to check if certain issues have been triggered yet or not



    // In scrpt.js protocolsOnType mapping, take protocol name and add as a property in each deployment and push to a protocolNames array
    // After issues mapping through all deployments, then map through protocolNames array and filter deployments where protocolName key === protocolNames x
    // Call constructEmbedMsg function to create the embd msg for the protocol.
    // Send this embed msg to the sendDiscordMessage function
    // sendDiscordMessage function returns a promise rather than actually making the request at that moment
    // push this promise to an array
    // send this array to the function that executes 5 reqs and waits 5 seconds
    if (embedObjects.length > 0) {
        return embedObjects;
    }
    return null;

}