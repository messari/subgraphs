# Compound v2 Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Pool Deposit TVL`

### Total Revenue USD

Sum across all Pools:

`(Pool Borrow Amount * Pool Borrow Rate)`

Note: This currently excludes Liquidations

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Pool Oustanding Borrow Amount * Pool Borrow Rate) * (Pool Reserve Factor)`

Note: This currently excludes Liquidations

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Outstanding Borrows * Pool Borrow Rate) * (1 - Pool Reserve Factor)`

Note: This currently excludes Liquidations

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

### Reward Token Emissions Amount

Amount of reward tokens (COMP) distributed each day.

Following calculation gives the COMP distributed (in COMP) to suppliers OR borrowers

`COMP per block * 4 * 60 * 24`

### Protocol Controlled Value

Not applicable to Compound v2

### Modified CToken ABI

CTokens have 2 different ABIs. They switch at block `8983575`, and the only difference is the `AccrueInterest` event params.

To handle this the `CTokenModifed` ABI just adds a new `AccrueInterest` event signature.

## Reference and Useful Links

Protocol: https://compound.finance/

Docs: https://compound.finance/docs

Smart contracts: https://github.com/compound-finance/compound-protocol

Deployed addresses: https://compound.finance/docs#networks

Existing subgraphs: https://github.com/graphprotocol/compound-v2-subgraph

Existing Subgraph in Studio: https://thegraph.com/hosted-service/subgraph/graphprotocol/compound-v2

Explanation of lending metrics: https://docs.aave.com/risk/asset-risk/risk-parameters

Dune Dashboard for Testing: https://dune.xyz/messari/Messari:-Compound-Macro-Financial-Statements
