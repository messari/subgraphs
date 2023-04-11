# cBridge

cBridge introduces the best-in-class cross-chain token bridging experience with deep liquidity for users, highly efficient and easy-to-use liquidity management for both cBridge node operators and Liquidity Providers who do not want to operate cBridge nodes, and new exciting developer-oriented features such as general message bridging for cases like cross-chain DEX and NFTs.

## Usage Metrics

`Active Users`, `Total Unique Users` & `Daily Transaction Count`

Transactions of interest include:
Cross-chain transfer of Tokens
Cross-chain transfer of NFTs
Adding Liquidity
Removing Liquidity

## Financial Metrics

### Total Value Locked USD

The TVL includes the funds locked in the bridge contract (pool-based bridge) and the funds locked in the tokenVault contract (canonical token bridge).

TVL = `pool-based bridge TVL` + `canonical token bridge TVL`

## Protocol Controlled Value USD

cBridge does not have Protocol Controlled Value, so this is not applicable.

## Total Revenue USD

Total revenue is a measure of the fees paid by the traders over a specific period. These trading fees, referred to as protocol fees, are different depending upon the type of bridging that is taking place either xAsset or xLiquidity. If it is xAsset (a canonical mapping bridge) then the protocol fee is 0% - .1% and if it is xLiquidity (a pool-based bridge) then the protocol fee is 0% - .5%

Total Revenue = `SupplySideRevenue` + `ProtocolSideRevenue`

Note: Percentage fee (revenue) varying by chain and token, and the information is only available via Celer Network's State Guardian Network API (https://cbridge-docs.celer.network/developer/api-reference/gateway-estimateamt) and not available on-chain. The current subgraph implementation tracks fee withdrawal through the pool-based bridge, but it is impossible to distinguish between protocol-side revenue (fee attributed to SGN) or supply-side revenue (fee attributed to liquidity providers).

### Supply Side Revenue USD

Supply-side revenue on cBridge is the share of transfer fees which go to the liquidity providers (LPs) for their contribution to the liquidity pools. This share is equal to 50% of the trading fees from the xLiquidity bridging model.

Supply-Side Revenue = `Transfer Fees` \* 0.5

### Protocol Side Revenue USD

Stakers and validators on cBridge receive 100% of the protocol fees from the xAsset model of bridging, and they receive 50% of the fees from the xLiquidity model of bridging.

Protocol Side Revenue = (`xLiquidity Transfer Fees * .5`) + (`xAsset Transfer Fees`) + `Message Fees`

Because information of the fees (except for the Message Fees) are only available via the SGN API and not available on-chain, we cannot track the protocol side revenue as it accrue, but only when it is withdrawn [decoding the refid value of the withdraw](https://github.com/celer-network/sgn-v2-contracts/blob/61159ed26e45e23731e4ed883b1d83be987d6c1a/contracts/pegged-bridge/OriginalTokenVault.sol#L49-L52)

## Pool-Level Metrics

### Pool Total Value Locked USD

Pool Total Value Locked = `Balance of Input Assets` \* `Price of Asset`

## Reward Tokens & Reward Token Emissions Amount

> 25% (2.5B CELR) of the total supply is reserved for Liquidity Mining purposes with a vesting period of 8 years. There are no more token unlocks from private seed investors. 17% (1.7B CELR) has been fully vested from the foundation. 5% (500M CELR) has been fully vested for marketing and ecosystem purposes.

Average daily `farming rewards claimed` over 7-day period from the [FarmingRewards contract](https://github.com/celer-network/sgn-v2-contracts/blob/aa569f848165840bd4eec8134f753e105e36ae38/contracts/liquidity-bridge/FarmingRewards.sol#L55)

Note: [Staking rewards](https://github.com/celer-network/sgn-v2-contracts/blob/main/contracts/staking/StakingReward.sol) to SGN validators are not included.

## Useful Links

### Protocol

https://cbridge.celer.network/#/transfer

### Celer Network

https://www.celer.network/
https://blog.celer.network/?post_type=post&s=cbridge

### Docs

https://cbridge-docs.celer.network/

### Contract Addresses

https://cbridge-docs.celer.network/reference/contract-addresses

### cBridge Analytics

https://cbridge-analytics.celer.network/analytics
