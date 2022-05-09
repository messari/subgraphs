# PoolTogether Subgraph
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
