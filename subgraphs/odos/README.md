# The Graph Subgraph

## Networks

- Ethereum

## Calculation Methodology v1.0.0

**TVL, revenues, and usage metrics will be calculated by the activity of 3 type of users:**

- Indexers
- Delegators
- Curators

**3 Contracts used:**

- Staking
- Curation
- RewardsManager

### Total Value Locked (TVL) USD

**Indexers:**

- Indexers provide a stake in order to provide indexing and query processing services. The value of the GRT that is staked by indexers counts towards the TVL of the protocol. The inflation rewards and query fees can be optionally withdrawn or restaked. If they are restaked, then the rewards will count towards TVL and supply side revenue. If they are not restaked, it only counts towards supply side revenue.

**Delegators:**

- Delegators may delegate GRT, or stake, to indexers. This delegation counts as a part of the TVL. When delegators earn inflation rewards or query fees that are distributed by the indexer, they are automatically delegated. This means that when delegators earn rewards, it counts as supply side revenue and towards TVL by default.

**Curators:**

- Curators can provide a curation signal on a subgraph. This signal is provided in GRT and the strength of their signal depends on a bonding curve. The value of the GRT that they deposit into the pool counts toward the TVL of the protocol. Curators earn 10% of the query fees. These query fees are deposited directly into the bonding curve pool. When query fees are deposited in this pool, it counts dually for TVL and supply side revenue.

### Volume

- Volume is not being tracked.

### Total Revenue USD

**Inflation:**

- There is a 3% annual inflation rate of the GRT token. The inflation is distributed propertionally based on curation signal and proportional to the amount an indexer has staked.
- The ratio of these rewards that gets distributed between indexers and delegators is determined by the indexer.

**Query Fees:**

- Each time an indexer services a query, it receives query fees as a result. These query fees are then sent to the query rebate pool. 10% of the query fees are deposited in the curation pool to increase the cost of the curation shares. 1% of the query fees gets burned, and the rest of the query fees are divided amongst indexers and delegators according to the reward ratio specifed by the indexer.

**Slashing:**

- When an indexer stake is slashed. 50% of the stake that gets slashed is awarded to the beneficiary who indecated the need to slash the stake. This 50% counts toward the revenue, and the rest gets burned.

### Supply-Side Revenue USD

- All rewards are supply-side rewards.

### Protocol-Side Revenue USD

- All rewards are supply-side rewards.

### Total Unique Users

**Count of Unique Addresses which have interacted with the protocol via any transaction:**

- This includes:
  - Indexer staking and unstaking
  - Delegator delegating and undelegating
  - Curation signalling and unsignalling.
  - Collection of inflation and query fees by the indexer and curator.
  - Updating of the indexer and delegator cut.

### Reward Token Emissions Amount

- Not applicable for this subgraph

### Protocol Controlled Value

- Not Applicable for this subgraph.

## References and Useful Links

- Other existing subgraph: https://fanf2.user.srcf.net/hermes/doc/antiforgery/stats.pdf

- Documentation: https://thegraph.com/docs/en/network/explorer/
