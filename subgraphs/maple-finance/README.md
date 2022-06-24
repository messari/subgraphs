# Maple Finance Subgraph

## Calculation Methodology v1.0.0

Below, the methodologies for key fields in the protocol are surfaces for convience.

In depth methodologies for every parameter in the protocol can be found here: [Schema Map](https://fluffy-cobalt-78d.notion.site/Schema-Map-59607afc87ac4891a7dc8c407e18f48d)

### Market methodologies

#### Total Value Locked (TVL) USD

total amount on the supply side that is earning interest; it does not include accrued staking rewards

`Outstanding Loans + Liquidity Available(as loan) + Staked Assets Balance`

#### Cumulative Deposit USD

Sum across Pool:

`Cumulative Deposit USD`

Except: stake deposits(not loanable)

#### Cumulative Withdraw USD

Sum across Pool:

`Cumulative Withdraw USD`

Except: stake deposits(not loanable)

#### Total Deposit Balance USD

Sum across Pool:

`Cumulative Deposit USD - Cumulative Withdraw USD - Default Suffered(from Loan Defaults))`

#### Total Borrow Balance USD

`Total Borrow Outstanding - Locker and Pool Losses(from Loan Defaults)`

Liquidated collatoral is interpreted the same as paying principal since form the pool perspective there is no difference. Losses to stake locker and pool are absorbed and removed from total borrow.

#### Cumulative Borrow USD

Sum across Pool:

`Cumulative Borrow USD`

#### Cumulative Liquidate USD

Sum across Pool:

`Cumulative Liquidate USD`

stake locker lossess + pool lossess. Collatoral liquidation is not counted towards cumulative liquidate and is instead considered the same as a prinicipal repayment since from the pool perspetive there is no difference.

#### Cumulative Supply Side Revenue USD

Sum across Pool:

`sum of all interest paid and establishment fees paid to the Pool Delegate + sum of all interested earned by Lenders + sum of all interest earned by Stakers`

this doesn’t include MPL token distribution (optional APY boost) or profits earned by the Keeper for liquidations (V2 and V3 loans only)

#### Cumulative Protocol Side Revenue USD

`sum of all establishment fees from borrowers paid to Maple Treasury`

Fees are percentage of the drawdown amount; lump sum for V1 and V2 loans and amortized over repayments for V3 loans

#### Cumulative Total Revenue USD

`Cumulative Supply Side Revenue + Cumulative Protocol Side Revenue`

---

### Protocol methodologies

### Total Unique Users

The number of Unique Adresses that interacted with the protocol through transaction

`Deposit`

`Borrow`

`Withdraw`

`Stake`

`Unstake`

`Repay`

#### Total Value Locked USD

Sum across all Markets:

`Sum of Protocol-Side Revenue USD`

#### Total Deposit Balance USD

Sum across all Markets:

`Total Deposit Balance USD`

#### Cumulative Deposit USD

Sum across all Markets:

`Cumulative Deposit USD`

#### Total Borrow Balance USD

Sum across all Markets:

`Total Borrow Balance USD`

#### Cumulative Borrow USD

Sum across all Markets:

`Cumulative Borrow USD`

#### Cumulative Liquidate USD

Sum across all Markets:

`Stake Locker Lossess + Pool lossess`

#### Cumulative Supply Side Revenue USD

Sum across all Markets:

`Cumulative Supply Side Revenue USD`

#### Cumulative Protocol Side Revenue USD

Sum across all Markets:

`Cumulative Protocol Side Revenue USD`

#### Cumulative Total Revenue USD

Sum across all Markets:

`Cumulative Total Revenue USD`

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

Validation done for this subgraph against other source can be found here: [Validation Spreadsheet](https://docs.google.com/spreadsheets/d/1viyui7nAzUXMx68EJSW61xC251uS8zpKePzV2xijjGQ/edit?usp=sharing)

Validation for subgraph self-consistency is done in the [Self consistancy notebook](./validation/self_consistancy.ipynb)
