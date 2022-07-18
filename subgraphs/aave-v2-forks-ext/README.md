# Aave V2 Forks

## Quickstart

### Deployment

Once everything is setup properly deploying is very easy.

```bash
# This example will deploy all forks of aave-v2 on all networks to the hosted service under "dmelotik" in deploymentConfigurations.json
npm run deploy --SUBGRAPH=aave-v2-forks-ext --PROTOCOL=aave-v2 --LOCATION=dmelotik

# This will do the same, but only deploying the ethereum subgraph
npm run deploy --SUBGRAPH=aave-v2-forks-ext --PROTOCOL=aave-v2 --NETWORK=ethereum --LOCATION=dmelotik
```

> Setting `deploy-on-merge` to `true` in [deploymentConfigurations.json](../../deployment/deploymentConfigurations.json) will run the above commands on subgraphs that have changed to messari's hosted service.

### Development Commands

During development you probably won't want to fully deploy the subgraph every time. Follow this guide to do each step incrementally.

To setup the subgraph manifest from the template:

```bash
# Use aave-v2 as an example
npm run prepare:yaml --PROTOCOL=aave-v2 --NETWORK=ethereum --TEMPLATE=aave.v2.template.yaml
```

To codegen and build:

```bash
graph codegen
graph build
```

> If you are working on multiple subgraphs you may want to delete `./generated/**` before `codegen` so no old files are left behind.

To deploy follow the steps above. You may put your hosted service endpoint in [deploymentConfigurations.json](../../deployment/deploymentConfigurations.json) just how messari's is set to take advantage of the commands.

## Aave Transaction Flow

When a transaction occurs in the `lendingPool` the following events are emitted in this order.

1. Next a `reserveDataUpdated` event is emitted
   1. This is equivalent to `AccrueInterest` in compound.
   2. New Revenue = ScaledTotalSupply \* (currentLiquidityIndex - lastLiquidityIndex)
   3. This event is used to update all of the rates, prices, and balances in the subgraph.
2. To get current supply balance we take use a contract call to `totalSupply()` in the respective aToken
3. To get the current borrow balance we call `totalSupply()` in both the VariableDebtToken and StableDebtToken
4. Finally we handle the actual transaction event (ie, deposit, borrow, repay, withdraw, liquidate)
   1. This handler is designed to only update the metrics that have to do with those events. ie, usage and daily/hourly event amounts

### Notes

- Avalanche oracles return prices offset by 8 decimals for some reason.

### Problems

- Unable to change `protocol.id` for multiple deployments on mainnet [see code](./protocols/aave-v2/src/constants.ts)

### Resources

- Aave V2 Contract Addresses: https://docs.aave.com/developers/v/2.0/deployed-contracts/deployed-contracts
- Aave V2 Permissioned Contract Addresses: https://aave-arc.gitbook.io/docs/deployed-contracts/arc
- Gesit Contract Addresses: https://docs.geist.finance/useful-info/deployments-addresses
