# ERC-721 Non-Fungible Token Metadata Subgraph

The subgraph monitors all transfer events, gets the token's tokenURI link if the event is related with ERC721 token transfer, and then retrieves and parses the metadata json file to get rich metadata information, according to ERC721 metadata schema and OpenSea metadata standards, if the tokenURI points to a valid json file on IPFS network.

Furthermore, for ERC721 metadata parsing, there are some edge cases to consider: 

1. Some ERC721 contracts still use centralized web service for metadata hosting. For example, the tokenURI for fancybear is something like https://api.fancybearsmetaverse.com/1

For this case, the subgraph will try its best to retrieve the IPFS hash from the tokenURI if it contains IPFS hash. Otherwise, the subgraph will just store the tokenURI and won’t move forward to parse the metadata.

2. Some ERC721 contracts use centralized web service for metadata hosting at first and then switch to IPFS later on. For example, after minting out, the bayc contract switched to IPFS for metadata hosting after minting out. It changed the tokenURI by resetting the baseURI for the contract.

For this case, the subgraph monitors whether the tokenURI has changed by comparing with the token's tokenURI seen before in every transfer event handling. If the tokenURI changes, then the subgraph will update the specific token's tokenURI and metadata. 

ERC-721 Non-Fungible Token Standard

- https://ethereum.org/en/developers/docs/standards/tokens/erc-721/

OpenSea Metadata Standards

- https://docs.opensea.io/docs/metadata-standards
