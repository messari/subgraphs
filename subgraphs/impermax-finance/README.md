# Impermax Finanace Subgraph

## Methodology v1.0.0

Impermax is a cross-chain, permissionless, decentralized lending protocol where users can participate as lenders or borrowers in isolated lending pools.

Each lending pool represents a pair of 2 tokens of a DEX. Lenders can supply tokens to any lending pool to earn passive yield without impermanent loss. Borrowers can deposit LP tokens in a lending pool to borrow tokens of the token pair. This enables borrowers to leverage their LP tokens and get even more LP tokens, allowing for leveraged yield farming and enhanced LP rewards.

## Metrics

### Usage and Transactions

Following activities count towards usage and transactions of the protocol,

- Depositing and withdrawing underlying tokens
- Depositing and withdrawing LP tokens
- Borrowing

### TVL

TVL of a market is the value of deposited tokens and the value of deposited LP tokens.
Sum of TVLs of all markets equals TVL of protocol.

### Fees and Revenue

Protocol charges a borrowing fee, which varies market-to-market. A percentage of this fee is given to the protocol treasury, rest is passed to liquidity providers.

## Useful Links

- Landing Page: https://www.impermax.finance/
- Lending App: https://app.impermax.finance/
- Docs: https://docs.impermax.finance/
- Contracts: https://github.com/DefiLlama/DefiLlama-Adapters/blob/main/projects/impermax/index.js
