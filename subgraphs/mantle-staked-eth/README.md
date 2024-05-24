# Mantle Staked ETH Subgraph

## Methodology v1.0.0

Mantle Liquid Staking Protocol (LSP) is a permissionless, non-custodial ETH liquid staking protocol deployed on Ethereum L1 and governed by Mantle. Mantle Staked Ether (mETH) serves as the value-accumulating receipt token.

## Metrics

### Usage and Transactions

- Stake ETH to instantly receive mETH.
- Unstake mETH to reclaim the initially staked ETH and accumulated rewards, with delays synchronized with the estimated "Exit Queue" wait time, and the Unstake Lifecycle.

### TVL

TVL is the total value of ETH staked with the protocol.

### Fees

Protocol applies a 10% fee on a user’s staking rewards. This fee is split between protocol and the node operators.

### Revenue

Staking rewards on the total staked ETH make up the total revenue.
Of this 10% is kept by the protocol as fees (protocol side revenue), rest 90% is passed on to the stakers (supply side revenue).

_Note_: ConsensusLayer and ExecutionLayer rewards are collected every ~8 days, hence there are peaks and troughs in revenue charts. [docs](https://docs.mantle.xyz/meth/concepts/accounting/calculating-fees).

## Useful Links

- Landing Page: https://mantle.xyz/meth
- Staking App: https://meth.mantle.xyz/stake
- Docs: https://docs.mantle.xyz/meth
- Contracts:
  - Staking Contract: https://etherscan.io/address/0xe3cBd06D7dadB3F4e6557bAb7EdD924CD1489E8f
  - Returns Aggregator Contract: https://etherscan.io/address/0x1766be66fBb0a1883d41B4cfB0a533c5249D3b82#code
  - mETH token address: https://etherscan.io/address/0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa
