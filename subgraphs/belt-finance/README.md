# Belt Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Vaults:

`Vault TVL`

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol.

Note that Belt applies a Withdrawal and Deposit Fees based on Strategy used at the time of deposit or withdraw.

Sum across all Vaults:

`(Withdraw Amount * Strategy Withdraw Fee) + (Deposit Amount * Strategy Deposit Fee) + Buyback Amount`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Note that this is the remaining Yield after Protocol Fees

Sum across all Vaults

`Harvested Amount - (Buyback Amount)`

## Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposit`

`Withdraw`

## Links

- Protocol website: https://belt.fi/landing
- Protocol documentation: https://docs.belt.fi/
- Deployed addresses: https://docs.belt.fi/contracts/contract-deployed-info

## Setup

1. Install all the dependencies

```
yarn add

# global packages
yarn global add @graphprotocol/graph-cli
yarn global add mustache
```

2. Generate types

```
yarn run prepare
yarn run codegen
```

3. Building the subgraph

```
yarn run prepare
yarn run build
```

5. Deploy

```
graph auth --product hosted-service <access-token>
graph deploy --product hosted-service <username/subgraph-name>
```
