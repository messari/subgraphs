# Uniswap Forks

## Protocols:

- Apeswap
  - BSC, Matic
    - The two chains use the code from uniswap V2. Additionally, there is a Masterchef and MasterchefV2 contract. BSC only uses the Masterchef contract, while MasterchefV2 is used on the Matic chain. The masterchef contracts are slightly different for Apeswap vs. Sushiswap in the naming of certain functions. It looks like Apeswap forked from Pancakeswap. This is why they each have a separate folder for Masterchef.
- Quickswap
  - Matic
    - Uses the same codebase as Uniswap-V2 for the factory and pools stored in the uniswap-forks/src folder
- Solarbeam
  - Moonriver
    - Uses the uniswap-v2 codebase as Uniswap V2 for factory and pools. Additionally, it uses a masterchef contract that is templated from Sushiswap's implementation.
- Spiritswap
  - Moonbeam
    - Uses the uniswap-v2 codebase as Uniswap V2 for factory and pools. Additionally, it uses a masterchef contract that is templated from Sushiswap's implementation.
- Sushiswap
  - Mainnet
    - The only code that differs between uniswap is the use of the masterchef contract. This contract allows users to deposit LP tokens to earn rewards. Mainnet usees both the Masterchef and MasterchefV2 contract for these purposes.
  - Arbitrum, Celo, Fantom, Fuse, Matic, Moonbeam, Moonriver, Xdai
    - Similarly, these chains inherit the same code from uniswap. However, these chains only use the MiniChef contract for staking LP and earning rewards. It works very similar to the Masterchef contracts.
  - BSC, Avalanche
    - These two sushiswap chains deploy in just the same way as Uniswap V2. Just with different configurations.
- Trader Joe
  - Avalanche
    - Uses the uniswap-v2 codebase as Uniswap V2 for factory and pools. Additionally, it uses a masterchefV2 contract that is templated from Sushiswap's implementation and a masterchefV3 contract that is deployed at a later start block.
- Ubeswap
  - Celo
    - Uses the uniswap-v2 codebase as Uniswap V2 for factory and pools. Additionally, it uses a PoolManager contract that manages and creates staking pools. These staking pools created and monitored using templates where you can get deposit, withdraw, and rewards data. The code for the staking pools are quite different than Sushiswap, because the desired events are stored in the StakingPool contracts created by the PoolManager contract which are instantiated for each pool.
- Uniswap V2
  - Mainnet
    - Uniswap V2 serves as a base for the deployment of the other subgraphs. The others are forks of uniswap and inherit the baseline functionality for pool creation, pool management, and events like swaps, deposits, and withdraws. The code for these functionailities are the same code used for all forks specified.
- VVS
  - Cronos
    - Uses the uniswap-v2 codebase as Uniswap V2 for factory and pools. Additionally, it uses a masterchef contract that is templated from Sushiswap's implementation.
    - This is not deployed on the hosted service. It is deployed on cronos. This is the query URL https://graph.cronoslabs.com/subgraphs/name/vvs-finance-cronos/first-subgraph
- Honeyswap
  - xDAI (Gnosis Chain), Matic (Polygon)
    - Uses the uniswap-v2 codebase as Uniswap V2 for factory and pools. Additionally, it uses a HoneyFarm contract (based off of MasterChef) for staking LP and earning rewards.

## Project Layout:

### schema.graphql

- Shared schema for all Uniswap forks.

### abis

- ABI's for all forks. There are folders to contain ABIs for each protocol

### src

- Contains all logic for deploying all subgraphs. When the logic is not shared accross protocols, create a separate folder for each - See Masterchef.

### config

- Config folder contains folders for each protocol. In these folders, add the configurations for each network. These configurations include constants to be used in the main program, and the template with .json configurations for the subgraph.yaml file

### deployment

- This folder contains the code and configurations for deploying according to the **Deployment Instructions** section.
