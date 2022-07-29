# Lido Subgraph

## Methodology v1.1.0

## Overview of the Products of Lido
Lido is a staking service provider, mainly known as the largest ETH2.0 staking service provider. Lido's other staking products include:

- ETH on Ethereum
- ERC20 version of MATIC (Polygon native token) on Ethereum
- xcKSM (ERC20 version of KSM, the native token of Kusana) on Moonbeam
- xcDOT (ERC20 version of DOT, the native token of Polkadot) on Moonriver
- SOL (native token of Solana) on Solana
- LUNA on Terra (terminated)

## Lido Introduction and Staking ETH on Ethereum
### Basic Mechanism
Lido is ETH2.0 staking service provider. Instead of locking 32 ETH and having no liquidity until ETH2.0 merger, Lido allows users to deposit ETH with Lido, and the deposited ETH is then pooled and staked with node operators selected by the Lido DAO. In exchange, depositors will be given a ERC20 token stETH on a 1:1 basis for the ETHs deposited. stETH is liquid and can be traded; and when withdrawals are enabled on ETH2.0, stETH can be redeemed for ETH.

### stETH and wstETH Tokens
stETH is a rebasable token. As Lido's staked ETH generates staking rewards from ETH 2.0 (net off penalties inflicted on validators), Lido’s ETH balance on the beacon chain will increase and stETH will be updated accordingly to match the balance of ETH on beacon chain. Lido will in turn update its depositors their corresponding stETH balances once per day. 

As the stETH is a rebased token, it's not accepted by some defi protocols. wstETH, a wrapped version of stETH is then created to address this issue. wstETH balance does not rebase, wstETH's price denominated in stETH changes instead.

### Fees
Lido applies a 10% fee on a user’s staking rewards. This fee is split between node operators, the DAO (treasury), and a coverage fund.

Currently, the fee split is:
- Node operators: 50%
- Coverage fund: 50%
- DAO (Treasury): 0%

Reference link: https://mainnet.lido.fi/#/lido-dao/0xae7ab96520de3a18e5e111b5eaab095312d7fe84/ 

### Incentives
There's not direct incentives for staking ETH in Lido. However, in order to encourage the adoption of stETH, Lido incentivises for providing liquidity to stETH related pools in Curve and Balancer. E.g. LDO, its governance token, are given for liquidity providers in Curve's stETH-ETH pool. 

### Useful Links
- Protocol
  - https://lido.fi/
- Docs
  - https://docs.lido.fi/
- Smart contracts
  - https://docs.lido.fi/contracts/lido
  - https://docs.lido.fi/deployed-contracts
- Tokenomics 
  - https://blog.lido.fi/introducing-ldo/
  - https://lido.fi/static/Lido:Ethereum-Liquid-Staking.pdf
- Treasury
  - https://blog.lido.fi/lido-dao-treasury-fund/
- Fees
  - https://docs.lido.fi/guides/node-operator-manual#the-fee
- Governance forum
  - https://research.lido.fi/
  - https://mainnet.lido.fi/#/lido-dao.aragonid.eth 
- Blog
  - https://blog.lido.fi/
 
### Usage Metrics

For Lido on Ethereum, the staking services include staking of ETH and staking of MATIC (please refer to the section "Staking MATIC on Ethereum" fo r details of staking MATIC.  

#### Active Users, Total Unique Users & Daily Transaction Count
Transactions that can be considered to be relevant to Lido on Ethereum network:
- Stake ETH into Lido
- Wrap stETH into wstETH or unwrap
- Stake MATIC into Lido 
- Unstake stMATIC
- Claim stMATIC after 3-4 days waiting period

Note: In Lido, ETH is deposited to get stETH on a 1:1 basis. However, in dexes likes Curve or Balancer, stETH is typically trading at a small discount. Therefore, buying stETH sometimes is out of the intention to stake ETH with Lido, but at a discount. 

### Financial Metrics
#### Total Value Locked USD
The Total Value Locked (TVL) on Lido in Ethereum is the sum of:
- the value of ETH in its staking contract
- the value of MATIC in its staking contract

#### Protocol Controlled Value USD
Lido has a treasury but not Protocol Controlled Value.

#### Revenue
Lido generates revenue from the staking rewards from:
- ETH2.0 staking rewards
- MATIC staking rewards

#### Supply-side and Protocol-side
As of now, 90% of the staking rewards are accrued to ETH depositors with Lido (supply-side revenue), and 10% are given to node operators, insurance fund and treasury (protocol-side revenue).

The Lido DAO can vote to change the 10% fee but the ratio has not been changed since Lido's launch.

Similarly, 90% of MATIC staking rewards go to MATIC depositors and the 10% goes to validators, insurance fund and the DAO.

### Pool-Level Metrics
#### Pool Total Value Locked USD
Lido on Ethereum network has two pools:
- ETH staking pool
- MATIC staking pool

#### Reward Tokens & Reward Token Emissions Amount
Lido does not give incentives or reward tokens within its own protocol. 


## Staking MATIC on Ethereum
### Summary
Lido partnered with Shard Labs since March 2022 for providing the staking service of the ERC20 version of MATIC on Ethereum. Polygon has a validator-delegator mechanism, where validators receive MATIC from delegators on Ethereum and stake for incentives in MATIC rewarded by Polygon Network.

Lido pool MATIC from depositors and allocate MATIC to validators. Lido then share the staking incentives with depositors, validator and the DAO. Currently, the split is the same as ETH staking, where 10% is for validators (5%), insurance fund (2.5%) and the Lido DAO (2.5%), and the remaining 90% goes to MATIC depositors.

### stMATIC

Depositors of MATIC into Lido on Polygon get an ERC-20 stMATIC tokens, which is NOT a rebased token. Depositor will get stMATIC based on the then exchange rate between stMATIC and MATIC. A depositor's balance of stMATIC is not going to increase on a daily basis to reflect rewards. Instead, the value of his stMATIC will change relative to MATIC as staking rewards are earned.

stMATIC can be redeemed any time. Default stMATIC unstaking period takes around 3-4 days (80 epochs on Polygon) to process. After that one has to take one more step to withdraw in the Claim page of Lido UI. 


### MATIC Staking Useful Links
- Protocol
  - https://polygon.lido.fi/
- Blog
  - https://blog.lido.fi/category/polygon/
- Documentation
  - https://docs.polygon.lido.fi/
- Fees
  - https://docs.polygon.lido.fi/fees
- Deployed contracts
  - https://docs.polygon.lido.fi/deployed-contracts

### Metrics
Metrics of staking MATIC on Ethereum is included in the section "Lido Introduction and Staking ETH on Ethereum" - "Usage Metrics", as this staking service is on Ethereum.


## Lido Staking xcDOT on Moonbeam
Lido has staking services for xcDOT on Moonbeam network. It follows the same mechanism as staking ETH on Ethereum. More details are as follows:

### Staking DOT
- DOT is the native token of Polkadot. xcDOT is ERC20 compatible token on the Moonbeam network, which can be received by users in exchange for DOT. A DOT holder locks their DOT on Polkadot and gets the same amount of xcDOT on their Moonbeam account. xcDOT can be instantly exchanged for DOT.
- stDOT is issued when a user stakes xcDOT in Lido, on a 1:1 basis. Like stETH, stDOT accrues rewards from Polkadot and is a rebase token. stDOT can be redeemed to xcDOT subject to a 30 days unbonding period.
- wstDOT is the wrapped version of stDOT.
- Links:
  - Details of tokens: https://docs.polkadot.lido.fi/extras/tokenomics
  - Protocol: https://lido.fi/polkadot
  - Contracts: https://docs.polkadot.lido.fi/extras/deployed-contracts
  - Docs: https://docs.polkadot.lido.fi/
- Fees: 10% of staking rewards is split between node operators, the DAO treasury, and Polkadot developers. I.e. 90% revenue goes to supply-side and 10% protocol side. 

### Metrics
- TVL of LIDO on Moonbeam is the xcDOT staked with Lido contracts
- Revenues are staking rewards from Polkadot, split between depositors (90%) and protocol (10%)
- Usage data should include:
  - stake xcDOT for stDOT
  - unbond stDOT for xcDOT
  - claim xcDOT after the unbonding period 
  - wrap/unwrap stDOt
  - transfer of DOT into Moonbeam chain to mint xcDOT and vice versa (optional)

## Staking xcKSM on Moonriver
Lido has staking services for xcKSM on Moonriver network. As Kusama is the test net for Polkadot, the mechanism of staking xcKSM on Moonriver is identical to staking xcDOT on Moonbeam. Only minor variations stated below:
- The ERC20 compatible token for KSM is xcKSM, and when staked with Lido, depositors get stKSM. Depositers can also wrap their stKSM and receive wstKSM.
- The unbonding period is 7 to 8 days
- Links:
  - Details of tokens: https://docs.kusama.lido.fi/extras/tokenomics
  - Protocol: https://lido.fi/kusama
  - Contracts: https://docs.kusama.lido.fi/extras/deployed-contracts
  - Docs: https://docs.kusama.lido.fi/

## Staking SOL on Solana
Lido has staking service for SOL on Solana. It's close to staking MATIC on Ethereum. The details are as follows:

### Staking SOL
- SOL is the native token of Solana network. It can be staked directly with Lido.  
- stSOL is issued when a user stakes SOL in Lido, at the then exchange rate between stSOL and SOL. Like stMATIC, stSOL is not a rebase token. Over time, as a user's SOL delegation accrues staking rewards, the value of his stSOL appreciates. stSOL can be redeemed to SOL subject to a 2-3 days deactivation period.
- Links:
  - Protocol: https://solana.lido.fi/
  - Contracts: https://docs.solana.lido.fi/deployments
  - Docs: https://docs.solana.lido.fi/
  - Fees: https://docs.solana.lido.fi/fees
- Fees: 10% of staking rewards is split between validators, the DAO treasury, and Solido developers. I.e. 90% revenue goes to supply-side and 10% protocol-side. 

### Metrics
- TVL of Lido on Solana is the SOL staked with Lido contracts
- Revenues are staking rewards from Solana staking, split between depositors (90%) and protocol (10%)
- Usage data should include:
  - stake SOL for stSOL
  - unstake stSOL for SOL
  - withdraw SOL after the deactivation period (executed in the wallet UI)
  
## Other Reference Links
- https://pro.nansen.ai/lido
- https://tokenterminal.com/terminal/projects/lido-finance
- https://dune.com/LidoAnalytical/Lido-Finance-Extended

---

# Technical Details

### stETH Supply:

`value`/1e18 FROM `stETH erc20."ERC20_evt_Transfer"`

WHERE `from` = '\x0000000000000000000000000000000000000000'

UNION ALL

-`value`/1e18 FROM `erc20."ERC20_evt_Transfer"`

WHERE `to` = '\x0000000000000000000000000000000000000000'


**Contract:** stETH erc20 0xae7ab96520de3a18e5e111b5eaab095312d7fe84

**Evt:** `ERC20_evt_Transfer`

**Parameters:** `value`, `from`, `to`

### stETH Price (ETH) from Curve:

`tokens_sold`/`tokens_bought` FROM `curvefi."steth_swap_evt_TokenExchange"`

WHERE `sold_id` = 0

UNION ALL 

`tokens_bought`/`tokens_sold` FROM `curvefi."steth_swap_evt_TokenExchange"`

WHERE `sold_id` = 1


**Contract:** curvefi steth 0xdc24316b9ae028f1497c275eb9192a3ea0f67022

**Evt:** `steth_swap_evt_TokenExchange`

**Parameters:** `tokens_sold`, `tokens_bough`, `sold_id`

### stETH Vol. (ETH) from Curve:

`tokens_sold`/1e18 FROM `curvefi."steth_swap_evt_TokenExchange"`

WHERE `sold_id` = 0

UNION ALL 

`tokens_bought`/1e18 FROM `curvefi."steth_swap_evt_TokenExchange"`

WHERE `sold_id` = 1


**Contract:** curvefi steth 0xdc24316b9ae028f1497c275eb9192a3ea0f67022

**Evt:** `steth_swap_evt_TokenExchange`

**Parameters:** `tokens_sold`, `tokens_bough`, `sold_id`

### stETH Vol. (USD)

`stETH Vol. (ETH)` * `ETH price (offchain)`

### stETH MCap. (USD)

`stETH Supply` * `stETH Price (ETH)` * `ETH price (offchain)`

### Number of Active Depositors:

COUNT(`sender`) FROM `lido."steth_evt_Submitted"`


**Contract:** lido steth 0xae7ab96520de3a18e5e111b5eaab095312d7fe84

**Evt:** `steth_evt_Submitted`

**Parameters:** `sender`  

### Unique Users:

COUNT (UNIQUE `sender`) OVER `time` FROM `lido."steth_evt_Submitted"`


**Contract:** lido steth 0xae7ab96520de3a18e5e111b5eaab095312d7fe84

**Evt:** `steth_evt_Submitted`

**Parameters:** `sender`  
    
### Deposits Amount (ETH)

SUM(`amount`)/1e18 FROM `lido."steth_evt_Submitted"`


**Contract:** lido steth 0xae7ab96520de3a18e5e111b5eaab095312d7fe84

**Evt:** `steth_evt_Submitted`

**Parameters:** `amount`

### Agg. Deposits (ETH)

SUM(`Deposits Amount (ETH)`) OVER `time`

### Agg. Deposits (USD)

`Agg. Deposits (ETH)` * `ETH price (offchain)`


### Total Staked (ETH):

SUM(SUM(`amount`)/1e18) OVER `time` FROM `lido."steth_evt_Unbuffered"`


**Contract:** lido steth 0xae7ab96520de3a18e5e111b5eaab095312d7fe84

**Evt:** `lido.steth_evt_Unbuffered`

**Parameters:** `amount`

### Total Pooled (ETH):

`postTotalPooledEther`/1e18 FROM `lido."LidoOracle_evt_PostTotalShares"`


**Contract:** lido LidoOracle 0x442af784a788a5bd6f42a01ebe9f287a871243fb

**Evt:** `LidoOracle_evt_PostTotalShares`

**Parameters:** `postTotalPooledEther`

### Lido Total Shares:

`totalShares`/1e18 FROM `lido."LidoOracle_evt_PostTotalShares"`


**Contract:** lido LidoOracle 0x442af784a788a5bd6f42a01ebe9f287a871243fb

**Evt:** `LidoOracle_evt_PostTotalShares`

**Parameters:** `totalShares`

### Beacon Chain Total Staked (ETH):

SUM(SUM(`amount`)/1e9) OVER `time` FROM `eth2."DepositContract_evt_DepositEvent"`
       
_Note_: `amount` is returned as little endian HEX num and needs to be decoded into INT


**Contract:** eth2 DepositContract 0x00000000219ab540356cbb839cbe05303d7705fa

**Evt:** `DepositContract_evt_DepositEvent`

**Parameters:** `amount`

### Others Total Staked (ETH):

`Beacon Chain Total Staked (ETH)` - `Total Staked (ETH)`

### Lido Participation (%):

`Total Staked (ETH)` / `Beacon Chain Total Staked (ETH)`


### Lido Global APY (%):

(1+(`postTotalPooledEther` - `preTotalPooledEther`)/`postTotalPooledEther`/(`timeElapsed`/(60 * 60 * 24)))^365-1 FROM `lido."LidoOracle_evt_PostTotalShares"`
        

**Contract:** lido LidoOracle 0x442af784a788a5bd6f42a01ebe9f287a871243fb

**Evt:** `LidoOracle_evt_PostTotalShares`

**Parameters:** `postTotalPooledEther`, `preTotalPooledEther`, `timeElapsed`

### Staking Rewards (ETH):

(`postTotalPooledEther`-`preTotalPooledEther`)/1e18 FROM `lido."LidoOracle_evt_PostTotalShares"`
        

**Contract:** lido LidoOracle 0x442af784a788a5bd6f42a01ebe9f287a871243fb

**Evt:** `LidoOracle_evt_PostTotalShares`

**Parameters:** `postTotalPooledEther`, `preTotalPooledEther`

### Staking Rewards (USD):

`Staking Rewards (ETH)` * `ETH price (offchain)`

### Agg. Staking Rewards (ETH)

SUM(`Staking Rewards (ETH)`) OVER `time`

### Treasury Revenue (ETH):

FOR every tx WITH triggered the evt `lido."LidoOracle_evt_PostTotalShares"`:

    SUM(`value`/1e18) FROM `stETH erc20."ERC20_evt_Transfer"`
    WHERE `to` = '\x3e40d73eb977dc6a537af587d48316fee66e9c8c'

_Note_:0x3e40d73eb977dc6a537af587d48316fee66e9c8c Treasury address

**Contract:** stETH erc20 0xae7ab96520de3a18e5e111b5eaab095312d7fe84

lido LidoOracle 0x442af784a788a5bd6f42a01ebe9f287a871243fb

**Evt:** `ERC20_evt_Transfer`

**Parameters:** `PostTotalShares`, `value`, `to`

### Node Operators Revenue (ETH):

FOR every tx WITH triggered the `evt lido."LidoOracle_evt_PostTotalShares"`:

    SUM(`value`/1e18) FROM `stETH erc20."ERC20_evt_Transfer"`
    WHERE "to" != '\x3e40d73eb977dc6a537af587d48316fee66e9c8c'     <---- !=

_Note_:0x3e40d73eb977dc6a537af587d48316fee66e9c8c Treasury address

**Contract:** stETH erc20 0xae7ab96520de3a18e5e111b5eaab095312d7fe84

lido LidoOracle 0x442af784a788a5bd6f42a01ebe9f287a871243fb

**Evt:** `ERC20_evt_Transfer`

**Parameters:** `PostTotalShares`, `value`, `to`

### Lido Protocol Revenue (ETH):

`Treasury Revenue (ETH)` + `Node Operators Revenue (ETH)`

### Supply-side Revenue (ETH):

`Staking Rewards (ETH)` - (`Treasury Revenue (ETH)` + `Node Operators Revenue (ETH)`)

### Agg. Protocol Revenue (ETH)

SUM(`Treasury Revenue (ETH)`) OVER `time` + SUM(`Node Operators Revenue (ETH)`) OVER `time`
