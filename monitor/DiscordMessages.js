import axios from 'axios';
import moment from "moment";


export async function getDiscordMessages() {
    const baseURL = "https://discordapp.com/api/channels/" + process.env.CHANNEL_ID + "/messages?limit=100";
    const headers = {
        "Authorization": "Bot " + process.env.BOT_TOKEN,
        "Content-Type": "application/json",
    }

    const data = await axios.get(baseURL, { "headers": { ...headers } });
    const weekAgo = new Date(Date.now() - ((86400000 * 7)));
    const previousWeekMessages = data.data.filter(obj => {
        return moment(new Date(obj.timestamp)).isSameOrAfter(weekAgo);
    });

    return previousWeekMessages;
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
    } catch (err) {
        console.log('ERROR', err, message)
    }
}
