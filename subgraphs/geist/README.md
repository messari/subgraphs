# Geist Finance Subgraph

## Links

Protocol: [geist.finance](https://geist.finance/)

Analytics: [geist.finance/stats](https://geist.finance/stats/)

Docs: [docs.geist.finance](https://docs.geist.finance/)

Smart contracts: [github.com/geist-finance/geist-protocol](https://github.com/geist-finance/geist-protocol)

Deployed addresses: [docs.geist.finance/useful-info/deployments-addresses](https://docs.geist.finance/useful-info/deployments-addresses)


## Status: Work in progress
The subgraph is live on The Graph Hosted Service [here](https://thegraph.com/hosted-service/subgraph/dineshpinto/geist-finance).

## Build Commands
1. Generate and build subgraph

```shell
graph codegen && graph build
```

2. Authenticated deploy to The Graph hosted service

```shell
graph deploy --product hosted-service dineshpinto/geist-finance
```
