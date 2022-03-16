# Subgraphs

## Contribution Guidelines

- Decide which protocol you want to build a subgraph for
- Fork this repository
- Add a folder under `subgraphs` with the name of the protocol you want to work on
- Copy over the corresponding schema from the root folder. For example, if you are working on a yield aggregator, you should copy over `schema-yield.graphql` to your folder and rename it to `schema.graphql`
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

## Resources

- Learn the basics of GraphQL: [https://graphql.org/learn/](https://graphql.org/learn/)
- Get familiar with Uniswap: [https://uniswap.org/faq](https://uniswap.org/faq)
- Get familiar with The Graph: [https://thegraph.academy/developers/](https://thegraph.academy/developers/)
- Creating a subgraph: [https://thegraph.academy/developers/defining-a-subgraph/](https://thegraph.academy/developers/defining-a-subgraph/)
- Deploying a subgraph to The Graph Studio: [https://thegraph.com/docs/en/studio/deploy-subgraph-studio/](https://thegraph.com/docs/en/studio/deploy-subgraph-studio/)

