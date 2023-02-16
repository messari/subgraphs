import { Octokit } from "@octokit/core"
import 'dotenv/config'


export async function postGithubIssue(title, message, postedIssues) {
    const octokit = new Octokit({
        auth: "Bearer " + process.env.GH_TOKEN
    })

    if (!postedIssues.includes(title + " (MONITOR)")) {
        await octokit.request('POST /repos/MichaelC1999/MCarroll-Website/issues', {
            title: title + " (MONITOR)",
            body: message,
        })
    }
}

export async function getGithubIssues() {
    let validIssues = [];
    const req = await fetch("https://api.github.com/repos/MichaelC1999/MCarroll-Website/issues?per_page=100&state=open", {
        method: "GET",
        headers: {
            Accept: "*/*",
            Authorization: "Bearer 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"
        },
    })


    const json = await req.json();

    if (Array.isArray(json)) {
        validIssues = json.filter((x) => {
            const key = x.title.toUpperCase().split(' ').join(" ") || "";
            return key.includes(" (MONITOR)");
        });
    }

    console.log(validIssues, req, process.env.GH_TOKEN)
    return validIssues;
}

getGithubIssues()
