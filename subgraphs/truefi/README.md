# TrueFi Subgraph

## Calculation Methodology v1.0.0

TrueFi allows lenders to earn returns on loaned cryptocurrencies while vetted borrowers can use TrueFi for rapid access to fixed-term, fixed-rate cryptocurrency loans. There are two lending markets in Truefi.

- One is TrueFi DAO Pools, which are managed by TRU holders who collectively assess the creditworthiness of borrowers and individual loans by staking TRU.
- Another is TrueFi Capital Markets, which enable third parties to launch their own lending pools to be customized and configured to the needs of specific portfolio managers and borrowers.

For details, please refer to https://docs.truefi.io/faq/

### Total Value Locked (TVL) USD

Sum across all Reserves:

`DAO Pools total TVL + Capital Markets total TVL`

It does not include the market value of TrueFi token locked in the protocol's staking contract.

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all DAO pools and managed portfolio:

`(Loans' repayment amount - loans' principle) * protocol's fee + Liquidation protocol bonus`

### Total Borrow Balance

Sum across all DAO pools and managed portfolio:

`Pool's outstanding loans value + portfolio's outstanding illiquid value`

Includes accrued interest

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

### Reward Token Emissions Amount

The reward in TrueFi is not directly allocated into markets. Instead, lenders need to stake their tfToken in order to get the reward. So the reward is shown at protocol level.

`Emissions per second * seconds per day`

## References and Useful Links

- Protocol website: https://truefi.io/
- Protocol documentation: https://docs.truefi.io/
- Smart contracts: https://github.com/trusttoken/
  - DAO Pools: https://github.com/trusttoken/contracts-pre22
  - Captial Markets: https://github.com/trusttoken/contracts-ragnarok/
- Existing Subgraph: https://thegraph.com/hosted-service/subgraph/mikemccready/truefi-pools

## Usage

### Prepare

`npm run prepare:yaml --TEMPLATE=truefi.template.yaml --PROTOCOL=truefi --NETWORK=ethereum`

## Smart Contracts Interactions

![TrueFi](../../docs/images/protocols/truefi.png "TrueFi")
