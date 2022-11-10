# Goldfinch Lending Protocol Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Markets (Pools):

`Total deposit amount USD - total withdrawal amount USD`

Note: Investments made to Tranched Pools from the Senior Pool are deducted from Protocol TVL to avoid double counting.

### Total Deposit USD

Sum across all Markets (Pools):

`Total deposit amount USD - total withdrawal amount USD`

Note: Investments made to Tranched Pools from the Senior Pool are deducted from Protocol Total Deposit to avoid double counting.

### Total Borrow USD

Sum across all Tranched Pools:

`Draw down amount USD`

### Total Revenue USD

Sum across all Markets:

`Protocol-Side revenue + Supply-Side revenue`

### Protocol-Side Revenue USD

Sum across all Markets:

`Reserve Fund Collected`

Note: Goldfinch collect reserve fund from withdraw and interest (from borrowers and extra Senior Pool fund sweeped to compound)

### Supply-Side Revenue USD

Sum across all Markets

`PaymentApplied.InterestAmount`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`'frob' LogNote event emitted by Vat addresses which include deposits/withdrawals/borrows/repays + Cat.Bite events or Dog.Bark events emitted during liquidations`

### Reward Token Emissions

The reward token is GFI. There are two types of reward emissions : backer rewards and staking rewards, each managed by its own contract.

- Staking Rewards (StakingRewards.sol): `event RewardPaid.params.reward`
- Backer Rewards (BackerRewards.sol): sum over all claims by markets `BackerRewardsClaimed.params.amountOfTranchedPoolRewards + BackerRewardsClaimed.params.amountOfSeniorPoolRewards`

### Minted Token Supply (None)

## References and Useful Links

- Protocol: https://goldfinch.finance/
- Analytics: https://api.thegraph.com/subgraphs/name/goldfinch-eng/goldfinch/graphql
- Docs: https://docs.goldfinch.finance/goldfinch/
- Smart contracts: https://github.com/goldfinch-eng/mono/tree/main/packages/protocol/contracts
- Deployed addresses: https://github.com/goldfinch-eng/mono/tree/main/packages/protocol/deployments/mainnet

## Smart Contracts Interactions

![Goldfinch](../../docs/images/protocols/goldfinch.png "Goldfinch")

# The Official Goldfinch Subgraph

Part of the Goldfinch subgraph was built on the official Goldfinch subgraph. The code for the official Goldfinch subgraph is at https://github.com/goldfinch-eng/mono/tree/main/packages/subgraph (document of the official subgraph can be found there) and a deployed version is at https://thegraph.com/hosted-service/subgraph/goldfinch-eng/goldfinch-v2
