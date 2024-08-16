# Staked Prime ETH Subgraph

## Methodology v1.0.0
Prime Staked ETH (primeETH) is a liquid re-staked token (LRT) that provides liquidity for assets that have been deposited into EigenLayer. By converting staked ETH into primeETH, users can stack ETH staking yield, EigenLayer points, and primeETH XP points all while remaining liquid. 

## Metrics

### Usage and Transactions
The following activities count towards the usage and transactions of the protocol:

- Depositing and withdrawing assets in the LRT Deposit pool.

### TVL (Total Value Locked)
The TVL is the sum of all tokens (in USD) deposited into the LRT Deposit Pool.

**Note:** The TVL does not match other sources because we are missing daily snapshots due to the protocol's lack of on-chain activity. Without consistent on-chain transactions or events, the data does not accurately reflect daily changes, leading to discrepancies.

## Useful Links
- Landing Page: https://www.primestaked.com/
- Docs: https://docs.primestaked.com/
- Contracts: https://docs.primestaked.com/smart-contracts/registry
