# Price Oracle

## Configuration

In `subgraph.yaml`, add the following code snippet inside the `abis` section of the `datasources` which is going to fetch prices of token using the `Price Oracle`.
**NOTE**: Include the following code snippet in each of the datasources, that is dependent on the `Price Oracle` and update imports in each file inside oracle folder.

```
###########################################
############## Price Oracle ###############
###########################################
      # ERC20
      - name: _ERC20
        file: ./abis/Prices/ERC20.json
      # Curve Contracts
      - name: CurvePool
        file: ./abis/Prices/Curve/Pool.json
      - name: CurveRegistry
        file: ./abis/Prices/Curve/Registry.json
      - name: CalculationsCurve
        file: ./abis/Prices/Calculations/Curve.json
      # YearnLens Contracts
      - name: YearnLensContract
        file: ./abis/Prices/YearnLens.json
      # Aave Oracle Contract
      - name: AaveOracleContract
        file: ./abis/Prices/AaveOracle.json
      # SushiSwap Contracts
      - name: CalculationsSushiSwap
        file: ./abis/Prices/Calculations/SushiSwap.json
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
// fetchPrice.usdPrice: BigDecimal
// fetchPrice.decimals: number

tokenPrice = fetchPrice.usdPrice * amount

// Method 2
// Using function getUsdPrice(tokenAddr: Address, amount: BigDecimal): BigDecimal

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
├── config
│   ├── arbitrum.ts
│   ├── aurora.ts
│   ├── avalanche.ts
│   ├── bsc.ts
│   ├── fantom.ts
│   ├── gnosis.ts
│   ├── harmony.ts
│   ├── mainnet.ts
│   ├── moonbeam.ts
│   ├── optimism.ts
│   └── polygon.ts
├── oracles
│   ├── AaveOracle.ts
│   ├── ChainLinkFeed.ts
│   └── YearnLensOracle.ts
├── routers
│   ├── CurveRouter.ts
│   └── UniswapForksRouter.ts
│── README.md
└── index.ts
```

## Development Status

🔨 = In progress.  
🛠 = Feature complete. Additional testing required.
`MultiCall` = If the method uses more than two `JSON RPC Call`.

### Arbitrum

| **Method**   |                 **Address**                  | **StartBlock** | **MultiCall** |
| ------------ | :------------------------------------------: | :------------: | :-----------: |
| YearnLens    | `0x043518ab266485dc085a1db095b8d9c2fc78e9b9` |   `2396321`    |      ❎       |
| AaveOracle   | `0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7` |   `7740843`    |      ❎       |
| Curve        | `0x3268c3bda100ef0ff3c2d044f23eab62c80d78d2` |   `11707234`   |      ❎       |
| SushiSwap    | `0x5ea7e501c9a23f4a76dc7d33a11d995b13a1dd25` |   `2396120`    |      ❎       |
| CurveRouters |                                              |                |               |
|              | `0x445FE580eF8d70FF569aB36e80c647af338db351` |   `1362056`    |      ✅       |
|              | `0x0E9fBb167DF83EdE3240D6a5fa5d40c6C6851e15` |   `4530115`    |      ✅       |
| UniswapForks |                                              |                |               |
|              | `0x1b02da8cb0d097eb8d57a175b88c7d8b47997506` |      `73`      |      ✅       |

### Aurora

| **Method**   |                 **Address**                  | **StartBlock** | **MultiCall** |
| ------------ | :------------------------------------------: | :------------: | :-----------: |
| CurveRouters |                                              |                |               |
|              | `0x5B5CFE992AdAC0C9D48E05854B2d91C73a003858` |   `62440525`   |      ✅       |
| UniswapForks |                                              |                |               |
|              | `0x2CB45Edb4517d5947aFdE3BEAbF95A582506858B` |                |      ✅       |

### Avalanche

| **Method**   |                 **Address**                  | **StartBlock** | **MultiCall** |
| ------------ | :------------------------------------------: | :------------: | :-----------: |
| AaveOracle   | `0xEBd36016B3eD09D4693Ed4251c67Bd858c3c7C9C` |   `11970477`   |      ❎       |
| CurveRouters |                                              |                |               |
|              | `0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6` |   `5254206`    |      ✅       |
|              | `0x90f421832199e93d01b64DaF378b183809EB0988` |   `9384663`    |      ✅       |
| UniswapForks |                                              |                |               |
|              | `0x60aE616a2155Ee3d9A68541Ba4544862310933d4` |   `2486393`    |      ✅       |
|              | `0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106` |    `56879`     |      ✅       |
|              | `0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506` |    `506236`    |      ✅       |

### BSC

| **Method**   |                 **Address**                  | **StartBlock** | **MultiCall** |
| ------------ | :------------------------------------------: | :------------: | :-----------: |
| UniswapForks |                                              |                |               |
|              | `0x10ED43C718714eb63d5aA57B78B54704E256024E` |   `6810080`    |      ✅       |
|              | `0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F` |    `586899`    |      ✅       |

### Fantom

| **Method**   |                 **Address**                  | **StartBlock** | **MultiCall** |
| ------------ | :------------------------------------------: | :------------: | :-----------: |
| YearnLens    | `0x57aa88a0810dfe3f9b71a9b179dd8bf5f956c46a` |   `17091856`   |      ❎       |
| Curve        | `0x0b53e9df372e72d8fdcdbedfbb56059957a37128` |   `27067399`   |      ❎       |
| SushiSwap    | `0x44536de2220987d098d1d29d3aafc7f7348e9ee4` |   `3809480`    |      ❎       |
| CurveRouters |                                              |                |               |
|              | `0x0f854EA9F38ceA4B1c2FC79047E9D0134419D5d6` |   `5655918`    |      ✅       |
|              | `0x4fb93D7d320E8A263F22f62C2059dFC2A8bCbC4c` |   `27552509`   |      ✅       |
| UniswapForks |                                              |                |               |
|              | `0xbe4fc72f8293f9d3512d58b969c98c3f676cb957` |   `3796241`    |      ✅       |
|              | `0x16327E3FbDaCA3bcF7E38F5Af2599D2DDc33aE52` |   `4250168`    |      ✅       |
|              | `0x1b02da8cb0d097eb8d57a175b88c7d8b47997506` |   `2457904`    |      ✅       |

### Gnosis

| **Method**   |                 **Address**                  | **StartBlock** | **MultiCall** |
| ------------ | :------------------------------------------: | :------------: | :-----------: |
| CurveRouters |                                              |                |               |
|              | `0x55E91365697EB8032F98290601847296eC847210` |   `20754886`   |      ✅       |
|              | `0x8A4694401bE8F8FCCbC542a3219aF1591f87CE17` |   `23334728`   |      ✅       |
| UniswapForks |                                              |                |               |
|              | `0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506` |   `14735910`   |      ✅       |

### Harmony

| **Method**   |                 **Address**                  | **StartBlock** | **MultiCall** |
| ------------ | :------------------------------------------: | :------------: | :-----------: |
| AaveOracle   | `0x3c90887ede8d65ccb2777a5d577beab2548280ad` |   `23930344`   |      ❎       |
| CurveRouters |                                              |                |               |
|              | `0x0a53FaDa2d943057C47A301D25a4D9b3B8e01e8E` |   `18003250`   |      ✅       |
| UniswapForks |                                              |                |               |
|              | `0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506` |   `11256069`   |      ✅       |

### Mainnet

| **Method**   |                 **Address**                  | **StartBlock** | **MultiCall** |
| ------------ | :------------------------------------------: | :------------: | :-----------: |
| YearnLens    | `0x83d95e0d5f402511db06817aff3f9ea88224b030` |   `12242339`   |      ❎       |
| ChainLink    | `0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf` |   `12864088`   |      ❎       |
| Curve        | `0x25BF7b72815476Dd515044F9650Bf79bAd0Df655` |   `12370088`   |      ❎       |
| SushiSwap    | `0x8263e161A855B644f582d9C164C66aABEe53f927` |   `12692284`   |      ❎       |
| CurveRouters |                                              |                |               |
|              | `0x7D86446dDb609eD0F5f8684AcF30380a356b2B4c` |   `11154794`   |      ✅       |
|              | `0x8F942C20D02bEfc377D41445793068908E2250D0` |   `13986752`   |      ✅       |
| UniswapForks |                                              |                |               |
|              | `0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F` |   `10794261`   |      ✅       |
|              | `0x7a250d5630b4cf539739df2c5dacb4c659f2488d` |   `10207858`   |      ✅       |

### Moonbeam

| **Method**   |                 **Address**                  | **StartBlock** | **MultiCall** |
| ------------ | :------------------------------------------: | :------------: | :-----------: |
| CurveRouters |                                              |                |               |
|              | `0xC2b1DF84112619D190193E48148000e3990Bf627` |   `1452049`    |      ✅       |
| UniswapForks |                                              |                |               |
|              | `0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506` |    `503734`    |      ✅       |

### Optimism

| **Method**   |                 **Address**                  | **StartBlock** | **MultiCall** |
| ------------ | :------------------------------------------: | :------------: | :-----------: |
| YearnLens    | `0xb082d9f4734c535d9d80536f7e87a6f4f471bf65` |   `18109291`   |      ❎       |
| AaveOracle   | `0xD81eb3728a631871a7eBBaD631b5f424909f0c77` |   `4365625`    |      ❎       |
| Curve        | `0x0ffe8434eae67c9838b12c3cd11ac4005daa7227` |   `18368996`   |      ❎       |
| SushiSwap    | `0x5fd3815dcb668200a662114fbc9af13ac0a55b4d` |   `18216910`   |      ❎       |
| CurveRouters |                                              |                |               |
|              | `0xC5cfaDA84E902aD92DD40194f0883ad49639b023` |   `2373837`    |      ✅       |
|              | `0x7DA64233Fefb352f8F501B357c018158ED8aA455` |   `3729171`    |      ✅       |
| UniswapForks |                                              |                |               |
|              | `0x9c12939390052919aF3155f41Bf4160Fd3666A6f` |   `19702709`   |      ✅       |

### Polygon

| **Method**   |                 **Address**                  | **StartBlock** | **MultiCall** |
| ------------ | :------------------------------------------: | :------------: | :-----------: |
| AaveOracle   | `0xb023e699F5a33916Ea823A16485e259257cA8Bd1` |   `25825996`   |      ❎       |
| CurveRouters |                                              |                |               |
|              | `0x094d12e5b541784701FD8d65F11fc0598FBC6332` |   `13991825`   |      ✅       |
|              | `0x47bB542B9dE58b970bA50c9dae444DDB4c16751a` |   `23556360`   |      ✅       |
| UniswapForks |                                              |                |               |
|              | `0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff` |   `4931900`    |      ✅       |
|              | `0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506` |   `11333235`   |      ✅       |
