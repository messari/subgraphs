# Liquid Driver

Liquid Driver is the first liquidity mining dApp providing liquidity-as-a-service in the Fantom ecosystem. 

## Links

- Protocol: https://www.liquiddriver.finance/
- Analytics: https://analyticsliquiddriver.com/?orgId=1
- Docs: https://docs.liquiddriver.finance/
- Smart contracts: https://github.com/LiquidDriver-finance/liquiddriver-contracts
- Deployed addresses:
   - Factory/Master Address: `0x742474dae70fa2ab063ab786b1fbe5704e861a0c`
   - Token Address: `0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9`
   - Burner: `0x05b7109b2dae299d882c410c1a281fc194658e89`

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
