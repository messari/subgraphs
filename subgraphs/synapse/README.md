# Synapse 

Synapse is a cross-chain liquidity network secured by validators utilizing multi-party computation (MPC) and threshold signature schemes (TSS). It combines AMMs from multiple chains with its own liquidity pools to allow efficient and low slippage transfer of assets between chains. All in all, Synapse allows users to effortlessly and seamlessly bridge or swap assets between chains, with over $10.5 billion USD in bridged volume. 

## Usage Metrics

`Active Users`, `Total Unique Users` & `Daily Transaction Count`

Users of Synapse are those taking the following actions:

Bridge Assets
Swap Assets
Liquidity Pools
Deposit Assets
Withdraw Assets
Stake LP position
Send Messages


## Total Value Locked USD

Synapse operates as 1) Canonical token bridge, bridging wrapped assets and 2) Liquidity asset bridge, having liquidity pools on either side of the bridge to transfer native assets. Liquidity providers can stake their LP position with Synapse, to help facilitate cross chain swaps and bridging in return for SYN emissions. 

TVL (USD)=`TotalDeposits (USD)`

## Protocol Controlled Value USD

Synapse participated in the Olympus bond program, and holds LP as protocol owned liquidity. Additionally, it owns some staking positions such as OHM. 

 Protocol Controlled Value (USD) = `LPHeld (USD)`+`StakingPositions (USD)`

## Total Revenue USD

The Synapse bridge by default charges 0.05% per bridge transaction, with a minimum fee that is chain-specific and dependent on the average gas fees on that chain. 

TotalRevenue (USD)=`ProtocolRevenue (USD)`+`SupplySideRevenue (USD)`



Multi-Chain: Exact swap fee percentages vary depending on the chain and pool. The trading fee (swap fee) can be seen in each pool page at https://synapseprotocol.com/pools. For many pools, the swap fee is 0.01%. In general for all pools and chains,
1NSwapFees= 
(`VolumePool1`*`SwapFee1`)+(`VolumePool2`*`SwapFee2`)+ . . . (`VolumePoolN`*`SwapFeeN`)

### Supply Side Revenue USD

Every Synapse stableswap pool charges small fees per swap which are currently split 40% to LPs, 60% as an admin fee for the protocol. 

SupplySideRevenue (USD)=(0.4*`SwapFees`)+`PoolYield`

Protocol Revenue USD

The protocol keeps all bridge fees, and 60% of swap fees. 

Protocol Revenue equation:

ProtocolRevenue (USD)= `BridgeFees`+(0.6*`SwapFees`)+`PCVYield`

where

`BridgeFees`=0.05100*`BridgeVolume (USD)`

at a fee rate of 0.05% per bridge.

## Pool-Level Metrics

### Pool Total Value Locked USD

Across all of Synapse’s liquidity pools, the TVLs can be calculated as: 

PoolTVL (USD) = (`Token1` * `PriceToken1`) +(`Token2` * `PriceToken2`) 

## Reward Tokens & Reward Token Emissions Amount

SYN is emitted every block to all Synapse nUSD and nETH pools.
Current SYN emissions are around 262k per week (down over 75% since the launch of Synapse in September 2021). 


## Useful Links
### Protocol
https://synapseprotocol.com/ 
### Documentation
https://docs.synapseprotocol.com/ 
### Contract Addresses
https://docs.synapseprotocol.com/reference/contract-addresses 
### Github
https://github.com/synapsecns 
### Analytics
Synapse Analytics 
API https://synapse.dorime.org/

### Treasury Contracts (from official Discord)
    'ethereum': '0x67F60b0891EBD842Ebe55E4CCcA1098d7Aac1A55',
    'bsc': '0x0056580B0E8136c482b03760295F912279170D46',
    'polygon': '0xBdD38B2eaae34C9FCe187909e81e75CBec0dAA7A',
    'avalanche': '0xd7aDA77aa0f82E6B3CF5bF9208b0E5E1826CD79C',
    'arbitrum': '0x940279D22EB27415F2b0A0Ee6287749b5B19F43D',
    'fantom': '0x224002428cF0BA45590e0022DF4b06653058F22F',
    'boba': '0xbb227Fcf45F9Dc5deF87208C534EAB1006d8Cc8d',
    'moonriver': '0x4bA30618fDcb184eC01a9B3CAe258CFc5786E70E',
    'optimism': '0x2431CBdc0792F5485c4cb0a9bEf06C4f21541D52',
    'harmony': '0x0172e7190Bbc0C2Aa98E4d1281d41D0c07178605',
    'aurora': '0xbb227Fcf45F9Dc5deF87208C534EAB1006d8Cc8d',
    'moonbeam': '0xbb227Fcf45F9Dc5deF87208C534EAB1006d8Cc8d',
    'cronos': '0x7f91f3111b2009eC7c079Be213570330a37e8aeC',
    'metis': '0x44a5847E9d8d2ab037475b2bE4f07a1143D12c2c'

