import { Octokit } from "@octokit/core"
import 'dotenv/config'

export async function postGithubIssue(title, body, postedIssues) {
    const octokit = new Octokit({
        auth: "Bearer " + process.env.GH_TOKEN
    })
    if (!postedIssues.map(x => x.title.toUpperCase()).includes(title.toUpperCase())) {
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
    }
}

export async function getGithubIssues() {
    let validIssues = [];
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
    return validIssues;
}
