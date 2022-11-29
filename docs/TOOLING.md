# Tooling

We have a suite of tools that aide subgraph development.

## Messari Subgraph CLI

This one is major, and required for this repo. We talked about the installation in [SETUP.md](./SETUP.md). This CLI is a wrapper that executes the deployment scripts. It can be used by anyone who deploys Messari subgraphs (and requires the directories to be setup how we defined in [STRUCTURE.md](./STRUCTURE.md)).

There is a video describing the use and explains in more details:

[![How to use Messari Subgraph CLI and Explanation](https://img.youtube.com/vi/WYWa-3Vh5Jc/0.jpg)](https://youtu.be/WYWa-3Vh5Jc)

## Subgraphs.xyz

This [website](https://subgraphs.messari.io/) is our one stop shop for visualizations. It contains the development/indexing status of all of our subgraphs. Then click into any subgraph and visualize all of the data. This is especially useful for QAing subgraphs and ensuring you are getting the data you expect without any errors.

You can also plug in a subgraph you have deployed to your hosted service and visualize it. Put the "Queries (HTTP)" endpoint in the search bar like this:

![custom visualization](./images/tooling/custom-visualization.png)

The subgraph page will also run a suite of tests outlined [here](../dashboard/README.md) like this:

![Subgraph tests](./images/tooling/checks.png)

## okgraph.xyz

This community developed tool allows you to plugin the subgraph id and gives you stats and links on the indexing.

[![okgraph](./images/tooling/okgraph.png)](https://okgraph.xyz/?q=messari%2Fcompound-v2-ethereum)

The most used things here are the "Logs", "API", and the "Messari Visualizer". All of these links are imperative for debugging and verifying your subgraphs. If your subgraph fails to index the error will be displayed obviously with the (hopefully) descriptive error message. More on errors in [ERRORS.md](./ERRORS.md).

## Logging Dashboard

This dashboard allows easier viewing of subgraph logs. Without it logs are cleared after ~1 hour. With this tool you can save logs, search through them, and filter.

Here is a [video](https://drive.google.com/file/d/1to7ZRsEcsnsS0DO23oC3W47RUVlsoC2o/view) describing how to use the dashboard.

> If you need any credentials please ask us!

## Miniscan

[Miniscan](https://miniscan.xyz/) is essentially an etherscan wrapper, but it allows for more chains and the ability to make historic contract calls (retrieving state at a specific block number). This tool is especially useful when you are trying to learn about a contract. You would plug in the address and you can view the source code (assuming it is verified) and make contract calls to understand behavior.
