# Walkthrough

This document will walk you through the process of building a subgraph from start to finish.

> This will assume you have gone through the previously mentioned docs in the [README.md](../README.md)

## Overview

A brief overview of what you can expect when building a subgraph:

- Familiarize yourself with the project, graphql, typescript, and the graph
- Understand the protocol
- Copy a template subgraph
- Define the manifest for the protocol
- Begin with mapping the granular events
- Deploy and test
- Check for issues (and iterate)
- Get higher level metrics and aggregate
- Populate the snapshots
- Hand off for review

## Familiarization

This step is simpler said than done. It will take a little bit of time to get familiar with everything. This includes:

- The project (understand the previous docs)
- Graphql and typescript (use the Introductory module in [RESOURCES.md](./RESOURCES.md))
- Understand the graph ([this](https://thegraph.com/docs/en/about/) is a good place to start)
- You should also understand the protocol on a technical level
  - A good place to start is their docs and reading their smart contracts

You will learn a lot as you build subgraphs, so don't stress about learning every little thing here.

## Fork

You should fork this repo and work off of that. You can find docs about updating your fork and rebasing in [CONTRIBUTING.md](./CONTRIBUTING.md).

## Create a Template

Now that you have a subgraph you want to make using a Messari standard schema you can start by copying over the template subgraph. This folder is named `_reference_`. Go through this and remove anything that is unnecessary for your case. For example, if you are building a dex subgraph, you don't need the lending library.

Some of the notable things in this folder:

- There is a pricing library you can learn more about [here](../subgraphs/_reference_/src/prices/README.md)
- There are some common mapping functions that you can reuse to reduce the amount of rework needed
- Ensure you are using the right schema for your subgraph type found in the head of the repo
- Folder names use [kebab-case](https://www.theserverside.com/definition/Kebab-case) in all lower case
- File names use [camelCase](https://en.wikipedia.org/wiki/Camel_case) with a preceding lowercase letter

## Create a PR

At this point you have a little work done. You should make a PR and convert it to a Draft so we can track the status and suggest changes as you build! To do this follow the notes in [CONTRIBUTING.md](./CONTRIBUTING.md).

## Define the Manifest

This means to start figuring out what contracts, events, and abis you will need and updating the `subgraph.yaml` template accordingly. In some protocols there will (hopefully) be a factory contract. This contract will create and deploy other contracts. These deployed contracts are going to usually be templates in the `subgraph.yaml` file.

You want to only include the ABIs used in each `dataSource`. Excess will start to bloat the file and make it difficult to read.

Then you want to find the important events in the contracts and start by marking those events to create handlers in the `subgraph.yaml`.

## deployment.json

You should add your subgraph status to the `deployment.json` file following the same structure as all of the other protocols. This will allow you to properly use `messari-subgraph-cli` to deploy your subgraph.

## Begin Mappings

Now that you have some of the events defined you can start to write the handlers for these events in `src/mapping.ts`.

If this is your first subgraph I would recommend starting with a log in the handler to list some data. This can be simple like displaying block data:

```typescript
export function handleDeposit(event: Deposit): void {
  log.info("transaction hash: {} Block number: {}", [
    event.transaction.hash.toHexString(),
    event.block.number.toString(),
  ]);
}
```

Play around with this, compare hashes on etherscan and help yourself understand some of the behavior.

## Using Logs in Subgraphs

There is a standard logging format that we follow in subgraphs to ensure subgraph data consumers have a framework to understand what is happening in a subgraph. There are five different types of log severity levels that we use in subgraphs:

- `log.debug`: This is only used for debugging purposes. It should not be found in any subgraph code in our `master` branch.
- `log.info`: This is used for general information about the subgraph. It can be used to log handler execution, data processing, etc. This should never be used in the case of error handling.
- `log.warning`: This is used for issues/warnings that may or may not be an issue. The issue will not create any major issues in a subgraph and should not affect downstream data consumers. This could be a divide by 0, but it may be the actual value so it is not an error that needs to be fixed.
- `log.error`: This is used for errors that need to be addressed, but are not fatal to the subgraph's function. This should be cause for a fix, but the subgraph can continue to execute. This may cause a minor data issue that should be addressed soon. This would be synonymous to a [#minor](https://github.com/messari/subgraphs/blob/master/docs/CONTRIBUTING.md#minor) fix in our versioning system.
- `log.critical`: This will be used for fatal errors. When this log is reached a subgraph will stop executing. This error will be cause for a major data issue that would create a major issue downstream if the data is consumed. This needs to be fixed ASAP and is synonymous to a [#major](https://github.com/messari/subgraphs/blob/master/docs/CONTRIBUTING.md#major) fix in our versioning system.

> As a general rule, if a function cannot continue to execute it should either be an `error` or `critical`. The severity will be determined by the impact of the error.

Each log severity has a different purpose and should be used accordingly.

> The goal is to remove ambiguity of log meaning for devs, help downstream consumers understand what is happening on a subgraph-level, and use downtime judiciously.

### Logging Format

Logs should be descriptive and formatted as follows to remain easy to parse through and understand. There are some pieces of information your logs should have:

- The function name that the log is found in
- A description of what the log is
- Any relevant information that is needed to understand the log
- A prefix to differentiate messari subgraph logs
- If possible, the transaction hash should also be included

Examples:

Setup see [logger.ts](../subgraphs/_reference_/src/common/utils/logger.ts):

```typescript
import { logger } from "./logger.ts";

const logger = new Logger(event, "handlePriceOracleUpdated");
```

```typescript
logger.info("New price oracle: {} updated from: {}", [
  event.params.newOracle.toHexString(),
  event.params.oldOracle.toHexString(),
]);
```

```typescript
logger.appendFuncName("getAavePriceUSD");
logger.warning(
  "Divide by 0 in liquidity pool used for pricing. Asset {} balance is 0 in this pool.",
  [tokenOne.toHexString()]
);
```

```typescript
logger.appendFuncName("handleDeposit");
logger.error(
  "Market: {} not found. Market entity expected to be created. Transaction hash {}",
  [event.address.toHexString(), event.transaction.hash.toHexString()]
);
```

```typescript
logger.appendFuncName("updateMarketData");
// This is impossible, and something is seriously wrong if this occurs
logger.critical(
  "InputTokenBalance is negative in market {}. Transaction hash {}",
  [market.id.toHexString(), event.transaction.hash.toHexString()]
);
```

## Deploy and Test

Now you want to deploy your subgraph. The easiest way to deploy is to the hosted service (this is being sunsetted so the alternative is the subgraph studio). You can deploy using the `messari-subgraph-cli` tool. You can learn more about this tool [here](./TOOLING.md).

Quickly you can run `messari b -d` and follow the prompts to deploy.

## Check for Issues and Iterate

This is going to be part of the process. You will need to do things over as bugs arise and logic is incorrect. Luckily we have dealt with a lot of issues so far. The following is a good start:

- If you need help debugging, finding fixes to errors, or how to fix errors see [ERRORS.md](./ERRORS.md)
- To find issues and check subgraphs as you re-deploy use [okgraph](https://okgraph.xyz/)
- [Miniscan](https://miniscan.xyz/) is particularly helpful for historical contract calls to see what is being returned.
- Look at the [TOOLING.md](./TOOLING.md) for more tools to help you in this!
- If you are still stuck don't hesitate to make a post in the discord! 👽

## Higher Level Metrics

Now you will need to start gathering some less granular metrics. This may include revenue, interest rates, other pool metrics. For these it is more common to use contract calls. For these calls it is standard practice to make a "try call" like this:

```typescript
let contract = Contract.bind(event.address);
let result = contract.try_getSomeData();
if (!result.reverted) {
  // do something with result.value
}
```

> Note: contract calls slow down indexing; however, if it is not available in an event a contract call is the most accurate way.

## Snapshots

Now that you have filled in a lot of the granular and high level metrics it is time to aggregate data and populate snapshots. The logic here is the same from subgraph to subgraph within the same schema so we helped you here. We are building standard libraries for this in the `_reference_` subgraph.

You should look at those and leverage them to create, populate, and store data in snapshots. It is very convenient to copy/paste battle tested logic to save development time!

## Github Actions

When you move your PR to "Ready for Review" it will trigger Github Actions to run. This will test a few things:

1. The directory structure is correct
2. The subgraph follows all of the typescript development standards
3. The subgraph codegen and builds without any errors

To check the lint locally you can run `npx eslint ./` to see errors and `npx eslint ./ --fix` to fix them. This needs to point to the head of your subgraph's directory.

The 3rd check is essentially just running `messari b` on the subgraph. This is something you will be doing consistently as you develop the subgraph.

## Are We Done??

At this point you may be close to finishing! Congratulations 🎉 you have built a Messari standard subgraph!

It is not quite done. Review your PR and make sure all of the [contributing guidelines](./CONTRIBUTING.md) are being followed. Make some checks to make sure your data is looking good in [subgraphs.xyz](https://subgraphs.messari.io/). Then assign a reviewer and notify them. And validate against some existing data sources:

- Project's official analytics dashboard
- [DeFi Llama](https://defillama.com/) (for TVL)
- [Dune Analytics](https://dune.xyz/)
- [TokenTerminal](https://www.tokenterminal.com/terminal)

I hate to break it to you, but nothing is ever perfect the first time. There will be more to iterate on, but this is an opportunity to learn and improve from an experienced subgraph developer.

Next the subgraph will be QA'd by a protocol specialist, and if that passes it is `prod` ready. This means we will integrate it into Messari's product that is powered by subgraphs. It is called Protocol Metrics and you can play with it [here](https://messari.io/protocol-explorer/all-protocols) (if you have any feedback don't hesitate to reach out)!

## Production Subgraphs

A production subgraph will have a `status` of `prod` in [`deployment.json`](../deployment/deployment.json). At this point we also want to add the methodology (protocol `README.md`) to the "Methodologies Gitbook".

### Adding Methodologies To GitBook

> Note: Only methodologies for protocols that are supported on protocol metrics should be added to the GitBook.

1. Navigate to [`SUMMARY.MD`](SUMMARY.md)
2. Find the protocol type section (Lending, DEX, etc.) that the protocol belongs too
3. Add the protocol in alphabetical order (if the protocol is a fork, make sure to add it under the corresponding fork header and in alphabetical order in relation to the other forks)
4. To direct the existing methodology to gitbooks, enter the protocol name and repository path in the format: `[protocol name](../subgraphs/protocol/blah/READ.ME)`
5. Save changes and make PR
6. Once PR is merged make sure that methodology is reflected on the [Messari GitBook](https://docs.messari.io/messari/getting-started/about-messari)
