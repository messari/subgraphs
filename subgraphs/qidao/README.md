# QiDAO Subgraph

## References and Useful Links

- Protocol website: https://mai.finance

- Protocol documentation: https://docs.mai.finance

- Smart contracts: https://github.com/0xlaozi/qidao

- Deployed addresses: https://docs.mai.finance/functions/smart-contract-addresses

## Smart Contracts Interactions

![QiDao](../../docs/images/protocols/qidao.png "QiDao")


## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Collateral locked in Vaults`

### Total Revenue USD

Sum across all Pools:

`(Closing Fee + Liquidation Revenue)`

Closing fee is taken from collateral during either debt repayment or liquidation

Both closing fee and liquidation penalty can be changed by admin

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`Closing Fee`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`Liquidation Revenue`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdraws`

`Borrows`

`Repays`

`Liquidations`

### Reward Token Emissions Amount

Reward token emissions are calculated off-chain via snapshots

## Note

- Similar to Liquity, there is no interest rate, only a one-time closing fee, which is taken from collateral during repay. Market interest rate is set to 0.
- MAI price is fixed to $1.0.
- Vault ownership is tracked using NFTs, which can be transferred between addresses. This is not tracked in the subgraph.
- Vault reward token (Qi) emissions are calculated off-chain from snapshots and are not tracked.
- Masterchef contracts are not tracked.
- [Anchor](https://app.mai.finance/anchor) is not tracked.
