# Orbit Bridge

Orbit Bridge is an interchain communication protocol that allows communication between heterogeneous blockchains. This is a simple bridge operating on the `LOCK_RELEASE` and `BURN_MINT` mechanism without any Liquidity Pools.

## Usage Metrics

`Active Users`, `Total Unique Users` & `Daily Transaction Count`

Transactions of interest include:
Cross-chain transfer of Tokens

### Total Value Locked USD

The TVL includes the funds locked in the tokenVault contract (canonical token bridge).

TVL = `canonical token bridge TVL`

## Total Revenue USD

Total revenue is a measure of the fees paid by the traders over a specific period. Since there are no LPs involved, there is only protocol fees - which is .1% of transaction.

Total Revenue = `ProtocolSideRevenue`

## Pool-Level Metrics

### Pool Total Value Locked USD

Pool Total Value Locked = `Balance of Input Assets` \* `Price of Asset`

## Links

Links to the relevant sources to learn about this protocol.

- Protocol: https://bridge.orbitchain.io/
- Analytics: https://bridge.orbitchain.io/dashboard/transaction
- Docs: https://bridge-docs.orbitchain.io/
- Smart contracts: https://github.com/orbit-chain/bridge-contract
- Deployed addresses: https://bridge-docs.orbitchain.io/faq/integration-guide/2.-contract-addresses
