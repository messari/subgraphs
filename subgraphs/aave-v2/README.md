# Aave v2 Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL)

Sum across all Pools: 

`Pool Deposit TVL`

### Total Revenue (Amount)

Sum across all Pools:

`(Pool Variable Borrow Amount * Variable Pool Borrow Rate) + (Pool Stable Borrow Amount * Stable Pool Borrow Rate)`

Note: This currently excludes Flash Loans

### Protocol-Side Revenue (Amount)
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Market Oustanding Borrow Amount * Market Borrow Rate) * (Pool Reserve Factor)`

### Supply-Side Revenue (Amount)
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Market Outstanding Borrows * Market Borrow Rate) * (1 - Pool Reserve Factor)`

### Total Revenue %
% Revenue from Assets Generated from Usage

`Pool borrow rate`

This is pool-dependent and varies based on utilization.

Note: This currently excludes Flash Loans


### Protocol-Side Revenue %

`Pool borrow rate * Pool Reserve Factor`

This is pool-dependent and varies based on utilization.

Note: This currently excludes Flash Loans


### Total Revenue %
% Revenue from Assets Generated from Usage

`Pool borrow rate * (1 - Pool Reserve Factor)`

This is pool-dependent and varies based on utilization.

Note: This currently excludes Flash Loans
