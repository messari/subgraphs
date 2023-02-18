# Maple Finance 2.0 (V2)

Maple Finance brings legacy financial markets to the blockchain to be secured by blockchain technology. They offer permissioned and permissionless lending with permissioned borrowing.

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

### Total Revenue USD

### Protocol-Side Revenue USD

### Supply-Side Revenue USD

### Total Unique Users

## Notes

- This protocol is on Solana and Ethereum, but subgraphs only support ethereum right now (2/7/23).
- Lending can be both Permissioned and Permissionless, but we put `PERMISSIONLESS` in the subgraph for now.
- Loans can be collateralized or uncollateralized on Maple. It is up to the Pool Delegates discretion. We put `UNDER_COLLATERALIZED` in the subgraph for now.
- The maple loan manager was deployed before the protocol was "launched".
  - We believe it was used in Maple Finance V1, so a lot of loans that were open in Maple Finance V1 were transitioned to Maple Finance V2.
- Revenue (interest) is interest paid, not outstanding interest accrued.
- Borrow rates are calculated based off the volume weighted average of the current outstanding loans.
- Deposit rates are calculated based off interest paid on the current outstanding loans (minus fees).
- Borrow balance is the true outstanding balance of the loan (including interest).

## Links

Links to the relevant sources to learn about this protocol.

- Protocol: https://app.maple.finance/#/v2/lend
- Analytics: https://dune.com/scottincrypto/Maple-Deposits
- Docs: https://maplefinance.gitbook.io/maple/
- Smart contracts: https://github.com/maple-labs/maple-core-v2
- Deployed addresses: https://maplefinance.gitbook.io/maple/technical-resources/protocol-overview/protocol-registry

## Contract Relationship Map

A map of relationships between contracts and interactions

![Maple Finance 2.0 Contract Relationship Map](../../docs/images/protocols/maple-v2.png)
