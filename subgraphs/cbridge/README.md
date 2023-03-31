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

Total Revenue = `SupplySideRevenue` + `ProtocolRevenue`

### Supply Side Revenue USD

Supply-side revenue on cBridge is the share of trading fees which go to the liquidity providers (LPs) for their contribution to the liquidity pools. This share is equal to 50% of the trading fees from the xLiquidity bridging model.

Supply-Side Revenue = `Trading Fees` \* 0.5

### Protocol Revenue USD

Stakers and validators on cBridge receive 100% of the protocol fees from the xAsset model of bridging, and they receive 50% of the fees from the xLiquidity model of bridging.

Protocol Revenue = (`xLiquidity Trading Fees * .5`) + (`xAsset Trading Fees`)

## Pool-Level Metrics

### Pool Total Value Locked USD

Pool Total Value Locked = `Number of Assets` \* `Price of Asset`

## Reward Tokens & Reward Token Emissions Amount

25% (2.5B CELR) of the total supply is reserved for Liquidity Mining purposes with a vesting period of 8 years. There are no more token unlocks from private seed investors. 17% (1.7B CELR) has been fully vested from the foundation. 5% (500M CELR) has been fully vested for marketing and ecosystem purposes.

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
