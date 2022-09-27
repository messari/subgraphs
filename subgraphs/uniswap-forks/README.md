# Uniswap Forks

## Protocols:

- Apeswap (BSC, Matic)
- Quickswap (Matic)
- Solarbeam (Moonriver)
- Spiritswap (Moonbeam)
- Sushiswap (Mainnet, Arbitrum, Celo, Fantom, Fuse, Matic, Moonbeam, Moonriver, Xdai, BSC, Avalanche)
- Trader Joe (Avalanche)
- Ubeswap (Celo)
- Uniswap V2 (Mainnet)
- VVS (Cronos)
- Honeyswap (Gnosis, Polygon)

## Calculation Methodology v1.0.0

### Tokens

- Tokens are priced by tracking a whitelisted set of tokens. These tokens are particular to a specific protocol and network. The price for a token is derived by getting its price from the pool with the largest total value locked that contains itself and a token within the whitelist. There is a minimum liquidity threshold for each protocol and network for a token to be priced against a whitelisted token. Pricing can be done in this way becuase it the total value of each token in a liquidity pool are expected to have close to the same value.

## Project Layout:

### schema.graphql

- Shared schema for all Uniswap forks.

### abis

- ABI's for all forks. There are folders to contain ABIs for each protocol

### protocols

- Contains a `src` folder for protocols specifc code and a `config` folder that contains network specific configurations and subgraph.yaml templates.

### src

- The `src` folder at the head of the Uniswap Forks directory contains code shared by all protocols within. Protocol specific code is store in the `src` folder specific to each protocol within the `protocols` folder.

### configurations

- The `configurations` folder contains code used for instantiating the proper configurations for a specific deployment. It pulls the configurations from the network specific configurations within the `config` folder for a specific protocol.
