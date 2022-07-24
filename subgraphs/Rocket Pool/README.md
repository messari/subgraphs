# Introduction of Rocket Pool

## Overview of Rocket Pool
Rocket Pool is a decentralised ETH2 staking service. The protocol connects two groups of users: node operators and liquid stakers of ETH2. 

## Useful Links
- Protocol: https://rocketpool.net/
- Docs: https://docs.rocketpool.net/
- DAO: https://dao.rocketpool.net/
- Discord: https://discord.com/invite/rocketpool
- Smart contracts: https://docs.rocketpool.net/overview/contracts-integrations/

## Mechanism 

*Node Operator*

Firstly, Rocket Pool has a toolkit of setting up a ETH2 staking node. (Reference: https://docs.rocketpool.net/guides/node/responsibilities.html) 

Rocket Pool nodes only need to deposit 16 ETH per validator. This will be coupled with 16 ETH from the staking pool (which "normal" stakers deposited in exchange for rETH) to create a new ETH2 validator. This new validator is called a minipool. Each minipool only has 32 ETH but a node operator can have many minipools in one node.

For each minipool, the node operator earns half of the minipool's total ETH rewards from ETH2 staking, plus an extra commission (varies from 5% to 20%) on the other half 16 ETH's staking rewards. The commission rate is determined based on the supply-demand situation at the time the minipool is created.

The ETH matched by Rocket Pool has a senior ranking than the node operator's ETH contribution. In addition, a node operator also needs to stake at least 1.6 ETH (10% of his ETH contribution to the minipool) worth of RPL token (the Rocket Pool governance token), for each minipool he has. This serves as a collateral in the event of slashing. For example:
- For example, if a node leaves the network with 28 ETH, the operator retains 12 ETH, the network retains 16 ETH - all loss is on the operator. 
- If a node leaves with 15 ETH, the network retains 16 ETH and the operator makes up the missing 1 ETH through the loss of RPL. 
- If the node leaves with 10 ETH, and there is only 1.6 ETH-worth of RPL from the original bond, the network retains 11.6 ETH, and the loss of 4.4 ETH (16 - 10 + 1.6) is spread across the network.

The node operator earns an additional RPL incentives proportional to its RPL staked. RPL staking for each minipool is capped at 150% of the ETH value contributed by the node operator per minipool, i.e. 24 ETH worth of RPL. Currently, rewards can be claimed every 28 days.

For details on depositing into a minipool, please refer to this link: https://docs.rocketpool.net/guides/node/create-validator.html#depositing-eth-and-creating-a-minipool, this delineates:
- The two processes of depositing, i.e. deposit 32 ETH to start ETH2 staking immediately and get refunded by Rocket Pool on the 16 ETH; or deposit 16 ETH and wait for Rocket Pool to match another 16  ETH to start staking
- How the commission rate for each minipool is determined.

*Staker of ETH*

ETH stakers are normal defi users who deposit ETH, as little as 0.01 ETH, into Rocket Pool for the protocol to match in minipool. Liquid stakers collectively receive ETH2 staking rewards via node operators' minipools, and pay them commissions.

Stakers get rETH as a LP token, representing a user's share of Rocket Pool's total staked ETH (excluding those 16 ETH contributed by the node operators into minipools directly). rETH is not a re-base token, so its price over ETH increases as ETH2 staking rewards accrue:

- rETH:ETH ratio =  (total ETH staked + Beacon Chain rewards) / (total rETH supply)

rETH can be staked and redeemed any time, subject to the liquidity in the Rocket Pool staking pool.

Buy and sell of rETH are also available in other third-party defi protocols, on Ethereum and Arbitrum.

*Oracle Node Operator*

Rocket Pool relies on some core nodes to perform some additional task for the protocol, such as monitoring minipool balances, in exchange of 15% RPL inflation annually. Economically, they are not different from a normal node operator. 
- https://medium.com/rocket-pool/rocket-pool-staking-protocol-part-2-e0d346911fe1

## Governance Token and Node Operator Collateral, RPL

RPL tokens are mainly for node operators to user as collaterals for slashed nodes. RPLs will also be auctioned, in the event of a shortfall of ETH to the stakers (see details under Node Operator above). 

RPL tokens are governance tokens for voting on protocol administrative matters like inflation and rewards.


## Usage Metrics

Rocket Pool has two classes of stakeholders, the node operators and the EHT stakers. Other than Oracle node operators who have to be selected and voted, the addition of any node operator is pretty much a permissionless process. From this perspective, only the Oracle node operators present and manage the protocol; but their service as an Oracle node (other than being a normal node managing minipools) do not have a bearing in the usage or financial metrics.

However, by ETH2 staking convention, all node operators are usually the protocol-side, and ETH stakers are supply-side. This classification can make it easier for comparing Rocket Pool with other similar staking protocols. 

In usage and financial metrics, we separate these two groups of users for the afore-mentioned reasons. 

*Stakers of ETH*
- stake ETH for rETH
- unstake rETH for ETH

*Node Operators*
- Deposit ETH for minipool
- Stake RPL
- Unstake RPL
- Claim RPL rewards

*Others*
- Buy RPLs from auctions (It seems not happened so far on Mainnet but there're test examples on Goerli)

## Financial Metrics

In line with the discussion under *Usage Metrics*, the financial metrics are further classified by two classes of users.

### TVL 

*Stakers of ETH*

- Sum of ETH staked in the staking pool

*Node Operators*

- Minipool contribution of ETH in blocks of 16 ETH by node operators
- RPL staked (optional, it's debatable if governance token staking is TVL)

*Others*
- The accrued ETH2 rewards from Beacon Chain should also be included as part of TVL, as this is the practice by Lido (regardless if the LP token is a rebase token or not).

### Revenue

The total revenue for Rocket Pool will be its ETH2 staking rewards from Beacon Chain. Then, depending on how whether the node operators are defined as protocol, the split of revenue can be further separated into supply-side and protocol-side. See Usage Metrics for details.

*Stakers of ETH*

- ETH2 staking rewards, less the amount of commission paid to node operators

*Node Operators*

- ETH2 staking rewards on their contribution of 16 ETH for each minipool
- Commission of 5% to 20% on the ETH2 staking rewards on the other 16 ETH matched by the protocol

### Rewards

RPL inflation will initially be 5% per annum and will be split up amongst:
— Node Operators staking RPL as collateral (70%)
— Oracle DAO members providing various oracle data (15%)
— Protocol DAO Treasury to fund decentralised development (15%)

### Protocol Owned Liquidity

There's no protocol owned liquidity by Rocket Pool smart contract. The protocol has a treasury which is mainly RPL. 
