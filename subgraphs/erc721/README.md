# ERC-721 Non-Fungible Token Subgraph

The subgraph monitor all transfer events, and then aggregate the results accordingly if it is decided the event is related with ERC721 smart contract.

## Calculation Methodology v1.0.0

### Collection's Token Count

Count of unique minted tokens in the collection

### Collection's Owner Count

Count of unique addresses unique token owners holding tokens in the collection

### Collection's Transfer Count

Count of transfer event which have interacted with the protocol via transfer transaction

### Collection's Daily Transfer Amount

Total number of tokens transfered between accounts during a day via transfer transaction

ERC-721 Non-Fungible Token Standard

- https://ethereum.org/en/developers/docs/standards/tokens/erc-721/
