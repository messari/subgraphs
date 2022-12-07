# Burrow Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Pool Deposit TVL`

### Total Revenue USD

Sum across all Pools:

`(Pool Borrow Amount * Pool Borrow Rate)`

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Pool Oustanding Borrow Amount * Pool Borrow Rate) * (Pool Reserve Factor)`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Outstanding Borrows * Pool Borrow Rate) * (1 - Pool Reserve Factor)`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

### Reward Token Emissions Amount

Amount of reward tokens (BRR) distributed each day.

Each farm reward is identified by the asset ID it gives. The reward config includes:

- reward_per_day - the amount of tokens split across farms participants daily based on their number of boosted shares (until there are no more remaining rewards).
- booster_log_base - the log base for the xbooster amounts. It's used to compute boosted shares per account. The number includes decimals of the xBooster token. E.g. 100 \* 1e18 is the log base of 100, if xBooster has 18 decimals.
- remaining_rewards - the amount of the remaining tokens to be distributed.

For example to create a farm for 30 days and distribute 1000 tokens per day, the reward_per_day should be set to 1000 and the remaining rewards will be 30000.

Once the remaining_rewards becomes equal to 0, the farm stops distributing this reward.

## Reference and Useful Links

Protocol: https://app.burrow.cash/

Docs: https://docs.burrow.cash/

Smart contracts: https://github.com/NearDeFi/burrowland

Building Subgraphs on NEAR: https://thegraph.com/docs/en/cookbook/near/
