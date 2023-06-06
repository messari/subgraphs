# Morpho Subgraph

The Morpho Subgraph is a collection of morpho-x lending protocols following the entities provided by Messari for Lending Protocols.

Some of the entities are filled with Morpho specific data, permitting to track the evolution of the protocols regarding the peer-to-peer aspect of Morpho.

Among them, some properties are defined as "internal", meaning that they are not "human readable" and are used for internal computations. These properties are prepended with an underscore.

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Pool Deposit TVL` = `Pooled Deposits` + `P2P Deposits`

### Total Revenue USD

Sum across all Pools:

`(Pool Borrow Amount * (Pool Borrow Rate + P2P Borrow Rate))`

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Pool Oustanding Borrow Amount (POOLED & P2P) * Pool Borrow Rate) * (Pool Reserve Factor)`

> Note: This currently excludes Liquidations. Also, reserve factor is dynamic.

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Outstanding Borrows * Pool Borrow Rate) * (1 - Pool Reserve Factor)`

> Note: This currently excludes Liquidations

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repays`

### Reward Token Emissions Amount

`$COMP Per Block (Normalized to Morpho share)` \* `Blocks Per Day`

> Rewards are only calculated on Morpho Compound for the $COMP rewards that are passed through. $MORPHO rewards are calculated off chains so we cannot include them in the subgraph.

## Notes

- This subgraph contains all of the standard fields, but has many custom fields that are specific to Morpho.

## References and Useful Links

- Website: https://www.morpho.xyz/
- Application: https://app.morpho.xyz/
- Morpho Analytics: https://analytics.morpho.xyz/
- Docs: https://docs.morpho.xyz/start-here/homepage

# Morpho Explained

## How Morpho works

Each interaction on Morpho-x leads to an interaction on the underlying protocol. Because the Morpho protocol is an aggregation of multiple positions, that means that Morpho is a protocol user itself (regarding the underlying protocol, pool based).

That means that pool rates and pool indexes are updated each time a user interacts with Morpho.

However, a supply on Morpho-x can lead to a Repay on the underlying protocol (If a Borrower is matched for example), and a Supply event on the underlying protocol (if the user is not fully matched).
So having a look to the transaction event on the underlying protocol does not really make sense for Financial statistic tracking.

## Event flow

The classic event flow of an interaction on Morpho is the following:

- Update of the rates and the indexes of the underlying protocol
- Update of the indexes on Morpho.
- Update of the deltas on Morpho.
- Supplier/Borrower matched if any
- Underlying protocol interaction
- Emission of the event on Morpho (Supplied, Borrowed, Repaid or Withdrawn).

## Protocols

Morpho is currently deployed on top of Aave V2 mainnet and Compound V2 mainnet:

| Protocol           | Morpho Address                                                                                                        | Deployment block |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Morpho Aave V2     | [0x777777c9898d384f785ee44acfe945efdff5f3e0](https://etherscan.io/address/0x777777c9898d384f785ee44acfe945efdff5f3e0) | 15383036         |
| Morpho Compound V2 | [0x8888882f8f843896699869179fb6e4f7e3b58888](https://etherscan.io/address/0x8888882f8f843896699869179fb6e4f7e3b58888) | 14860866         |

All Morpho Protocols are indexed in the same subgraph with different `LendingProtocol` entities.

## P2P Improvement

The Market entity has properties named `p2pSupplyInterestsImprovement` & `p2pBorrowInterestsImprovement` that are the improvement of the interests of the users that are matched on the P2P market compared to their equivalent position on the underlying pool.

For example, if Alice has $100 matched at a 1% yield per yer (0.5% on the underlying pool), after one year, the yield earned is $1, and it was about $0.5 on the pool

## Unimplemented Features

- [ ] Add data about the p2p matching, such as number of matches, matched value etc.
