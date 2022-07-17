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


## Note: MISSING DATA (Dec 2020 - Apr 29, 2021)

* The Lido smart contracts use an upgradeable proxy contract format to update the contracts. Initial contracts didn't have relevant public functions and events for easily calculating certain revenue metrics. The contracts were upgraded in April 2021 to make available `PostTotalShares` event and `lastCompletedReportDelta` function which allow you to conveniently calculate staking rewards (and therefore total revenue).
* Calculating Total Revenue (and hence Supply Side Revenue) for the duration Dec 2020 - Apr 2021 is cumbersome. We (Tarun, Vincent) decided to not calculate metrics for the mentioned duration. Supporting quantitative data for our decision is provided below. For more information on the calculation methodology, see the discussion with the Lido team on their discord [here](https://discord.com/channels/761182643269795850/773584934619185154/996811044477476935).

### Supporting Data
Dec 2020 - Apr 2021
* The totalRevenue data is missing from Jan 07 2021 (revenue start data) - April 29 2021. 
* The cumulativeProtocolRevenue (calculated by tracking the transfers from null_address to treasury OR node operators) for this period was ~700K.
* If cumulativeProtocolRevenue was ~700K, then the cumulativeTotalRevenue would be ~7 million and the cumulativeSupplySideRevenue would be 6.4 million. (Given protocol side revenue is 10% of total revenue, supply side revenue is 90%).

May 2021 - July 2022 (present)
* As of now, the cumulativeTotalRevenue is 304 million, cumulativeProtocolSideRevenue is 30 million and cumulativeSupplySideRevenue is 274 million.
* This would mean, in the grand scheme of things, the cumulativeTotalRevenue and cumulativeSupplySideRevenue would ~2% difference if we are unable to fill the 4 month Jan 2021 - Apr 2021 gap in that data.

The 2% difference seems acceptable given the methodology won't be straighforward to fill the gap and this methodology won't apply for calculations beyond those 4 months.

## Protocol Diagrams

![Staking Pool Overview](https://blog.lido.fi/content/images/2020/11/01.png)

## Validation (in-progress)

Validation was done against other data sources (tokenterminal, defillama) and documented in this sheet: [Lido Finance - Messari Subgraph - Validation Sheet](https://docs.google.com/spreadsheets/d/1fiKfv9KLoWbRK1W6ejhWiySIzbd5CDyWs5so-tvJcHo/edit#gid=0).

A helper validation script was created to quickly view and compare data in the terminal: [review.sh](https://github.com/fortysevenlabs/messari-subgraphs/tree/master/subgraphs/lido/validation/review.sh).

**Runing the helper script**
The intention of the script is to print relevant revenue metrics for quick comparison. The script takes a date in `YYYY-MM-DD` format, normalizes the timestampts to tokenterminal format (`2022-07-01T00:00:00.000Z`), converts the tokenterminal format to epoch times for subgraph, makes queries (subgraph, tokenterminal) and prints the output. 
```
./review.sh {GRAPH_API_URL} {YYYY-MM-DD}
./review.sh https://api.thegraph.com/subgraphs/name/fortysevenlabs/lido 2022-07-01
```

**Files** 

* Structure

    ```
    validation
      ├── lido-finance-project.json
      ├── metrics-daily-{date}.json
      ├── metrics-monthly-{date}.json
      └── review.sh
    ```
 
* Token Terminal Metrics (and Samples)

    * **metrics-daily-{date}.json** - daily metric values, see sample below
    ```
    {
        "project_id": "lido-finance",
        "timestamp": "2022-07-04T00:00:00.000Z",
        "active_users": null,
        "business_type": "interest",
        "deposits": null,
        "gmv": null,
        "market_cap_circulating": 232787544.26598746,
        "market_cap_fully_diluted": 501204356.71843535,
        "pe_circulating": 10.114905445579968,
        "pe_fully_diluted": 21.777946466616125,
        "price": 0.5012043567184353,
        "project": "Lido Finance",
        "ps_circulating": 1.0114905445579967,
        "ps_fully_diluted": 2.1777946466616127,
        "revenue_protocol": 56549.80000931314,
        "revenue_supply_side": 508948.2000838183,
        "revenue_total": 565498.0000931314,
        "token_incentives": null,
        "token_trading_volume": 16187416.610178523,
        "tokenholders": 16268,
        "treasury": 108013901.4348732,
        "tvl": 4624675259.240275,
        "volmc_circulating": 0.0695372970285836,
        "volmc_fully_diluted": 0.03229703890876636
    }
    ```

    * **metrics-monthly-{date}.json** - monthly metric values, see sample below
    ```
    {
        "project_id": "lido-finance",
        "timestamp": "2022-07-01T00:00:00.000Z",
        "active_users": null,
        "business_type": "interest",
        "deposits": null,
        "gmv": null,
        "market_cap_circulating": 299253507.347208,
        "market_cap_fully_diluted": 629531658.1241714,
        "pe_circulating": 13.960412433611236,
        "pe_fully_diluted": 29.331670090462787,
        "price": 0.6295316581241713,
        "project": "Lido Finance",
        "ps_circulating": 1.3960412433611233,
        "ps_fully_diluted": 2.933167009046278,
        "revenue_protocol": 918432.1152130027,
        "revenue_supply_side": 8265889.036917024,
        "revenue_total": 9184321.152130026,
        "token_incentives": null,
        "token_trading_volume": 25201168.607745774,
        "tokenholders": 16410,
        "treasury": 128933022.49720491,
        "tvl": 4945104157.166401,
        "volmc_circulating": 0.0746432616201606,
        "volmc_fully_diluted": 0.0355197736414646
    }
    ```

    * **metrics-aggregates-{date}.json** - aggregates for each available metric, see sample below
    ```
    "revenue_total": {
      "values": {
        "latest": 591638.2247886488,
        "max": 1283408.9217863563
      },
      "sums": {
        "1d": 591638.2247886488,
        "7d": 3801974.0384223517,
        "30d": 18230313.019791126,
        "90d": 83039425.02801158,
        "180d": 157171362.6796032,
        "365d": 280335074.4713445,
        "all": 300694642.4476183
      },
      "averages": {
        "1d": 591638.2247886488,
        "7d": 543139.1483460503,
        "30d": 607677.1006597042,
        "90d": 922660.2780890175,
        "180d": 873174.2371089066,
        "365d": 768041.2999214916,
        "all": null
      },
      "changes": {
        "1d": 0.05691777970848855,
        "7d": 0.17276281877458688,
        "30d": -0.34239173121466204,
        "90d": -0.49199632652903247,
        "180d": -0.2259560682991053,
        "365d": 2.44463209675667,
        "all": null
      },
      "trends": {
        "1d": 0.05691777970848855,
        "7d": -0.06525895356191369,
        "30d": -0.3606337929222101,
        "90d": 0.12015721777412214,
        "180d": 0.28707332304856736,
        "365d": 12.769205456522135,
        "all": null
      },
      "moving_averages_annualized": {
        "1d": null,
        "7d": null,
        "30d": 221802141.74079204,
        "90d": null,
        "180d": null,
        "365d": null,
        "all": null
      }
    }
    ```

## Useful links and references

https://docs.lido.fi/
