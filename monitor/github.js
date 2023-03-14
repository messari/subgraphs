import { Octokit } from "@octokit/core"
import 'dotenv/config'
import { postError } from './messageDiscord.js';

export async function postGithubIssue(title, body, postedIssues, isDecen) {
    if (!!process.env.GH_TOKEN) {
        const octokit = new Octokit({
            auth: "Bearer " + process.env.GH_TOKEN
        })
        if (!postedIssues.map(x => x.title.toUpperCase()).find(x => x.includes(title.type.toUpperCase()) && x.includes(title.protocol.toUpperCase()) && (isDecen ? x.includes('DECEN') : !x.includes('DECEN')))) {
            try {
                const chains = `[${title.chains.join(", ")}]`;
                await octokit.request('POST /repos/messari/subgraphs/issues', {
                    title: `${title.protocol} ${chains}: ${title.type}`,
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
                postError(err.message)
            }
        }
    } else {
        postError('GH TOKEN ENV NOT ADDED')
    }
}

export async function getGithubIssues() {
    let validIssues = [];
    if (process.env.GH_TOKEN) {
        try {
            const req = await fetch("https://api.github.com/repos/messari/subgraphs/issues?per_page=100&state=open&labels=monitor&sort=updated", {
                method: "GET",
                headers: {
                    Accept: "*/*",
                    Authorization: "Bearer " + process.env.GH_TOKEN
                },
            })

            validIssues = await req.json();
        } catch (err) {
            console.log(err)
        }
    }
    return validIssues;
}
