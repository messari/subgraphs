# EigenLayer Protocol Subgraph Metrics Methodology v1.0.0

eigenlayer subgraph based on a non-standard schema - based on generic schema v2.1.1.

## Business Summary

![EigenLayer mechanism](https://2039955362-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FPy2Kmkwju3mPSo9jrKKt%2Fuploads%2FjFazbQVLirHn0B3v1kkl%2Fservice_deployment.gif?alt=media&token=0fd32dd0-74b7-4ec0-88cc-e7600d2c7237)

- EigenLayer is a protocol built on Ethereum that introduces `restaking`, a new primitive in cryptoeconomic security. Restaking enables the reuse of staked ETH on the consensus layer.
  - `Stakers`: Users that stake ETH natively or with a liquid staking token (LST) can opt-in to EigenLayer smart contracts to restake their ETH or LST and providing pooled security to additional applications on the network to earn additional rewards.
  - `Operators`: Stakers may be interested in participating in EigenLayer, but may not want to run software containers of services themselves. EigenLayer provides an avenue for these stakers to delegate EigenLayer operations to operators, who offer to run actively validated services software modules on their behalf.
  - `Actively Validated Services (AVS)`: Decentralized service for Ethereum must bootstrap a new trust network to secure their system, fragmenting security. EigenLayer enables these services to tap into the pooled security of Ethereum's stakers.
- The initial launch is limited to restaking and withdrawing of staked assets, and does not feature opting in to AVSs or delegation of restaked assets to operators.
  - Native Restaking,
    - An `EigenPod` contract that is deployed on a per-user basis facilitates native restaking.
    - Ethereum stakers can assign the withdrawal credentials of multiple validators to the addresses of their EigenPods.
  - Liquid Restaking:
    - A `Strategy` contract that is deployed on a per-LST-provider basis facilitates liquid restaking.
    - At this time, the protocol supports liquid staking of Lido stETH (stETH), Rocket Pool ETH (rETH), and Coinbase Wrapped Staked ETH (cbETH).
- The initial launch also comes with certain guardrails:
  - Restaking limits have been updated frequently, the lastest one: https://www.blog.eigenlayer.xyz/eigenlayer-announces-new-cap-increase-for-liquid-staking-tokens-lsts/.
  - For LSTs and EigenPods, queued withdrawals have a 7-day hold before it is available to withdraw.
- For restaking their staked ETH, stakers accrue `restaked points`. These points are a measure of their staking participation equal to the time-integrated amount staked. Currently, no other fees/incentives by/to the protocol, operators, or AVSs are received/distributed.

## Financial and Usage Metrics

Total Value Locked:

- TVL = ∑ restaked ETH in EigenPods and lstETH in Strategies

Volume:

- Deposit Volume = ∑ (value of staked eth deposited)
- Withdrawal Volume = ∑ (value of restaked eth withdrawn)
- Total Volume = Deposit Volume + Withdrawal Volume
- Net Volume = Deposit Volume - Withdrawal Volume

Activity:

- `Deposit` and `Withdrawal` into restaking pools make up user activity.

## Links:

- Protocol: https://app.eigenlayer.xyz/
- Contracts: https://github.com/Layr-Labs/eigenlayer-contracts/blob/master/script/output/M1_deployment_mainnet_2023_6_9.json
- Stats Dashboards:
  - https://dune.com/21co/eigen-layer
  - https://dune.com/cryptoded/eigenlayer
