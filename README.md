# Subgraphs

## Contribution Guidelines

- Decide which protocol you want to build a subgraph for
- Fork this repository
- Add a folder under `subgraphs` with the name of the protocol you want to work on
- Copy over the corresponding schema from the root folder. For example, if you are working on a yield aggregator, you should copy over `schema-yield.graphql` to your folder and rename it to `schema.graphql`. Note `schema-common.graphql` is used for schema design and reference, and should never be used for implementation
- Build the subgraph within that folder
- Submit a pull request to this repo after you are done

## Recommended Development Workflow

- Start with understanding the protocol and how it works
- Go over the smart contracts. Identify the ones that we need to pull data from
  - Usually each protocol has a factory contract that's responsible for tracking other contracts (e.g. Uniswap's Factory contract, Aave's Lending Pool Registry, Yearn's Registry)
  - Also a pool/vault contract that's responsible for pool level bookkeeping and transactions (e.g. Uniswap's Pair contract, Yearn's Vault contract, Aave's Lending Pool contract)
- Go over the schema and think about what data are needed from smart contract events/calls to map to the fields in each entity
  - It's easiest to start with more granular entities and build up to aggregated data
  - For example, usually it's easier to start writing mappings for transactions and usage metrics
- Go over the documents in the `docs` folder. That should answer lots of questions you may have
- Implement the mappings, deploy and test your data using either Hosted Service or The Graph Studio
- For specific metrics (esp. financial metrics), please refer to our [methodology](https://docs.google.com/spreadsheets/d/1C5n13sN57WVTK0SJNoQR0qLjV6SAGrFwzJoMkq8nNos/). Feel free to comment in the spreadsheet if anything is unclear or incorrect.
- Verify your subgraph against other sources and include specific links to these sources in the README. Below are some common sources:
  - Project's official analytics dashboard
  - [DeFi Llama](https://defillama.com/) (for TVL)
  - [Dune Analytics](https://dune.xyz/)
  - [TokenTerminal](https://www.tokenterminal.com/terminal)

## Resources

### Introductory

- Learn the basics of GraphQL: [https://graphql.org/learn/](https://graphql.org/learn/)
- Query subgraphs using GraphQL: https://thegraph.com/docs/en/developer/graphql-api/
- Get familiar with The Graph: [https://thegraph.academy/developers/](https://thegraph.academy/developers/)
- Defining a subgraph: [https://thegraph.academy/developers/defining-a-subgraph/](https://thegraph.academy/developers/defining-a-subgraph/)
- Creating a subgraph: https://thegraph.com/docs/en/developer/create-subgraph-hosted/
- Deploying a subgraph using The Graph Studio: [https://thegraph.com/docs/en/studio/deploy-subgraph-studio/](https://thegraph.com/docs/en/studio/deploy-subgraph-studio/)

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

| Feature |  Status |
| ------- |  :------: |
| **DEX AMM** |    |
| Uniswap v2 | 🛠 |
| Uniswap v3 | 🔨 |
| Sushiswap | 🔨 |
| Curve | 🔨 |
| Balancer v2 | |
| Bancor v2 | 🔨 |
| Bancor v3 | |
| DODO v2 |  |
| **Lending Protocols** |    |
| Aave v2 | 🔨  |
| Compound | 🔨  |
| Geist | 🔨  |
| Benqi | 🔨  |
| **Yield Aggregators** |     |
| Yearn v2 | 🔨 |
| Convex Finance | 🔨  |
| Badger DAO | 🔨 |
| Stake DAO | 🛠 |
| Beefy Finance |  |
| Tokemak | 🛠  |
| Harvest Finance | 🔨  |
| Yield Yak |  |
