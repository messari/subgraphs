# Schema Definition

All subgraphs follow a set of standardized schemas. This standardization brings some important benefits:

**It makes it extremely easy for people to consume the subgraph data.**

- Every protocol has slightly different terminology and definition, making it difficult for people to make sense of their data.
- You will only need a single set of queries / pipeline to pull data from all supported protocols.
- All data are normalized in the same way, which saves you a huge amount of work.

**It makes it easy for developers to contribute.**

- Defining a subgraph schema from scratch can be a daunting task as there are many edge cases and nuances to consider. Our schema is battle-tested, making it a great starting point for any subgraph.
- We have a large set of subgraph implementations for you to refer to, and a wealth of tribal knowledge tracked in PRs and comments.
- We have a set of common libraries that you can leverage. Some of them took weeks to implement.
- We have great tooling you can use to validate your subgraph.

---

## Naming Conventions

- Enum values should be in all caps.
- Common types:
  - hash/address: `String`
  - block height: `BigInt`
  - timestamp: unix timestamp in `BigInt`
  - token amount: All token amounts should be BigInt to preserve precision (i.e. in wei)
  - dollar amount: All USD amounts (including prices) should be BigDecimal
- All rates should be stored as percentage values as `BigDecimal`. For example, 70.50% should be stored as `70.5`.
- Use plurals when referring to multiple items, usually stored as an array (e.g. tokens, balances).
- Optional fields that don't apply to an entity should be left as `null` instead of initialized with 0 or empty string.
- Certain prefixes may be used to indicate a particular type of value:
  - _cumulative_: sum of all historical data from day 1 up to this point. E.g. `cumulativeDepositUSD` means all deposits has ever been made to this protocol/pool.
  - _daily/hourly_: this only applies to snapshots and represents the sum of the snapshot interval (i.e. daily aggregate). E.g. `dailyActiveUsers` means all unique active users on a given day, up till now.
  - All other quantitative field indicates a spot balance. In other words, the value at this point in time. E.g. `totalValueLockedUSD` means the total TVL of the protocol/pool as of now.

### Quantitative Data

- There are 3 ways in which quantitative data are stored and fetched:
  1. Real-time: you can get real-time data by querying on specific entities. For example, get `totalValueLockedUSD` from a `Pool`.
  2. Point-in-time: you can get point-in-time (including historical) data on specific entities using [time-travel queries](https://thegraph.com/docs/en/developer/graphql-api/#time-travel-queries).
  3. Time-series: the best way to get time-series data is by querying for snapshots. For example, get `totalValueLockedUSD` from `PoolDailySnapshot`.

## Versioning

Every subgraph has a embedded versioning system in the `Protocol` entity/interface. We use 3 separate fields to version different aspects of the subgraphs for different stakeholders.

### Schema Version

There are two use cases for `schemaVersion`:

1. For us to keep track if a subgraph is implemented to the latest version of the schema. Generally as we update the schema there is going to be a lag between the shared schema upgrade (in the root dir) and specific protocol's schema upgrade. This can be used to track if a protocol has upgraded to the latest schema
2. For the consumer to know when there is a breaking change in the schema, which will cause a breaking change in their code.

### Subgraph Version

The field `subgraphVersion` this is mainly used for the specific subgraph developer to keep track the implementation. For example, if there is a major refactor, we should bump this version, but this has nothing to do with the schema and will no impact on downstream consumers. There may also be repository-wide implementation upgrades. For example, we might need to reimplement everything in Rust somewhere down the road (for substream upgrades), they it'll be a major upgrade on the implementation (major version bump) but again, no impact on schema or downstream consumer.

### Methodology Version

The field `methodologyVersion` is mainly used for data consumers to track how we calculate our metrics, and to which version of the code/subgraph that methodology corresponds to. For example, if Yahoo Finance uses our data and wants to know when we changed the definition of TVL, this is the best way to diff against that. With a single version, you can't immediately tell if the methodology has been changed

## ID

### Protocol ID

You can use the factory contract address for a protocol as the protocol ID. Here are some examples:

- Uniswap v2's Factory Contract: 0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f
- Aave v2's Registry: 0x52D306e36E3B6B02c153d0266ff0f85d18BCD413
- Yearn v2's Registry: 0xe15461b18ee31b7379019dc523231c57d1cbc18c
- Curve's Address Provider: 0x0000000022d53366457f9d5e68ec105046fc4383

### Entity ID

Entity IDs are usually defined by either an address, a transaction hash, a log index, or some combination of these. IDs are unique per entity type but can be the same in different entities. For example, a `Protocol` entity and a `Withdraw` entity can have the same ID.

Note that entity types that derive from the same interface cannot have the same IDs. For example, a `Withdraw` entity and a `Deposit` entity cannot have the same ID since they both implement the `Event` interface. In this case, we prefix the ID by `withdraw-` or `deposit-` in order to make them unique. You can use the helper function `prefixID(string, string)` in `common/utils/strings.ts` to make this easier.

Certain protocols may require adjustments to the ID of specific entities to handle edge cases (e.g. single-sided liquidity pools or single-sided staking). Feel free to make adjustments necessary to best fit the situation. Make sure these are documented in the README of the specific subgraphs.

Here are some examples:

- Convex doesn't have vault contracts for individual vaults. The Vault IDs for Convex is stored as { the Booster contract address }-{ pool ID }.
- Bancor v3 creates a reward program that has start and end date for a few tokens deposited (DAI, ETH, etc). The reward is always in BNT. So the ID is being stored as " { Reward token type }-{ Smart contract address of the deposited token }-{ start }-{ end } " such as `DEPOSIT-<DAI ADDRESS>-16xxxxxx-16xxxxxxx`.
- For pools that support single-sided staking, we can store each side as a separate pool, set `isSingleSided` as true, and differentiate with their ID (e.g. { Address of parent pool }- { Address/pid of staking pool }).

## Transaction vs. Event

The most granular data we index in the subgraphs are Event entities. They are very similar to the events in Ethereum event logs but not exactly the same. Conceptually, an Event entity uniquely represents a user action that has occurred in a protocol.

Generally, they are Ethereum events emitted by a function in the smart contracts, stored in transaction receipts as event logs. However, some user actions of interest are function calls that don't emit events. For example, the deposit and withdraw functions in Yearn do not emit any events. In our subgraphs, we still store them as Event entities, although they are not technically Ethereum events emitted by smart contracts.

In some cases, a smart contract call can emit multiple Ethereum events. In this case, the Ethereum event that's most relevant to the user action should be used to create the Event entity. For example, when minting a Uniswap v2 LP position, the mint function in Uniswap v2 emits two events: Mint and Transfer. In this case, we only need to create an Event entity (Deposit) based on the Mint event as it's more relevant to the user action deposit.

The words _transaction_ and _event_ are used interchangeably in this repo, instead of using _transaction_ to refer to an Ethereum transaction. Note that we do not index any Ethereum transactions in our subgraphs, as Ethereum transactions can contain any number of heterogeneous events (or user actions) and are difficult to generalize in a useful way. That being said, all Event entities are keyed upon its parent transaction hash (and the event log index), so it's easy to trace back to a transaction if needed.

When indexing smart contract calls that represent a user action but do not emit any events, we still create Event entities but use an arbitrary index as the event log index. The index should always start from 0 and increment onwards. This is necessary in situation where there are multiple calls in the same transaction, we need a way to differetiate the Event entity created from each call.

### From & To

Note that the `from` and `to` field is defined differently per entity and may not necessarily correspond to that of the underlying transaction. For example, the `to` field is always the interacted smart contract address in the transaction but can be the user (caller) in the `Withdraw` entity, as the asset flows from the pool to the user. In general, `from` and `to` are defined according to the flow of the token/asset involved.

## Account & Positions

### Positions

All positions are per market per account. We track two sides of the market separately:

- When a deposit is made, a `LENDER` position is opened.
- When a deposit is withdrew, the position is closed.
- When a borrow is made, a `BORROWER` position is opened.
- When a borrow is repaid, the position is closed.
- Depending on the amount being liquidated, the position may either be closed, or stay open.

When a deposit position is open, any additional deposits or withdraws updates the existing `Position` entity, instead of creating a new one. If a deposit occurs after an open `LENDER` position has been closed off, a new `LENDER` position gets created.

Example 1: Compound

1. User deposits 10 ETH
2. User borrows 1000 USDC
3. User borrows 200 SUSHI
4. User withdraws 1 ETH

The open positions should be:

- LENDER: 9 ETH
- BORROWER: 1000 USDC
- BORROWER: 200 SUSHI

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

There is a `RewardToken` entity in our schemas. This represents the extra token incentive associated with a particular protocol/pool (i.e. emission token), usually during a protocol's liquidity mining program, and is not the token associated with the base yield (i.e. LP token). Similarly, fields like `rewardTokenEmissionsAmount` and `rewardTokenEmissionsUSD` also refer to the rewards that come from token incentives. The before mentioned fields represent the estimated yield projected over the subsequent 24 hour period.

Not all protocols have token rewards. For example, Uniswap doesn't have any token reward. For protocols that do, usually not all pools have token rewards. For example, for Sushiswap, only pools in the Onsen program have token rewards.

It's also common for a single pool to have multiple reward tokens. For example, Sushiswap's MasterChef v2 allows for multiple `Rewarders`. Some Curve pools also have both CRV as a reward and also the pool token (e.g. FXS for FRAX, SNX for sUSD) as another reward. Similarly, for Lending Protocols, it's possible for a single Market to have reward tokens for both the lender (deposit) and the borrower (borrow). In that case, you should include two reward tokens for that Market, one with reward type as deposit and one with reward type as borrow.

There are different ways to calculate `rewardTokenEmissionsAmount` and `rewardTokenEmissionsUSD`. In particular, you can calculate a theoretical emission amount based on the underlying emission equation, or you can calculate the realized amount based on harvests. It's recommended to use the theoretical amount as it's more accurate and consistent. When calculating these in a snapshot, you should calculate them as the per-second (timestamp) or per-block amount of the current block normalized to the during of that snapshot depending on the emissions specified emissions interval (e.g. normalize the per-second or per-block amount to the daily amount for a daily snapshot). The reasoning for that is when we show this data on the front-end, it'll be converted to an APY, which will drive user decision (e.g. decide where they want to invest their money in the future), so the data should be forward-looking.

When handling reward tokens that need to be staked (e.g. in the MasterChef contract), make sure you also keep track of `stakedOutputTokenAmount`, which will be needed to calculate reward APY.

The fields related to rewards tokens in the LP staking programs (e.g. `rewardTokenEmissionsAmount`, `rewardTokenEmissionsUSD`, `stakedOutputTokenAmount`, `rewardToken`) should all remain null unless the LP tokens minted from this pool have been elligeable for staking to earn rewards. If an LP token has at one time been elligeable for use in a staking program but is no longer earning rewards, these fields should still remain as non-null values.

## Usage Metrics

Usage should be generally thought of in terms of external user interactions, that are primarily initiated by a user (EOA) on the front-end, but can also be initiated by another protocol/smart contract.

Here are some more detailed guidelines:

**Considered Usage**

- DEXes: Swapping Tokens using Liquidity Pools, Adding LP, Removing LP, Creating Pools
- Lending: Depositing Tokens into Pools, Withdrawing Tokens from Pools, Borrowing Tokens from Pools, Repaying Borrowed Balances, Liquidating Positions, Creating Pools
- Yield: Depositing Tokens into a Vault, Withdrawing Tokens from a Vault, Harvesting Yields from Vaults, Creating Vaults
- General: Staking/harvesting actions ARE considered usage

**NOT considered Usage**

- Protocol internal actions are NOT considered usage (e.g. governance actions, contract deployments/upgrades).
- Protocol token (e.g. UNI token, AAVE token) transfers/swaps are NOT considered usage.
- Pool token (e.g. cTokens, yTokens) transfers are NOT considered usage.
- On-chain voting/delegation are NOT considered usage.
- Failed transactions are NOT considered usage.

## Financial Metrics

Since the methodology for calculating financial metrics are protocol-independent, they are defined per-protocol in the `README.md` file of the protocol's subgraph folder.

That being said, here are some general definitions for certain fields:

- **Total Revenue**: All new money entering the protocol from operations. This is fees from dexs. and total yield generated in yield aggregators.
- **Supply Side Revenue**: portion of Total Rev paid to depositors. this is total yield generated less protocol fees in yield ags. This is fees directed to LPs in DEXes.
- **Protocol Revenue**: portion of total revenue directed to protocol and its operations. Includes strategiest revenue and other operational funds. so this includes all protocol fees such as protocols' DEX fee portion, yield aggregator's performance fees etc.

In the future, we may also consider more detailed financial metrics. But these are not needed for now:

- **Operational Earnings**: Protocol Revenue after paying for operational expenses. Operational expenses would include strategiest fees in yield ag. Also includes consultant fees such as Gauntlet, GFX Labs contracts with the protocol (second part obv very manual but we should figure out how to leverage our intel prowess here for a metric no one else can put together at scale).
- **Adj Operational Earnings**: Operational Earnings minus token emissions (in USD). This should represent net capital into the protocol before income redistribution, accounts for incentivized revenue.

## Internal Entities

There are situations where you may want to have additional entities in your schema. For example:

- Entities to save internal states of your subgraph for aggregation (e.g. counting)
- Entities to cached contract call result (e.g. prices)

In general, feel free to add extra entities that tracks the internal state of the subgraph as you see fit. Make sure you prefix these entities with an underscore (e.g. `_User`) to differentiate it from entities in the common schema. The same applies to extra fields within existing entities.

Make sure these changes are **strictly** additive. If you need to **modify** existing entities, please let me know and we can go through it together.

When adding entities, make sure you document them with comments in your schema. User-facing comments should be done in double quotes and developer-facing comments should be done with hash tags.
