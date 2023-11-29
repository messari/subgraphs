# Kwenta Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL)

Sum of all the margin deposits

> TVL of a Pool = ∑ value of all assets to be provided as collateral pool

> TVL of the Protocol = ∑ TVL of of all the pools

### Open Intereest

> Open Interest = ∑ value of open positions

Calculated by fetching pool contract market size and skew data

> Long Open Interest = (marketSize + marketSkew) / 2

> Short Open Interest = (marketSize - marketSkew) / 2

> Total Open Interest = Long + Short Open Interest

### Volume

- Volume: The total cumulative value of all the trades executed

- Inflow Volume: The total cumulative value of margin deposited
- Outflow Volume: The total cumulative value of margin withdrawn

### Revenue/Fees

The protocol take two fees - Keeper Fees and Maker/Takes Fees

- Keeper Fees: A dynamic fees to execute the trade
- Maker/Taker Fees: Normal Maker/Taker fees they vary depending on the market

Protocol Side Revenue = Zero

Supply-Side Revenue = Total Fees (currently Kwenta don't charge any fees)

Total Revenue = Total Fees

### Unique Users

**Count of Unique Addresses which have interacted with the protocol via any transaction:**

- Margin deposits and withdrawals

- Position Modified - new, updated or closed

- Liquidations

## References and Useful Links

- Other existing subgraph: https://thegraph.com/hosted-service/subgraph/kwenta/optimism-main

- Other official and unofficial data sources: https://kwenta.eth.limo/stats/, https://tokenterminal.com/terminal/projects/kwenta

- Documentation: https://docs.kwenta.io/

## Note

We are only tracking v2 markets because v1 markets are deprecated and have almost no liquidity, and the current method to calculate open interest is not supported by v1 markets
