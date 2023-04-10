# Axelar Network / Satellite Bridge

Axelar network support cross-chain communication and token transfers.

## Methodology Version 1.0.0

### Usage Metrics

`Active Users`, `Total Unique Users` & `Daily Transaction Count`

Transactions of interest include:
Cross-chain transfer of Tokens
Cross-chain transfer of Messages

### Financial Metrics

#### Total Value Locked USD

The TVL includes the funds locked in the gateway contract.

TVL = `Token bridge TVL`

### Protocol Controlled Value USD

Not applicable.

### Total Revenue USD

Total revenue is a measure of the fees paid by the traders over a specific period.

Total Revenue = `ProtocolSideRevenue`

Note: Gas fees varying by chain and token, and the information is only available via Axelar CLI or Satellite frontend and not available on-chain. The current subgraph implementation tracks fee payment by users to the Gas Service contract, which include prepaid actual gas fee and fees to the protocol (maybe set to 0). Overpaid gas fees are refunded to the user, which may lead to negative revenue for certain days in the snapshot when the refund happened in a day/hour different than the payment.

#### Supply Side Revenue USD

None

#### Protocol Side Revenue USD

The protocol receive 100% of the protocol fees from the xAsset model of bridging.

Protocol Side Revenue = Sum `gas fee paid by users of the bridge`

Part of the paid gas fees may be used for token mint or contract call, but the amount is unknown (e.g. in the destination chain).

### Pool-Level Metrics

#### Pool Total Value Locked USD

Pool Total Value Locked = `Balance of Input Assets` \* `Price of Asset`

### Reward Tokens & Reward Token Emissions Amount

Rewards are distributed to validators via the axelar client (https://docs.axelar.dev/cli-docs/v0_31_3/axelard_query_distribution_rewards#synopsis) and are not available on-chain. Since they are not the conventional rewards to suppliers/users of protocol, the rewards are not included in the subgraph.

## Useful Links

### Axelar Network / Satellite Frontend

https://axelar.network
https://satellite.money

### Docs

https://docs.axelar.dev

### Contract Addresses

https://docs.axelar.dev/dev/build/contract-addresses/mainnet
