# Price Oracle

## Configuration

- In `subgraph.yaml`, add the following code inside the `abis` section of the `datasources` which is going to fetch prices of token using the `Price Oracle`.
  **NOTE**: Include the following code in each of the datasources, that is dependent on the `Price Oracle` and update imports in each file inside oracle folder.

```
###########################################
############## Price Oracle ###############
###########################################
# ERC20
- name: _ERC20
  file: ./abis/Prices/ERC20.json
# Curve Contracts
- name: CurveRegistry
  file: ./abis/Prices/Curve/Registry.json
- name: CurvePoolRegistry
  file: ./abis/Prices/Curve/PoolRegistry.json
- name: CalculationsCurve
  file: ./abis/Prices/Calculations/Curve.json
# YearnLens Contracts
- name: YearnLensContract
  file: ./abis/Prices/YearnLens.json
# ChainLink Contracts
- name: ChainLinkContract
  file: ./abis/Prices/ChainLink.json
# Uniswap Contracts
- name: UniswapRouter
  file: ./abis/Prices/Uniswap/Router.json
- name: UniswapFactory
  file: ./abis/Prices/Uniswap/Factory.json
- name: UniswapPair
  file: ./abis/Prices/Uniswap/Pair.json
# SushiSwap Contracts
- name: SushiSwapRouter
  file: ./abis/Prices/SushiSwap/Router.json
- name: SushiSwapFactory
  file: ./abis/Prices/SushiSwap/Factory.json
- name: SushiSwapPair
  file: ./abis/Prices/SushiSwap/Pair.json
- name: CalculationsSushiSwap
  file: ./abis/Prices/Calculations/SushiSwap.json
```

## Usage

Following are some ways through which you can get the prices of tokens:

```
import { BigDecimal } from "@graphprotocol/graph-ts";
import { getUsdPricePerToken, getUsdPrice } from "../Oracle";

// Method 1 
// Using function getUsdPricePerToken(tokenAddr: Address): CustomPriceType

let tokenPrice: BigDecimal;
let fetchPrice = getUsdPricePerToken(tokenAddr);

// fetchPrice.reverted: Bool
// fetchPrice.decimals: number
// fetchPrice.decimalsBaseTen: BigDecimal, returns 10**decimals

if (!fetchPrice.reverted) {
  tokenPrice = fetchPrice.usdPrice.div(
    fetchPrice.decimalsBaseTen
  );
} else {
  // default value of this variable, if reverted is BigDecimal Zero
  tokenPrice = fetchPrice.usdPrice
}

// Method 2
// Using function getUsdPrice(tokenAddr: Address, amount: BigInt)

let tokenPrice = getUsdPrice(tokenAddr, amount);
```

## Optimizations

- Reorder the methods present in `index.ts`, depending on which method works best for you.

## Folder Structure

```

Prices
├── calculations
│   ├── CalculationsCurve.ts
│   └── CalculationsSushiSwap.ts
├── common
│   ├── types.ts
│   ├── constants.ts
│   └── utils.ts
├── oracles
│   ├── ChainLinkFeed.ts
│   └── YearnLensOracle.ts
├── routers
│   ├── CurveRouter.ts
│   ├── SushiSwapRouter.ts
│   └── UniswapRouter.ts
│── README.md
└── index.ts
```

## Development Status

### Mainnet

🔨 = In progress.  
🛠 = Feature complete. Additional testing required.
`MultiCall` = If the method uses more than two `JSON RPC Call`.

| Method                                                                               |      Type      | StartBlock | MultiCall | Status |
| ------------------------------------------------------------------------------------ | :------------: | :--------: | :-------: | :----: |
| [YearnLens](https://etherscan.io/address/0x83d95e0d5f402511db06817aff3f9ea88224b030) |    `Oracle`    | `12242339` |    ❎     |   🛠    |
| [ChainLink](https://etherscan.io/address/0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf) |    `Oracle`    | `12864088` |    ❎     |   🛠    |
| [Curve](https://etherscan.io/address/0x25BF7b72815476Dd515044F9650Bf79bAd0Df655)     | `Calculations` | `12370088` |    ❎     |   🛠    |
| [SushiSwap](https://etherscan.io/address/0x8263e161A855B644f582d9C164C66aABEe53f927) | `Calculations` | `12692284` |    ❎     |   🛠    |
| [Curve](https://etherscan.io/address/0x7D86446dDb609eD0F5f8684AcF30380a356b2B4c)     |    `Router`    | `11154794` |    ✅     |   🛠    |
| [Uniswap](https://etherscan.io/address/0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D)   |    `Router`    | `10207858` |    ✅     |   🛠    |
| [SushiSwap](https://etherscan.io/address/0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F) |    `Router`    | `10794261` |    ✅     |   🛠    |


### Fantom

🔨 = In progress.  
🛠 = Feature complete. Additional testing required.
`MultiCall` = If the method uses more than two `JSON RPC Call`.

| Method                                                                               |      Type      | StartBlock | MultiCall | Status |
| ------------------------------------------------------------------------------------ | :------------: | :--------: | :-------: | :----: |
| [Curve](https://ftmscan.com/address/0x0b53e9df372e72d8fdcdbedfbb56059957a37128)     | `Calculations` | `27067399` |    ❎     |   🛠    |
| [SushiSwap](https://ftmscan.com/address/0xec7Ac8AC897f5082B2c3d4e8D2173F992A097F24) | `Calculations` | `3808222` |    ❎     |   🛠    |
| [Curve](https://ftmscan.com/address/0x0f854EA9F38ceA4B1c2FC79047E9D0134419D5d6)     |    `Router`    | `5655918` |    ✅     |   🛠    |
| [SpookySwap](https://ftmscan.com/address/0xbe4fc72f8293f9d3512d58b969c98c3f676cb957)   |    `Router`    | `3796241` |    ✅     |   🛠    |
| [SushiSwap](https://ftmscan.com/address/0x1b02da8cb0d097eb8d57a175b88c7d8b47997506) |    `Router`    | `2457904` |    ✅     |   🛠    |


### Arbitrum-One

🔨 = In progress.  
🛠 = Feature complete. Additional testing required.
`MultiCall` = If the method uses more than two `JSON RPC Call`.

| Method                                                                               |      Type      | StartBlock | MultiCall | Status |
| ------------------------------------------------------------------------------------ | :------------: | :--------: | :-------: | :----: |
| [Curve](https://arbiscan.io/address/0x26f698491daf32771217abc1356dae48c7230c75)     | `Calculations` | `5287603` |    ❎     |   🛠    |
| [SushiSwap](https://arbiscan.io/address/0x5EA7E501c9A23F4A76Dc7D33a11D995B13a1dD25) | `Calculations` | `2396120` |    ❎     |   🛠    |
| [Curve](https://arbiscan.io/address/0x445FE580eF8d70FF569aB36e80c647af338db351)     |    `Router`    | `1362056` |    ✅     |   🛠    |
| [SushiSwap](https://arbiscan.io/address/0x1b02da8cb0d097eb8d57a175b88c7d8b47997506) |    `Router`    | `73` |    ✅     |   🛠    |
