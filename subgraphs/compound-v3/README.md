# Compound III Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Pool Deposit TVL`

### Total Revenue USD

Sum across all Pools:

`(Pool Borrow Amount * Pool Borrow Rate)`

> Note: This currently excludes Liquidations

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Pool Oustanding Borrow Amount * Pool Borrow Rate) * (Pool Reserve Factor)`

> Note: This currently excludes Liquidations. Also, reserve factor is dynamic.

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Outstanding Borrows * Pool Borrow Rate) * (1 - Pool Reserve Factor)`

> Note: This currently excludes Liquidations

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repays`

`Transfers`

### Reward Token Emissions Amount

`Rewards Per Second` \* `Seconds Per Day`

> Note: this applies to borrow and supply side, only on the base token

### Protocol Controlled Value

Not applicable to Compound III

## Compound V2 vs Compound III

Compound III and V2 are very different, aside from the fact that they both come from the compound team and both are lending protocols.

Some of the new features in Compound III not found in V2 are:

- Multiple collateral tokens per market
- The market's risk is isolated from other markets
- The "Base Token" in III is the only token you can earn interest on, but it is not used as collateral
- The collateral-only tokens in Compound V3 have supply caps in order to reduce the amount of risk to a single asset in a market

## Notes

- `Comet` is also the collateral token. (ie, it is cUSDCv3)
- Need to manually add TotalsBasic() to Comet abi to get total Supply of base tokens with interest, interest (revenue), borrows with interest.
- Base token withdraws act as withdraws and borrows (depending on the user's position)
- The base asset cannot be used as collateral
- Reserve factor is dynamic. Essentially just the spread of supply/borrow ir rates at the time
- `BuyCollateral()` is a way for external accounts to purchase seized collateral at a discount. The discount being the liquidation penalty for that collateral asset.
  - Compound V3 separates the liquidation callouts from the seized collateral sales.
- `handleTransfer()` watches for base token transfers: https://github.com/compound-finance/comet/blob/376fdebaf08d7245edee4e668fa399447464cbdb/contracts/Comet.sol#L941
  - We are not able to catch if the function does not emit both `transfer` events. This may leave some discrepancies in position data.
- Position ID is often not found in `subtractPosition()`. Expect base token positions to be off.
  - This is because the baseToken is so fluid, to fix this we would need to open a supply and borrow position each time a user updates their cUSDC balance.
  - We need to account for any double counting with this.
- In the beginning of Compound V3 Polygon there are cases where the borrow rate is higher than the supply rate. To cover this, we skip the revenue calculation on that block.
- The pieces needed to calculate interest per position are available on positions and positionSnapshots. See the calculations needed in order to derive value with interest [here](https://github.com/compound-finance/comet/blob/015cc2a82154ece6d32e6309000583ece0f1811e/contracts/CometCore.sol#L80-L92). This only applies to base assets. Any collateral asset doesn't accrue any interest

## Reference and Useful Links

Protocol: https://compound.finance/

Docs: https://docs.compound.finance/

Smart contracts: https://github.com/compound-finance/comet

Deployed addresses: https://docs.compound.finance/#networks
