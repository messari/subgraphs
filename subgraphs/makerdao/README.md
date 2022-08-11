# MakerDAO Lending Protocol Subgraph

## Calculation Methodology v1.0.1

### Total Value Locked (TVL) USD

Sum across all Markets:

`Total Collateral Tokens in USD after accounting deposits and withdrawals`

Total collateral is counted by dink during LogNote events for Vat.frob calls

### Total Deposit USD

Sum across all Markets:

`Sum dink values (collaterals) emitted during frob LogNote events from the Vat address per Market`

'ink' is considered the market's collateral, dink stands for Δink, contract emits signed values. Note ink is in WAD, no matter the decimals of the underlying token.

### Total Borrow USD

Sum across all Markets:

`Sum dart values emitted in frob LogNote events from the Vat address per Market`

'art' is considered the market's debt, dart stands for Δart, contract emits signed values

### Total Revenue USD

Sum across all Markets:

`(Change in market debt multiplier rate value in fold LogNote events from the Vat address * market total borrow usd) + (Liquidations per market * liquidation penalty per market)`

### Protocol-Side Revenue USD

Sum across all Markets:

`(Change in market debt multiplier rate value in fold LogNote events from the Vat address * market total borrow usd) + (Liquidations per market * liquidation penalty per market)`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Markets

`Change in dai savings rate * total dai in the pot contract`

Note makerdao depositors do not earn interests on their deposit (collateral), so the supply side revenue here is different than the supply-side revenue in a typical lending protocol. Makerdao users have to use the DAI they borrow to join the Pot contract to earn revenue, so this is more like staking rewards.

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`'frob' LogNote event emitted by Vat addresses which include deposits/withdrawals/borrows/repays + Cat.Bite events or Dog.Bark events emitted during liquidations`

### NO Reward Token Emissions

### Minted Token Supply

`Total supply of DAI token`

## References and Useful Links

- Protocol: https://makerdao.com/en/
- Analytics: https://makerburn.com/#/
- Docs: https://docs.makerdao.com/
- Smart contracts: https://github.com/makerdao/dss
- Deployed addresses: https://changelog.makerdao.com/releases/mainnet/active/contracts.json

## Smart Contracts Interactions

![Makerdao](../../docs/images/protocols/makerdao.png "Makerdao")

## Data Notes

- There is a sharp reduction in supply side revenue on 2020-03-17. It is because Maker reduced the supply side rate (DAI Savings Rate, or DSR) to effectively 0% on that date. See https://www.reddit.com/r/MakerDAO/comments/fnzdzp/dai_savings_rate_0/

## Build

- Initialize subgraph (Subgraph Studio):
  ```
  graph init --product subgraph-studio
  --from-contract <CONTRACT_ADDRESS> [--network <ETHEREUM_NETWORK>] [--abi <FILE>] <SUBGRAPH_SLUG> [<DIRECTORY>]
  ```
- Initialize subgraph (Hosted Service):
  ```
  graph init --product hosted-service --from-contract <CONTRACT_ADDRESS> <GITHUB_USER>/<SUBGRAPH_NAME>[<DIRECTORY>]
  ```
- Generate code from manifest and schema: `graph codegen`
- Build subgraph: `graph build`

## Deploy

- Authenticate (just once): `graph auth --product hosted-service <ACCESS_TOKEN>`
- Deploy to Subgraph Studio: `graph deploy --studio <SUBGRAPH_NAME>`
- Deploy to Hosted Service: `graph deploy --product hosted-service <GITHUB_USER>/<SUBGRAPH_NAME>`
