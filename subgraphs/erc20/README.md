# ERC20 Token Subgraph

The subgraph reads ERC20 token list from IPFS, monitors the tokens' events and aggregates the results accordingly.

## Calculation Methodology v1.0.0

### Token's Current Holder Count

Count of Unique Addresses which are currently holding the token

### Token's Cumulative Holder Count

Count of Unique Addresses which have held or are holding the token

### Token's Transfer Count

Count of Transfer Event which have interacted with the protocol via transfer transaction

`Transfers`

### Token's Daily Transfer Amount

Total number of tokens transfered between accounts during a day via transfer transaction

`Transfers`

ERC20 Token Standard

- https://ethereum.org/en/developers/docs/standards/tokens/erc-20/

## Building/Deployment
```bash
# Prepare Token Registry
npm run prepare:constants --NETWORK=mainnet --YEAR=2022
# Build
npm run build
# Deploy
npm run deploy --NETWORK=mainnet --YEAR=2022 --LOCATION=messari/erc20-holders-2022
```
