# Axelar Network / Satellite Bridge

Axelar network support cross-chain communication and token transfers.

## Methodology Version 1.0.1

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

The Axelar bridge currently charges only gas fees and no bridge fees. Gas fees paid by users are used for transfers, relays and contract calls, and not collected as protocol side revenue. The total revenue is 0 as of April 2023.

#### Supply Side Revenue USD

None

#### Protocol Side Revenue USD

None

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
