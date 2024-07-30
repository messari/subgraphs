# Chainlink Staking Subgraph

## Methodology v1.0.0

Staking is a core initiative of Chainlink Economics 2.0 that brings a new layer of cryptoeconomic security to the Chainlink Network. Staking enables ecosystem participants, such as node operators and community members, to back the performance of oracle services with staked LINK and earn rewards for helping secure the network.

| Parameter                         | Value           |
| --------------------------------- | --------------- |
| Total Pool Size                   | 45,000,000 LINK |
| Community Staker Allotment        | 40,875,000 LINK |
| Node Operator Staker Allotment    | 4,125,000 LINK  |
| Community Staker Minimum          | 1 LINK          |
| Community Staker Maximum          | 15,000 LINK     |
| Node Operator Staker Minimum      | 1,000 LINK      |
| Node Operator Staker Maximum      | 75,000 LINK     |
| Node Operator Staker Slash Amount | 700 LINK        |
| Alerter Reward                    | 7,000 LINK      |
| Cooldown Period (Unbonding)       | 28 days         |
| Claim Window Period               | 7 days          |
| Reward Ramp-Up Period             | 90 days         |
| Base Floor Reward Rate            | 4.5%            |
| Delegation Rate                   | 4%              |
| Effective Base Floor Reward Rate  | 4.32%           |

## Metrics

### Usage and Transactions

- Deposits into Community and Operator Pools(v0.2) and in Staking Pool (v0.1)
- Withdrawals from Community and Operator Pools(v0.2) and in Staking Pool (v0.1)

### TVL

- Total LINK staked in Community and Operator Pools (v0.2) and LINK left in Staking Pool (v0.1)

### Rewards

- The community stakers are rewarded a base floor reward rate of 4.5% per year in LINK for helping secure the Chainlink Network. From those annualized rewards, 4% of Community Staker rewards is automatically directed to Node Operator Stakers as a Delegation Reward. The result is an effective base floor reward rate of 4.32% on an annualized basis for Community Stakers in v0.2
- The node operator stake portion of the v0.2 pool features the same 4.5% base floor reward rate but is supplemented by Delegation Rewards from Community Stakers and made available to Node Operator Stakers proportionally based on the amount each operator stakes.

## Useful Links

- Landing Page: https://staking.chain.link/
- Docs: https://chain.link/economics/staking
- Contracts: https://github.com/DefiLlama/DefiLlama-Adapters/blob/main/projects/chainlink/index.js
