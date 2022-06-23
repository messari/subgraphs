# Subgraphs

This repo contains subgraphs defined using a set of standardized schemas. These subgraphs are used to extract raw blockchain data and transform them into meaningful metrics, for products and analytics. Our goal is to build a subgraph for every DeFi protocol in the space.

## Contribution Guidelines

- Decide which protocol you want to build a subgraph for.
- Fork this repository.
- Add a folder under `subgraphs` with the name of the protocol you want to work on.
- Copy over the corresponding schema from the root folder. For example, if you are working on a yield aggregator, you should copy over `schema-yield.graphql` to your folder and rename it to `schema.graphql`. Note `schema-common.graphql` is used for schema design and reference, and should never be used for implementation.
- Build the subgraph within that folder. Feel free to use the [reference subgraph](./subgraphs/_reference_/) as a reference.
- Submit a PR (pull request) to this repo after you are done. Make sure you submit your PR as a draft if it's a work-in-progress. Include a link to your deployment in your PR description.

## Recommended Development Workflow

- Start with understanding the protocol. An easy start could be interacting with the protocol UI on testnets, check transaction details on Etherscan and pay attention to key events that are emitted.
- Go over the smart contracts. Identify the ones that we need to pull data from.
  - Usually each protocol has a factory contract that's responsible for tracking other contracts (e.g. Uniswap's Factory contract, Aave's Lending Pool Registry, Yearn's Registry).
  - Also a pool/vault contract that's responsible for pool level bookkeeping and transactions (e.g. Uniswap's Pair contract, Yearn's Vault contract, Aave's Lending Pool contract).
- Go over the schema and think about what data are needed from smart contract events/calls to map to the fields in each entity.
  - It's easiest to start with more granular entities and build up to aggregated data.
  - For example, usually it's easier to start writing mappings for transactions and usage metrics.
- Go over the documents in the `docs` folder. That should answer lots of questions you may have.
- Implement the mappings, deploy and test your data using either Hosted Service or The Graph Studio.
- For metrics calculation (e.g. revenue, fees, TVL), please refer to the `README.md` in the protocol's subgraph folder for methodology. There is also a broader explanation of how different fields are defined in the schema in `docs/Schema.md`. Feel free to reach out to me if anything isn't clear.
- We've built a handy debugging/validation dashboard for you to quickly visualize the data in your subgraph. It's deployed to [subgraphs.xyz](https://subgraphs.xyz/) and the source code is under `dashboard` if you want to spin it up locally.
- Verify your subgraph against other sources and include specific links to these sources in the README. Below are some common sources:
  - Project's official analytics dashboard
  - [DeFi Llama](https://defillama.com/) (for TVL)
  - [Dune Analytics](https://dune.xyz/)
  - [TokenTerminal](https://www.tokenterminal.com/terminal)

## Resources

### Introductory

- Learn the basics of GraphQL: [https://graphql.org/learn/](https://graphql.org/learn/)
- Query subgraphs using GraphQL: https://thegraph.com/docs/en/developer/graphql-api/
- Get familiar with The Graph: [https://thegraph.academy/developers/](https://thegraph.academy/developers/)
- Defining a subgraph: [https://thegraph.academy/developers/defining-a-subgraph/](https://thegraph.academy/developers/defining-a-subgraph/)
- Creating a subgraph: https://thegraph.com/docs/en/developer/create-subgraph-hosted/
- Deploying a subgraph using The Graph Studio: [https://thegraph.com/docs/en/studio/deploy-subgraph-studio/](https://thegraph.com/docs/en/studio/deploy-subgraph-studio/)

### Intermediate

- [AssemblyScript API](https://thegraph.com/docs/en/developer/assemblyscript-api/)
- [Unit Test Using Matchstick](https://thegraph.com/docs/en/developer/matchstick/)
- [Building a Subgraph for Sushiswap](https://docs.simplefi.finance/subgraph-development-documentation/sushiswap-subgraph-development)
- [Building a Subgraph for Loopring](https://www.youtube.com/watch?v=SNmzhwlQqgU)
  - Using templates (dynamic data sources)
  - Indexing proxies

### Advanced

- Building ambitious subgraphs (Part I): https://www.youtube.com/watch?v=4V2o5YJooOM
  - Schema design
  - Error handling
  - Interface and union types
- Building ambitious subgraphs (Part II) https://www.youtube.com/watch?v=1-8AW-lVfrA
  - Performance tips and tricks (for both mappings and queries)
- [Documentation for the graph-node](https://github.com/graphprotocol/graph-node/tree/master/docs)

## Development Status

🔨 = In progress.  
🛠 = Feature complete. Additional testing required.  
✅ = Production-ready.  

| Protocol |  Status | Versions † | Deployments |
| ------- |  :------: | --- | --- |
| **DEX AMM** |    | |
| [Apeswap](https://apeswap.finance/) | 🛠 | 1.3.0 / 1.1.1 / 1.0.0 | [![Apeswap BSC](./docs/images/chains/bsc.png)](https://thegraph.com/hosted-service/subgraph/messari/apeswap-bsc) [![Apeswap Polygon](./docs/images/chains/matic.png)](https://thegraph.com/hosted-service/subgraph/messari/apeswap-polygon) |
| [Balancer v2](https://balancer.fi/) | 🛠 | 1.3.0 / 1.1.2 / 1.0.0 | [![Balancer V2 Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/balancer-v2-ethereum) [![Balancer V2 Arbitrum](./docs/images/chains/arbitrum.png)](https://thegraph.com/hosted-service/subgraph/messari/balancer-v2-arbitrum) [![Balancer V2 Polygon](./docs/images/chains/matic.png)](https://thegraph.com/hosted-service/subgraph/messari/balancer-v2-polygon)|
| Bancor v3 | 🔨 | | |
| [Beethoven X](https://beets.fi/) | 🛠 | 1.3.0 / 1.1.2 / 1.0.0 | [![Beethoven X Fantom](./docs/images/chains/fantom.png)](https://thegraph.com/hosted-service/subgraph/messari/beethoven-x-fantom) [![Beethoven X Optimism](./docs/images/chains/optimism.png)](https://thegraph.com/hosted-service/subgraph/messari/beethoven-x-optimism)  |
| [Curve](https://curve.fi/) | 🛠 | 1.2.1 / 1.0.0 / 1.0.0 | [![Curve Finance Gnosis](./docs/images/chains/xdai.png)](https://thegraph.com/hosted-service/subgraph/messari/curve-finance-gnosis) [![Curve Finance Polygon](./docs/images/chains/matic.png)](https://thegraph.com/hosted-service/subgraph/messari/curve-finance-polygon) [![Curve Finance Arbitrum](./docs/images/chains/arbitrum.png)](https://thegraph.com/hosted-service/subgraph/messari/curve-finance-arbitrum) [![Curve Finance Optimism](./docs/images/chains/optimism.png)](https://thegraph.com/hosted-service/subgraph/messari/curve-finance-optimism) [![Curve Finance Fantom](./docs/images/chains/fantom.png)](https://thegraph.com/hosted-service/subgraph/messari/curve-finance-fantom) [![Curve Finance Avalanche](./docs/images/chains/avalanche.png)](https://thegraph.com/hosted-service/subgraph/messari/curve-finance-avalanche) [![Curve Finance Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/curve-finance-ethereum) |
| DODO v2 | 🔨 | | |
| [Ellipsis Finance](https://ellipsis.finance/) | 🛠 | 1.2.1 / 1.0.0 / 1.0.0 | [![Ellipsis Finance BSC](./docs/images/chains/bsc.png)](https://thegraph.com/hosted-service/subgraph/messari/ellipsis-finance-bsc) |
| [Quickswap](https://quickswap.exchange/#/swap) | 🛠 | 1.3.0 / 1.0.0 / 1.0.0 | [![Quickswap Polygon](./docs/images/chains/matic.png)](https://thegraph.com/hosted-service/subgraph/messari/quickswap-polygon) |
| Platypus Finance | 🔨 | | |
| [Saddle Finance](https://saddle.finance/#/) | 🛠 | 1.3.0 / 1.1.0 / 1.0.0 | [![Saddle Finance Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/saddle-finance-ethereum) [![Saddle Finance Arbitrum](./docs/images/chains/arbitrum.png)](https://thegraph.com/hosted-service/subgraph/messari/saddle-finance-arbitrum) [![Saddle Finance Fantom](./docs/images/chains/fantom.png)](https://thegraph.com/hosted-service/subgraph/messari/saddle-finance-fantom) [![Saddle Finance Optimism](./docs/images/chains/optimism.png)](https://thegraph.com/hosted-service/subgraph/messari/saddle-finance-optimism) |
| [Solarbeam](https://solarbeam.io/) | 🛠 | 1.3.0 / 1.0.0 / 1.0.0 | [![Solarbeam Moonriver](./docs/images/chains/moonriver.png)](https://thegraph.com/hosted-service/subgraph/messari/solarbeam-moonriver) |
| [SpiritSwap](https://www.spiritswap.finance/) | 🛠 | 1.3.0 / 1.0.0 / 1.0.0 | [![SpiritSwap Fantom](./docs/images/chains/fantom.png)](https://thegraph.com/hosted-service/subgraph/messari/spiritswap-fantom) |
| [SpookySwap](https://spooky.fi/) | 🛠 | 1.3.0 / 1.1.1 / 1.0.0 | [![SpookySwap Fantom](./docs/images/chains/fantom.png)](https://thegraph.com/hosted-service/subgraph/messari/spookyswap-fantom) |
| [Ubeswap](https://ubeswap.org/) | 🛠 | 1.3.0 / 1.1.1 / 1.0.0 | [![Ubeswap Celo](./docs/images/chains/celo.png)](https://thegraph.com/hosted-service/subgraph/messari/ubeswap-celo) |
| [VVS Finance](https://vvs.finance/) | 🛠 | 1.3.0 / 1.1.1 / 1.0.0 | [![VVS Finance Cronos](./docs/images/chains/cronos.png)](https://graph.cronoslabs.com/subgraphs/name/messari/vvs-finance) |
| [SushiSwap](https://www.sushi.com/) | 🛠 | 1.3.0 / 1.1.1 / 1.0.0 | [![SushiSwap Celo](./docs/images/chains/celo.png)](https://thegraph.com/hosted-service/subgraph/messari/sushiswap-celo) [![SushiSwap Fuse](./docs/images/chains/fuse.png)](https://thegraph.com/hosted-service/subgraph/messari/sushiswap-fuse) [![SushiSwap Moonriver](./docs/images/chains/moonriver.png)](https://thegraph.com/hosted-service/subgraph/messari/sushiswap-moonriver) [![SushiSwap Avalanche](./docs/images/chains/avalanche.png)](https://thegraph.com/hosted-service/subgraph/messari/sushiswap-avalanche) [![SushiSwap BSC](./docs/images/chains/bsc.png)](https://thegraph.com/hosted-service/subgraph/messari/sushiswap-bsc) [![SushiSwap Arbitrum](./docs/images/chains/arbitrum.png)](https://thegraph.com/hosted-service/subgraph/messari/sushiswap-arbitrum) [![SushiSwap Fantom](./docs/images/chains/fantom.png)](https://thegraph.com/hosted-service/subgraph/messari/sushiswap-fantom) [![SushiSwap Polygon](./docs/images/chains/matic.png)](https://thegraph.com/hosted-service/subgraph/messari/sushiswap-polygon) [![SushiSwap Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/sushiswap-ethereum) [![SushiSwap Gnosis](./docs/images/chains/xdai.png)](https://thegraph.com/hosted-service/subgraph/messari/sushiswap-gnosis) |
| [Trader Joe](https://traderjoexyz.com/home#/) | 🛠 | 1.3.0 / 1.0.0 / 1.0.0 | [![Trader Joe Avalanche](./docs/images/chains/avalanche.png)](https://thegraph.com/hosted-service/subgraph/messari/trader-joe-avalanche) |
| [Uniswap v2](https://uniswap.org/) | 🛠 | 1.3.0 / 1.1.1 / 1.0.0 | [![Uniswap V2](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/uniswap-v2-ethereum) |
| [Uniswap v3](https://uniswap.org/) | 🛠 | 1.3.0 / 1.1.1 / 1.0.0 | [![Uniswap V3](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/uniswap-v3-ethereum) [![Uniswap V3 Polygon](./docs/images/chains/matic.png)](https://thegraph.com/hosted-service/subgraph/messari/uniswap-v3-polygon) [![Uniswap V3 Optimism](./docs/images/chains/optimism.png)](https://thegraph.com/hosted-service/subgraph/messari/uniswap-v3-optimism) [![Uniswap V3 Arbtitrum](./docs/images/chains/arbitrum.png)](https://thegraph.com/hosted-service/subgraph/messari/uniswap-v3-arbitrum)|
| **Lending Protocols** |    | |
| [Aave v2](https://aave.com/) | 🛠 | 1.1.0 / 1.1.31 / 1.0.0 | [![Aave V2 Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/aave-v2-ethereum) |
| [Aave v3](https://aave.com/) | 🔨 | 1.3.0 / 1.0.0 / 1.0.0 | [![Aave V3 Optimism](./docs/images/chains/optimism.png)](https://thegraph.com/hosted-service/subgraph/messari/aave-v3-optimism) [![Aave V3 Polygon](./docs/images/chains/matic.png)](https://thegraph.com/hosted-service/subgraph/messari/aave-v3-polygon) [![Aave V3 Harmony](./docs/images/chains/harmony.png)](https://thegraph.com/hosted-service/subgraph/messari/aave-v3-harmony) [![Aave V3 Fantom](./docs/images/chains/fantom.png)](https://thegraph.com/hosted-service/subgraph/messari/aave-v3-fantom) [![Aave V3 Avalanche](./docs/images/chains/avalanche.png)](https://thegraph.com/hosted-service/subgraph/messari/aave-v3-avalanche) [![Aave V3 Arbitrum](./docs/images/chains/arbitrum.png)](https://thegraph.com/hosted-service/subgraph/messari/aave-v3-arbitrum) |
| [Aurigami](https://www.aurigami.finance/) | 🛠 | 1.3.0 / 1.0.6 / 1.0.0  | [![Aurigami Aurora](./docs/images/chains/aurora.png)](https://thegraph.com/hosted-service/subgraph/messari/aurigami-aurora) |
| [Bastion Protocol](https://bastionprotocol.com/) | 🛠 | 1.3.0 / 1.0.9 / 1.0.0 | [![Bastion Protocol Aurora](./docs/images/chains/aurora.png)](https://thegraph.com/hosted-service/subgraph/messari/bastion-protocol-aurora) |
| [Banker Joe](https://traderjoexyz.com/lending#/) | 🛠 | 1.3.0 / 1.0.5 / 1.0.0 | [![Banker Joe Avalanche](./docs/images/chains/avalanche.png)](https://thegraph.com/hosted-service/subgraph/messari/banker-joe-avalanche) |
| [BENQI](https://benqi.fi/) | 🛠 | 1.3.0 / 1.0.6 / 1.0.0 | [![BENQI Avalanche](./docs/images/chains/avalanche.png)](https://thegraph.com/hosted-service/subgraph/messari/benqi-avalanche) |
| [Compound](https://compound.finance/) | 🛠 | 1.3.0 / 1.6.6 / 1.0.0 | [![Compund Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/compound-ethereum) |
| [CREAM Finance](https://cream.finance/) | 🛠 | 1.3.0 / 1.0.6 / 1.0.0 | [![CREAM Finance Arbitrum](./docs/images/chains/arbitrum.png)](https://thegraph.com/hosted-service/subgraph/messari/cream-finance-arbitrum) [![CREAM Finance Polygon](./docs/images/chains/matic.png)](https://thegraph.com/hosted-service/subgraph/messari/cream-finance-polygon) [![CREAM Finance BSC](./docs/images/chains/bsc.png)](https://thegraph.com/hosted-service/subgraph/messari/cream-finance-bsc) [![CREAM Finance Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/cream-finance-ethereum)|
| dForce | 🛠 | | |
| Euler Finance | 🔨 | | |
| Geist | 🔨 | | |
| [Iron Bank](https://app.ib.xyz/) | 🛠 | 1.3.0 / 1.0.8 / 1.0.0 | [![Iron Bank Fantom](./docs/images/chains/fantom.png)](https://thegraph.com/hosted-service/subgraph/messari/iron-bank-fantom) [![Iron Bank Avalanche](./docs/images/chains/avalanche.png)](https://thegraph.com/hosted-service/subgraph/messari/iron-bank-avalanche) [![Iron Bank Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/iron-bank-ethereum) |
| Maple Finance | 🔨 | | |
| [Moonwell Finance](https://moonwell.fi/) | 🛠 | 1.3.0 / 1.0.9 / 1.0.0 | [![Moonwell Moonriver](./docs/images/chains/moonriver.png)](https://thegraph.com/hosted-service/subgraph/messari/moonwell-moonriver)  |
| Notional Finance | 🔨 | | |
| [Rari Fuse](https://app.rari.capital/fuse) | 🔨 | 1.3.0 / 1.0.16 / 1.0.0 | [![Rari Fuse Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/rari-fuse-ethereum) [![Rari Fuse Arbitrum](./docs/images/chains/arbitrum.png)](https://thegraph.com/hosted-service/subgraph/messari/rari-fuse-arbitrum) |
| [SCREAM](https://scream.sh/) | 🛠 | 1.3.0 / 1.0.6 / 1.0.0 | [![SCREAM Fantom](./docs/images/chains/fantom.png)](https://thegraph.com/hosted-service/subgraph/messari/scream-fantom)  |
| TrueFi |   | | |
| [Venus Protocol](https://venus.io/) | 🛠 | 1.3.0 / 1.0.6 / 1.0.0 | [![Venus Protocol BSC](./docs/images/chains/bsc.png)](https://thegraph.com/hosted-service/subgraph/messari/venus-protocol-bsc) |
| [Yeti Finance](https://yeti.finance/) | 🔨 | | |
| **CDPs** |    | |
| [Abracadabra](https://abracadabra.money/) | 🛠 | 1.3.0 / 1.0.5 / 1.0.0| [![Abracadabra Money](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/abracadabra-money-ethereum) [![Abracadabra Money](./docs/images/chains/bsc.png)](https://thegraph.com/hosted-service/subgraph/messari/abracadabra-money-bsc) [![Abracadabra Money](./docs/images/chains/arbitrum.png)](https://thegraph.com/hosted-service/subgraph/messari/abracadabra-money-arbitrum) [![Abracadabra Money](./docs/images/chains/fantom.png)](https://thegraph.com/hosted-service/subgraph/messari/abracadabra-money-fantom) [![Abracadabra Money](./docs/images/chains/avalanche.png)](https://thegraph.com/hosted-service/subgraph/messari/abracadabra-money-avalanche) |
| Alchemix |   | | |
| [Inverse Finance](https://www.inverse.finance/) | 🛠 | 1.3.0 / 1.2.2 / 1.0.0  | [![Inverse Finance Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/inverse-finance-ethereum)|
| [Liquity](https://www.liquity.org/) | 🛠 | 1.3.0 / 1.1.4 / 1.0.1 | [![Liquity Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/liquity-ethereum) |
| [MakerDAO](https://makerdao.com/en/) | 🛠 | 1.3.0 / 1.1.0 / 1.0.0 | [![MakerDAO Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/makerdao-ethereum?selected=playground) |
| [QiDAO](https://app.mai.finance/) | 🛠 | 1.3.0 / 1.1.0 / 1.0.0 | [![QiDAO Arbitrum](./docs/images/chains/arbitrum.png)](https://thegraph.com/hosted-service/subgraph/messari/qidao-arbitrum) [![QiDAO Avalanche](./docs/images/chains/avalanche.png)](https://thegraph.com/hosted-service/subgraph/messari/qidao-avalanche) [![QiDAO BSC](./docs/images/chains/bsc.png)](https://thegraph.com/hosted-service/subgraph/messari/qidao-bsc) [![QiDAO Fantom](./docs/images/chains/fantom.png)](https://thegraph.com/hosted-service/subgraph/messari/qidao-fantom) [![QiDAO Polygon](./docs/images/chains/matic.png)](https://thegraph.com/hosted-service/subgraph/messari/qidao-polygon) [![QiDAO Moonriver](./docs/images/chains/moonriver.png)](https://thegraph.com/hosted-service/subgraph/messari/qidao-moonriver) [![QiDAO Optimism](./docs/images/chains/optimism.png)](https://thegraph.com/hosted-service/subgraph/messari/qidao-optimism) [![QiDAO Gnosis](./docs/images/chains/xdai.png)](https://thegraph.com/hosted-service/subgraph/messari/qidao-gnosis) |
| **Yield Aggregators** |     | |
| [Arrakis Finance](https://www.arrakis.finance/) |  | | |
| Badger DAO | 🔨 | | |
| Beefy Finance | 🛠 | | |
| [Belt Finance](https://belt.fi/landing) | 🛠 | 1.2.1 / 1.0.0 / 1.0.0 | [![Belt BSC](./docs/images/chains/bsc.png)](https://thegraph.com/hosted-service/subgraph/messari/belt-finance-bsc) |
| [Convex Finance](https://www.convexfinance.com/) | 🛠 | 1.3.0 / 1.1.1 / 1.0.0 | [![Convex Finance Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/convex-finance-ethereum) |
| [Gamma Strategy](https://www.gamma.xyz/) | 🛠 | 1.2.1 / 1.0.0 / 1.0.0 | [![Gamma Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/gamma-ethereum) [![Gamma Polygon](./docs/images/chains/matic.png)](https://thegraph.com/hosted-service/subgraph/messari/gamma-polygon) |
| Harvest Finance | 🔨  | | |
| Liquid Driver | 🔨  | | |
| [Rari Vaults](https://rari.capital/) | 🛠 | 1.2.1 / 1.3.13 / 1.0.0 | [![Rari Vaults Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/rari-vaults-ethereum)|
| [Stake DAO](https://stakedao.org/) | 🛠 | 1.3.0 / 1.3.0 / 1.0.0 | [![Stake DAO](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/stake-dao-ethereum)|
| [Tokemak](https://www.tokemak.xyz/) | 🛠 | 1.2.1 / 1.0.0 / 1.0.0 | [![Tokemak](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/tokemak-ethereum) |
| Vesper Finance | 🔨 | | |
| Yield Yak | 🔨 | | |
| [Yearn v2](https://yearn.fi/) | 🛠 | 1.3.0 / 1.2.0 / 1.0.0 | [![Yearn V2 Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/yearn-v2-ethereum) [![Yearn V2 Arbitrum](./docs/images/chains/arbitrum.png)](https://thegraph.com/hosted-service/subgraph/messari/yearn-v2-arbitrum) [![Yearn V2 Fantom](./docs/images/chains/fantom.png)](https://thegraph.com/hosted-service/subgraph/messari/yearn-v2-fantom) |
| **Network Subgraph** |    | |
| EVM | 🔨 | | |
| Cosmos | 🔨 | | |
| NEAR | 🔨 | | |
| Arweave | 🔨 | | |
| **ERC20 Subgraph** |    | |
| TBD | 🔨 | | |
| **ERC721 Subgraph** |    | |
| TBD | 🔨 | | |

† Versions are schema version, subgraph version, methodology version respectively
