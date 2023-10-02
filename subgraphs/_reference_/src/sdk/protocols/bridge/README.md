# Bridge SDK `1.0.1`

## Setup

- Copy over the whole SDK folder into your subgraph `src`. You won't need any of the other protocols, so you can safely delete those.
- You'll need to be using the bridge schema, starting from version `1.1.0`, since that one adds some auxiliary fields and entities that the lib needs.
- Run `graph codegen` to make sure every import resolves if you want your intelisense and import navigation to work.

That's it. To simplify setup we've tried to not make it depend on any contract calls. If it needed to make any, you would need to add the ABI of the given contract to your manifest and change the import paths wherever it is used in the library.

## How to use

You should probably forget about GraphQL entities altoghether if using this. Only exception being auxiliary entities, or a very specific usecase that the library doesn't support or gets in the way.

The library is initialized via a single constructor and a single import:

```typescript
import { SDK } from "./sdk/protocols/bridge";

const sdk = SDK.initialize(conf, pricer, tokenInit, event);

// ALSO accepts ethereum.Call
// const sdk = SDK.initialize(conf, pricer, tokenInit, call);
```

Where:

- `event`/`call` is the event/function being handled by the handler making use of the SDK
- `conf` should be an implementation of `BridgeConfigurer`. For convenience you can find an implementation that you can import directly at `./sdk/protocols/bridge/config`
- `pricer` should be an implementation of `TokenPricer`, found at `./sdk/protocols/config`. It allows the library to automatically calculate prices internally. Implementing it yourself allows you to use any pricing source you'd need.
- `tokenInit` should be an implementation of `./sdk/protocols/bridge/tokens:TokenInitializer`. It is used to populate the `Token` entity for the first time, and was decided to require it to be implemented to avoid the library depending on ABIs and to give some flexibility in case we need to deal with non-compliant ERC20 tokens.

The SDK class exposes 5 classes for you to use:

- `sdk.Protocol`
- `sdk.Tokens`
- `sdk.Accounts`
- `sdk.Pools`
- `sdk.Pricer`

We'll see them in a second. But you should know that for this all to work properly you need to **always use these classes methods and never other constructors directly**.

### _sdk.Protocol_

You can use this object to modify any value from the `Protocol` entity: TVL, revenue, volume, etc ...

This one is exposed for flexibility purposes, but in most cases you won't need to use it. Most of the values you might want to modify will already be updated automatically if you are using `sdk.Accounts` and `sdk.Pools`.

Here's the interface for your reference, refer to the jsdoc for more details:

<details>
  <summary>Protocol Interface</summary>

```typescript
interface Protocol {
  getID(): string;
  getBytesID(): string;
  getCurrentEvent(): CustomEventType;
  getTokenPricer(): TokenPricer;
  getCurrentChainID(): BigInt;
  setTotalValueLocked(tvl: BigDecimal): void;
  addTotalValueLocked(tvl: BigDecimal): void;
  addTotalValueExportedUSD(tve: BigDecimal): void;
  setTotalValueExportedUSD(tve: BigDecimal): void;
  addTotalValueImportedUSD(tvi: BigDecimal): void;
  setTotalValueImportedUSD(tvi: BigDecimal): void;
  addSupplySideRevenueUSD(rev: BigDecimal): void;
  addProtocolSideRevenueUSD(rev: BigDecimal): void;
  addRevenueUSD(protocolSide: BigDecimal, supplySide: BigDecimal): void;
  addVolumeInUSD(vol: BigDecimal): void;
  addVolumeOutUSD(vol: BigDecimal): void;
  addUser(count: u8 = 1): void;
  addTransferSender(count: u8 = 1): void;
  addTransferReceiver(count: u8 = 1): void;
  addLiquidityProvider(count: u8 = 1): void;
  addMessageSender(count: u8 = 1): void;
  addActiveUser(activity: AccountWasActive): void;
  addActiveTransferSender(activity: AccountWasActive): void;
  addActiveTransferReceiver(activity: AccountWasActive): void;
  addActiveLiquidityProvider(activity: AccountWasActive): void;
  addActiveMessageSender(activity: AccountWasActive): void;
  addTransaction(type: TransactionType): void;
  addCanonicalPoolRoute(count: u8 = 1): void;
  addWrappedPoolRoute(count: u8 = 1): void;
  addPool(count: u8 = 1): void;
  addSupportedToken(count: u8 = 1): void;
  addSupportedNetwork(chainID: BigInt): void;
}
```

</details>

As said, in most cases you won't need to use this directly.

### _sdk.Accounts_

This is the `AccountManager`. Whenever you need to deal with an account, you'll want to resort to this. It exposes a single method:

```typescript
interface AccountManager {
  loadAccount(address: Address): Account;
}
```

When instantiating accounts with it you'll see that the `Protocol.totalUniqueUsers` counter will get updated. It returns an object of our `Account` class. You should always get instances of `Account` via the `AccountManager`, never call the constructor directly.

`Account` gives you this functionality:

```typescript
interface Account {
  addChain(chain: BigInt): void;
  transferOut(
    pool: Pool,
    route: PoolRoute,
    destination: Address,
    amount: BigInt,
    transactionID: Bytes | null = null,
    updateMetrics: boolean = true
  ): BridgeTransfer;
  transferIn(
    pool: Pool,
    route: PoolRoute,
    source: Address,
    amount: BigInt,
    transactionID: Bytes | null = null,
    updateMetrics: boolean = true
  ): BridgeTransfer;
  liquidityDeposit(
    pool: Pool,
    amount: BigInt,
    updateMetrics: boolean = true
  ): LiquidityDeposit;
  liquidityWithdraw(
    pool: Pool,
    amount: BigInt,
    updateMetrics: boolean = true
  ): LiquidityWithdraw;
  countDeposit(): void;
  countWithdraw(): void;
  countTransferIn(): void;
  countTransferOut(): void;
}
```

The most relevant methods here are `transferIn()`, `transferOut()`, `liquidityDeposit()` and `liquidityWithdraw()`. You won't need the rest unless you don't create events via these Account methods.

When creating an event through these aforementioned methods, all Account and Protocol counters about unique users, user activity and transactions will be automatically updated. If for some reason you don't use these methods, you have `countDeposit|Withdraw|transferIn|transferOut` available.

### _sdk.Pools_

This is the `PoolManager`, to create and load `Pool`'s. Loading and creating pools should be done with this:

```typescript
PoolManager.loadPool<T>(id: Bytes, onCreate: onCreatePoolCallback | null = null, aux: T | null = null): Pool;
```

If you know that the pool you are loading from storage already exists you can omit the `onCreate` argument. Otherwise, it should be set. When the `PoolManager` detects that the pool you are trying to load doesn't exist, it will create the entity and call this callback.

The `aux` parameter can be any arbitrary type that you might need in your callback. This is done this way because closing over variables is not supported by AssemblyScript so we need to pass the argument around. An example of how to create a Pool:

```typescript
import { SDK, Pool } from "./sdk/protocols/bridge";

type PoolType = string;

export function handlePoolCreated(event: PoolCreated): void {
  const sdk = SDK.initialize(conf, pricer, tokenInit, event);

  const id = event.params.poolAddress;
  const aux: PoolType =
    "some value that we cannot get from PoolCreated alone for example";

  const pool = sdk.Pools.loadPool(id, onCreatePool, aux);
}

function onCreatePool(
  event: PoolCreated,
  pool: Pool,
  sdk: SDK,
  type: PoolType
): void {
  // ... do whatever stuff is necessary
  // ...

  // initialize is necessary for the entity to be persisted. Each pool should only be initialized once.
  // onCreatePool will only be called by the PoolManager the time the entity is created.
  pool.initialize(name, symbol, type, inputToken);
}
```

> **IMPORTANT: For Pool's to be persisted, it is necessary to call `initialize()` the first time it is loaded. This will set all the default values and save the entity.**

The use of a callback is optional. An alternative to it might just be:

```typescript
const pool = sdk.Pools.loadPool(id);
if (!pool.isInitialized) {
    pool.initialize(.....);
}
```

Make sure to call `initialize()` if it is the first time this pool is loaded. If not, it won't be persisted.
Also, if `initialize()` is called for a Pool that already was, it will result in a no-op.

### _sdk.Pool_

The `Pool` class contains all the methods you need to update any of its fields. If you see yourself needing to update an entity directly, it's either wrong or the library is missing some important functionality. File an issue or reach out so we can take a look at your usecase.

This is the full API exposed by `Pool`, for your reference. Refer to the jsdoc for details on what each function does:

<details>
    <summary>Pool Interface</summary>

```typescript
interface Pool {
  getBytesID(): Bytes;
  initialize(
    name: string,
    symbol: string,
    type: BridgePoolType,
    inputToken: Token
  ): void;
  getDestinationTokenRoute(token: CrosschainToken): PoolRoute | null;
  addDestinationToken(token: CrosschainToken): void;
  refreshTotalValueLocked(): void;
  setTotalValueLocked(newTVL: BigDecimal): void;
  addTotalValueLocked(delta: BigDecimal): void;
  setNetValueExportedUSD(newNetValueExported: BigDecimal): void;
  addNetValueExportedUSD(delta: BigDecimal): void;
  refreshNetValueExportedUSD(): void;
  getInputTokenAmountPrice(amount: BigInt): BigDecimal;
  addInputTokenBalance(amount: BigInt, updateMetrics: bool = true): void;
  setInputTokenBalance(newBalance: BigInt, updateMetrics: bool = true): void;
  addVolume(
    isOutgoing: boolean,
    route: PoolRoute,
    amount: BigInt,
    amountUSD: BigDecimal | null
  ): void;
  addSupplySideRevenueUSD(rev: BigDecimal): void;
  addProtocolSideRevenueUSD(rev: BigDecimal): void;
  addRevenueUSD(protocolSide: BigDecimal, supplySide: BigDecimal): void;
  addRevenueNative(protocolSide: BigInt, supplySide: BigInt): void;
  addMintSupply(amount: BigInt): void;
  addOutputTokenSupply(amount: BigInt): void;
  setOutputTokenSupply(amount: BigInt): void;
  addStakedOutputTokenAmount(amount: BigInt): void;
  setStakedOutputTokenAmount(amount: BigInt): void;
  refreshOutputTokenPriceUSD(): void;
  setRewardEmissions(type: RewardTokenType, token: Token, amount: BigInt): void;
  trackTransfer(
    transfer: BridgeTransfer,
    route: PoolRoute,
    eventType: TransactionType
  ): void;
  trackDeposit(deposit: LiquidityDeposit): void;
  trackWithdraw(withdraw: LiquidityWithdraw): void;
}
```

</details>

The most relevant methods you'll need from this `Pool` are:

- `initialize(string, string, BridgePoolType, Token): void`
- `addDestinationToken(CrosschainToken): void`
- `getDestinationTokenRoute(CrosschainToken): PoolRoute`
- `addRevenueUSD(BigDecimal, BigDecimal): void`
- `addRevenueNative(BigInt, BigInt): void`
- `addStakedOutputTokenAmount(BigInt): void`
- `setStakedOutputTokenAmount(BigInt): void`
- `setRewardEmissions(RewardTokenType, Token, BigInt): void`

All the rest you probably won't need unless you don't create transfers|deposits|withdraws via the `Account` class, or if you do so with `updateMetrics = false`.

### _sdk.Tokens_

This is a simple utility class to instantiate tokens and crossChainTokens easily. It also exposes a `registerSupportedToken`, which you probably don't need, since it is called as part of the `Pool.initialize`.

It also exposes an optional method `setTokenPresaver(presaver: TokenPresaver)`, which allows you to inject a class that implements `TokenPresaver`. What this will do is to call `preSaveToken(token: Token): Token` when initializing a new token right before calling `.save()`. This allows you to add extra context to the Token entity if you need to do so.

### _sdk.Pricer_

This is the same `TokenPricer` you pass to the `SDK.constructor`. It is there for convenience, mainly in case it needs to be used inside `Pool.onCreate` callbacks.

## End to End Example

The following are 2 examples of how to handle a transferOut (funds being sent out of this chain to a different one) and how to handle the emissions of rewards from some `masterChef` contract.

### TransferOut

```typescript
import { SDK } from "./sdk/protocols/bridge";
import { TokenPricer } from "./sdk/protocols/config";
import { TokenInitializer, TokenParams } from "./sdk/protocols/bridge/tokens";
import { Pool } from "./sdk/protocols/bridge/pool";
import { BridgePermissionType } from "./sdk/protocols/bridge/constants";
import { BridgeConfig } from "./sdk/protocols/bridge/config";
import { _ERC20 } from "wherever You have an ABI for it";
import { Versions } from "./versions";

// Implement TokenPricer to pass it to the SDK constructor
class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    return getUsdPrice(Address.fromBytes(token.id), BIGDECIMAL_ONE);
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount);
  }
}

// Implement TokenInitializer
class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const erc20 = _ERC20.bind(address);
    const name = erc20.name();
    const symbol = erc20.symbol();
    const decimals = erc20.decimals().toI32();
    return {
      name,
      symbol,
      decimals,
    };
  }
}

const conf = new BridgeConfig(
  "0x2796317b0fF8538F253012862c06787Adfb8cEb6",
  "Synapse",
  "synapse",
  BridgePermissionType.WHITELIST,
  Versions
);

export function handleTransferOut(event: TransferOut): void {
  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  const poolID = event.address;
  const pool = sdk.Pools.loadPool(
    poolID,
    onCreatePool,
    BridgePoolType.LOCK_RELEASE
  );
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    event.params.chainId,
    event.params.token,
    CrosschainTokenType.WRAPPED,
    event.params.token
  );
  pool.addDestinationToken(crossToken);

  const acc = sdk.Accounts.loadAccount(event.transaction.from);
  acc.transferOut(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params.to,
    event.params.amount,
    event.transaction.hash
  );
  pool.addRevenueNative(event.params.protocolFee, event.params.supplyFee);
}

function onCreatePool(
  event: PoolCreated,
  pool: Pool,
  sdk: SDK,
  type: BridgePoolType
): void {
  // ...
  pool.initialize(name, symbol, type, inputToken);
}
```

### Set Reward Emissions

```typescript
const rewardTokenAddress = "0x0.....";

export function handlePoolRewardsUpdated(event: PoolRewardsUpdated): void {
  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  const pool = sdk.Pools.loadPool(event.params.poolAddress);
  const rewardToken = sdk.Tokens.getOrCreateToken(rewardTokenAddress);
  const dailyEmissions = calculateDailyEmissions(
    event.params.emissionsPerBlock
  );

  pool.setRewardEmissions(RewardTokenType.DEPOSIT, rewardToken, dailyEmissions);
}
```

## A Note On Snapshots

You don't need to worry about snapshots anymore. At all. But you might want to know how they work under the hood.
Snapshots from each entity that has them are taken when the given entity is loaded. If the time since the last snapshot was taken is longer than the snapshot period, a snapshot will be taken with the data the entity had at the time of the load. Any changes made to an entity after a load will be part of the next snapshot.
