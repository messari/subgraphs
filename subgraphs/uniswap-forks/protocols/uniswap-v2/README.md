# Uniswap v2 Subgraph

## Calculation Methodology v1.0.0

- Sum accross all liquidity pools for protocol metric.

### Total Value Locked (TVL) USD

- The value of all tokens provided in the liquidity pools.

### Volume

- The total value or amount from swaps in liquidity pools. The value of a swap in USD is single-sided, and is only used to update protocol and financial metrics if at least one token is a part of our token whitelist.

### Total Revenue USD

- `Pool Swap Trading Volume * Total Swap Fee Percentage`

- Total Swap Fee: %0.30.

- Protocol Side Fee: `off`.

More info on swaps found here:
https://docs.uniswap.org/protocol/concepts/V3-overview/fees

### Protocol-Side Revenue USD

- `Pool Swap Trading Volume * Protocol Side Fee Percentage`

- `Protocol Side Fee Percentage = Total Swap Fee Percentage - Supply Side Fee Percentage`

- Protocol Side Fee (On): %0.05.

- Protocol Side Fee (Off): %0.00.

### Supply-Side Revenue USD

- `Pool Swap Trading Volume * Supply Side Fee Percentage`

- `Supply Side Fee Percentage = Total Swap Fee Percentage - Protocol Side Fee Percentage`

- Supply Side Fee (On): %0.25.

- Supply Side Fee (Off): %0.30.

### Total Unique Users

**Count of Unique Addresses which have interacted with the protocol via any transaction:**

- Swaps

- Deposits

- Withdraws

### Reward Token Emissions Amount

- Not Applicable for this subgraph.

### Protocol Controlled Value

- Not Applicable for this subgraph.

## References and Useful Links

- Other existing subgraph: https://thegraph.com/hosted-service/subgraph/uniswap/uniswap-v2

- Documentation: https://docs.uniswap.org/
