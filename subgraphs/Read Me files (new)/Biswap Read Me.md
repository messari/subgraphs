# Biswap - Metrics

Biswap is a decentralized exchange (DEX) on Binance Smart Chain (BSC) for BEP-20 tokens. It promises the lowest transaction fees of any BSC exchange at 0.1%. Biswap is more than a DEX; it has Farms, Launchpools, Initial DEX Offerings, Lotteries, Non-Fungible Tokens, etc.
## Usage Metrics
`Active Users`, `Total Unique Users` & `Daily Transaction Count`

Biswap users are those who conduct one of the following transactions:
Liquidity Pool
Users who have deposited tokens in an LP
Users who have withdrawn tokens in an LP
Users who have swapped tokens in an LP
Farms (Users will receive LP tokens if they deposit tokens in an LP)
Users who have staked LP tokens 
Users who have harvested LP tokens
Launchpools (It is a platform that lets users stake their crypto tokens for new ones)
Users who stake BSW or other tokens to earn BSW or any other listed tokens
NFT Marketplace
Users who buy or sell NFTs 
Users who stake NFTs to earn tokens
Lottery
Users who buy lottery tickets using BSW tokens
## Financial Metrics

### Total Value Locked USD

The Total Value Locked (TVL) =`Total deposited tokens value across all pools (LPDeposits)` + `Staked tokens value on LaunchPools (StakedTokenLaunchPools)` + 
`Staked NFTs value (StakedNFTs)*`
*Depending if values exist for Staked NFTs


### Protocol Controlled Value USD

Biswap doesn’t have Protocol Controlled Value.

### Total Revenue USD


Total Revenue (USD) = `SupplySideRevenue` + `ProtocolRevenue`

### Supply-Side Revenue USD

Supply-Side Revenue of Biswap can be calculated based on the following components:
50% of the TransactionFee will be provided to the Liquidity Providers, i.e., 50% in 0.1% = 0.05% (LPTransactionFee)
Yield generated in Farms (YieldGenFarms)*
Yield generated in Launchpools (YieldGenLaunchpools)
Yield generated in NFTs Marketplace (YieldGenNFTs)
* excludes protocol reward tokens

Supply Side Revenue (USD) = `LPTransactionFee` + `YieldGenFarms` +
 `YieldGenLaunchPools` + `YieldGenNFTs`

### Protocol Revenue USD

Protocol Revenue of Biswap can be calculated based on the following components:
50% of the TransactionFee will be provided to the Protocol, i.e., 50% in 0.1% = 0.05% (ProtocolTransactionFee)
NFTs sales revenue (NFTSales)
13% of purchased lottery tickets (LotteryRevenue)
Minting new tokens in IDOs (MintTokenIDOs)

Protocol Revenue (USD) = `ProtocolTransactionFee` + `NFTSales` + 
				 `LotteryRevenue` + `MintTokenIDOs`
## Pool-Level Metrics

### Pool Total Value Locked USD

The Pool Total value Locked can be calculated by summing up all the assets deposited in the Liquidity Pools and Launchpools multiplied by the price of each asset in USD.

Pool Total Value Locked (USD) = (`LiquidityPoolDeposits` * `PriceOfAsset`) +
 (`LaunchpoolDeposits` * `PriceOfAsset`)

## Reward Tokens & Reward Token Emissions Amount 

Biswap has a maximum supply of 700 million BSW tokens. Out of those, 600 million tokens are allocated as follows:
Farms/Launchpools: 80.7% per block
Referral Program: 4.3% per block
SAFU: 1% per block
Team: 9% per block
Investment Fund: 5% per block

The remaining 100 million BSW tokens have been allocated to the Transaction Fee Mining program.

After the voting on the Integration of NFT, GameFi, and Strategic Partnerships on October 31, 2021, these 100 million BSW tokens will be redistributed as follows:
70 million BSW for NFT, GameFi, and Strategic Partnerships
30 million BSW for Transaction Fee Mining

## Useful Links
Protocol
https://biswap.org
Docs
https://biswap.gitbook.io/biswap
Analytics
https://biswap.org/analytics
Metrics
https://biswap.org/bsw_token
Smart Contracts
https://biswap.gitbook.io/biswap/general-information/biswap-smart-contracts



