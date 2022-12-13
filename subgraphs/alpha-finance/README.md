# Alpha Finance Lab (Alpha Venture DAO)   
## About the Protocol
Alpha Venture DAO, known before 31 March 2022 as Alpha Finance Lab, is a decentralized finance innovation hub. It consists of two arms: Alpha Build, which encompasses the protocol’s own products, and Alpha Incubate, an accelerator ecosystem that supports external web3 projects. The flagship offering is Alpha Homora, a multichain protocol for leveraged yield farming, leveraged liquidity providing, and lending. Migration is ongoing from Homora V1 (on Ethereum and Binance Smart Chain) to Homora V2 (on Ethereum, Avalanche, and Fantom) and both versions are currently active. Alpha has also entered the NFT space with Alpha Buy Wall, a floor NFT marketplace, and Provably Rare Gems, a PoW standard to mine interoperable ERC-1155 tokens (metaverse gems). In February 2022, Alpha Venture DAO closed its fourth project under the Alpha Build umbrella: AlphaX, an on-chain derivatives trading platform. The entire ecosystem is represented by the ALPHA token, which allows its stakers to share in the revenues of Homora, receive perks when they use the protocol (such as higher leverage), and gain a portion of protocol fees from Incubate projects.
## Usage Metrics

`Active Users`, `Total Unique Users` & `Daily Transaction Count`


## Financial Metrics

### Total Value Locked USD

Total Value Locked USD = `Sum of the market value of all assets in the lending pools USD` 

This is summed by all the values in V1 and V2 from each individual chain. Alpha Homora TVL includes token values locked in: 
Homora V1:
V1 on Ethereum
V1 on Binance Smart Chain (BSC) 
Homora legacy V2
Homora V2:
V2 on Ethereum 
V2 on Avalanche 
V2 on Fantom

###Protocol Controlled Value USD

The protocol does not use the Protocol Controlled Value (PCV). Implementing PCV has been proposed by the community in the protocol’s Governance chat on Discord, and Alpha’s team acknowledged the proposal.

###Total Revenue USD

Alpha Protocol Total Revenue USD  = 

`Revenue from Yield Farming Positions From DEXs` +` Revenue from trading fees From DEXs` + `Borrowing Fees YF and LP Positions` 

It is also true that:

Total Revenue USD = `SupplySideRevenue (USD)` +  `ProtocolRevenue (USD)`

### Supply Side Revenue USD

Supply Side Revenue USD = 

`Revenue for  Holders of YF Positions ` + `Revenue for Holders of trading fees` + `% of Borrow Fees to Individual Lenders on Homora (90% on V1, 80% on V2)` + `% of Borrow Fees to Lending Protocol Partner: Cream/Iron Bank (90% on V1, 80% on V2)` + `% of Borrow Fees from Protocol Revenue converted to ALPHA and disbursed to Stakers` 


### Protocol Revenue USD

Protocol Revenue USD =  `% of Borrow Interest Rates (10% on Homora V1, 20% on V2)`

## Pool-Level Metrics

### Pool Total Value Locked USD

TVL USD for each pool (token pair) = `USD value of token 1` + `USD value of token 2`


## Reward Tokens & Reward Token Emissions Amount

Homora users with leverage (in Yield Farming or Liquidity Pools) earn ALPHA tokens as a reward in addition to their APY.

ALPHA can be staked. The proportion of staked ALPHA in the total pool is represented by sALPHA. The rewards for ALPHA staking are: 
28.47% APY at the time of this writing (source), which comes from protocol fees (95% of protocol fees go to staking rewards, and only 5% to protocol development). No new ALPHA is minted to produce this reward APY (source)
preferential terms of use (access to higher leverage) on Homora (source)
rewards from select incubated projects: Beta Finance, pStake, and GuildFi. 



## How Homora works: 
Users lend tokens to Alpha Homora. Homora combines these assets along with assets they borrow from a lending protocol (Iron Bank or Cream V2) in order to lend to other users who seek leveraged yield farming or leveraged liquidity providing. 
Leverage users specify the pool they want to enter on one of the available blockchains (Fantom or Avalanche for Homora V2,  BSC for V1, Ethereum for both versions) and provide one or both tokens (and possibly also the LP token) for the pool. Users can also provide the LP token at the outset, which will increase their collateral for leveraged positions. If only one token from the liquidity pair is supplied by user, Homora will split the value roughly in half and execute the swap on behalf of the user to prepare the tokens to provide liquidity to a Liquidity Pool or Yield Farm on a DEX (Uniswap or Sushiswap, SpiritSwap or SpookySwap, Trader Joe, Pangolin, etc., depending on the chain).  
Alternatively, users can Yield Farm or provide liquidity to Liquidity Pools through Homora without leverage. In either case, rewards get automatically reinvested into the user’s position by the algorithm.
Positions that reach 100% debt ratio can be liquidated by liquidators (other users) for a 5% bounty.



Alpha protocol user transactions include (all of these tx are on Homora except the last one):

-  Lending tokens (Earn page of the app), and the other side of this transaction - withdrawing lent tokens (if utilization ratio allows to withdraw at that time).
-  Opening and closing Yield Farming positions, leveraged and regular (Positions page of the app).
-  Opening and closing Liquidity Providing positions, leveraged and regular.
-  Claiming APY (but not ALPHA token rewards because governance token transfers are not considered usage) - by default earnings get automatically reinvested into the user’s original Yield Farming or Liquidity Providing position.
-  Liquidating positions, and getting reimbursed the liquidation amount in LP token along with 5% bounty (two separate transactions).
- Staking ALPHA token.

Liquidation bounty: On Homora, all positions are listed publicly, and users can liquidate others’ positions that reach 100% debt ratio in exchange for a 5% bounty. For instance, a liquidator can repay debt on a 1 ETH position that is subject to liquidation risk, and in return they will receive LP token equivalent to 1.05 ETH.

Swaps prior to entering a pool (if a user only provided one token from the liquidity pair) are done by Homora on behalf of the user, and should not count as a user transaction. All a user does in this case is open a farming position (i.e. the transaction that counts) and set its parameters.

Migrating from an older version of Homora (V1, or legacy V2 before a major update) to a newer version (V2), which users do manually, should not count as a transaction, because during migration there are no assets or funds entering or leaving the Homora ecosystem as a whole. 

## Useful Links
### Protocol
https://alphaventuredao.io/ 
### Docs
https://docs.alphaventuredao.io/alpha-finance-lab/alpha-build/overview 
### Smart contracts
https://github.com/AlphaFinanceLab/alpha-homora-v1-eth-contract 
https://github.com/AlphaFinanceLab/alpha-homora-v1-bsc-contract 
https://github.com/AlphaFinanceLab/alpha-homora-v2-contract/tree/master/contracts
### Deployed addresses
https://docs.alphaventuredao.io/alpha-finance-lab/stake-alpha/alpha-token
### Messari Resources on the Protocol
https://messari.io/asset/alpha-finance/profile
https://messari.io/article/alpha-finance-lab  
