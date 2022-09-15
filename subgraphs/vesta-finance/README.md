# Vesta Finance Lending Protocol Subgraph

Vesta is a layer 2-first lending protocol, based on source codes from liquity protocol on Ethereum, which allows users to obtain maximum liquidity against their collateral without paying interest.

Users can lock up collateral and issue Vesta's stablecoin VST to their own address, and subsequently transfer those tokens to any other address.

## Links

- Protocol website: https://vestafinance.xyz/
- Protocol documentation: https://docs.vestafinance.xyz/
- Smart contracts: https://github.com/vesta-finance/vesta-protocol-v1/tree/master/contracts
- Deployed addresses: https://docs.vestafinance.xyz/technical-overview/contract-addresses
- Existing subgraphs: https://thegraph.com/hosted-service/subgraph/shinitakunai/vestafinance-v1_1

## Calculation Methodology v1.0.1

### Total Value Locked (TVL) USD

Sum across all Pools:

`Collateral locked in Troves + VST and Collateral in stability pool`

Ignores VST staked. Currently, the collaterals includes ETH, renBTC, gOHM, GMX, DPX and GLP.

### Total Revenue USD

Sum across all Pools:

`Borrowing Fee + Redemption Fee + Liquidation Revenue (i.e. Liquidation reserve + Value of Collateral - Outstanding Loan Amount)`

Borrowing fee is 0.5% to 5% depending on amount borrowed, Redemption fee is Borrowing fee + 0.5%

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`Borrowing Fee + Redemption Fee + Part of Liquidation Revenue (Liquidation reserve + 0.5% of Collateral)`

Part of Liquidation Revenue (Liquidation reserve + 0.5% of Collateral) goes to Liquidator

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

## Usage

### Prepare

`npm run prepare:yaml --TEMPLATE=vesta.finance.template.yaml --PROTOCOL=vesta-finance --NETWORK=arbitrum`

## Smart Contract Interactions

### Events included in the subgraph

As vesta finance is a fork based on liquity, please refer to the liquity's chart for events included vesta finance's subgraph.

![Liquity](../../docs/images/protocols/liquity.png "Liquity")

Nevertheless, they are also many changes in vesta finance smart contracts.

- as there are five collaterals in vesta finance, instead of just ETH in liquity, many smart contracts' functions and events signatrue add asset address into their paramters in vesta finance, rather than using ETH as the asset by default. For example, TroveUpdated() event's definition changes from TroveUpdated(indexed address,uint256,uint256,uint256,uint8) to TroveUpdated(indexed address,indexed address,uint256,uint256,uint256,uint8) in vesta finance

- Meanwhile, the stable coin minted changes from LUSD to VST. As a result, some functions's name also changes. For example, LUSDBorrowingFeePaid() event's name change to VSTBorrowingFeePaid() in vesta finance

These changes in smart contracts cause substantial changes in sourc codes of vesta finance's subgraph when comparing with liquity's subgraph. In the event handlers, the program needs to update the specific asset's metrics accordingly if the asset's information is provided. In the case that the asset's information is not provided, it must be deduced with other methods.
