# Swell Liquid Staking Subgraph

## Methodology v1.0.0

Ethereum ‘solo staking’ comes with two very high barriers to entry for most users to participate:

- The minimum economic value required to participate is 32 ETH per validator and requires that ETH to be locked up during staking.
- The process of validating and producing blocks is very technical and requires infrastructure expertise to avoid penalties and slashing for misbehavior.

Liquid staking solves the problem by separating and delegating the responsibilities of ‘staking’ to users who are willing to economically participate (stakers) and to users willing to technically participate (node operators). Stakers deposit ETH to validators run by node operators who in return manage them with the engineering precision required to scale and maximize returns for both parties.
Stakers are now able to stake any nominal amount under 32 ETH and in return for capital get a liquid transferrable token that represents their staked ETH and accrued staking rewards.

## Metrics

### Usage and Transactions

- Stake ETH to instantly receive swETH.
- Unstake swETH to reclaim the initially staked ETH and accumulated rewards, with delays synchronized with the estimated "Exit Queue" wait time.

### TVL

TVL is the total value of ETH staked with the protocol.

### Fees

Protocol currently applies a 10% fee on a user’s staking rewards. This fee is split between protocol and the node operators.

### Revenue

Staking rewards on the total staked ETH make up the total revenue.
Of this 10% is kept by the protocol as fees (protocol side revenue), rest 90% is passed on to the stakers (supply side revenue).

## Useful Links

- Landing Page: https://www.swellnetwork.io/
- Staking App: https://app.swellnetwork.io/restake
- Docs: https://docs.swellnetwork.io/
- Contracts:
  - swETH Contract: https://etherscan.io/address/00xf951e335afb289353dc249e82926178eac7ded78
  - Deposit Manager Contract: https://etherscan.io/address/0xb3d9cf8e163bbc840195a97e81f8a34e295b8f39
  - swEXIT Contract: https://etherscan.io/address/0x48c11b86807627af70a34662d4865cf854251663
