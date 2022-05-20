# Uniswap Forks 

## Protocols:
- Uniswap V2
    - Mainnet
        - Uniswap V2 serves as a base for the deployment of the other subgraphs. The others are forks of uniswap and inherit the baseline functionality for pool creation, pool management, and events like swaps, deposits, and withdraws. The code for  these functionailities are the same code used for all forks specified. 
- Sushiswap
    - Mainnet
        - The only code that differs between uniswap is the use of the masterchef contract. This contract allows users to deposit LP tokens to earn rewards. Mainnet usees both the Masterchef and MasterchefV2 contract for these purposes.
    - Arbitrum, Celo, Fantom, Fuse, Matic, Moonbeam, Moonriver, Xdai
        - Similarly, these chains inherit the same code from uniswap. However, these chains only use the Miniswap contract for staking LP and earning rewards. It works very similar to the Masterchef contracts. 
    - BSC, Avalanche
        - These two sushiswap chains deploy in just the same way as Uniswap V2. Just with different configurations. 
- Apeswap
    - BSC, Matic
        - The two chains use the code from uniswap V2. Additionally, there is a Masterchef and MasterchefV2 contract. BSC only uses the Masterchef contract, while MasterchefV2 is used on the Matic chain. The masterchef contracts are slightly different for Apeswap vs. Sushiswap in the naming of certain functions. This is why they each have a separate folder for Masterchef. 

## Deployment Instructions:
- Add/update configuraptions to the deployment/deploymentConfigurations.json file in order to add or update deployments.

```
# Deploys uniswap-v2 to mainnet in my hosted service.
npm run deploy uniswap-v2 mainnet steegecs

# Deploys uniswap-v2 to all networks in my hosted service.
npm run deploy uniswap-v2 steegecs

# Deploys protocols and networks in my hosted service.
npm run deploy steege
```

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
