# BadgerDAO Subgraph

## Known Issue

The `bDigg` vault of badger finance with contract address `0x7e7E112A68d8D2E221E11047a72fFC1065c38e1a`
has issue related to the input token price. The price for `Digg` token with address `0x798d1be841a82a273720ce31c822c61a67a601c3`
is currently fetched from `SushiSwapRouter` which results in incorrect values since block `11680422`.

The entities `Deposit` and `Withdraw` which stores the `amountUSD` for the tokens is incorrect for
above mentioned vault. Since, the amountUSD is used to calculate various financial metrics, hence
entity `FinancialsDailySnapshot` will also is affected.

Logs from the Price Library

```
[SushiSwapRouter] tokenAddress: 0x798d1be841a82a273720ce31c822c61a67a601c3, Price: 17.517436 Block: 12639535, data_source: bDIGG
```

- Vault Link [Badger - Digg](https://app.badger.com/vault/badger-digg?chain=ethereum)
- Digg Token [Etherscan](https://etherscan.io/address/0x798D1bE841a82a273720CE31c822C61a67a601C3)
- Vault Etherscan [View](https://etherscan.io/address/0x7e7E112A68d8D2E221E11047a72fFC1065c38e1a)

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Vaults:

`Vault TVL`

### Total Revenue USD

Sum across all Vaults:

`Total Yield`

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Note that BadgerDAO applies a Variable Withdrawal Fee and Variable Performance Fee

Sum across all Vaults:

`(Vault Revenue * Vault Annualized Performance Fee) + (Withdraw Amount * Vault Withdraw Fee)`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Note that this is the remaining Yield after Protocol Fees

Sum across all Vaults

`((Vault Revenue * (1 - Vault annualized Performance Fee)) - (Withdraw Amount * Vault Withdraw Fee)`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposit`

`Withdraw`

### Reward Token Emissions Amount

To be added

### Protocol Controlled Value

To be added

## Links

- Protocol website: https://badger.com/
- Protocol documentation: https://badger-finance.gitbook.io/badger-finance/
- Smart contracts: https://github.com/Badger-Finance/badger-system
- Deployed addresses: https://docs.badger.com/badger-finance/contract-addresses
- Existing subgraphs: https://github.com/Badger-Finance/badger-subgraph





## DONE

[FINAL_PRICE] vault 0xd04c48a53c111300ad41190d63681ed3dad998ec price 42060.211171 tokenAddr 0x075b1bb99792c9e1041ba13afef80c91a1e70fb3 block 14029921, data_source: bcrvSBTC
[FINAL_PRICE] vault 0xb9d076fde463dbc9f915e5392f807315bf940334 price 42353.671458 tokenAddr 0x64eda51d3ad40d56b9dfc5554e06f94e1dd786fd block 14042290, data_source: bcrvTBTC
[FINAL_PRICE] vault 0x235c9e24d3fb2fafd58a2e49d454fdcd2dbf7ff1 price 200486547.816656 tokenAddr 0xcd7989894bc033581532d2cd88da5db0a4b12859 block 14049821, data_source: buniWbtcBadger
[FINAL_PRICE] vault 0xf349c0faa80fc1870306ac093f75934078e28991 price 41796.561237 tokenAddr 0x2fe94ea3d5d4a175184081439753de15aef9d614 block 14035386, data_source: bcrvOBTC
[FINAL_PRICE] vault 0x5dce29e92b1b939f8e8c60dcf15bde82a85be4a9 price 42687.839599 tokenAddr 0x410e3e86ef427e30b9235497143881f717d93c2a block 14033531, data_source: bcrvBBTC
[FINAL_PRICE] vault 0xbe08ef12e4a553666291e9ffc24fccfd354f2dd2 price 1563.826291 tokenAddr 0xca3d75ac011bf5ad07a98d02f18225f9bd9a6bdf block 14044651, data_source: bcrvTricrypto
[FINAL_PRICE] vault 0x599d92b453c010b1050d31c364f6ee17e819f193 price 0 tokenAddr 0x17d8cbb6bce8cee970a4027d1198f6700a7a6c24 block 14056268, data_source: bimBTC
[FINAL_PRICE] vault 0x26b8efa69603537ac8ab55768b6740b67664d518 price 0 tokenAddr 0x48c59199da51b7e30ea200a74ea07974e62c4ba7 block 14000972, data_source: bFpMbtcHbtc
[FINAL_PRICE] vault 0x19e4d89e0cb807ea21b8cef02df5eaa99a110da5 price 1.004175 tokenAddr 0x5a6a4d54456819380173272a5e8e9b9904bdf41b block 14006746, data_source: bMIM-3LP3CRV-f
[FINAL_PRICE] vault 0x15cbc4ac1e81c97667780fe6dadedd04a6eeb47b price 1.00723 tokenAddr 0xd632f22692fac7611d2aa1c0d552930d43caed3b block 14006760, data_source: bFRAX3CRV-f
[FINAL_PRICE] vault 0x7e7e112a68d8d2e221e11047a72ffc1065c38e1a price 24.43963 tokenAddr 0x798d1be841a82a273720ce31c822c61a67a601c3 block 14000921, data_source: bDigg
[FINAL_PRICE] vault 0x8a8ffec8f4a0c8c9585da95d9d97e8cd6de273de price 0 tokenAddr 0x18d98d452072ac2eb7b74ce3db723374360539f1 block 14027344, data_source: bslpWbtcibBTC
[FINAL_PRICE] vault 0xfd05d3c7fe2924020620a8be4961bbaa747e6305 price 45.21282682 tokenAddr 0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b block 14001648, data_source: bveCVX
[FINAL_PRICE] vault 0x937b8e917d0f36edebba8e459c5fb16f3b315551 price 45.001157 tokenAddr 0x04c90c198b2eff55716079bc06d7ccc4aa4d7512 block 14012381, data_source: bbveCVX-CVX-f
[FINAL_PRICE] vault 0x27e98fc7d05f54e544d16f58c194c2d7ba71e3b5 price 0 (after 14 1519.771434) tokenAddr 0xc4ad29ba4b3c580e6d59105fff484999997675ff block 14008467, data_source: bcrvTricrypto2
[FINAL_PRICE] vault 0x2b5455aac8d64c14786c3a29858e43b5945819c0 price 4.790263 tokenAddr 0x62b9c7356a2dc64a1969e19c23e4f579f9810aa7 block 13999440, data_source: bcvxCRV
[FINAL_PRICE] vault 0xae96ff08771a109dc6650a1bdca62f2d558e40af price 43319.268146 tokenAddr 0xfbdca68601f835b27790d98bbb8ec7f05fdeaa9b block 13999896, data_source: bcrvIbBTC
[FINAL_PRICE] vault 0x758a43ee2bff8230eeb784879cdcff4828f2544d price 58674366995.676561 tokenAddr 0xceff51756c56ceffca006cd410b03ffc46dd3a58 block 14015984, data_source: bslpWbtcEth
[FINAL_PRICE] vault 0x1862a18181346ebd9edaf800804f89190def24a5 price 160518522.256311 tokenAddr 0x110492b31c59716ac47337e616804e3e3adc0b4a block 14001621, data_source: bslpWbtcBadger
[FINAL_PRICE] vault 0x6def55d2e18486b9ddfaa075bc4e4ee0b28c1545 price 42968.05938 tokenAddr 0x49849c98ae39fff122806c06791fa73784fb3675 block 14004176, data_source: bcrvRenBTC
[FINAL_PRICE] vault 0x19d97d8fa813ee2f51ad4b4e04ea08baf4dffc28 price 12.1907018 tokenAddr 0x3472a5a71965499acd81997a54bba8d852c6e53d block 13999600, data_source: bBadger
[FINAL_PRICE] vault 0x53c8e199eb2cb7c01543c137078a038937a68e40 price 39.86763888 tokenAddr 0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b block 14035838, data_source: bCVX
[FINAL_PRICE] vault 0x8c76970747afd5398e958bdfada4cf0b9fca16c4 price 41910.252052 tokenAddr 0xb19059ebb43466c323583928285a49f558e572fd block 14035327, data_source: bcrvHBTC
[FINAL_PRICE] vault 0xc17078fdd324cc473f8175dc5290fae5f2e84714 price 35176211869923.600358 tokenAddr 0xe86204c4eddd2f70ee00ead6805f917671f56c52 block 14084637, data_source: buniWbtcDigg
[FINAL_PRICE] vault 0xaf5a1decfa95baf63e0084a35c62592b774a2a87 price 41192.287896 tokenAddr 0x49849c98ae39fff122806c06791fa73784fb3675 block 14592904, data_source: bharvestcrvRenBTC


OTHER byvWBTC: 0x4b92d19c11435614CD49Af1b589001b7c08cD4D5
[FINAL_PRICE] vault 0x88128580acdd9c04ce47afce196875747bf2a9f6 price 20748186461179.039476 tokenAddr 0x9a13867048e01c663ce8ce2fe0cdae69ff9f35e3 block 14758576, data_source: bslpWbtcDigg

43,565,929,102,682
20,748,186,461,179


    {
      "name": "bslpWbtcDigg",
      "address": "0x88128580ACdD9c04Ce47AFcE196875747bF2A9f6",
      "startBlock": 14711029
    }



``` 
0x17d8cbb6bce8cee970a4027d1198f6700a7a6c24 BTC
0x48c59199da51b7e30ea200a74ea07974e62c4ba7 BTC
0x18d98d452072ac2eb7b74ce3db723374360539f1 
0x137469b55d1f15651ba46a89d0588e97dd0b6562
0x9a13867048e01c663ce8ce2fe0cdae69ff9f35e3 (gives half price)
```

8170140974.19436
58163953083316014054.25068031707877
[SushiSwapRouter] tokenAddress: 0x18d98d452072ac2eb7b74ce3db723374360539f1, Price:  58163953083316014054.25068031707877


8,170,140,974.19436
0.000136204461772474

value = 987921.13
balance = 0.000136204461772474
price = 7,253,221,496.152575


ts = 0.000388923313957977 
res = 39.224297187828189625

res * 2 / ts 
201,707.1015293588
5,863,625,441.458462 price of 1 lp token

2,280,500.638500331

0.000136204461772474
tvl = 798,651.9472892351
tvl = 79,221,899

8998689076284
57225543954
28296.1522702
usdc 26408.098439 * 39 * 2 = 


reserve 0 = 39
reserve 1 = 39
wbtc = 29442.621753
total liquidity = 2296524.496734
// price per token = liquidity * 10^18 / total supply

7,288,770,111.35204




```
WBTC
getAmountsOut
100000000
[0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599, 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48]
```

[SUSHI] amount out 
 token0 0x2260fac5e5542a773aa44fbcfedf7c193bc2c599 
 token1 0x2260fac5e5542a773aa44fbcfedf7c193bc2c599 
 token0price 29442621753 
 token1price 29442621753 
token0revert false token1revert false, data_source: bBadger

[FINAL_PRICE] vault 0x8a8ffec8f4a0c8c9585da95d9d97e8cd6de273de price 5785957416.330083371722225468632379 tokenAddr 0x18d98d452072ac2eb7b74ce3db723374360539f1 block 14811911, data_source: bBadger

[SUSHI] reserves reserv0 3977842492 reserve1 39708314100567650335, data_source: bBadger

[SUSHI] lp token price usdc token 0x18d98d452072ac2eb7b74ce3db723374360539f1 price 5784037712100085.777799668875806476, data_source: bBadge

5784037712100085 
578403771210.0085
