# Morpho Subgraph

The Morpho Subgraph is a collection of morpho-x lending protocols following the entities provided by Messari for Lending Protocols.

Some of the entities are filled with Morpho specific data, permitting to track the evolution of the protocols regarding the peer-to-peer aspect of Morpho.

Among them, some properties are defined as "internal", meaning that they are not "human readable" and are used for internal computations. These properties are prepended with an underscore.

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

Creates a table with the datasources list

| Protocol           | Morpho Address                                                                                                        | Deployment block |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Morpho Aave V2     | [0x777777c9898d384f785ee44acfe945efdff5f3e0](https://etherscan.io/address/0x777777c9898d384f785ee44acfe945efdff5f3e0) | 15383036         |
| Morpho Compound V2 | [0x8888882f8f843896699869179fb6e4f7e3b58888](https://etherscan.io/address/0x8888882f8f843896699869179fb6e4f7e3b58888) | 14860866         |

All Morpho Protocols are indexed in the same subgraph with different `LendingProtocol` entities.

## Access through the Subgraph Network

Coming soon

## P2P improvement

The Market entity has properties named `p2pSupplyInterestsImprovement` & `p2pBorrowInterestsImprovement` that are the improvement of the interests of the users that are matched on the P2P market compared to their equivalent position on the underlying pool.

For example, if Alice has $100 matched at a 1% yield per yer (0.5% on the underlying pool), after one year, the yield earned is $1, and it was about $0.5 on the pool

## TODO

- [ ] Add the Comp rewards for morpho-compound, since the protocol is redistributing comp rewards to users on pool
- [ ] Add data about the p2p matching, such as number of matches, matched value etc.
- [ ] Add Protocol Revenues. Not a problem for now since reserve factor is setted to 0.
