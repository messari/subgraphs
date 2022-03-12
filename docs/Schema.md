# Schema Definition

### Transaction vs. Event

The most granular data we index in the subgraphs are Event entities. They are very similar to the events in Ethereum event logs but not exactly the same. Conceptually, an Event entity uniquely represents a user action that has occurred in a protocol.

Generally, they are Ethereum events emitted by a function in the smart contracts, stored in transaction receipts as event logs. However, some user actions of interest are function calls that don't emit events. For example, the deposit and withdraw functions in Yearn do not emit any events. In our subgraphs, we still store them as Event entities, although they are not technically Ethereum events emitted by smart contracts.

In some cases, a smart contract call can emit multiple Ethereum events. In this case, the Ethereum event that's most relevant to the user action should be used to create the Event entity. For example, when minting a Uniswap v2 LP position, the mint function in Uniswap v2 emits two events: Mint and Transfer. In this case, we only need to create an Event entity (Deposit) based on the Mint event as it's more relevant to the user action deposit.

The words *transaction* and *event* are used interchangeably in this repo, instead of using *transaction* to refer to an Ethereum transaction. Note that we do not index any Ethereum transactions in our subgraphs, as Ethereum transactions can contain any number of heterogeneous events (or user actions) and are difficult to generalize in a useful way. That being said, all Event entities are keyed upon its parent transaction hash (and the event log index), so it's easy to trace back to a transaction if needed.

When indexing smart contract calls that represent a user action but do not emit any events, we still create Event entities but use an arbitrary index as the event log index. The index should always start from 0 and increment onwards. This is necessary in situation where there are multiple calls in the same transaction, we need a way to differetiate the Event entity created from each call.

### Price Oracles
