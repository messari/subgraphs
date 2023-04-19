# Aave V3 Subgraph

## Calculation Methodology v1.1.0

Methodology version 1.0.1 updates the calculation methodology for aave-v3 to use aave-forks implementation, especially for protocol-side revenue. This change happens as the aave-v3 is refactored as one of aave-forks to consolidate code and address issues in the previous aave-v3 subgraph (subgraph version 1.0.5): [#966](https://github.com/messari/subgraphs/issues/966) and [#1285](https://github.com/messari/subgraphs/issues/1285).

Methodology version 1.0.2 added protocol side revenue from liquidations (see [#1831](https://github.com/messari/subgraphs/issues/1831))

### Total Value Locked (TVL) USD

Sum across all Pools:

`Pool Deposit TVL`

### Total Revenue USD

Sum across all Pools:

`(Pool Variable Borrow Amount * Variable Pool Borrow Rate) + (Pool Stable Borrow Amount * Stable Pool Borrow Rate) + liquidated collateral amount * liquidation penalty * liquidation procotol fee percentage + flashloan amount * flashloan premium rate total`

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Pool Oustanding Borrow Amount * Pool Borrow Rate) * (Pool Reserve Factor) + liquidated collateral amount * liquidation penalty * liquidation procotol fee percentage + flashloan amount * flashloan premium rate to protocol`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools:

`(Pool Outstanding Borrow Amount * Pool Borrow Rate) * (1 - Pool Reserve Factor) + flashloan amount * (flashloan premium rate total - flashloan premium rate to protocol)`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

### Reward Token Emissions Amount

`Emissions per second * seconds per day`

### Protocol Controlled Value

N/A

## References and Useful Links

- Protocol website: [https://aave.com](https://aave.com)
- Protocol documentation: [https://docs.aave.com/developers/getting-started/readme](https://docs.aave.com/developers/getting-started/readme)
- Smart contracts: [https://github.com/aave/aave-v3-core](https://github.com/aave/aave-v3-core)
  - Rewards contracts: [https://github.com/aave/aave-v3-periphery](https://github.com/aave/aave-v3-periphery)
- Deployed addresses: [https://docs.aave.com/developers/deployed-contracts/v3-mainnet](https://docs.aave.com/developers/deployed-contracts/v3-mainnet)
- Existing Subgraph: [https://github.com/aave/protocol-subgraphs](https://github.com/aave/protocol-subgraphs)

### Prepare

`npm run prepare:yaml --TEMPLATE=aave-v3.template.yaml --PROTOCOL=aave-v3 --NETWORK=matic`

## Smart Contracts Interactions

![Aave V3](../../docs/images/protocols/aave-v3.png "Aave V3")

## Notes

- Risk Type: beside common collateral and loan in global risk type, aave-v3 provides an isolation mode whether suppliers of isolated assets can only borrow assets that are borrowable in isolation mode. Since most of collateral and borrow are in global model, we set the riskType field of the procotol to "GLOBAL". We may change it to "MIXED" in the future when we add an "MIXED" risk type.
