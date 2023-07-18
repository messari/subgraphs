# Uniswap V3 Forks - Swap

> Note: This subgraph only tracks the `Swap` events.<br/>
> All the other events have been ignored. If you wish to see other entities and metrics for uniswap-v3-forks, you may check the [uniswap-v3-forks subgraphs here](https://github.com/messari/subgraphs/tree/master/subgraphs/uniswap-v3-forks).

## Protocols:

- Pancakeswap V3 - Swap (Mainnet)

## Project Layout:

### schema.graphql

- Shared schema for all Uniswap V3 forks.

### abis

- ABI's for all forks. There are folders to contain ABIs for each protocol

### protocols

- Contains a `src` folder for protocols specifc code and a `config` folder that contains network specific configurations and subgraph.yaml templates.

### src

- The `src` folder at the head of the Uniswap V3 Forks directory contains code shared by all protocols within. Protocol specific code is store in the `src` folder specific to each protocol within the `protocols` folder.

### configurations

- The `configurations` folder contains code used for instantiating the proper configurations for a specific deployment. It pulls the configurations from the network specific configurations within the `config` folder for a specific protocol.
