# Iron Bank Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum deposits on the protocol, that is, sum across all Markets:

`cToken.outputTokenSupply() * cToken.exchangeRate() * priceOracle.getUnderlyingPrice(cToken)`

`cToken.outputTokenSupply()` returns supply of output Token, multiplying exchangeRate gives the balance of input (underlying) token (inputTokenBalance), which is then converted to USD by multiplying with the underlying token price returned from the price Oracle contract.

### Total Revenue USD

Sum across all Pools:

`(Pool Borrow Amount * Pool Borrow Rate)`

Sum of Interest paid by borrowers, or `AccrueInterest.interestAccumulated * priceOracle.getUnderlyingPrice(cToken)`

The `AccrueInterest` event is emitted when interest (revenue) is accrued in the underlying token. The interest (revenue) is converted to USD by multiplying with the underlying token price (including ETH) returned from the price Oracle contract.

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

`Repays`

`Liquidations`

### Reward Token Emissions Amount

The Iron Bank uses the [StakingRewards Factory](https://optimistic.etherscan.io/address/0x35F70CE60f049A8c21721C53a1dFCcB5bF4a1Ea8) contract to deploy [StakingRewards contracts](https://github.com/ibdotxyz/StakingRewards/blob/master/contracts/StakingRewards.sol) on Optimism that allows depositors to stake their output token for rewards (currently in IB token).

Reward emissions for staking depositors: `RewardPaid.params.reward * price of IB token` normalized to daily amount.

Price of IB token on Optimism is obtained from [Beethoven X rETH-IB Pool](https://optimistic.etherscan.io/address/0x785f08fb77ec934c01736e30546f87b4daccbe50) and [Beethoven X rETH-OP-aUSD Pool](https://optimistic.etherscan.io/address/0xb0de49429fbb80c635432bbad0b3965b28560177).

### Protocol Controlled Value

Not applicable.

## Resources

- Protocol: https://app.ib.xyz/
- Analytics: [Not found]
- Docs: https://docs.ib.xyz/
- Smart contracts: https://github.com/ibdotxyz/compound-protocol
- Deployed addresses: https://docs.ib.xyz/
- Official subgraph: https://thegraph.com/explorer/subgraph?id=4NbM6LH6Ks1tRtrYAvFKAHbnMZ6wtmYhMHJQcUztRdWr&view=Playground
