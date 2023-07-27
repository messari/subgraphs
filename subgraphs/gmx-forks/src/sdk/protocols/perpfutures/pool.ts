import { Bytes, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import {
  sortBytesArray,
  updateArrayAtIndex,
  sortArrayByReference,
} from "../../util/arrays";
import { PositionType, TransactionType } from "./enums";
import { Perpetual } from "./protocol";
import { TokenManager } from "./tokens";
import { PoolSnapshot } from "./poolSnapshot";
import * as constants from "../../util/constants";
import {
  exponentToBigDecimal,
  poolArraySort,
  safeDivide,
} from "../../util/numbers";

import {
  LiquidityPoolFee,
  Token as TokenSchema,
  LiquidityPool as LiquidityPoolSchema,
} from "../../../../generated/schema";

/**
 * This file contains the PoolManager, which is used to
 * initialize new pools in the protocol.
 *
 * Schema Version:  1.3.3
 * SDK Version:     1.1.6
 * Author(s):
 *  - @harsh9200
 *  - @dhruv-chauhan
 *  - @dmelotik
 */

export class PoolManager {
  protocol: Perpetual;
  tokens: TokenManager;

  constructor(protocol: Perpetual, tokens: TokenManager) {
    this.protocol = protocol;
    this.tokens = tokens;
  }

  loadPool(id: Bytes): Pool {
    let entity = LiquidityPoolSchema.load(id);
    if (entity) return new Pool(this.protocol, entity, this.tokens);

    entity = new LiquidityPoolSchema(id);
    entity.protocol = this.protocol.getBytesID();

    const pool = new Pool(this.protocol, entity, this.tokens);
    pool.isInitialized = false;
    return pool;
  }
}

export class Pool {
  pool: LiquidityPoolSchema;
  protocol: Perpetual;
  tokens: TokenManager;
  snapshoter: PoolSnapshot;

  public isInitialized: boolean = true;

  constructor(
    protocol: Perpetual,
    pool: LiquidityPoolSchema,
    tokens: TokenManager
  ) {
    this.pool = pool;
    this.protocol = protocol;
    this.tokens = tokens;
    this.snapshoter = new PoolSnapshot(pool, protocol.event);
  }

  initialize(
    name: string,
    symbol: string,
    inputTokens: TokenSchema[],
    outputToken: TokenSchema | null,
    oracle: string | null = null
  ): void {
    if (this.isInitialized) return;

    const event = this.protocol.getCurrentEvent();
    this.pool.protocol = this.protocol.getBytesID();
    this.pool.name = name;
    this.pool.symbol = symbol;
    this.pool.oracle = oracle;
    this.pool.inputTokens = inputTokens.map<Bytes>((token) => token.id);
    this.pool.outputToken = outputToken ? outputToken.id : null;

    this.pool.fees = [];
    this.pool.rewardTokens = [];

    this.pool.createdTimestamp = event.block.timestamp;
    this.pool.createdBlockNumber = event.block.number;

    this.pool.fundingrate = new Array<BigDecimal>(inputTokens.length).fill(
      constants.BIGDECIMAL_ZERO
    );
    this.pool.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

    this.pool.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeStakeSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    this.pool.cumulativeEntryPremiumUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeExitPremiumUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeTotalPremiumUSD = constants.BIGDECIMAL_ZERO;

    this.pool.cumulativeDepositPremiumUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeWithdrawPremiumUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeTotalLiquidityPremiumUSD = constants.BIGDECIMAL_ZERO;

    this.pool.longOpenInterestUSD = constants.BIGDECIMAL_ZERO;
    this.pool.shortOpenInterestUSD = constants.BIGDECIMAL_ZERO;
    this.pool.totalOpenInterestUSD = constants.BIGDECIMAL_ZERO;

    this.pool.cumulativeUniqueUsers = 0;
    this.pool.cumulativeUniqueDepositors = 0;
    this.pool.cumulativeUniqueBorrowers = 0;
    this.pool.cumulativeUniqueLiquidators = 0;
    this.pool.cumulativeUniqueLiquidatees = 0;

    this.pool.longPositionCount = 0;
    this.pool.shortPositionCount = 0;

    this.pool.openPositionCount = 0;
    this.pool.closedPositionCount = 0;
    this.pool.cumulativePositionCount = 0;

    this.pool.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeVolumeByTokenAmount = new Array<BigInt>(
      inputTokens.length
    ).fill(constants.BIGINT_ZERO);
    this.pool.cumulativeVolumeByTokenUSD = new Array<BigDecimal>(
      inputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    this.pool.cumulativeInflowVolumeUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeInflowVolumeByTokenAmount = new Array<BigInt>(
      inputTokens.length
    ).fill(constants.BIGINT_ZERO);
    this.pool.cumulativeInflowVolumeByTokenUSD = new Array<BigDecimal>(
      inputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    this.pool.cumulativeClosedInflowVolumeUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeClosedInflowVolumeByTokenAmount = new Array<BigInt>(
      inputTokens.length
    ).fill(constants.BIGINT_ZERO);
    this.pool.cumulativeClosedInflowVolumeByTokenUSD = new Array<BigDecimal>(
      inputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    this.pool.cumulativeOutflowVolumeUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeOutflowVolumeByTokenAmount = new Array<BigInt>(
      inputTokens.length
    ).fill(constants.BIGINT_ZERO);
    this.pool.cumulativeOutflowVolumeByTokenUSD = new Array<BigDecimal>(
      inputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    this.pool.inputTokenBalances = new Array<BigInt>(inputTokens.length).fill(
      constants.BIGINT_ZERO
    );
    this.pool.inputTokenWeights = new Array<BigDecimal>(
      inputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    this.pool.outputTokenSupply = constants.BIGINT_ZERO;
    this.pool.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;

    this.pool.stakedOutputTokenAmount = constants.BIGINT_ZERO;
    this.pool.rewardTokenEmissionsAmount = [];
    this.pool.rewardTokenEmissionsUSD = [];

    this.pool._lastSnapshotDayID = constants.BIGINT_ZERO;
    this.pool._lastSnapshotHourID = constants.BIGINT_ZERO;
    this.pool._lastUpdateTimestamp = event.block.timestamp;

    this.save();

    this.protocol.addPool();
  }

  private save(): void {
    this.pool._lastUpdateTimestamp = this.protocol.event.block.timestamp;
    this.pool.save();
  }

  getBytesID(): Bytes {
    return this.pool.id;
  }

  getInputTokens(): Bytes[] {
    return this.pool.inputTokens;
  }

  getOutputToken(): Bytes {
    if (!this.pool.outputToken) return Bytes.empty();

    return this.pool.outputToken!;
  }

  setPoolFee(
    feeType: constants.LiquidityPoolFeeType,
    feePercentage: BigDecimal | null = null
  ): void {
    const feeId = Bytes.fromUTF8(feeType)
      .concat(Bytes.fromUTF8("-"))
      .concat(this.getBytesID());

    let fees = LiquidityPoolFee.load(feeId);
    if (!fees) {
      fees = new LiquidityPoolFee(feeId);
      fees.feeType = feeType;

      if (!this.pool.fees.includes(feeId)) {
        const poolFees = this.pool.fees;
        poolFees.push(feeId);

        this.pool.fees = poolFees;
        this.save();
      }
    }

    fees.feePercentage = feePercentage;
    fees.save();
  }

  /**
   * Updates the total value locked for this pool to the given value.
   * Will also update the protocol's total value locked based on the change in this pool's.
   */
  setTotalValueLocked(newTVL: BigDecimal): void {
    const delta = newTVL.minus(this.pool.totalValueLockedUSD);
    this.addTotalValueLocked(delta);
  }

  /**
   * Adds the given delta to the total value locked for this pool.
   * Will also update the protocol's total value locked based on the change in this pool's.
   *
   * @param delta The change in total value locked for this pool.
   */
  addTotalValueLocked(delta: BigDecimal): void {
    this.pool.totalValueLockedUSD = this.pool.totalValueLockedUSD.plus(delta);
    this.save();

    this.protocol.addTotalValueLocked(delta);
  }

  /**
   * Recalculates the total value locked for this pool based on its current input token balance.
   * This function will also update the protocol's total value locked based on the change in this pool's.
   */
  refreshTotalValueLocked(): void {
    let totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

    for (let idx = 0; idx < this.pool.inputTokens.length; idx++) {
      const inputTokenBalance = this.pool.inputTokenBalances[idx];
      const inputToken = this.tokens.getOrCreateTokenFromBytes(
        this.pool.inputTokens[idx]
      );

      const amountUSD = this.getInputTokenAmountPrice(
        inputToken,
        inputTokenBalance
      );
      totalValueLockedUSD = totalValueLockedUSD.plus(amountUSD);
    }

    this.setTotalValueLocked(totalValueLockedUSD);
    this.refreshInputTokenWeights();
  }

  /**
   * Adds the given delta to the cumulative volume for this pool.
   * Will also update the protocol's total volume on the change in this pool's.
   * @param delta The change in total value locked for this pool.
   */
  addVolume(delta: BigDecimal): void {
    this.pool.cumulativeVolumeUSD = this.pool.cumulativeVolumeUSD.plus(delta);
    this.save();

    this.protocol.addVolume(delta);
  }

  /**
   * Adds a given USD value to the pool and protocol supplySideRevenue. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param rev {BigDecimal} The value to add to the protocol's supplySideRevenue.
   */
  private addSupplySideRevenueUSD(rev: BigDecimal): void {
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
  private addProtocolSideRevenueUSD(rev: BigDecimal): void {
    this.pool.cumulativeTotalRevenueUSD =
      this.pool.cumulativeTotalRevenueUSD.plus(rev);
    this.pool.cumulativeProtocolSideRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD.plus(rev);
    this.save();

    this.protocol.addProtocolSideRevenueUSD(rev);
  }

  /**
   * Adds a given USD value to the pool and protocol stakeSideRevenue. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param rev {BigDecimal} The value to add to the protocol's protocolSideRevenue.
   */
  private addStakeSideRevenueUSD(rev: BigDecimal): void {
    this.pool.cumulativeTotalRevenueUSD =
      this.pool.cumulativeTotalRevenueUSD.plus(rev);
    this.pool.cumulativeStakeSideRevenueUSD =
      this.pool.cumulativeStakeSideRevenueUSD.plus(rev);
    this.save();

    this.protocol.addStakeSideRevenueUSD(rev);
  }

  /**
   * Adds a given USD value to the pool and protocol's supplySideRevenue, protocolSideRevenue, and stakeSideRevenue.
   * It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param protocolSide {BigDecimal} The value to add to the protocol's protocolSideRevenue.
   * @param supplySide {BigDecimal} The value to add to the protocol's supplySideRevenue.
   * @param stakeSide {BigDecimal} The value to add to the protocol's stakeSideRevenue.
   */
  addRevenueUSD(
    protocolSide: BigDecimal,
    supplySide: BigDecimal,
    stakeSide: BigDecimal
  ): void {
    this.addSupplySideRevenueUSD(supplySide);
    this.addProtocolSideRevenueUSD(protocolSide);
    this.addStakeSideRevenueUSD(stakeSide);
  }

  addRevenueByToken(
    token: TokenSchema,
    protocolSide: BigInt,
    supplySide: BigInt,
    stakeSide: BigInt
  ): void {
    const protocolAmountUSD = this.protocol.pricer.getAmountValueUSD(
      token,
      protocolSide,
      this.protocol.event.block
    );
    const supplyAmountUSD = this.protocol.pricer.getAmountValueUSD(
      token,
      supplySide,
      this.protocol.event.block
    );
    const stakeAmountUSD = this.protocol.pricer.getAmountValueUSD(
      token,
      stakeSide,
      this.protocol.event.block
    );

    this.addRevenueUSD(protocolAmountUSD, supplyAmountUSD, stakeAmountUSD);
  }

  /**
   * Adds a given USD value to the pool and protocol entryPremium. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param premium {BigDecimal} The value to add to the pool and protocol's entryPremium.
   */
  private addEntryPremiumUSD(premium: BigDecimal): void {
    this.pool.cumulativeTotalPremiumUSD =
      this.pool.cumulativeTotalPremiumUSD.plus(premium);
    this.pool.cumulativeEntryPremiumUSD =
      this.pool.cumulativeEntryPremiumUSD.plus(premium);
    this.save();

    this.protocol.addEntryPremiumUSD(premium);
  }

  /**
   * Adds a given USD value to the pool and protocol exitPremium. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param premium {BigDecimal} The value to add to the pool and protocol's entryPremium.
   */
  private addExitPremiumUSD(premium: BigDecimal): void {
    this.pool.cumulativeTotalPremiumUSD =
      this.pool.cumulativeTotalPremiumUSD.plus(premium);
    this.pool.cumulativeExitPremiumUSD =
      this.pool.cumulativeExitPremiumUSD.plus(premium);
    this.save();

    this.protocol.addExitPremiumUSD(premium);
  }

  /**
   * Adds a given USD value to the pool and protocol depositPremium. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param premium {BigDecimal} The value to add to the pool and protocol's depositPremium.
   */
  private addDepositPremiumUSD(premium: BigDecimal): void {
    this.pool.cumulativeTotalLiquidityPremiumUSD =
      this.pool.cumulativeTotalLiquidityPremiumUSD.plus(premium);
    this.pool.cumulativeDepositPremiumUSD =
      this.pool.cumulativeDepositPremiumUSD.plus(premium);
    this.save();

    this.protocol.addDepositPremiumUSD(premium);
  }

  /**
   * Adds a given USD value to the pool and protocol withdrawPremium. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param premium {BigDecimal} The value to add to the pool and protocol's withdrawPremium.
   */
  private addWithdrawPremiumUSD(premium: BigDecimal): void {
    this.pool.cumulativeTotalLiquidityPremiumUSD =
      this.pool.cumulativeTotalLiquidityPremiumUSD.plus(premium);
    this.pool.cumulativeWithdrawPremiumUSD =
      this.pool.cumulativeWithdrawPremiumUSD.plus(premium);
    this.save();

    this.protocol.addWithdrawPremiumUSD(premium);
  }

  addUsdPremium(amountUSD: BigDecimal, transactionType: TransactionType): void {
    if (transactionType == TransactionType.DEPOSIT) {
      this.addDepositPremiumUSD(amountUSD);
    }
    if (transactionType == TransactionType.WITHDRAW) {
      this.addWithdrawPremiumUSD(amountUSD);
    }
    if (transactionType == TransactionType.COLLATERAL_IN) {
      this.addEntryPremiumUSD(amountUSD);
    }
    if (transactionType == TransactionType.COLLATERAL_OUT) {
      this.addExitPremiumUSD(amountUSD);
    }
  }

  addPremiumByToken(
    token: TokenSchema,
    amount: BigInt,
    transactionType: TransactionType
  ): void {
    const premiumUSD = this.protocol.pricer.getAmountValueUSD(
      token,
      amount,
      this.protocol.event.block
    );

    if (transactionType == TransactionType.DEPOSIT) {
      this.addDepositPremiumUSD(premiumUSD);
    }
    if (transactionType == TransactionType.WITHDRAW) {
      this.addWithdrawPremiumUSD(premiumUSD);
    }
    if (transactionType == TransactionType.COLLATERAL_IN) {
      this.addEntryPremiumUSD(premiumUSD);
    }
    if (transactionType == TransactionType.COLLATERAL_OUT) {
      this.addExitPremiumUSD(premiumUSD);
    }
  }

  /**
   * Adds a given USD value to the pool's long and total openInterestUSD.
   *
   * @param amountChangeUSD {BigDecimal} The value to add to the pool's openInterest in USD.
   */
  updateLongOpenInterestUSD(
    amountChangeUSD: BigDecimal,
    isIncrease: bool
  ): void {
    if (isIncrease) {
      this.pool.totalOpenInterestUSD =
        this.pool.totalOpenInterestUSD.plus(amountChangeUSD);
      this.pool.longOpenInterestUSD =
        this.pool.longOpenInterestUSD.plus(amountChangeUSD);
    } else {
      this.pool.totalOpenInterestUSD =
        this.pool.totalOpenInterestUSD.minus(amountChangeUSD);
      this.pool.longOpenInterestUSD =
        this.pool.longOpenInterestUSD.minus(amountChangeUSD);
    }
    this.save();
    this.protocol.updateLongOpenInterestUSD(amountChangeUSD, isIncrease);
  }

  /**
   * Adds a given USD value to the pool's short and total openInterestUSD.
   *
   * @param amountChangeUSD {BigDecimal} The value to add to the pool's openInterest in USD.
   */
  updateShortOpenInterestUSD(
    amountChangeUSD: BigDecimal,
    isIncrease: bool
  ): void {
    if (isIncrease) {
      this.pool.totalOpenInterestUSD =
        this.pool.totalOpenInterestUSD.plus(amountChangeUSD);
      this.pool.shortOpenInterestUSD =
        this.pool.shortOpenInterestUSD.plus(amountChangeUSD);
    } else {
      this.pool.totalOpenInterestUSD =
        this.pool.totalOpenInterestUSD.minus(amountChangeUSD);
      this.pool.shortOpenInterestUSD =
        this.pool.shortOpenInterestUSD.minus(amountChangeUSD);
    }
    this.save();
    this.protocol.updateShortOpenInterestUSD(amountChangeUSD, isIncrease);
  }

  /**
   * Adds a given USD value to the pool InflowVolumeUSD. It can be a positive or negative amount.
   * @param volume {BigDecimal} The value to add to the pool's InflowVolumeUSD.
   */
  addInflowVolumeUSD(volume: BigDecimal): void {
    this.pool.cumulativeInflowVolumeUSD =
      this.pool.cumulativeInflowVolumeUSD.plus(volume);
    this.save();

    this.protocol.addInflowVolumeUSD(volume);
  }

  /**
   * Adds a given USD value to the pool ClosedInflowVolumeUSD. It can be a positive or negative amount.
   * @param volume {BigDecimal} The value to add to the pool's ClosedInflowVolumeUSD.
   */
  addClosedInflowVolumeUSD(volume: BigDecimal): void {
    this.pool.cumulativeClosedInflowVolumeUSD =
      this.pool.cumulativeClosedInflowVolumeUSD.plus(volume);
    this.save();

    this.protocol.addClosedInflowVolumeUSD(volume);
  }

  /**
   * Adds a given USD value to the pool OutflowVolumeUSD. It can be a positive or negative amount.
   * @param volume {BigDecimal} The value to add to the pool's OutflowVolumeUSD.
   */
  addOutflowVolumeUSD(volume: BigDecimal): void {
    this.pool.cumulativeOutflowVolumeUSD =
      this.pool.cumulativeOutflowVolumeUSD.plus(volume);
    this.save();

    this.protocol.addOutflowVolumeUSD(volume);
  }

  /**
   * Adds a given amount to the pool's outputTokenSupply. It should only be used for pools
   * of type LIQUIDITY. Or pools that emit some kind of LP token on deposit.
   * @param amount
   */
  addOutputTokenSupply(amount: BigInt): void {
    this.setOutputTokenSupply(
      this.pool.outputTokenSupply
        ? this.pool.outputTokenSupply!.plus(amount)
        : amount
    );
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
   * Updates the price of the pool's output token in USD.
   * This is automatically called when changing the output token supply via setOutputTokenSupply
   * but can be called manually if necessary.
   */
  refreshOutputTokenPriceUSD(): void {
    if (!this.pool.outputToken) return;

    const token = this.tokens.getOrCreateTokenFromBytes(this.pool.outputToken!);
    let price = this.protocol.pricer.getTokenPrice(
      token,
      this.protocol.event.block
    );

    if (
      price.equals(constants.BIGDECIMAL_ZERO) &&
      !this.pool.outputTokenSupply!.equals(constants.BIGINT_ZERO)
    ) {
      price = this.pool.totalValueLockedUSD.div(
        this.pool
          .outputTokenSupply!.toBigDecimal()
          .div(constants.BIGINT_TEN_TO_EIGHTEENTH.toBigDecimal())
      );
    }

    this.pool.outputTokenPriceUSD = price;
    token.lastPriceUSD = price;
    token.lastPriceBlockNumber = this.protocol.event.block.number;
    token.save();
    this.save();
  }

  /**
   * Adds a given amount to the pool's stakedOutputTokenAmount.
   * @param amount
   * @returns
   */
  addStakedOutputTokenAmount(amount: BigInt): void {
    this.setStakedOutputTokenAmount(
      this.pool.stakedOutputTokenAmount
        ? this.pool.stakedOutputTokenAmount!.plus(amount)
        : amount
    );
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
   * Utility function to convert some amount of input token to USD.
   *
   * @param amount the amount of inputTokens to convert to USD
   * @returns The converted amount.
   */
  getInputTokenAmountPrice(token: TokenSchema, amount: BigInt): BigDecimal {
    const price = this.protocol
      .getTokenPricer()
      .getTokenPrice(token, this.protocol.event.block);
    token.lastPriceUSD = price;
    token.lastPriceBlockNumber = this.protocol.event.block.number;
    token.save();

    return amount.divDecimal(exponentToBigDecimal(token.decimals)).times(price);
  }

  /**
   * Recalculates the input token weights for this pool based on its current input token tvl.
   */
  refreshInputTokenWeights(): void {
    const inputTokenWeights: BigDecimal[] = [];

    for (let idx = 0; idx < this.pool.inputTokens.length; idx++) {
      const inputTokenBalance = this.pool.inputTokenBalances[idx];
      const inputToken = this.tokens.getOrCreateTokenFromBytes(
        this.pool.inputTokens[idx]
      );
      const inputTokenTVL = this.getInputTokenAmountPrice(
        inputToken,
        inputTokenBalance
      );

      inputTokenWeights.push(
        safeDivide(inputTokenTVL, this.pool.totalValueLockedUSD).times(
          constants.BIGDECIMAL_HUNDRED
        )
      );
    }

    this.pool.inputTokenWeights = inputTokenWeights;
    this.pool.save();
  }

  /**
   * Sets the pool's input token balances to the given amount. It will optionally
   * update the pool's and protocol's total value locked. If not stated, will default to true.
   *
   * @param newBalances amount to be set as the pool's input token balance.
   * @param updateMetrics optional parameter to indicate whether to update the pool's and protocol's total value locked.
   */
  setInputTokenBalances(
    newBalances: BigInt[],
    updateMetrics: boolean = true
  ): void {
    this.pool.inputTokenBalances = newBalances;
    this.save();

    if (updateMetrics) this.refreshTotalValueLocked();
  }

  /**
   * Sets the pool fundingRate.
   * @param fundingrate pool funding rate.
   */
  setFundingRate(fundingrate: BigDecimal[]): void {
    this.pool.fundingrate = fundingrate;
    this.pool.save();
  }

  setInputTokens(inputTokens: TokenSchema[]): void {
    this.pool.inputTokens = inputTokens.map<Bytes>((token) => token.id);
    this.pool.save();
  }

  setInputTokensById(inputTokenIds: Bytes[]): void {
    this.pool.inputTokens = inputTokenIds;
    this.pool.save();
  }

  tokenExists(token: TokenSchema): bool {
    return this.pool.inputTokens.includes(token.id);
  }

  addInputToken(
    token: TokenSchema,
    newTokenBalance: BigInt = constants.BIGINT_ZERO
  ): void {
    const inputTokens = this.pool.inputTokens;
    const inputTokenBalances = this.pool.inputTokenBalances;
    const fundingrates = this.pool.fundingrate;
    const cumulativeVolumeByTokenAmount =
      this.pool.cumulativeVolumeByTokenAmount;
    const cumulativeVolumeByTokenUSD = this.pool.cumulativeVolumeByTokenUSD;
    const cumulativeInflowVolumeByTokenAmount =
      this.pool.cumulativeInflowVolumeByTokenAmount;
    const cumulativeInflowVolumeByTokenUSD =
      this.pool.cumulativeInflowVolumeByTokenUSD;
    const cumulativeClosedInflowVolumeByTokenAmount =
      this.pool.cumulativeClosedInflowVolumeByTokenAmount;
    const cumulativeClosedInflowVolumeByTokenUSD =
      this.pool.cumulativeClosedInflowVolumeByTokenUSD;
    const cumulativeOutflowVolumeByTokenAmount =
      this.pool.cumulativeOutflowVolumeByTokenAmount;
    const cumulativeOutflowVolumeByTokenUSD =
      this.pool.cumulativeOutflowVolumeByTokenUSD;

    inputTokens.push(token.id);
    inputTokenBalances.push(newTokenBalance);
    fundingrates.push(constants.BIGDECIMAL_ZERO);

    cumulativeVolumeByTokenAmount.push(constants.BIGINT_ZERO);
    cumulativeVolumeByTokenUSD.push(constants.BIGDECIMAL_ZERO);
    cumulativeInflowVolumeByTokenAmount.push(constants.BIGINT_ZERO);
    cumulativeInflowVolumeByTokenUSD.push(constants.BIGDECIMAL_ZERO);
    cumulativeClosedInflowVolumeByTokenAmount.push(constants.BIGINT_ZERO);
    cumulativeClosedInflowVolumeByTokenUSD.push(constants.BIGDECIMAL_ZERO);
    cumulativeOutflowVolumeByTokenAmount.push(constants.BIGINT_ZERO);
    cumulativeOutflowVolumeByTokenUSD.push(constants.BIGDECIMAL_ZERO);

    poolArraySort(
      inputTokens,
      inputTokenBalances,
      fundingrates,
      cumulativeVolumeByTokenAmount,
      cumulativeVolumeByTokenUSD,
      cumulativeInflowVolumeByTokenAmount,
      cumulativeInflowVolumeByTokenUSD,
      cumulativeClosedInflowVolumeByTokenAmount,
      cumulativeClosedInflowVolumeByTokenUSD,
      cumulativeOutflowVolumeByTokenAmount,
      cumulativeOutflowVolumeByTokenUSD
    );

    this.pool.inputTokens = inputTokens;
    this.pool.fundingrate = fundingrates;
    this.pool.cumulativeVolumeByTokenAmount = cumulativeVolumeByTokenAmount;
    this.pool.cumulativeVolumeByTokenUSD = cumulativeVolumeByTokenUSD;
    this.pool.cumulativeInflowVolumeByTokenAmount =
      cumulativeInflowVolumeByTokenAmount;
    this.pool.cumulativeInflowVolumeByTokenUSD =
      cumulativeInflowVolumeByTokenUSD;
    this.pool.cumulativeClosedInflowVolumeByTokenAmount =
      cumulativeClosedInflowVolumeByTokenAmount;
    this.pool.cumulativeClosedInflowVolumeByTokenUSD =
      cumulativeClosedInflowVolumeByTokenUSD;
    this.pool.cumulativeOutflowVolumeByTokenAmount =
      cumulativeOutflowVolumeByTokenAmount;
    this.pool.cumulativeOutflowVolumeByTokenUSD =
      cumulativeOutflowVolumeByTokenUSD;
    this.pool.save();
    this.setInputTokenBalances(inputTokenBalances, true);
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
    type: constants.RewardTokenType,
    token: TokenSchema,
    amount: BigInt
  ): void {
    const rToken = this.tokens.getOrCreateRewardToken(token, type);
    const amountUSD = this.protocol.pricer.getAmountValueUSD(
      token,
      amount,
      this.protocol.event.block
    );
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
   * Adds some value to the cumulativeUniqueUsers counter. If the value is omitted it will default to 1.
   * If you are loading accounts with the AccountManager you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   */
  addUser(count: u8 = 1): void {
    this.pool.cumulativeUniqueUsers += count;
    this.save();
  }

  /**
   * Adds some value to the cumulativeUniqueDepositors counter. If the value is omitted it will default to 1.
   * If you are loading accounts with the AccountManager you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   */
  addDepositor(count: u8 = 1): void {
    this.pool.cumulativeUniqueDepositors += count;
    this.save();
  }

  /**
   * Adds some value to the cumulativeUniqueBorrowers counter. If the value is omitted it will default to 1.
   * If you are loading accounts with the AccountManager you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   */
  addBorrower(count: u8 = 1): void {
    this.pool.cumulativeUniqueBorrowers += count;
    this.save();
  }

  /**
   * Adds some value to the cumulativeUniqueLiquidators counter. If the value is omitted it will default to 1.
   * @param count {u8} The value to add to the counter.
   */
  addLiquidator(count: u8 = 1): void {
    this.pool.cumulativeUniqueLiquidators += count;
    this.save();
  }

  /**
   * Adds some value to the cumulativeUniqueLiquidatees counter. If the value is omitted it will default to 1.
   * @param count {u8} The value to add to the counter.
   */
  addLiquidatee(count: u8 = 1): void {
    this.pool.cumulativeUniqueLiquidatees += count;
    this.save();
  }

  /**
   * Adds 1 to the cumulativePositionCount counter and adds 1 to the counter corresponding the given position type.
   * @param positionSide {PositionType} The type of transaction to add.
   * @see PositionType
   * @see Account
   */
  openPosition(positionSide: PositionType): void {
    if (positionSide == PositionType.LONG) {
      this.pool.longPositionCount += 1;
    } else if (positionSide == PositionType.SHORT) {
      this.pool.shortPositionCount += 1;
    }

    this.pool.openPositionCount += 1;
    this.pool.cumulativePositionCount += 1;
    this.save();
  }

  /**
   * Subtracts 1 to the cumulativePositionCount counter and adds 1 to the counter corresponding the given position type.
   * @param positionSide {PositionType} The type of transaction to add.
   * @see PositionType
   * @see Account
   */
  closePosition(positionSide: PositionType): void {
    if (positionSide == PositionType.LONG) {
      this.pool.longPositionCount -= 1;
    } else if (positionSide == PositionType.SHORT) {
      this.pool.shortPositionCount -= 1;
    }

    this.pool.openPositionCount -= 1;
    this.pool.closedPositionCount += 1;
    this.save();
  }

  /**
   * Adds the volume of a given input token by its amount and its USD value.
   * It will also add the amount to the total volume of the pool and the protocol
   * @param token The input token
   * @param amount The amount of the token
   */
  addVolumeByToken(token: TokenSchema, amount: BigInt): void {
    const amountUSD = this.protocol.pricer.getAmountValueUSD(
      token,
      amount,
      this.protocol.event.block
    );

    const tokenIndex = this.pool.inputTokens.indexOf(token.id);
    if (tokenIndex == -1) return;

    const cumulativeVolumeByTokenAmount =
      this.pool.cumulativeVolumeByTokenAmount;
    const cumulativeVolumeByTokenUSD = this.pool.cumulativeVolumeByTokenUSD;

    cumulativeVolumeByTokenAmount[tokenIndex] =
      cumulativeVolumeByTokenAmount[tokenIndex].plus(amount);
    cumulativeVolumeByTokenUSD[tokenIndex] =
      cumulativeVolumeByTokenUSD[tokenIndex].plus(amountUSD);

    this.pool.cumulativeVolumeByTokenUSD = cumulativeVolumeByTokenUSD;
    this.pool.cumulativeVolumeByTokenAmount = cumulativeVolumeByTokenAmount;

    this.save();
    this.addVolume(amountUSD);
  }

  /**
   * Adds the volume of a given input token by its amount and its USD value.
   * It will also add the amount to the total volume of the pool and the protocol
   * @param token The input token
   * @param amount The amount of the token
   */
  addCumulativeVolumeByTokenAmount(token: TokenSchema, amount: BigInt): void {
    const amountUSD = this.protocol.pricer.getAmountValueUSD(
      token,
      amount,
      this.protocol.event.block
    );

    const tokenIndex = this.pool.inputTokens.indexOf(token.id);
    if (tokenIndex == -1) return;

    const cumulativeVolumeByTokenAmount =
      this.pool.cumulativeVolumeByTokenAmount;
    const cumulativeVolumeByTokenUSD = this.pool.cumulativeVolumeByTokenUSD;

    cumulativeVolumeByTokenAmount[tokenIndex] =
      cumulativeVolumeByTokenAmount[tokenIndex].plus(amount);
    cumulativeVolumeByTokenUSD[tokenIndex] =
      cumulativeVolumeByTokenUSD[tokenIndex].plus(amountUSD);

    this.pool.cumulativeVolumeByTokenUSD = cumulativeVolumeByTokenUSD;
    this.pool.cumulativeVolumeByTokenAmount = cumulativeVolumeByTokenAmount;

    this.save();
  }

  /**
   * Adds the inflow volume of a given input token by its amount and its USD value.
   * It will also add the amount to the total inflow volume of the pool and the protocol
   * @param token The input token
   * @param amount The amount of the token
   */
  addInflowVolumeByToken(token: TokenSchema, amount: BigInt): void {
    const amountUSD = this.protocol.pricer.getAmountValueUSD(
      token,
      amount,
      this.protocol.event.block
    );

    const tokenIndex = this.pool.inputTokens.indexOf(token.id);
    if (tokenIndex == -1) return;

    const cumulativeInflowVolumeByTokenAmount =
      this.pool.cumulativeInflowVolumeByTokenAmount;
    const cumulativeInflowVolumeByTokenUSD =
      this.pool.cumulativeInflowVolumeByTokenUSD;

    cumulativeInflowVolumeByTokenAmount[tokenIndex] =
      cumulativeInflowVolumeByTokenAmount[tokenIndex].plus(amount);
    cumulativeInflowVolumeByTokenUSD[tokenIndex] =
      cumulativeInflowVolumeByTokenUSD[tokenIndex].plus(amountUSD);

    this.pool.cumulativeInflowVolumeByTokenAmount =
      cumulativeInflowVolumeByTokenAmount;
    this.pool.cumulativeInflowVolumeByTokenUSD =
      cumulativeInflowVolumeByTokenUSD;

    this.save();
    this.addInflowVolumeUSD(amountUSD);
  }

  /**
   * Adds the outflow volume of a given input token by its amount and its USD value.
   * It will also add the amount to the total outflow volume of the pool and the protocol
   * @param token The input token
   * @param amount The amount of the token
   */
  addOutflowVolumeByToken(token: TokenSchema, amount: BigInt): void {
    const amountUSD = this.protocol.pricer.getAmountValueUSD(
      token,
      amount,
      this.protocol.event.block
    );

    const tokenIndex = this.pool.inputTokens.indexOf(token.id);
    if (tokenIndex == -1) return;

    const cumulativeOutflowVolumeByTokenAmount =
      this.pool.cumulativeOutflowVolumeByTokenAmount;
    const cumulativeOutflowVolumeByTokenUSD =
      this.pool.cumulativeOutflowVolumeByTokenUSD;

    cumulativeOutflowVolumeByTokenAmount[tokenIndex] =
      cumulativeOutflowVolumeByTokenAmount[tokenIndex].plus(amount);
    cumulativeOutflowVolumeByTokenUSD[tokenIndex] =
      cumulativeOutflowVolumeByTokenUSD[tokenIndex].plus(amountUSD);

    this.pool.cumulativeOutflowVolumeByTokenAmount =
      cumulativeOutflowVolumeByTokenAmount;
    this.pool.cumulativeOutflowVolumeByTokenUSD =
      cumulativeOutflowVolumeByTokenUSD;

    this.save();
    this.addOutflowVolumeUSD(amountUSD);
  }

  /**
   * Adds the closed inflow volume of a given input token by its amount and its USD value.
   * It will also add the amount to the total closed inflow volume of the pool and the protocol
   * @param token The input token
   * @param amount The amount of the token
   */
  addClosedInflowVolumeByToken(token: TokenSchema, amount: BigInt): void {
    const amountUSD = this.protocol.pricer.getAmountValueUSD(
      token,
      amount,
      this.protocol.event.block
    );

    const tokenIndex = this.pool.inputTokens.indexOf(token.id);
    if (tokenIndex == -1) return;

    const cumulativeClosedInflowVolumeByTokenAmount =
      this.pool.cumulativeClosedInflowVolumeByTokenAmount;
    const cumulativeClosedInflowVolumeByTokenUSD =
      this.pool.cumulativeClosedInflowVolumeByTokenUSD;

    cumulativeClosedInflowVolumeByTokenAmount[tokenIndex] =
      cumulativeClosedInflowVolumeByTokenAmount[tokenIndex].plus(amount);
    cumulativeClosedInflowVolumeByTokenUSD[tokenIndex] =
      cumulativeClosedInflowVolumeByTokenUSD[tokenIndex].plus(amountUSD);

    this.pool.cumulativeClosedInflowVolumeByTokenAmount =
      cumulativeClosedInflowVolumeByTokenAmount;
    this.pool.cumulativeClosedInflowVolumeByTokenUSD =
      cumulativeClosedInflowVolumeByTokenUSD;

    this.save();
    this.addClosedInflowVolumeUSD(amountUSD);
  }
}
