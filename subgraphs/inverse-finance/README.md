# Inverse Finance Lending Protocol Subgraph

## Links

- Protocol: https://www.inverse.finance/
- Analytics: https://dune.xyz/naoufel/inverse-dao
- Docs: https://docs.inverse.finance/inverse-finance/about-inverse
- Smart contracts: https://github.com/InverseFinance/anchor
- Deployed addresses: https://docs.inverse.finance/inverse-finance/technical/smart-contracts
- Official subgraph: https://thegraph.com/studio/subgraph/inverse-subgraph/

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
- Deploy to Subgraph Studio: `graph deploy --studio <SUBGRAPH_NAME>`
- Deploy to Hosted Service: `graph deploy --product hosted-service <GITHUB_USER>/<SUBGRAPH_NAME>`

## Hosted Subgraph

- Hosted subgraph: https://thegraph.com/hosted-service/subgraph/tnkrxyz/inverse-finance