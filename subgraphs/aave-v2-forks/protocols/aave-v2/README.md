# Aave v2 Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Pool Deposit TVL`

### Total Revenue USD

Sum across all Pools:

`(Pool Variable Borrow Amount * Variable Pool Borrow Rate) + (Pool Stable Borrow Amount * Stable Pool Borrow Rate)`

Note: This currently excludes Flash Loans

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Pool Oustanding Borrow Amount * Pool Borrow Rate) * (Pool Reserve Factor)`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Outstanding Borrow Amount * Pool Borrow Rate) * (1 - Pool Reserve Factor)`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

### Reward Token Emissions Amount

To be added

### Protocol Controlled Value

Not applicable to Aave

## Useful links and references

Existing Subgraph: https://thegraph.com/hosted-service/subgraph/aave/protocol-v2

https://docs.aave.com/risk/asset-risk/risk-parameters#reserve-factor

AAVE API: https://aave-api-v2.aave.com/

### How to use AAVE API

The AAVE API can make historical calls so we can cross reference our subgraph data.

This GET call will return V2 historical data from a certain date: https://aave-api-v2.aave.com/#/data/get_data_liquidity_v2

Here is an example https API call for data on Avalanche Markets on 02-20-2022: https://aave-api-v2.aave.com/data/liquidity/v2?poolId=0xb6A86025F0FE1862B372cb0ca18CE3EDe02A318f&date=02-20-2022
