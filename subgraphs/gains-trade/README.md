# gTrade Protocol Subgraph Metrics Methodology v1.0.0

gains-trade subgraph based on Messari's derivatives perpetual schema.

## Business Summary

gTrade is a liquidity-efficient, powerful, and user-friendly decentralized leveraged trading platform developed by Gains Network.

They claim to be more capital efficient than other existing platform, allows for low trading fees, and offer a wide range of leverages and pairs.
GNS and the NFTs are designed to be actively used within the platform and to allow ownership of the protocol through revenue capture & governance.

gTrade is currently deployed on Polygon and Arbitrum networks.

## gDAI

gDAI is an ERC-20 representing ownership of the underlying DAI asset. It follows an exchange rate model (similar to Compound's cTokens) where the price of gDAI to DAI changes in real-time from two variables: accumulated fees and trader PnL (both open and closed).

```
gDAI = 1 + accRewardsPerToken — Math.max(0, accPnlPerTokenUsed)
```

## gDAI vault

gDAI Vault is a DAI vault following ERC-4626, a standard API for tokenized yield-bearing vaults that represent shares of a single underlying ERC-20 asset. For this vault, gDAI shares represent the underlying DAI asset.

Trades are opened with DAI collateral, regardless of the trading pair. The leverage is synthetic and backed by the DAI vault.

Supported types of trades:

- Market: trade executes immediately, at market price
- Limit: trade executes at exact price set if price reaches threshold

Supported asset classes ([complete list](https://gains-network.gitbook.io/docs-home/gtrade-leveraged-trading/pair-list)):

- Crypto pairs
- Forex pairs
- Stock pairs
- Indices pairs
- Commodity pairs

The vault serves as the counterparty to all trades made on the platform:

- When traders win (positive PnL), their winnings are received from the vault
- When traders lose (negative PnL), their losses are sent to the vault

Liquidity providers can deposit DAI and mint gDAI LP token to receive share of fee from trading.

Fee percentages vary as per asset classes, [complete list here](https://gains-network.gitbook.io/docs-home/gtrade-leveraged-trading/fees-and-spread). Trading Fee is split between:

- Governance & Team fee
- Ecosystem fee (shared between GNS Single-Sided Staking and the gDAI vault)
- Market/Limit fee (goes to GNS staking if the order is a market order, and to NFT bots if the order is a limit order)
- while all trades are open, traders pay the rollover fee and pay / earn the funding fee

## Financial and Usage Metrics

Total Value Locked:

- TVL of a Pool = ∑ DAI in pool
- TVL of the Protocol = ∑ TVL of the gDAI pool

Volume:

- Inflow Volume: funds that entered the protocol as part of long/short positions being opened
- Outflow Volume: funds that left the protocol because of positions being closed
- Cumulative Volume: Inflow Volume + Outflow Volume
- Closed Inflow Volume: when a position closes, if it results in a gain to the protocol balance (the trader lost), whatever is the net increase would go here. If the trader wins (removing funds from the protocol balance) then this is untouched. It would be like the "settled inflow", which allows users to know if the protocol is making or losing money during a given period.

Revenue:

- Protocol Side Revenue: ∑ Governance & Team Fee
- Supply Side Revenue: ∑ Ecosystem Fee

Activity:

- Deposit/Withdraw: add/remove liquidity from the gDAI vault
- Collateral In/Out: open/close position with putting in/taking out DAI collateral
- Borrow: open position with levarage
- Liquidate: liquidate someone's position

## Links:

- Protocol: https://gains.trade
- Docs: https://gains-network.gitbook.io/docs-home/
- Contract Addresses: https://gains-network.gitbook.io/docs-home/what-is-gains-network/contract-addresses
- Stats: https://dune.com/gains/gtrade_stats
