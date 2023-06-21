# MUX Protocol Subgraph Metrics Methodology v1.0.0

This is for MUX Subgraph based on Messari Derivatives Perpetual Schema.

## Business Summary

The MUX Protocol Suite is a complex of protocols with features that will offer optimized trading cost, deep liquidity, a wide range of leverage options and diverse market options for traders.

The key components in the MUX Protocol Suite can be divided and summarized as follows:

### MUX Leveraged Trading Protocol

It is a decentralized leveraged trading protocol that offers zero price impact trading, up to 100x leverage, no counterparty risks for traders and an optimized on-chain trading experience. Traders will trade against the MUX native pool (MUXLP pool) on the Leveraged Trading Protocol.

### MUX Leveraged Trading Aggregator

It is a sub-protocol in the MUX protocol suite that automatically selects the most suitable liquidity route and minimizes the composite cost for traders while meeting the needs of opening positions. The aggregator can also supply additional margin for traders to raise the leverage up to 100x on aggregated underlying protocols.

The MUX Aggregator sub-protocol is an essential component of the MUX protocol suite. The current version of MUX Leveraged Trading Aggregator integrates with GMX and Gains Trade protocols. The subgraph tracks all positions and volumes for trading being routed to these third party protocols but does not count the fee and premium for these trading as these charges are paid to other protocols, not MUX protocol.

## Rewards and Fees

### Rewards for staking MUX LP

- ETH rewards for MUX LP staking are gradually distributed after your first epoch.
- MUX rewards for MUXLP staking are gradually distributed after you start staking.
- Epochs start and end weekly on Thursdays UTC.

### Fee Structure

The following fee structure only applies to trading against the MUX native pool (MUXLP pool). If a trader's position routes to a third-party underlying leveraged trading protocol through the MUX aggregator, the fee structure will follow the underlying protocols. For example: If your position is routed to GMX through MUX, then GMX fees structure will be applied, and all fees will go to GMX.

### Position Fee

The MUX protocol charges position fees when traders open and close positions. The position fee is fixed at 0.08% and calculated as follows:

> Open Fee: 0.08% × Asset Price × Position Size
> Close Fee: 0.08% × Asset Price × Position Size

### Funding Payments

After traders borrow pooled assets for positions, the MUX protocol charges funding payments, which can be seen as borrowing fees from positions. The funding payment is collected every 8-hour.

### Liquidation Fee

The maintenance margin (MM) on the MUX protocol is 0.5%, and the liquidation fee is 0.1%. Therefore, 0.1% (if it exists) margin will be collected as the fee when a position is liquidated. The remaining margin after liquidation will return to traders.

## Usage Metrics

The usage metrics take the following user activities into accout.

### MUX LP

- Mint MUX LP token by supplying the assets
- Burn MUX LP tokens to redeem any index asset

### Spot & Perpetual Exchange Traders

- Open a long or short position with MUX Leveraged Trading Protocol
- Close the position with MUX Leveraged Trading Protocol
- Open a long or short position with MUX Leveraged Trading Aggregator
- Close the position with MUX Leveraged Trading Aggregator

## Financial Metrics

### TVL

> TVL of MUX native pool = ∑ value of all assets to be provided as liquidity in the unique MUX native multi-asset pool

> TVL of the Protocol = ∑ TVL of the MUX native multi-asset pool

### Volume

Total volumes in this subgraph refer to perp trading volume for both MUX Leveraged Trading Protocol and MUX Leveraged Trading Aggregator. Meanwhile, there are three types of volumes for perp trading: InflowVolume, OutflowVolume and ClosedInflowVolume:

- Inflows are all funds that entered the protocol as part of long/short positions being opened.
- Outflows are all funds that left the protocol because of positions being closed.
- And then inflows at close: when a position closes, if it results in a gain to the protocol balance (the trader lost), whatever is the net increase would go here. If the trader wins (removing funds from the protocol balance) then this is untouched. It would be like the "settled inflow", which allows users to know if the protocol is making or losing money during a given period.

### Total Revenue

> Total Revenue of a Pool = ∑ position opening & closing fees, borrowing fees, and liquidation fees

#### Protocol Income Allocation

The protocol income collected from trading fees will be allocated as follows:
(POR is the rate of Protocol Owned Liquidity)

> Total Protocol Income × 70% × POR: Allocate for veMUX holders (in ETH)

> Total Protocol Income × 70% × (1 - POR): Allocate for MUXLP stakers (in ETH)

> Total Protocol Income × 30%: Purchase MUXLP and add as protocol-owned liquidity

## Useful Links

Protocol:

- https://app.mux.network/#/trade

Docs:

- https://docs.mux.network/

Smart contracts:

- https://docs.mux.network/protocol/contracts

Dashboard:

- https://stats.mux.network/public/dashboard/13f401da-31b4-4d35-8529-bb62ca408de8
