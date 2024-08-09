import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../../util/constants";
import { TokenManager } from "./tokens";
import { ProtocolManager } from "./protocol";
import { PoolSnapshot } from "./poolSnapshot";
import { Pool as PoolSchema, Token } from "../../../../generated/schema";
import { Bytes, BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";

/**
 * This file contains the PoolManager, which is used to
 * initialize new pools in the protocol.
 *
 * Schema Version:  3.0.0
 * SDK Version:     1.1.0
 * Author(s):
 *  - @steegecs
 *  - @shashwatS22
 */

export class PoolManager {
  protocol: ProtocolManager;
  tokens: TokenManager;

  constructor(protocol: ProtocolManager, tokens: TokenManager) {
    this.protocol = protocol;
    this.tokens = tokens;
  }

  loadPool(id: Bytes): Pool {
    let entity = PoolSchema.load(id);
    if (entity) {
      return new Pool(this.protocol, entity, this.tokens, true);
    }

    entity = new PoolSchema(id);
    entity.protocol = this.protocol.getBytesID();

    const pool = new Pool(this.protocol, entity, this.tokens, false);
    pool.isInitialized = false;
    return pool;
  }
}

export class Pool {
  pool: PoolSchema;
  protocol: ProtocolManager;
  tokens: TokenManager;
  snapshoter: PoolSnapshot | null = null;

  public isInitialized: boolean = true;

  constructor(
    protocol: ProtocolManager,
    pool: PoolSchema,
    tokens: TokenManager,
    isInitialized: bool
  ) {
    this.pool = pool;
    this.protocol = protocol;
    this.tokens = tokens;

    if (isInitialized) {
      this.snapshoter = new PoolSnapshot(pool, protocol.event);
      this.pool.lastUpdateTimestamp = protocol.event.block.timestamp;
      this.save();
    }
  }

  private save(): void {
    this.pool.save();
  }

  initialize(
    name: string,
    symbol: string,
    inputTokens: Bytes[],
    outputToken: Token | null
  ): void {
    if (this.isInitialized) {
      return;
    }

    const event = this.protocol.getCurrentEvent();
    this.pool.protocol = this.protocol.getBytesID();
    this.pool.name = name;
    this.pool.symbol = symbol;
    this.pool.inputTokens = inputTokens;
    this.pool.outputToken = outputToken ? outputToken.id : null;
    this.pool.createdTimestamp = event.block.timestamp;
    this.pool.createdBlockNumber = event.block.number;

    this.pool.inputTokenBalances = [];
    this.pool.inputTokenBalancesUSD = [];
    this.pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    this.pool.lastSnapshotDayID = 0;
    this.pool.lastUpdateTimestamp = BIGINT_ZERO;
    this.save();

    this.protocol.addPool();
  }

  /**
   * Recalculates the total value locked for this pool based on its current input token balance.
   * This function will also update the protocol's total value locked based on the change in this pool's.
   */
  private refreshTotalValueLocked(): void {
    let totalValueLockedUSD = BIGDECIMAL_ZERO;

    for (let idx = 0; idx < this.pool.inputTokens.length; idx++) {
      const inputTokenBalanceUSD = this.pool.inputTokenBalancesUSD[idx];
      totalValueLockedUSD = totalValueLockedUSD.plus(inputTokenBalanceUSD);
    }

    this.setTotalValueLocked(totalValueLockedUSD);
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

  addInputToken(token: Address): void {
    const inputTokens = this.pool.inputTokens.concat([token]);
    this.pool.inputTokens = inputTokens;

    this.save();
  }

  // export function removeFromArrayAtIndex<T>(x: T[], index: i32): T[] {
  //   const retval = new Array<T>(x.length - 1);
  //   let nI = 0;
  //   for (let i = 0; i < x.length; i++) {
  //     if (i != index) {
  //       retval[nI] = x[i];
  //       nI += 1;
  //     }
  //   }
  //   return retval;
  // }

  removeInputToken(token: Address): void {
    const inputTokens = this.pool.inputTokens;
    const newArray = new Array<Bytes>(inputTokens.length - 1);

    let nI = 0;
    for (let i = 0; i < inputTokens.length; i++) {
      if (inputTokens[i] != token) {
        newArray[nI] = inputTokens[i];
        nI += 1;
      }
    }

    this.pool.inputTokens = newArray;

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
   * Utility function to update token price.
   *
   * @param token
   * @returns
   */
  setTokenPrice(token: Token): void {
    if (
      !token.lastPriceBlockNumber ||
      (token.lastPriceBlockNumber &&
        token.lastPriceBlockNumber! < this.protocol.event.block.number)
    ) {
      const pricePerToken = this.protocol.getTokenPricer().getTokenPrice(token);
      token.lastPriceUSD = pricePerToken;
      token.lastPriceBlockNumber = this.protocol.event.block.number;
      token.save();
    }
  }

  /**
   * Utility function to convert some amount of input token to USD.
   *
   * @param token
   * @param amount the amount of inputToken to convert to USD
   * @returns The converted amount.
   */
  getInputTokenAmountPrice(token: Token, amount: BigInt): BigDecimal {
    this.setTokenPrice(token);

    return this.protocol.getTokenPricer().getAmountValueUSD(token, amount);
  }

  /**
   * Sets the pool's input token balance to the given amount. It will optionally
   * update the pool's and protocol's total value locked. If not stated, will default to true.
   *
   * @param amount amount to be set as the pool's input token balance.
   * @param updateMetrics optional parameter to indicate whether to update the pool's and protocol's total value locked.
   */
  setInputTokenBalances(
    newBalances: BigInt[],
    updateMetrics: boolean = true
  ): void {
    this.pool.inputTokenBalances = newBalances;
    this.setInputTokenBalancesUSD();
    if (updateMetrics) {
      this.refreshTotalValueLocked();
    }
  }

  /**
   * Sets the pool's input token balance USD by calculating it for each token.
   */
  private setInputTokenBalancesUSD(): void {
    const inputTokenBalancesUSD: BigDecimal[] = [];
    for (let idx = 0; idx < this.pool.inputTokens.length; idx++) {
      const inputTokenBalance = this.pool.inputTokenBalances[idx];
      const inputToken = this.tokens.getOrCreateToken(
        Address.fromBytes(this.pool.inputTokens[idx])
      );

      const amountUSD = this.getInputTokenAmountPrice(
        inputToken,
        inputTokenBalance
      );
      inputTokenBalancesUSD.push(amountUSD);
    }
    this.pool.inputTokenBalancesUSD = inputTokenBalancesUSD;
  }

  getBytesID(): Bytes {
    return this.pool.id;
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
  addRevenueNative(
    inputToken: Token,
    protocolSide: BigInt,
    supplySide: BigInt
  ): void {
    const pricer = this.protocol.pricer;

    const pAmountUSD = pricer.getAmountValueUSD(inputToken, protocolSide);
    const sAmountUSD = pricer.getAmountValueUSD(inputToken, supplySide);
    this.addRevenueUSD(pAmountUSD, sAmountUSD);
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
   * @param amount
   */
  setOutputTokenSupply(amount: BigInt): void {
    this.pool.outputTokenSupply = amount;
    this.save();
  }
}
