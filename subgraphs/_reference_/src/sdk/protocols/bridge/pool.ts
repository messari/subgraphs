import {
  Bytes,
  BigDecimal,
  BigInt,
  ethereum,
  Address,
  log,
} from "@graphprotocol/graph-ts";
import {
  BridgeTransfer,
  CrosschainToken,
  LiquidityDeposit,
  LiquidityWithdraw,
  Pool as PoolSchema,
  PoolRoute,
  Token,
} from "../../../../generated/schema";
import { Bridge } from "./protocol";
import { BridgePoolType, CrosschainTokenType, TransactionType } from "./enums";
import {
  BIGDECIMAL_ZERO,
  BIGINT_MINUS_ONE,
  BIGINT_ZERO,
  RewardTokenType,
} from "../../util/constants";
import { exponentToBigDecimal } from "../../util/numbers";
import { sortArrayByReference, sortBytesArray, updateArrayAtIndex } from "../../util/arrays";
import { TokenManager } from "./tokens";
import { PoolSnapshot } from "./poolSnapshot";
import { SDK } from ".";

type onCreatePoolCallback<T> = (
  event: ethereum.Event,
  pool: Pool,
  sdk: SDK,
  aux: T | null
) => void;

export class PoolManager {
  protocol: Bridge;
  tokens: TokenManager;

  constructor(protocol: Bridge, tokens: TokenManager) {
    this.protocol = protocol;
    this.tokens = tokens;
  }

  loadPool<T>(
    id: Bytes,
    onCreate: onCreatePoolCallback<T> | null = null,
    aux: T | null = null
  ): Pool {
    let entity = PoolSchema.load(id);
    if (entity) {
      return new Pool(this.protocol, entity, this.tokens);
    }

    entity = new PoolSchema(id);
    entity.protocol = this.protocol.getBytesID();

    const pool = new Pool(this.protocol, entity, this.tokens);
    pool.isInitialized = false;
    if (onCreate) {
      onCreate(this.protocol.getCurrentEvent(), pool, this.protocol.sdk!, aux);
    }
    return pool;
  }
}

export class Pool {
  pool: PoolSchema;
  protocol: Bridge;
  tokens: TokenManager;
  snapshoter: PoolSnapshot | null = null;

  public isInitialized: boolean = true;

  constructor(protocol: Bridge, pool: PoolSchema, tokens: TokenManager) {
    this.pool = pool;
    this.protocol = protocol;
    this.tokens = tokens;
    this.snapshoter = new PoolSnapshot(pool, protocol.event);
  }

  private save(): void {
    this.pool.save();
  }

  private getInputToken(): Token {
    return this.tokens.getOrCreateToken(
      Address.fromBytes(this.pool.inputToken)
    );
  }

  initialize(
    name: string,
    symbol: string,
    type: BridgePoolType,
    inputToken: Token
  ): void {
    if (this.isInitialized) {
      return;
    }

    const event = this.protocol.getCurrentEvent();
    this.pool.name = name;
    this.pool.symbol = symbol;
    this.pool.type = type;
    this.pool.inputToken = inputToken.id;
    this.pool.destinationTokens = [];
    this.pool.routes = [];
    this.pool.createdTimestamp = event.block.timestamp;
    this.pool.createdBlockNumber = event.block.number;

    if (type == BridgePoolType.BURN_MINT) {
      this.pool.mintSupply = BIGINT_ZERO;
    }
    this.pool.inputTokenBalance = BIGINT_ZERO;
    this.pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeVolumeIn = BIGINT_ZERO;
    this.pool.cumulativeVolumeOut = BIGINT_ZERO;
    this.pool.netVolume = BIGINT_ZERO;
    this.pool.cumulativeVolumeInUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeVolumeOutUSD = BIGDECIMAL_ZERO;
    this.pool.netVolumeUSD = BIGDECIMAL_ZERO;

    this.pool._lastDailySnapshotTimestamp = BIGINT_ZERO;
    this.pool._lastHourlySnapshotTimestamp = BIGINT_ZERO;
    this.save();

    this.protocol.addPool();
    this.tokens.registerSupportedToken(Address.fromBytes(inputToken.id));
  }

  private addRouteAndCrossToken(
    route: PoolRoute,
    token: CrosschainToken
  ): void {
    const routes = this.pool.routes;
    const tokens = this.pool.destinationTokens;

    routes.push(route.id);
    tokens.push(route.crossToken);

    this.pool.routes = routes;
    this.pool.destinationTokens = tokens;
    this.save();

    if (token.type == CrosschainTokenType.CANONICAL) {
      this.protocol.addCanonicalPoolRoute();
    } else {
      this.protocol.addWrappedPoolRoute();
    }
    this.protocol.addSupportedNetwork(token.chainID);
  }

  private routeIDFromCrosschainToken(token: CrosschainToken): Bytes {
    const chainIDs = [this.protocol.getCurrentChainID(), token.chainID].sort();
    return Bytes.fromUTF8(
      `${this.pool.id.toHexString()}-${token.id.toHexString()}-${chainIDs[0]}-${
        chainIDs[1]
      }`
    );
  }

  /**
   * Retrieves the PoolRoute associated with the given token on this pool.
   *
   * @param token The token in the other chain
   * @returns The route which connects this pool to that token.
   */
  getDestinationTokenRoute(token: CrosschainToken): PoolRoute | null {
    const id = this.routeIDFromCrosschainToken(token);
    return PoolRoute.load(id);
  }

  /**
   * Registers the given token as one to which we can bridge from this pool.
   * If it is already registered, this function does nothing.
   * Otherwise, it will create a new PoolRoute and add it to the pool. It will also
   * update the route counters on the Protocol entity and add the network to the
   * list of supported networks.
   *
   * @param token
   */
  addDestinationToken(token: CrosschainToken): void {
    let route = this.getDestinationTokenRoute(token);
    if (route) {
      return;
    }

    const event = this.protocol.getCurrentEvent();
    const id = this.routeIDFromCrosschainToken(token);
    route = new PoolRoute(id);
    route.pool = this.pool.id;
    route.counterType = inferCounterType(this.pool.type, token);
    route.inputToken = this.pool.inputToken;
    route.crossToken = token.id;
    route.isSwap = this.isSwap(token);
    route.cumulativeVolumeIn = BIGINT_ZERO;
    route.cumulativeVolumeOut = BIGINT_ZERO;
    route.cumulativeVolumeInUSD = BIGDECIMAL_ZERO;
    route.cumulativeVolumeOutUSD = BIGDECIMAL_ZERO;
    route.createdTimestamp = event.block.timestamp;
    route.createdBlockNumber = event.block.number;
    route.save();
    this.addRouteAndCrossToken(route, token);
  }

  private isSwap(token: CrosschainToken): boolean {
    if (!token.token) {
      return true;
    }
    return this.pool.inputToken != token.token!;
  }

  /**
   * Recalculates the total value locked for this pool based on its current input token balance.
   * This function will also update the protocol's total value locked based on the change in this pool's.
   */
  refreshTotalValueLocked(): void {
    const tvl = this.getInputTokenAmountPrice(this.pool.inputTokenBalance);
    this.setTotalValueLocked(tvl);
  }

  /**
   * Updates the total value locked for this pool to the given value.
   * Will also update the protocol's total value locked based on the change in this pool's.
   */
  setTotalValueLocked(newTVL: BigDecimal): void {
    const delta = newTVL.minus(this.pool.totalValueLockedUSD);
    this.addTotalValueLocked(delta);
    this.save();
  }

  /**
   * Adds the given delta to the total value locked for this pool.
   * Will also update the protocol's total value locked based on the change in this pool's.
   *
   * @param delta The change in total value locked for this pool.
   */
  addTotalValueLocked(delta: BigDecimal): void {
    this.pool.totalValueLockedUSD = this.pool.totalValueLockedUSD.plus(delta);
    this.protocol.addTotalValueLocked(delta);
    this.save();
  }

  /**
   * Utility function to convert some amount of input token to USD.
   *
   * @param amount the amount of inputToken to convert to USD
   * @returns The converted amount.
   */
  getInputTokenAmountPrice(amount: BigInt): BigDecimal {
    const token = this.getInputToken();
    const price = this.protocol.getTokenPricer().getTokenPrice(token);
    token.lastPriceUSD = price;
    token.save();

    return amount.divDecimal(exponentToBigDecimal(token.decimals)).times(price);
  }

  /**
   * Adds the given amount to the pool's input token balance. It will optionally
   * update the pool's and protocol's total value locked. If not stated, will default to true.
   *
   * @param amount amount to be added to the pool's input token balance.
   * @param updateMetrics optional parameter to indicate whether to update the pool's and protocol's total value locked.
   */
  addInputTokenBalance(amount: BigInt, updateMetrics: boolean = true): void {
    const newBalance = this.pool.inputTokenBalance.plus(amount);
    this.setInputTokenBalance(newBalance, updateMetrics);
  }

  /**
   * Sets the pool's input token balance to the given amount. It will optionally
   * update the pool's and protocol's total value locked. If not stated, will default to true.
   *
   * @param amount amount to be set as the pool's input token balance.
   * @param updateMetrics optional parameter to indicate whether to update the pool's and protocol's total value locked.
   */
  setInputTokenBalance(
    newBalance: BigInt,
    updateMetrics: boolean = true
  ): void {
    this.pool.inputTokenBalance = newBalance;
    if (updateMetrics) {
      this.refreshTotalValueLocked();
    }
  }

  getBytesID(): Bytes {
    return this.pool.id;
  }

  /**
   * Adds the given volume to the Pool, Protocol and Route.
   *
   * @param isOutgoing true for volumeOut, false for volumeIn
   * @param route the route for which to add volume
   * @param amount amount of input token to add as volume
   * @param amountUSD optional amount of USD to add as volume. If not set it will be calculated with the Pricer.
   */
  addVolume(
    isOutgoing: boolean,
    route: PoolRoute,
    amount: BigInt,
    amountUSD: BigDecimal | null
  ): void {
    if (!amountUSD) {
      amountUSD = this.getInputTokenAmountPrice(amount);
    }

    if (isOutgoing) {
      route.cumulativeVolumeOut = route.cumulativeVolumeOut.plus(amount);
      route.cumulativeVolumeOutUSD =
        route.cumulativeVolumeOutUSD.plus(amountUSD);
      this.pool.cumulativeVolumeOut =
        this.pool.cumulativeVolumeOut.plus(amount);
      this.pool.cumulativeVolumeOutUSD =
        this.pool.cumulativeVolumeOutUSD.plus(amountUSD);
      this.pool.netVolume = this.pool.netVolume.minus(amount);
      this.pool.netVolumeUSD = this.pool.netVolumeUSD.minus(amountUSD);
      this.protocol.addVolumeInUSD(amountUSD);
    } else {
      route.cumulativeVolumeIn = route.cumulativeVolumeIn.plus(amount);
      route.cumulativeVolumeInUSD = route.cumulativeVolumeInUSD.plus(amountUSD);
      this.pool.cumulativeVolumeIn = this.pool.cumulativeVolumeIn.plus(amount);
      this.pool.cumulativeVolumeInUSD =
        this.pool.cumulativeVolumeInUSD.plus(amountUSD);
      this.pool.netVolume = this.pool.netVolume.plus(amount);
      this.pool.netVolumeUSD = this.pool.netVolumeUSD.plus(amountUSD);
      this.protocol.addVolumeOutUSD(amountUSD);
    }
    route.save();
    this.save();
  }

  /**
   * Adds a given USD value to the pool and protocol supplySideRevenue. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param rev {BigDecimal} The value to add to the protocol's supplySideRevenue.
   */
  addSupplySideRevenueUSD(rev: BigDecimal): void {
    this.pool.cumulativeTotalRevenueUSD =
      this.pool.cumulativeTotalRevenueUSD.plus(rev);
    this.pool.cumulativeSupplySideRevenueUSD =
      this.pool.cumulativeSupplySideRevenueUSD.plus(rev);
    this.save();

    this.protocol.addSupplySideRevenueUSD(rev);
  }

  /**
   * Adds a given USD value to the pool and protocol protocolSideRevenue. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param rev {BigDecimal} The value to add to the protocol's protocolSideRevenue.
   */
  addProtocolSideRevenueUSD(rev: BigDecimal): void {
    this.pool.cumulativeTotalRevenueUSD =
      this.pool.cumulativeTotalRevenueUSD.plus(rev);
    this.pool.cumulativeProtocolSideRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD.plus(rev);
    this.save();

    this.protocol.addProtocolSideRevenueUSD(rev);
  }

  /**
   * Adds a given USD value to the pool and protocol's supplySideRevenue and protocolSideRevenue. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param protocolSide {BigDecimal} The value to add to the protocol's protocolSideRevenue.
   * @param supplySide {BigDecimal} The value to add to the protocol's supplySideRevenue.
   */
  addRevenueUSD(protocolSide: BigDecimal, supplySide: BigDecimal): void {
    this.addSupplySideRevenueUSD(supplySide);
    this.addProtocolSideRevenueUSD(protocolSide);
  }

  /**
   * Convenience method to add revenue denominated in the pool's input token. It converts it to USD
   * under the hood and calls addRevenueUSD.
   */
  addRevenueNative(protocolSide: BigInt, supplySide: BigInt): void {
    const pricer = this.protocol.pricer;
    const inputToken = this.getInputToken();
    const pAmountUSD = pricer.getAmountValueUSD(inputToken, protocolSide);
    const sAmountUSD = pricer.getAmountValueUSD(inputToken, supplySide);
    this.addRevenueUSD(pAmountUSD, sAmountUSD);
  }

  /**
   * Adds a given amount to the pool's mintSupply. It should only be used for pools of type BURN_MINT.
   * @param amount {BigInt} The amount to add to the pool's mintSupply. It can be positive or negative.
   */
  addMintSupply(amount: BigInt): void {
    this.pool.mintSupply = this.pool.mintSupply!.plus(amount);
    this.save();
  }

  /**
   * Adds a given amount to the pool's outputTokenSupply. It should only be used for pools
   * of type LIQUIDITY. Or pools that emit some kind of LP token on deposit.
   * @param amount
   */
  addOutputTokenSupply(amount: BigInt): void {
    if (!this.pool.outputTokenSupply) {
      this.pool.outputTokenSupply = BIGINT_ZERO;
    }
    this.pool.outputTokenSupply = this.pool.outputTokenSupply!.plus(amount);
    this.save();
  }

  /**
   * Sets the pool's outputTokenSupply value. It should only be used for pools
   * of type LIQUIDITY. Or pools that emit some kind of LP token on deposit.
   * It will also update the outputTokenPriceUSD value.
   * @param amount
   */
  setOutputTokenSupply(amount: BigInt): void {
    this.pool.outputTokenSupply = amount;
    this.refreshOutputTokenPriceUSD();
    this.save();
  }

  /**
   * Adds a given amount to the pool's stakedOutputTokenAmount.
   * @param amount
   * @returns
   */
  addStakedOutputTokenAmount(amount: BigInt): void {
    if (!this.pool.stakedOutputTokenAmount) {
      this.pool.stakedOutputTokenAmount = BIGINT_ZERO;
      this.save();
      return;
    }

    this.pool.stakedOutputTokenAmount =
      this.pool.stakedOutputTokenAmount!.plus(amount);
    this.save();
  }

  /**
   * Sets the pool's stakedOutputTokenAmount value.
   * @param amount
   */
  setStakedOutputTokenAmount(amount: BigInt): void {
    this.pool.stakedOutputTokenAmount = amount;
    this.save();
  }

  /**
   * Updates the price of the pool's output token in USD.
   * This is automatically called when changing the output token supply via setOutputTokenSupply
   * but can be called manually if necessary.
   */
  refreshOutputTokenPriceUSD(): void {
    if (!this.pool.outputToken) {
      return;
    }
    const token = this.tokens.getOrCreateToken(
      Address.fromBytes(this.pool.outputToken)
    );
    const price = this.protocol.pricer.getTokenPrice(token);

    this.pool.outputTokenPriceUSD = price;
    this.save();
  }

  /**
   * Sets the rewardTokenEmissions and its USD value for a given reward token.
   * It will also create the RewardToken entity and add it to the pool rewardTokens array
   * if not already present.
   * @param type The type of reward token
   * @param token The actual token being rewarded
   * @param amount The daily amount of reward tokens emitted to this pool
   */
  setRewardEmissions(
    type: RewardTokenType,
    token: Token,
    amount: BigInt
  ): void {
    const rToken = this.tokens.getOrCreateRewardToken(type, token);
    const amountUSD = this.protocol.pricer.getAmountValueUSD(token, amount);
    if (!this.pool.rewardTokens) {
      this.pool.rewardTokens = [rToken.id];
      this.pool.rewardTokenEmissionsAmount = [amount];
      this.pool.rewardTokenEmissionsUSD = [amountUSD];
      this.save();
      return;
    }

    if (this.pool.rewardTokens!.includes(rToken.id)) {
      const index = this.pool.rewardTokens!.indexOf(rToken.id);
      this.pool.rewardTokenEmissionsAmount = updateArrayAtIndex(
        this.pool.rewardTokenEmissionsAmount!,
        amount,
        index
      );
      this.pool.rewardTokenEmissionsUSD = updateArrayAtIndex(
        this.pool.rewardTokenEmissionsUSD!,
        amountUSD,
        index
      );
      this.save();
      return;
    }

    const tokens = this.pool.rewardTokens!.concat([rToken.id]);
    const newOrder = sortBytesArray(tokens);

    let amounts = this.pool.rewardTokenEmissionsAmount!.concat([amount]);
    let amountsUSD = this.pool.rewardTokenEmissionsUSD!.concat([amountUSD]);
    amounts = sortArrayByReference(newOrder, tokens, amounts);
    amountsUSD = sortArrayByReference(newOrder, tokens, amountsUSD);

    this.pool.rewardTokens = tokens;
    this.pool.rewardTokenEmissionsAmount = amounts;
    this.pool.rewardTokenEmissionsUSD = amountsUSD;
    this.save();
  }

  /**
   * Will update all volumes, mintSupply, TVL, and transaction counts based on the information of some transfer.
   * If the transfer is created via an `Account`, this will be called automatically.
   *
   * @param transfer
   * @param route the route this transfer is travelling through.
   * @param eventType the type of transfer: transfer_out, transfer_in, deposit, withdraw, etc
   * @see Account
   */
  trackTransfer(
    transfer: BridgeTransfer,
    route: PoolRoute,
    eventType: TransactionType
  ): void {
    this.addVolume(
      transfer.isOutgoing,
      route,
      transfer.amount,
      transfer.amountUSD
    );
    this.protocol.addTransaction(eventType);

    if (this.pool.type == BridgePoolType.BURN_MINT) {
      let amount = transfer.amount;
      if (transfer.isOutgoing) {
        amount = amount.times(BIGINT_MINUS_ONE);
      }
      this.addMintSupply(amount);
    } else if (
      this.pool.type == BridgePoolType.LIQUIDITY ||
      this.pool.type == BridgePoolType.LOCK_RELEASE
    ) {
      let amount = transfer.amount;
      if (!transfer.isOutgoing) {
        amount = amount.times(BIGINT_MINUS_ONE);
      }
      this.addInputTokenBalance(amount);
    }
  }

  /**
   * Will update the pool inputTokenBalance and TVL (also protocol TVL), based on the amount deposited.
   * This will be called automatically if the LiquidityDeposit is created via an `Account`.
   * It WON'T update the outputTokenSupply, so you should do that manually.
   * @param deposit
   * @see Account
   */
  trackDeposit(deposit: LiquidityDeposit): void {
    this.protocol.addTransaction(TransactionType.LIQUIDITY_DEPOSIT);
    this.addInputTokenBalance(deposit.amount);
  }

  /**
   * Will update the pool inputTokenBalance and TVL (also protocol TVL), based on the amount withdrawn.
   * This will be called automatically if the LiquidityWithdraw is created via an `Account`.
   * It WON'T update the outputTokenSupply, so you should do that manually.
   * @param deposit
   * @see Account
   */
  trackWithdraw(withdraw: LiquidityWithdraw): void {
    this.protocol.addTransaction(TransactionType.LIQUIDITY_WITHDRAW);
    this.addInputTokenBalance(withdraw.amount.times(BIGINT_MINUS_ONE));
  }
}

/**
 * Will determine what's the type of the pool on the other side of the route.
 * Possible combinations are:
 * - BURN_MINT <> LOCK_RELEASE
 * - BURN_MINT <> BURN_MINT
 * - LIQUIDITY <> LIQUIDITY
 *
 * @param poolType the type of the pool on the current side of the route
 * @param token the token sent through this route
 * @returns {BridgePoolType}
 */
function inferCounterType(
  poolType: BridgePoolType,
  token: CrosschainToken
): BridgePoolType {
  if (poolType == BridgePoolType.LIQUIDITY) {
    return BridgePoolType.LIQUIDITY;
  }
  if (poolType == BridgePoolType.LOCK_RELEASE) {
    return BridgePoolType.BURN_MINT;
  }
  if (poolType == BridgePoolType.BURN_MINT) {
    return token.type == CrosschainTokenType.WRAPPED
      ? BridgePoolType.BURN_MINT
      : BridgePoolType.LOCK_RELEASE;
  }

  log.error("Unknown pool type at inferCounterType {}", [poolType]);
  log.critical("", []);
  return poolType;
}
