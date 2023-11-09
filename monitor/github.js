import { Octokit } from "@octokit/core";
import { postAlert } from "./messageDiscord.js";
import axios from "axios";
import "dotenv/config";

export async function postGithubIssue(title, body, postedIssues, isDecen) {
  if (!!process.env.GH_TOKEN) {
    const octokit = new Octokit({
      auth: "Bearer " + process.env.GH_TOKEN,
    });
    if (postedIssues.length === 0) {
      postAlert("NO POSTED ISSUES REACHED GH ISSUE FUNC");
    } else {
      const issArr = postedIssues.map((x) => x.title?.toUpperCase());
      if (
        !issArr.filter(
          (x) =>
            x.includes(title.type.toUpperCase()) &&
            x.includes(title.protocol.toUpperCase()) &&
            (isDecen ? x.includes("DECEN") : !x.includes("DECEN"))
        )?.length > 0
      ) {
        try {
          const chains = `${title.chains.join(", ")}`;
          await octokit.request("POST /repos/messari/subgraphs/issues", {
            title: `${title.protocol} ${chains}: ${title.type}`,
            body,
            assignees: ["bye43"],
            labels: ["bug", "monitor"],
          });
        } catch (err) {
          postAlert(err.message);
        }
      }
    }
  } else {
    postAlert("GH TOKEN ENV NOT ADDED");
  }
}

export async function getGithubIssues() {
  let validIssues = [];
  if (process.env.GH_TOKEN) {
    try {
      const baseURL =
        process.env.GH_BASE_URL +
        "/repos/messari/subgraphs/issues?per_page=100&state=open&labels=monitor&sort=updated";
      const headers = {
        Accept: "*/*",
        Authorization: "Bearer " + process.env.GH_TOKEN,
      };
      const req = await axios.get(baseURL, headers);
      validIssues = req?.data || [];
    } catch (err) {
      postAlert("getGithubIssues() - " + err.message);
    }
  }
  return validIssues;
}
