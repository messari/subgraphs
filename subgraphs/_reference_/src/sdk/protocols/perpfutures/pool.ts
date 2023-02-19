import {
  sortBytesArray,
  updateArrayAtIndex,
  sortArrayByReference,
} from "../../util/arrays";
import {
  LiquidityPoolFee,
  Token as TokenSchema,
  LiquidityPool as LiquidityPoolSchema,
} from "../../../../generated/schema";
import { PositionType } from "./enums";
import { Perpetual } from "./protocol";
import { TokenManager } from "./tokens";
import { PoolSnapshot } from "./poolSnapshot";
import * as constants from "../../util/constants";
import { exponentToBigDecimal } from "../../util/numbers";
import { Bytes, BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";

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
    inputTokens: [TokenSchema],
    outputToken: TokenSchema | null
  ): void {
    if (this.isInitialized) return;

    const event = this.protocol.getCurrentEvent();
    this.pool.protocol = this.protocol.getBytesID();
    this.pool.name = name;
    this.pool.symbol = symbol;
    this.pool.inputTokens = inputTokens.map<Bytes>((token) => token.id);
    this.pool.outputToken = outputToken ? outputToken.id : null;

    this.pool.fees = [];
    this.pool.rewardTokens = [];

    this.pool.createdTimestamp = event.block.timestamp;
    this.pool.createdBlockNumber = event.block.number;

    this.pool.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    this.pool.fundingrate = [];
    this.pool.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;

    this.pool.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    this.pool.cumulativeEntryPremiumUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeExitPremiumUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeTotalPremiumUSD = constants.BIGDECIMAL_ZERO;

    this.pool.cumulativeDepositPremiumUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeWithdrawPremiumUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeTotalLiquidityPremiumUSD = constants.BIGDECIMAL_ZERO;

    this.pool.openInterestUSD = constants.BIGDECIMAL_ZERO;

    this.pool.cumulativeUniqueBorrowers = 0;
    this.pool.cumulativeUniqueLiquidators = 0;
    this.pool.cumulativeUniqueLiquidatees = 0;

    this.pool.longPositionCount = 0;
    this.pool.shortPositionCount = 0;

    this.pool.openPositionCount = 0;
    this.pool.closedPositionCount = 0;
    this.pool.cumulativePositionCount = 0;

    this.pool.cumulativeInflowVolumeUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeClosedInflowVolumeUSD = constants.BIGDECIMAL_ZERO;
    this.pool.cumulativeOutflowVolumeUSD = constants.BIGDECIMAL_ZERO;

    this.pool.inputTokenBalances = new Array<BigInt>(inputTokens.length).fill(
      constants.BIGINT_ZERO
    );
    this.pool.inputTokenWeights = new Array<BigDecimal>(
      inputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    this.pool.outputTokenSupply = constants.BIGINT_ZERO;
    this.pool.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;

    this.pool.stakedOutputTokenAmount = constants.BIGINT_ZERO;
    this.pool.rewardTokenEmissionsAmount = null;
    this.pool.rewardTokenEmissionsUSD = null;

    this.pool._lastSnapshotDayID = 0;
    this.pool._lastSnapshotHourID = 0;
    this.pool._lastUpdateTimestamp = event.block.timestamp;

    this.save();
  }

  private save(): void {
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

    return this.pool.outputToken;
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
  }

  /**
   * Updates the total value locked for this pool to the given value.
   * Will also update the protocol's total value locked based on the change in this pool's.
   */
  setVolume(newVolume: BigDecimal): void {
    const delta = newVolume.minus(this.pool.cumulativeVolumeUSD);
    this.addVolume(delta);
    this.save();
  }

  /**
   * Adds the given delta to the total value locked for this pool.
   * Will also update the protocol's total value locked based on the change in this pool's.
   *
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
   * Adds a given USD value to the pool and protocol entryPremium. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param premium {BigDecimal} The value to add to the pool and protocol's entryPremium.
   */
  addEntryPremiumUSD(premium: BigDecimal): void {
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
  addExitPremiumUSD(premium: BigDecimal): void {
    this.pool.cumulativeTotalPremiumUSD =
      this.pool.cumulativeTotalPremiumUSD.plus(premium);
    this.pool.cumulativeExitPremiumUSD =
      this.pool.cumulativeExitPremiumUSD.plus(premium);
    this.save();

    this.protocol.addExitPremiumUSD(premium);
  }

  /**
   * Adds a given USD value to the pool and protocol's entryPremium and exitPremium. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param entryPremiumPaid {BigDecimal} The value to add to the protocol's entryPremium in USD.
   * @param exitPremiumPaid {BigDecimal} The value to add to the protocol's exitPremium in USD.
   */
  addPremiumUSD(
    entryPremiumPaid: BigDecimal,
    exitPremiumPaid: BigDecimal
  ): void {
    this.addEntryPremiumUSD(entryPremiumPaid);
    this.addExitPremiumUSD(exitPremiumPaid);
  }

  /**
   * Adds a given USD value to the pool and protocol depositPremium. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param premium {BigDecimal} The value to add to the pool and protocol's depositPremium.
   */
  addDepositPremiumUSD(premium: BigDecimal): void {
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
  addWithdrawPremiumUSD(premium: BigDecimal): void {
    this.pool.cumulativeTotalLiquidityPremiumUSD =
      this.pool.cumulativeTotalLiquidityPremiumUSD.plus(premium);
    this.pool.cumulativeWithdrawPremiumUSD =
      this.pool.cumulativeWithdrawPremiumUSD.plus(premium);
    this.save();

    this.protocol.addWithdrawPremiumUSD(premium);
  }

  /**
   * Adds a given USD value to the pool and protocol's depositPremium and withdrawPremium. It can be a positive or negative amount.
   * Same as for the rest of setters, this is mostly to be called internally by the library.
   * But you can use it if you need to. It will also update the protocol's snapshots.
   * @param depositPremium {BigDecimal} The value to add to the protocol's depositPremium in USD.
   * @param withdrawPremium {BigDecimal} The value to add to the protocol's withdrawPremium in USD.
   */
  addTotalLiquidityPremiumUSD(
    depositPremium: BigDecimal,
    withdrawPremium: BigDecimal
  ): void {
    this.addDepositPremiumUSD(depositPremium);
    this.addWithdrawPremiumUSD(withdrawPremium);
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
    if (!this.pool.outputTokenSupply)
      this.pool.outputTokenSupply = constants.BIGINT_ZERO;

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
   * Updates the price of the pool's output token in USD.
   * This is automatically called when changing the output token supply via setOutputTokenSupply
   * but can be called manually if necessary.
   */
  refreshOutputTokenPriceUSD(): void {
    if (!this.pool.outputToken) return;

    const token = this.tokens.getOrCreateTokenFromBytes(this.pool.outputToken);
    const price = this.protocol.pricer.getTokenPrice(token);

    this.pool.outputTokenPriceUSD = price;
    this.save();
  }

  /**
   * Adds a given amount to the pool's stakedOutputTokenAmount.
   * @param amount
   * @returns
   */
  addStakedOutputTokenAmount(amount: BigInt): void {
    if (!this.pool.stakedOutputTokenAmount)
      this.pool.stakedOutputTokenAmount = constants.BIGINT_ONE;

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
   * Utility function to convert some amount of input token to USD.
   *
   * @param amount the amount of inputTokens to convert to USD
   * @returns The converted amount.
   */
  getInputTokenAmountPrice(token: TokenSchema, amount: BigInt): BigDecimal {
    const price = this.protocol.getTokenPricer().getTokenPrice(token);
    token.lastPriceUSD = price;
    token.save();

    return amount.divDecimal(exponentToBigDecimal(token.decimals)).times(price);
  }

  /**
   * Sets the pool's input token balances to the given amount. It will optionally
   * update the pool's and protocol's total value locked. If not stated, will default to true.
   *
   * @param amount amount to be set as the pool's input token balance.
   * @param updateMetrics optional parameter to indicate whether to update the pool's and protocol's total value locked.
   */
  setInputTokenBalances(
    newBalances: [BigInt],
    updateMetrics: boolean = true
  ): void {
    this.pool.inputTokenBalances = newBalances;
    this.save();

    if (updateMetrics) this.refreshTotalValueLocked();
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
   * If you are loading accounts with the AccountManager you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   */
  addLiquidator(count: u8 = 1): void {
    this.pool.cumulativeUniqueLiquidators += count;
    this.save();
  }

  /**
   * Adds some value to the cumulativeUniqueLiquidatees counter. If the value is omitted it will default to 1.
   * If you are loading accounts with the AccountManager you won't need to use this method.
   * @param count {u8} The value to add to the counter.
   */
  addLiquidatee(count: u8 = 1): void {
    this.pool.cumulativeUniqueLiquidatees += count;
    this.save();
  }

  /**
   * Adds 1 to the cumulativePositionCount counter and adds 1 to the counter corresponding the given position type.
   * If you are creating transaction entities from the Account class you won't need to use this method.
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

    this.protocol.addPosition(positionSide);
  }

  /**
   * Subtracts 1 to the cumulativePositionCount counter and adds 1 to the counter corresponding the given position type.
   * If you are creating transaction entities from the Account class you won't need to use this method.
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

    this.protocol.closePosition(positionSide);
  }

  addVolumeByToken(tokenAddress: Address, amount: BigInt): void {
    const token = this.tokens.getOrCreateToken(tokenAddress);
    const amountUSD = this.protocol.pricer.getAmountValueUSD(token, amount);

    const tokenIndex = this.pool.inputTokens.indexOf(tokenAddress);
    if (tokenIndex == -1) return;

    const volumeDailyTracker = this.snapshoter.getVolumeDailyTracker();
    const volumeHourlyTracker = this.snapshoter.getVolumeHourlyTracker();

    const dailyVolumeByTokenUSD = volumeDailyTracker.dailyVolumeByTokenUSD;
    dailyVolumeByTokenUSD[tokenIndex] =
      dailyVolumeByTokenUSD[tokenIndex].plus(amountUSD);

    const dailyVolumeByTokenAmount =
      volumeDailyTracker.dailyVolumeByTokenAmount;
    dailyVolumeByTokenAmount[tokenIndex] =
      dailyVolumeByTokenAmount[tokenIndex].plus(amount);

    volumeDailyTracker.dailyVolumeByTokenUSD = dailyVolumeByTokenUSD;
    volumeDailyTracker.dailyVolumeByTokenAmount = dailyVolumeByTokenAmount;

    const hourlyVolumeByTokenUSD = volumeHourlyTracker.hourlyVolumeByTokenUSD;
    hourlyVolumeByTokenUSD[tokenIndex] =
      hourlyVolumeByTokenUSD[tokenIndex].plus(amountUSD);

    const hourlyVolumeByTokenAmount =
      volumeHourlyTracker.hourlyVolumeByTokenAmount;
    hourlyVolumeByTokenAmount[tokenIndex] =
      hourlyVolumeByTokenAmount[tokenIndex].plus(amount);

    volumeHourlyTracker.hourlyVolumeByTokenUSD = hourlyVolumeByTokenUSD;
    volumeHourlyTracker.hourlyVolumeByTokenAmount = hourlyVolumeByTokenAmount;

    volumeDailyTracker.save();
    volumeHourlyTracker.save();
  }

  addInflowVolumeByToken(tokenAddress: Address, amount: BigInt): void {
    const token = this.tokens.getOrCreateToken(tokenAddress);
    const amountUSD = this.protocol.pricer.getAmountValueUSD(token, amount);

    const tokenIndex = this.pool.inputTokens.indexOf(tokenAddress);
    if (tokenIndex == -1) return;

    const volumeDailyTracker = this.snapshoter.getVolumeDailyTracker();
    const volumeHourlyTracker = this.snapshoter.getVolumeHourlyTracker();

    const dailyInflowVolumeByTokenUSD =
      volumeDailyTracker.dailyInflowVolumeByTokenUSD;
    dailyInflowVolumeByTokenUSD[tokenIndex] =
      dailyInflowVolumeByTokenUSD[tokenIndex].plus(amountUSD);

    const dailyInflowVolumeByTokenAmount =
      volumeDailyTracker.dailyInflowVolumeByTokenAmount;
    dailyInflowVolumeByTokenAmount[tokenIndex] =
      dailyInflowVolumeByTokenAmount[tokenIndex].plus(amount);

    volumeDailyTracker.dailyInflowVolumeByTokenUSD =
      dailyInflowVolumeByTokenUSD;
    volumeDailyTracker.dailyInflowVolumeByTokenAmount =
      dailyInflowVolumeByTokenAmount;

    const hourlyInflowVolumeByTokenUSD =
      volumeHourlyTracker.hourlyInflowVolumeByTokenUSD;
    hourlyInflowVolumeByTokenUSD[tokenIndex] =
      hourlyInflowVolumeByTokenUSD[tokenIndex].plus(amountUSD);

    const hourlyInflowVolumeByTokenAmount =
      volumeHourlyTracker.hourlyInflowVolumeByTokenAmount;
    hourlyInflowVolumeByTokenAmount[tokenIndex] =
      hourlyInflowVolumeByTokenAmount[tokenIndex].plus(amount);

    volumeHourlyTracker.hourlyInflowVolumeByTokenUSD =
      hourlyInflowVolumeByTokenUSD;
    volumeHourlyTracker.hourlyVolumeByTokenAmount =
      hourlyInflowVolumeByTokenAmount;

    volumeDailyTracker.save();
    volumeHourlyTracker.save();
  }

  addOutflowVolumeByToken(tokenAddress: Address, amount: BigInt): void {
    const token = this.tokens.getOrCreateToken(tokenAddress);
    const amountUSD = this.protocol.pricer.getAmountValueUSD(token, amount);

    const tokenIndex = this.pool.inputTokens.indexOf(tokenAddress);
    if (tokenIndex == -1) return;

    const volumeDailyTracker = this.snapshoter.getVolumeDailyTracker();
    const volumeHourlyTracker = this.snapshoter.getVolumeHourlyTracker();

    const dailyOutflowVolumeByTokenUSD =
      volumeDailyTracker.dailyOutflowVolumeByTokenUSD;
    dailyOutflowVolumeByTokenUSD[tokenIndex] =
      dailyOutflowVolumeByTokenUSD[tokenIndex].plus(amountUSD);

    const dailyOutflowVolumeByTokenAmount =
      volumeDailyTracker.dailyOutflowVolumeByTokenAmount;
    dailyOutflowVolumeByTokenAmount[tokenIndex] =
      dailyOutflowVolumeByTokenAmount[tokenIndex].plus(amount);

    volumeDailyTracker.dailyOutflowVolumeByTokenUSD =
      dailyOutflowVolumeByTokenUSD;
    volumeDailyTracker.dailyOutflowVolumeByTokenAmount =
      dailyOutflowVolumeByTokenAmount;

    const hourlyOutflowVolumeByTokenUSD =
      volumeHourlyTracker.hourlyOutflowVolumeByTokenUSD;
    hourlyOutflowVolumeByTokenUSD[tokenIndex] =
      hourlyOutflowVolumeByTokenUSD[tokenIndex].plus(amountUSD);

    const hourlyOutflowVolumeByTokenAmount =
      volumeHourlyTracker.hourlyOutflowVolumeByTokenAmount;
    hourlyOutflowVolumeByTokenAmount[tokenIndex] =
      hourlyOutflowVolumeByTokenAmount[tokenIndex].plus(amount);

    volumeHourlyTracker.hourlyOutflowVolumeByTokenUSD =
      hourlyOutflowVolumeByTokenUSD;
    volumeHourlyTracker.hourlyVolumeByTokenAmount =
      hourlyOutflowVolumeByTokenAmount;

    volumeDailyTracker.save();
    volumeHourlyTracker.save();
  }

  addClosedInflowVolumeByToken(tokenAddress: Address, amount: BigInt): void {
    const token = this.tokens.getOrCreateToken(tokenAddress);
    const amountUSD = this.protocol.pricer.getAmountValueUSD(token, amount);

    const tokenIndex = this.pool.inputTokens.indexOf(tokenAddress);
    if (tokenIndex == -1) return;

    const volumeDailyTracker = this.snapshoter.getVolumeDailyTracker();
    const volumeHourlyTracker = this.snapshoter.getVolumeHourlyTracker();

    const dailyClosedInflowVolumeByTokenUSD =
      volumeDailyTracker.dailyClosedInflowVolumeByTokenUSD;
    dailyClosedInflowVolumeByTokenUSD[tokenIndex] =
      dailyClosedInflowVolumeByTokenUSD[tokenIndex].plus(amountUSD);

    const dailyClosedInflowVolumeByTokenAmount =
      volumeDailyTracker.dailyClosedInflowVolumeByTokenAmount;
    dailyClosedInflowVolumeByTokenAmount[tokenIndex] =
      dailyClosedInflowVolumeByTokenAmount[tokenIndex].plus(amount);

    volumeDailyTracker.dailyClosedInflowVolumeByTokenUSD =
      dailyClosedInflowVolumeByTokenUSD;
    volumeDailyTracker.dailyClosedInflowVolumeByTokenAmount =
      dailyClosedInflowVolumeByTokenAmount;

    const hourlyClosedInflowVolumeByTokenUSD =
      volumeHourlyTracker.hourlyClosedInflowVolumeByTokenUSD;
    hourlyClosedInflowVolumeByTokenUSD[tokenIndex] =
      hourlyClosedInflowVolumeByTokenUSD[tokenIndex].plus(amountUSD);

    const hourlyClosedInflowVolumeByTokenAmount =
      volumeHourlyTracker.hourlyClosedInflowVolumeByTokenAmount;
    hourlyClosedInflowVolumeByTokenAmount[tokenIndex] =
      hourlyClosedInflowVolumeByTokenAmount[tokenIndex].plus(amount);

    volumeHourlyTracker.hourlyClosedInflowVolumeByTokenUSD =
      hourlyClosedInflowVolumeByTokenUSD;
    volumeHourlyTracker.hourlyVolumeByTokenAmount =
      hourlyClosedInflowVolumeByTokenAmount;

    volumeDailyTracker.save();
    volumeHourlyTracker.save();
  }
}
