# Lido Subgraph
## Calculation Methodology v1.0.0


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




## METRICS FOR UI

### Total Value Locked (TVL) USD

`Agg. Deposits (ETH)`

### Total Revenue USD

`Staking Rewards (ETH)`

### Protocol-Side Revenue USD

`Lido Protocol Revenue (ETH)`

### Supply-Side Revenue USD

`Supply-side Revenue (ETH)`

### Total Unique Users

`Unique Users`


## Useful links and references

https://docs.lido.fi/
