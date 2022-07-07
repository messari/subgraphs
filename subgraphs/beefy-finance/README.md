# Beefy Finance - Yield Protocol Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Vaults:

`Vault total value locked`

### Total Revenue USD

Sum across all Vaults:

`Amount harvested * price of token harvested`

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Vaults:

`Total revenue * performanceFee / 100`

PerformanceFee is set as maxFee of the vault (which is usually 10%) minus strategist and harvester fee (which are set by the deployer)

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Vaults

`Total revenue * (1 - performanceFee/100 - strategistFee/100 - harvesterFee/100)`

PerformanceFee is set as maxFee of the vault (which is usually 10%) minus strategist and harvester fee (which are set by the deployer)

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

### Deposits

Since deposit event has only the `tvl` parameter, deposited amount is calculated by subtracting the last tvl registered by the subgraph to the current input token balance

## Useful Links and references

- https://beefy.finance/
- https://app.beefy.com/#/
- https://docs.beefy.com/
- https://dashboard.beefy.finance/
- https://api.beefy.finance/
- https://defillama.com/protocol/beefy-finance

## Deploying

Before deploying, run

`yarn write-yaml ${network}`

to build the yaml file for the correct chain; than you can deploy using

`yarn deploy ${githubuser/subgraphname}`
