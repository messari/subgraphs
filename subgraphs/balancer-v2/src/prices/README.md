# Price Oracle

## Configuration

- In `subgraph.yaml`, add the following code inside the `abis` section of the `datasources` which is going to fetch prices of token using the `Price Oracle`.
  **NOTE**: Include the following code in each of the datasources, that is dependent on the `Price Oracle` and update imports in each file inside oracle folder.

```
#############################################
############## Price Oracle #################
#############################################
- name: ERC20
  file: ./abis/Ethereum/ERC20.json
- name: CurveRegistry
  file: ./abis/Oracles/Curve/Registry.json
- name: CalculationsCurve
  file: ./abis/Oracles/Calculations/Curve.json
- name: YearnLensContract
  file: ./abis/Oracles/YearnLens.json
- name: ChainLinkContract
  file: ./abis/Oracles/ChainLink.json
- name: UniswapRouter
  file: ./abis/Oracles/Uniswap/Router.json
- name: UniswapFactory
  file: ./abis/Oracles/Uniswap/Factory.json
- name: UniswapPair
  file: ./abis/Oracles/Uniswap/Pair.json
- name: SushiSwapRouter
  file: ./abis/Oracles/SushiSwap/Router.json
- name: SushiSwapFactory
  file: ./abis/Oracles/SushiSwap/Factory.json
- name: SushiSwapPair
  file: ./abis/Oracles/SushiSwap/Pair.json
- name: CalculationsSushiSwap
  file: ./abis/Oracles/Calculations/SushiSwap.json
```

## Usage

Following are some ways through which you can get the prices of tokens:

```
import { BigDecimal } from "@graphprotocol/graph-ts";
import { getUsdPricePerToken, getUsdPrice } from "../Oracle";

// Method 1
// Using function getUsdPricePerToken(tokenAddr: Address)

let tokenPrice: BigDecimal;
let fetchPrice = getUsdPricePerToken(tokenAddr);
if (!fetchPrice.reverted) {
  tokenPrice = fetchPrice.usdPrice.div(
    fetchPrice.decimals.toBigDecimal()
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
