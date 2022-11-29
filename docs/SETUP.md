# Setup

This document describes how to setup your local working environment in order to develop Messari subgraphs.

## Prerequisites

- [Node & npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- Some development experience
- Technical knowledge of blockchains (especially evm)
- Knowledge of [The Graph](https://thegraph.com/docs/) (our beginner [RESOURCES.md](./RESOURCES.md) file will be a good starting place)

## Installation

After installing Nodejs and npm you are close to done with installing all of the development dependencies. There are a few other npm packages to [install globally](https://docs.npmjs.com/downloading-and-installing-packages-globally):

- [graph-cli](https://www.npmjs.com/package/@graphprotocol/graph-cli)
- [graph-ts](https://www.npmjs.com/package/@graphprotocol/graph-ts)
- [messari-subgraph-cli](https://www.npmjs.com/package/messari-subgraph-cli) (more on this in [TOOLING.md](./TOOLING.md))
- [mustache](https://www.npmjs.com/package/mustache)

This is really all that you need, but you can read more about the graph packages [here](https://thegraph.com/docs/en/developing/creating-a-subgraph/#install-the-graph-cli).

After cloning the repo and moving into the head of the repository you should install the project-level npm packages:

```bash
git clone https://github.com/messari/subgraphs.git
cd subgraphs
npm install
```

`npm install` will install `husky` in order to run some pre-commit hooks behind the scenes (mainly to format with `prettier`). If you want to disable this for some reason you can run:

```bash
npm uninstall husky && git config --unset core.hooksPath
```

## What is next?

From here you should be set to build, run, and deploy Messari subgraphs as outlined in [WALKTHROUGH.md](./WALKTHROUGH.md). Next you should familiarize yourself with the project [structure](./STRUCTURE.md) and [tooling](./TOOLING.md). 🚀
