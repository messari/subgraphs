# ERC20 Token Subgraph

The subgraph read erc20 token list from IPFS, monitor the tokens' event and aggregate the results accordingly.

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
