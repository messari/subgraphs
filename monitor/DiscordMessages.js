import axios from 'axios';
import moment from "moment";

const sleep = m => new Promise(r => setTimeout(r, m));

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

    const baseURL = "https://discordapp.com/api/channels/" + process.env.CHANNEL_ID + "/messages";
    const headers = {
        "Authorization": "Bot " + process.env.BOT_TOKEN,
        "Content-Type": "application/json",
    }

    const postJSON = JSON.stringify({ "content": message })

    try {
        const data = await axios.post(baseURL, postJSON, { "headers": { ...headers } });
        return null;
    } catch (err) {
        console.log('ERROR', err, message)
        if (err.response.status === 429) {
            return await axios.post(baseURL, postJSON, { "headers": { ...headers } });
        } else {
            return null;
        }
    }
}
