# Dopex Protocol Subgraph Metrics Methodology v1.0.0

This is for Dopex Subgraph based on Messari Derivatives Options Schema.

## Business Summary

Dopex is a decentralized options protocol which aims to maximize liquidity, minimize losses for option writers and maximize gains for option buyers - all in a passive manner for liquidity contributing participants.

Right now, Dopex core options exchange platform operates on Arbitrum L2. It has also presence on Polygon, but its TVL and volume is negligible.

The protocol's main product is Single Staking Option Vaults (SSOVs) which is summarized as follows:

### SSOVs

SSOVs, which represents Single Staking Option Vaults (SSOVs), allow users to lock up tokens for a specified period of time and earn yield on their staked assets. Users will be able to deposit assets into a contract which then sells your deposits as call or put options to buyers at fixed strikes that they select for different expiries.

### Sell Options

With SSOVs, users will be selling covered options at low risk with no need for intensive knowledge on option Greeks.

> Prior to the beginning of a new epoch, strikes are set for the expiry of the vault.

> Users lock collateral into this vault and select fixed strikes that they want to sell their options at.

> The contract deposits the collateral locked into a protocol for additional yield.

### Exercise & Settlements

All options are auto-exercised on expiry by default and can be settled any time after expiry at users' convenience.

Settlements on option exercises happen without requiring the underlying asset and hence are net settlements. The PnL (Profit & Loss) of the option is calculated and the exercise can go through which burn the option tokens and transfer the PnL in the settlement asset to the user.

## Calculation Methodology v1.0.0

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdraws`

`Purchases`

`Settles`

### Total Value Locked (TVL)

> TVL of a Pool = ∑ value of all collaterals to be provided as liquidity in the unique SSOV pool

> TVL of the Protocol = ∑ TVL of all SSOV pools

### Volume

Total volumes in this subgraph refer to all trading volume related with deposit collaterals to sell options, withdraw collaterals to close the selling options position, purchase options and settle options.

### Total Revenue

> Total Revenue of a Pool = ∑ options purchase fees

## Useful Links

Protocol:

- https://app.dopex.io/

SSOVs:

- https://app.dopex.io/ssov

Docs:

- https://docs.dopex.io/

Smart contracts:

- https://docs.dopex.io/contracts

Dashboard provided by a third party:

- https://www.dopexanalytics.io/Stats/Index
