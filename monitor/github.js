import { Octokit } from "@octokit/core"
import 'dotenv/config'
import { postError } from './messageDiscord.js';

export async function postGithubIssue(title, body, postedIssues) {
    if (!!process.env.GH_TOKEN) {
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
