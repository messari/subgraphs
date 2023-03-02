import axios from 'axios';
import { Octokit } from "@octokit/core"
import 'dotenv/config'

export async function postGithubIssue(title, body, postedIssues) {
    if (process.env.GH_TOKEN) {
        const octokit = new Octokit({
            auth: "Bearer " + process.env.GH_TOKEN
        })
        if (!postedIssues.map(x => x.title.toUpperCase()).includes(title.toUpperCase())) {
            try {
                await octokit.request('POST /repos/messari/subgraphs/issues', {
                    title,
                    body,
                    assignees: [
                        "bye43"
                    ],
                    labels: [
                        'bug',
                        'monitor'
                    ]
                })

            } catch (err) {
                const baseURL = "https://discordapp.com/api/channels/1019063880040861806/messages";
                const headers = {
                    "Authorization": "Bot " + process.env.BOT_TOKEN,
                    "Content-Type": "application/json",
                }
                const postJSON = JSON.stringify({ "content": `**Subgraph Bot Monitor from ${process.env.CHANNEL_ID} on Channel ${process.env.CHANNEL_ID}- Errors detected**\n` + err.message });
                await axios.post(baseURL, postJSON, { "headers": { ...headers } });
            }
        }
    }
}

export async function getGithubIssues() {
    let validIssues = [];
    if (process.env.GH_TOKEN) {
        try {
            const req = await fetch("https://api.github.com/repos/messari/subgraphs/issues?per_page=100&state=open", {
                method: "GET",
                headers: {
                    Accept: "*/*",
                    Authorization: "Bearer " + process.env.GH_TOKEN
                },
            })

            const json = await req.json();
            if (Array.isArray(json)) {
                validIssues = json.filter((x) => {
                    return x.labels.find(x => x.name === "monitor");
                });
            }
        } catch (err) {
            console.log(err)
        }
    }
    return validIssues;
}
