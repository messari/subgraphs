import {
  sortArrayByReference,
  sortBytesArray,
  updateArrayAtIndex,
} from "../../util/arrays";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  RewardTokenType,
} from "../../util/constants";
import { TokenManager } from "./tokens";
import { ProtocolManager } from "./protocol";
import { PoolSnapshot } from "./poolSnapshot";
import { exponentToBigDecimal } from "../../util/numbers";
import { Pool as PoolSchema, Token } from "../../../../generated/schema";
import { Bytes, BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";

/**
 * This file contains the PoolManager, which is used to
 * initialize new pools in the protocol.
 *
 * Schema Version:  2.1.1
 * SDK Version:     1.0.0
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
    outputToken: Token | null,
    isLiquidity: bool
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
    this.pool.isLiquidityToken = isLiquidity ? true : false;
    this.pool.createdTimestamp = event.block.timestamp;
    this.pool.createdBlockNumber = event.block.number;

    this.pool.inputTokenBalances = [];
    this.pool.inputTokenBalancesUSD = [];
    this.pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    this.pool.lastSnapshotDayID = 0;
    this.pool.lastSnapshotHourID = 0;
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
  getInputTokenAmountPrice(token: Token, amount: BigInt): BigDecimal {
    const price = this.protocol.getTokenPricer().getTokenPrice(token);
    token.lastPriceUSD = price;
    token.save();

    return amount.divDecimal(exponentToBigDecimal(token.decimals)).times(price);
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
}
