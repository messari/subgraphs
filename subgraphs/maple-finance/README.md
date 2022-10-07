# Maple Finance Subgraph

## Calculation Methodology v1.1.0

Below, the methodologies for key fields in the protocol are surfaced for convenience.

Note that all cumulatives USD values are origination values (i.e values at the time the accumulation occurred), they are not current values. This means that the cumulative values are monotonically increasing over time. If current values are desired for the cumulatives, they can be derived from the cumulative token values.

In depth methodologies for every parameter in the protocol can be found here: [Schema Map](https://fluffy-cobalt-78d.notion.site/Schema-Map-59607afc87ac4891a7dc8c407e18f48d)

### Total Value Locked (TVL) USD

Total amount on the supply side that is earning interest

Sum across all Markets:

`Total Deposit Balance USD`

This does not include accrued staking rewards.

### Total Deposit Balance USD

Sum across all Markets:

`Cumulative Deposit USD - Cumulative Withdraw USD - Cumulative Pool Losses USD`

Pool Losses occur when a default is suffered by the pool, it is absorbed by the deposit amount.

### Total Borrow Balance USD

Sum across all Markets:

`Cumulative Withdraw USD - Cumulative Principal Repay USD - Loan Defaults USD`

Liquidated collateral is interpreted the same as paying principal since from the pool perspective there is no difference. Defaults to the Stake Locker and Pool are absorbed and removed from total borrow.

### Cumulative Liquidate USD

Sum across all Markets:

`Cumulative Stake Locker Losses USD + Cumulative Pool Losses USD`

Collateral liquidation is not counted towards cumulative liquidate, and is instead considered the same as a principal repayment since from the pool perspective there is no difference.

### Cumulative Supply Side Revenue USD

Sum across all Markets:

`Cumulative Establishment Fees To Pool Delegate USD + Cumulative Interest To Market USD`

Interest To Market USD is all interest going to the Suppliers and the Stake Locker, this doesn't include MPL token distribution.

### Cumulative Protocol Side Revenue USD

Sum across all Markets:

`Cumulative Establishment Fees To Maple Treasury USD`

Establishment Fees To Maple Treasury USD is a percentage of the drawdown amount; lump sum for V1 and V2 loans and amortized over repayments for V3 loans.

### Cumulative Total Revenue USD

Sum across all Markets:

`Cumulative Supply Side Revenue USD + Cumulative Protocol Side Revenue USD`

### Total Unique Users

The number of Unique Addresses that interacted with the protocol through these transactions:

`Deposit`

`Borrow`

`Withdraw`

`Repay`

`Stake`

`Unstake`

## Protocol Diagrams

Diagrams of the protocol, specifically focusing on key things needed for the Subgraph. Each diagram follows this legend:

![Legend](./docs/Legend.jpg)

### Protocol Map

![Protocol Map](./docs/ProtocolMap.jpg)

### Providing Liquidity Flow

![Providing Liquidity Flow](./docs/ProvidingLiquidity.jpg)

### Staking Flow

![Staking](./docs/Staking.jpg)

### Taking Loan Flow

![Taking a loan](https://user-images.githubusercontent.com/9797920/175491683-de0cae25-58fd-4f05-a579-eb02fea2297e.jpg)

### Repaying Loan (Principal and Interest)

![Repay Loan](./docs/RepayLoan.jpg)

### Liquidation Flow

![Liquidation](./docs/Liquidation.jpg)

## Validation

Validation done for this subgraph against other data sources can be found here: [Validation Spreadsheet](https://docs.google.com/spreadsheets/d/1viyui7nAzUXMx68EJSW61xC251uS8zpKePzV2xijjGQ/edit?usp=sharing)

Validation for subgraph self-consistency, and some helper queries for the Validation Spreadsheet are here: [Notebooks](./validation)
