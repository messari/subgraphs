# Structure

This document will help you understand the structure of the Messari subgraphs repository. What should you know at a high level? What does each protocol directory look like? What should I worry about?

## Why is the standard structure important?

All our subgraphs share the same build and deployment scripts. They are used during development, when deploying a subgraph, and during our CI/CD validation pipelines. These scripts expect all subgraphs to follow a given directory structure. So for them to work without adding extra hassle, and to keep code itself organized in a consistent and predictable manner, we require all subgraphs to follow this structure.

Our CI pipelines on PRs automatically validate that this structure is followed, to enforce it and make sure things don't break in case of error.

To do so we are using [folderslint](). It is a simple tool that allows you to define some rules and then validates that they are met. The rules are very simple, it is a set of paths that are whitelisted. These are contained at `/subgraphs/.folderslintrc`.

See the following for the actual directory structure.

## High Level

### Dashboard

The following graphic highlights the important features. To start `./dashboard` is [subgraphs.xyz](https://subgraphs.messari.io/) and that is largely maintained by (@MichaelC1999).

### Deployment

The `./deployment` folder is important to note. The `deployment.json` file stores all of our subgraph deployments and statuses. (@steegecs) made a nice video that outlines the details.

[![Deployment.json Walkthrough](https://img.youtube.com/vi/cgCNkRmM4NM/0.jpg)](https://youtu.be/cgCNkRmM4NM)

> You will find out more in [WALKTHROUGH.md](./WALKTHROUGH.md), but this should be maintained alongside any new subgraphs and/or fixes.

### Subgraphs

The `subgraphs` directory stores all of the actual subgraph code. More on this in the next section.

### Extras

The `docs` contain all of the documentation around this code, progress, and development of this repo. The `monitor` houses the code that we use to find any issues in subgraphs as listed in `deployment.json`. It is a discord bot that alerts us on errors in production and `messari/` subgraphs.

It is important to note that the schemas titled `schema-{protocol type}.graphql` in the head of the repository are our standard schemas. These act as a base for all of our subgraphs. We can add field and entities in individual subgraphs, but the base is a guarantee in terms of schema design.

```
.
├── dashboard
│   ├── public
│   ├── scripts
│   └── src
├── deployment
│   └── deployment.json
├── docs
├── monitor
├── subgraphs
│   └── compound-v3
└── schema-generic.graphql
```

## `./subgraphs` Directory

In `./subgraphs` you will first notice there are many protocol names. Each folder is a subgraph for that protocol. Each folder includes the code for subgraphs on all networks that protocol is deployed to.

### Subgraph Structure

The following is a very typical subgraph directory. And some things are removed to highlight the important parts.

```
.
├── abis
│   └── AToken.json
├── *build*
├── *generated*
├── protocols
│   └── aave-v3
│       ├── README.md
│       ├── config
│       │   ├── deployments
│       │   │   ├── aave-v3-arbitrum
│       │   │   │   └── configurations.json
│       │   │   ├── aave-v3-avalanche
│       │   │   │   └── configurations.json
│       │   └── templates
│       │       └── aave.v3.template.yaml
│       └── src
│           ├── mapping.ts
│           └── constants.ts
├── src
│   └── utils
│       ├── constants.ts
│       ├── numbers.ts
│       └── strings.ts
├── package.json
├── schema.graphql
├── *subgraph.yaml*
├── tsconfig.json
└── *package-lock.json*
```

> Note: `*folder/file*` denotes auto-generated files and folders.

### `./abis` Directory

This directory stores the ABI files. These are defined in `subgraph.yaml`. There shouldn't be any abis stored that are not defined in `subgraph.yaml`.

### `./src` Directories

Any directory labeled `src` will contain subgraph mappings. This is where the bulk of the code lives that a developer needs to write in for the subgraph. This can either be shared (in the case of forks) and live in the head, or it can be protocol specific and live in the protocol directory.

### Auto Generated Files / Folders

The `subgraph.yaml` is an imperative file, but it is defined in `./protocols/aave-v3/config/templates/aave.v3.template.yaml`. The deployment scripts take the `template.yaml` and fill in the blanks using moustache to create `subgraph.yaml`.

The next folder to be created is `./generated`, which is created upon `graph codegen` (this is done automatically in the deployment scripts). This folder contains the typescript classes that allow developers to access smart contract state (contract calls), events, and entities from the schema.

The last folder to be auto generated is `./build`. This contains the compiled WASM files and abis that are uploaded to the graph (hosted service, studio, or decentralized network) using IPFS. This is what the graph node(s) use to index the blockchain as defined in our code.

### `./protocols` Directory

This directory contains the code for each deployment of this subgraph. In this example it seems convoluted, but this structure provides flexibility to define multiple protocols (as seen in the fork directories) and multiple networks. Here we see multiple networks that Aave V3 is deployed to. The `configurations.json` files define the contract addresses, startblocks, and anything else needed to build the `subgraph.yaml` file.

This directory must be setup as follows changing file names and protocol names based on the individual subgraph. Also note that the folder names in `./deployments` must match the protocol names in the `deployment.json` file we went over earlier.

There is nice video that goes over this in more depth:

[![Standard Directory Structure Walkthrough](https://img.youtube.com/vi/i3VAQYFMwEI/0.jpg)](https://youtu.be/i3VAQYFMwEI)

### README

The `README.md` should contain the methodology for the subgraph. Normally defined by our protocol specialists. An end user should be able to go there and understand how we calculate different metrics in the scope of this protocol. This file needs to live under `./protocols/protocol-name/README.md`.

Some additional fields you may find in a `README.md` include links to important protocol resources and notes about special cases in the subgraph.

## Forked Subgraph Repository

The directories labeled `protocol-forks` follow the same directory structure, but there are just more protocols under `./protocols`. To learn more about this I encourage you to explore a fork directory and/or watch the previous video! 👾
