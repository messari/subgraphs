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
| [Apeswap](https://apeswap.finance/) | 🛠 | 1.0.1 / 1.0.0 / 1.0.0 | [![Apeswap BSC](./docs/images/chains/bsc.png)](https://thegraph.com/hosted-service/subgraph/messari/apeswap-bsc) [![Apeswap Polygon](./docs/images/chains/polygon.png)](https://thegraph.com/hosted-service/subgraph/messari/apeswap-polygon) |
| Balancer v2 | 🔨 | | |
| Bancor v2 | 🔨 | | |
| Bancor v3 | | | |
| Curve | 🔨 | | |
| DODO v2 | 🔨 | | |
| Ellipsis Finance |  | | |
| Platypus Finance | 🔨 | | |
| Saddle Finance | 🔨 | | |
| Sushiswap | 🔨 | | |
| [Uniswap v2](https://uniswap.org/) | 🛠 | 1.0.1 / 1.0.1 / 1.0.0 | [![Uniswap V2](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/uniswap-v2) |
| [Uniswap v3](https://uniswap.org/) | 🛠 | 1.0.1 / 1.0.0 / 1.0.0 | [![Uniswap V3](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/uniswap-v3) [![Uniswap V3 Polygon](./docs/images/chains/polygon.png)](https://thegraph.com/hosted-service/subgraph/messari/uniswap-v3-polygon) [![Uniswap V3 Optimism](https://messari.io/asset-images/51809842-fb42-470e-ab2d-1095334a5a4d/16.png?v=2)](https://thegraph.com/hosted-service/subgraph/messari/uniswap-v3-optimism) [![Uniswap V3 Arbtitrum](https://messari.io/asset-images/a288b358-f3d3-4ecd-aa30-c45c84f666ee/16.png?v=2)](https://thegraph.com/hosted-service/subgraph/messari/uniswap-v3-arbitrum)|
| **Lending Protocols** |    | |
| Aave v2 | 🔨 | | |
| Aave v3 |  | | |
| [Bastion Protocol](https://bastionprotocol.com/) | 🔨 | | |
| Benqi | 🔨 | | |
| [Compound](https://compound.finance/) | 🛠 | 1.0.1 / 1.0.0 / 1.0.0 | [![Compund Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/compound-ethereum) |
| CREAM | 🔨 | | |
| Geist | 🔨 | | |
| Hundred Finance | 🔨 | | |
| Maple Finance | 🔨 | | |
| Moola Market | 🔨 | | |
| Moonwell Finance | 🔨 | | |
| TrueFi |   | | |
| **CDPs** |    | |
| [Abracadabra](https://abracadabra.money/) | 🛠 | 1.1.0 / 0.0.6 / 1.0.0| [![Abracadabra Money](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/abracadabra-money) |
| Alchemix |   | | |
| Inverse Finance | 🔨 | | |
| [Liquity](https://www.liquity.org/) | 🛠 | 1.1.0 / 1.0.0 / 1.0.0 | [![Liquity Ethereum](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/liquity-ethereum) |
| MakerDAO | 🔨 | | |
| QiDAO |   | | |
| **Yield Aggregators** |     | |
| Autofarm |  | | |
| Badger DAO | 🔨 | | |
| Beefy Finance | | | |
| [Belt Finance](https://belt.fi/landing) | 🛠 | 1.1.0 / 1.0.0 / 1.0.0 | [![Belt BSC](./docs/images/chains/bsc.png)](https://thegraph.com/hosted-service/subgraph/messari/belt-finance-bsc) |
| Convex Finance | 🔨  | | |
| Harvest Finance | 🔨  | | |
| Liquid Driver | 🔨  | | |
| Pancakebunny | 🔨 | | |
| Rari Aggregator | 🔨 | | |
| Reaper Farm | 🔨  | | |
| [Stake DAO](https://stakedao.org/) | 🛠 | 1.0.0 / 1.0.0 / 1.0.0 | [![Stake DAO](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/stake-dao)|
| [Tokemak](https://www.tokemak.xyz/) | 🛠 | 1.0.0 / 1.0.0 / 1.0.0 | [![Tokemak](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/tokemak) |
| Vesper Finance | 🔨 | | |
| Yield Yak | 🔨 | | |
| [Yearn v2](https://yearn.fi/) | 🛠 | 1.2.0 / 1.0.0 / 1.0.0 | [![Yearn](./docs/images/chains/ethereum.png)](https://thegraph.com/hosted-service/subgraph/messari/yearn-v2-ethereum) |

† Versions are schema version, subgraph version, methodology version respectively
