# Liquity Lending Protocol Subgraph

## Links

- Protocol website: https://www.liquity.org
- Protocol documentation: https://docs.liquity.org
- Smart contracts: https://github.com/liquity/dev/tree/main/packages/contracts/contracts
- Deployed addresses: https://docs.liquity.org/documentation/resources#contract-addresses
- Existing subgraphs: https://thegraph.com/explorer/subgraph?id=2TmD7Fq3K2BQGmUXNPzrNMXb6PDNbcBWfAHa5o3gRJC8

## Calculation Methodology v1.0.1

### Total Value Locked (TVL) USD

Sum across all Pools:

`Collateral locked in Troves + LUSD and Collateral in stability pool`

Ignores LQTY staked. Currently, the only Collateral is ETH.

### Total Revenue USD

Sum across all Pools:

`Borrowing Fee + Redemption Fee + Liquidation Revenue (i.e. Liquidation reserve of 200 LUSD + Value of Collateral - Outstanding Loan Amount)`

Borrowing fee is 0.5% to 5% depending on amount borrowed, Redemption fee is Borrowing fee + 0.5%

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`Borrowing Fee + Redemption Fee + Part of Liquidation Revenue (Liquidation reserve of 200 LUSD + 0.5% of Collateral)`

Part of Liquidation Revenue (Liquidation reserve of 200 LUSD + 0.5% of Collateral) goes to Liquidator

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`Part of Liquidation Revenue (i.e. 99.5% of Collateral - Outstanding Loan Amount)`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Repays`

`Liquidations`

### Reward Token Emissions Amount

Liquity issues LQTY rewards in 3 different ways:

- Issued to Stability Pool depositors proportionally to their amount deposited.
- Issued to frontend providers based on the usage they get
- LP to LUSD:ETH in Uniswap

We are currently tracking the ones issued to Stability Pool depositors only.

These rewards have a yearly halving emission curve. They halve every 1 year, and are recalculated every 1 minute.
A total of 32M LQTY is allocated to Stability Pool rewards.

More on that here: https://github.com/liquity/dev#lqty-issuance-to-stability-providers

The way these rewards are tracked in the subgraph is by using the same formula than the contracts and the same inputs,
instead of tracking the actual LQTY transfers or claims. Since the subgraph contains daily emission amounts, we calculate them by storing in each snapshot the amount that will be emitted in the 24 hours since the snapshot is taken.

### Protocol Controlled Value

To be added

## Usage

### Prepare

`npm run prepare:yaml --TEMPLATE=liquity.template.yaml --PROTOCOL=liquity --NETWORK=ethereum`

## Smart Contract Interactions

### Events included in the subgraph

![Liquity](../../docs/images/protocols/liquity.png "Liquity")

See also official documentation for more detailed charts:

https://github.com/liquity/dev#flow-of-ether-in-liquity
