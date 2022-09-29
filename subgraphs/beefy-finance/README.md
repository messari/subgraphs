# Beefy Finance - Yield Protocol Subgraph

![Beefy](../../docs/images/protocols/beefy-finance.png)

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Vaults:

`vault.totalValueLockedUSD`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

### Deposits

Since deposit event has only the `tvl` parameter, deposited amount is calculated by subtracting the last tvl registered by the subgraph to the current input token balance

`Deposit.amount = event.params.tvl - vault.inputTokenBalance`

### Whitdraws

Since withdraw event has only the `tvl` parameter, whitdrawn amount is calculated by subtracting the current input token balance to the last tvl registered by the subgraph

`Withdraw.amount = vault.inputTokenBalance - event.params.tvl`

### Harvests and Supply-Side Revenue

Harvest events for the various vaults can be divided into two categories: events that return the amount harvested and events that don't. In the case amount harvested is not returned, we use the difference between current tvl and last stored tvl instead.

`amountHarvested = contract.balance() - vault.inputTokenBalance`

Supply-side revenue is then obtained by summing all the amount harvested (since fees to the protocol are paid separately)

`protocol.cumulativeSupplySideRevenueUSD += amountHarvested * inputToken.lastPriceUSD`

### Charged Fees and Protocol-Side Revenue

Protocol fees are applied by `chargeFees()` function and paid in wrapped native token.

`protocol.cumulativeSupplyProtocolRevenueUSD += (event.params.beefyFees + event.params.strategistFees + event.params.callFees) * nativeToken.lastPriceUSD`

### Total Revenue USD

`protocol.cumulativeTotalRevenueUSD = protocol.cumulativeSupplySideRevenueUSD + protocol.cumulativeSupplyProtocolRevenueUSD`

## Useful Links and references

- https://beefy.finance/
- https://app.beefy.com/#/
- https://docs.beefy.com/
- https://dashboard.beefy.finance/
- https://api.beefy.finance/
- https://defillama.com/protocol/beefy-finance

## Undeerstanding the Beefy Finance nuance

Beefy Finance does not have a registry or factory contract. Therefore we cannot use templates in our manifest (subgraph) to dynamically include new vaults/strategies to watch for events.

The workaround to this is adding every vault/strategy pair to each chains manifest file. This means each chain will have a different template file.

> If they add a registry (or factory) contract in the future we can simply add a template onto our subgraph and then we are back to normalcy. However, we still need to have each vault/strategy manually added that predates the registry/factory contract.

### Template File Source

In order to generate the template manifest files we will use the script under `./setup` and the source of the vault/strategy contract data is sourced from Beefy Finance directly. You can find that data under `./setup/data`.

> _Tip_: You can format the data into json using https://jsonformatter.curiousconcept.com/#

Source of respective network deployments: https://github.com/beefyfinance/beefy-app/tree/master/src/features/configure/vault

### Generating Templates

From that file there are a few transformations done to generate the template files.

To run:

```bash
cd beefy-finance
npm install
node ./setup/buildManifest.js [NETWORK]
```

1. We first add in a filler contract in order to have a standard `./generated` folder to import from.
2. The file sourced from beefy api only has the vault address, so we need to use web3 to get the strategy address and `startBlock`.
3. That is all we need to build the manifest file. Action 2 occurs on each vault in every chain.

The output is a template file for each chain under `./protocols/beefy-finance/config/templates/beefy.[CHAIN].template.yaml`

### Deployment

From here you can build, run, and deploy the subgraph as normal.

### Adding New Vaults

Simply go to the `./setup/data` folder and add the new vault address to the respective chain file. Then run the `buildManifest.js` script again and you will have a new template file.

> Note: The fields you need in `./setup/data` are `createdAt`, `id`, and `earnContractAddress` . The rest of the fields are not needed. But that is what comes from the data source at beefy.

### Adding Templates to the Manifest

This is simple, but manual. Generally templates are small, so you can just manually add it to the end of the manifest file.

## Known Issues

- Beefy Finance `harmony` has no vaults yet
- On Celo, sushiswap oracle fails to fetch prices of LP tokens
- Since the workaround to calculate deposit and withdraws amounts is not perfect (if more calls to the same vault are done in the same block there could be interferences between events) some negative amounts could occasionally come up
- Some vaults do not emit all the needed events for a complete tracking of all the metrics, so some old data may be missing
- The main issue with Beefy Finance is that there is no registry or factory contract to emit events and store the addresses of the vaults / strategies. This requires a lot of overhead on our part to support and is described in greater detail under ##Deployment
