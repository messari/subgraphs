# Uniswap v2 Subgraph

## Links

- Protocol: https://uniswap.org/
- Analytics: https://info.uniswap.org/
- Docs: https://docs.uniswap.org/protocol/V2/introduction
- Smart contracts: https://github.com/Uniswap/v2-core
- Deployed addresses: https://docs.uniswap.org/protocol/V2/reference/smart-contracts/factory
- Official subgraph: https://github.com/Uniswap/v2-subgraph

## Build

- Initialize subgraph (Subgraph Studio):
  ```
  graph init --product subgraph-studio
  --from-contract <CONTRACT_ADDRESS> [--network <ETHEREUM_NETWORK>] [--abi <FILE>] <SUBGRAPH_SLUG> [<DIRECTORY>]
  ```
- Initialize subgraph (Hosted Service):
  ```
  graph init --product hosted-service --from-contract <CONTRACT_ADDRESS> <GITHUB_USER>/<SUBGRAPH_NAME>[<DIRECTORY>]
  ```
- Generate code from manifest and schema: `graph codegen`
- Build subgraph: `graph build`

## Deploy

- Authenticate (just once): `graph auth --product hosted-service <ACCESS_TOKEN>`
- Deploy to Hosted Service: `graph deploy --product hosted-service <GITHUB_USER>/<SUBGRAPH_NAME>`
- Deploy to Subgraph Studio: `graph deploy --studio <SUBGRAPH_NAME>`
