# Harvest Finance Subgraph

Yield Farming Protocol

You can query this subgraph by making a graphql request to:
https://api.studio.thegraph.com/query/8290/harvest-finance/v0.0.50

### Install

```
yarn install
```

### Test

```
yarn test
```

### Deploy

```
messari b harvest-finance-ethereum
yarn deploy
```


## Problems & Workarounds

* Deprecated Vaults: In some cases harvest finance needs to change the underlying of a Vault and for that purpose they create and assign an adhoc strategy to move the funds to another vault. This process is manual and those strategies are not verified on etherscan. We had to hardcode the strategies addresses and use them to mark vaults as migrated and not to have them into account when performing calculations.

## Links

Docs - https://harvest-finance.gitbook.io/harvest-finance/
