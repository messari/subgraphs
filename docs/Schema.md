# Schema Definition

## Protocol ID

You can use the factory contract address for a protocol as the protocol ID. Here are some examples:

- Uniswap v2's Factory Contract: 0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f
- Aave v2's Registry: 0x52D306e36E3B6B02c153d0266ff0f85d18BCD413
- Yearn v2's Registry: 0xe15461b18ee31b7379019dc523231c57d1cbc18c
- Curve's Address Provider: 0x0000000022d53366457f9d5e68ec105046fc4383

## Transaction vs. Event

The most granular data we index in the subgraphs are Event entities. They are very similar to the events in Ethereum event logs but not exactly the same. Conceptually, an Event entity uniquely represents a user action that has occurred in a protocol.

Generally, they are Ethereum events emitted by a function in the smart contracts, stored in transaction receipts as event logs. However, some user actions of interest are function calls that don't emit events. For example, the deposit and withdraw functions in Yearn do not emit any events. In our subgraphs, we still store them as Event entities, although they are not technically Ethereum events emitted by smart contracts.

In some cases, a smart contract call can emit multiple Ethereum events. In this case, the Ethereum event that's most relevant to the user action should be used to create the Event entity. For example, when minting a Uniswap v2 LP position, the mint function in Uniswap v2 emits two events: Mint and Transfer. In this case, we only need to create an Event entity (Deposit) based on the Mint event as it's more relevant to the user action deposit.

The words *transaction* and *event* are used interchangeably in this repo, instead of using *transaction* to refer to an Ethereum transaction. Note that we do not index any Ethereum transactions in our subgraphs, as Ethereum transactions can contain any number of heterogeneous events (or user actions) and are difficult to generalize in a useful way. That being said, all Event entities are keyed upon its parent transaction hash (and the event log index), so it's easy to trace back to a transaction if needed.

When indexing smart contract calls that represent a user action but do not emit any events, we still create Event entities but use an arbitrary index as the event log index. The index should always start from 0 and increment onwards. This is necessary in situation where there are multiple calls in the same transaction, we need a way to differetiate the Event entity created from each call.

### From & To

Note that the `from` and `to` field is defined differently per entity and may not necessarily correspond to that of the underlying transaction. For example, the `to` field is always the interacted smart contract address in the transaction but can be the user (caller) in the `Withdraw` entity, as the asset flows from the pool to the user. In general, `from` and `to` are defined according to the flow of the token/asset involved.

## Yield and Reward Tokens

### Yield

There are broadly two kinds of yields in DeFi:

#### Base Yield

- This is an increase in the value of the token you deposit. Usually, this comes from fees you earn as a liquidity provider or as a lender/depositor.
- e.g. In DEXes, this is the increase in reserves of a particular LP token. In lending protocols, this is the interest bearing tokens you receive upon deposit (aTokens for Aave, cTokens for Compound). In yield aggregators, this is the yield bearing tokens you hold (yTokens for Yearn).

#### Token incentives

- This is the additional tokens you get that’s distinct from the token you deposit.
- e.g. for Sushiswap, this would be the SUSHI rewards in the Onsen program.
- This is usually handled by a dedicated staking contract. The most popular is the MasterChef contract used in Sushiswap.

### Reward Tokens

There is a `RewardToken` entity in our schemas. This represents the extra token incentive associated with a particular protocol/pool (i.e. emission token), and is not the token associated with the base yield (i.e. LP token). Similarly, fields like `rewardTokenEmissionsAmount` and `rewardTokenEmissionsUSD` also refer to the rewards that come from token incentives.

Not all protocols have token rewards. For example, Uniswap doesn't have any token reward. For protocols that do, usually not all pools have token rewards. For example, for Sushiswap, only pools in the Onsen program have token rewards.

It's also common for a single pool to have multiple reward tokens. For example, Sushiswap's MasterChef v2 allows for multiple `Rewarders`. Some Curve pools also have both CRV as a reward and also the pool token (e.g. FXS for FRAX, SNX for sUSD) as another reward.

## Usage Metrics

Usage should be generally thought of in terms of external user interactions, that are primarily initiated by a user (EOA) on the front-end, but can also be initiated by another protocol/smart contract.

Here are some more detailed guidelines:

- Protocol internal actions are NOT considered usage (e.g. governance actions, contract deployments/upgrades).
- Protocol token (e.g. UNI token, AAVE token) transfers/swaps are NOT considered usage.
- Pool token (e.g. cTokens, yTokens) transfers are NOT considered usage.
- On-chain voting/delegation are NOT considered usage.
- Failed transactions are NOT considered usage.
- Staking/harvesting actions ARE considered usage.

## Financial Metrics

### Protocol Revenue

### Supply-Side Revenue

### Fees

## Internal Entities

There are situations where you may want to have additional entities in your schema. For example:

- Entities to save internal states of your subgraph for aggregation (e.g. counting)
- Entities to cached contract call result (e.g. prices)

In general, feel free to add extra entities that tracks the internal state of the subgraph as you see fit. Make sure you prefix these entities with an underscore (e.g. `_User`) to differentiate it from entities in the common schema.

Make sure these changes are **strictly** additive. If you need to **modify** existing entities, please let me know and we can go through it together.

When adding entities, make sure you document them with comments in your schema. User-facing comments should be done in double quotes and developer-facing comments should be done with hash tags.
