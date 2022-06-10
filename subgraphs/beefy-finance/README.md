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

### Reward Token Emissions Amount

To be added

### Protocol Controlled Value

Sum across all valuts:

`Vault controlled value`

## Useful Links and references

- https://beefy.finance/
- https://app.beefy.com/#/
- https://docs.beefy.com/
- https://dashboard.beefy.finance/
- https://api.beefy.finance/
- https://defillama.com/protocol/beefy-finance

### Testing

## Setup

The release binary comes in two flavours - for МacOS and Linux. To add Matchstick to your subgraph project just open up a terminal, navigate to the root folder of your project and simply run graph test - it downloads the latest Matchstick binary and runs the specified test or all tests in a test folder (or all existing tests if no datasource flag is specified).
Example usage:

```
graph test gravity

```

# More info here

https://thegraph.com/docs/en/developer/matchstick/
