import {
  ethereum,
  BigDecimal,
  Address,
  BigInt,
  log,
  Bytes,
} from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../configurations/configure";
import {
  Account,
  ActiveAccount,
  Deposit,
  DexAmmProtocol,
  FinancialsDailySnapshot,
  LiquidityPool,
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
  Position,
  Swap,
  Tick,
  TickDailySnapshot,
  TickHourlySnapshot,
  Token,
  Withdraw,
  _LiquidityPoolAmount,
} from "../../generated/schema";
import {
  INT_ZERO,
  INT_ONE,
  EventType,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  BIGINT_NEG_ONE,
} from "./constants";
import { getOrCreateAccount } from "./entities/account";
import { getLiquidityPoolFee, getLiquidityPoolAmounts } from "./entities/pool";
import { getOrCreateProtocol } from "./entities/protocol";
import { getOrCreateToken, isFakeWhitelistToken } from "./entities/token";
import {
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
} from "./entities/usage";
import { getTrackedVolumeUSD } from "./price/price";
import {
  BigDecimalAverage,
  bigDecimalAbs,
  convertTokenToDecimal,
  percToDec,
  sumBigDecimalListByIndex,
  sumBigIntListByIndex,
  absBigIntList,
  sumBigDecimalList,
  convertBigIntListToBigDecimalList,
  safeDivBigDecimal,
  subtractBigDecimalLists,
  subtractBigIntLists,
} from "./utils/utils";

export class RawDeltas {
  inputTokenBalancesDeltas: BigInt[];
  totalLiquidityDelta: BigInt;
  activeLiquidityDelta: BigInt;
  uncollectedSupplySideTokenAmountsDeltas: BigInt[];
  uncollectedProtocolSideTokenAmountsDeltas: BigInt[];

  constructor(
    inputTokenBalancesDeltas: BigInt[],
    totalLiquidityDelta: BigInt,
    activeLiquidityDelta: BigInt,
    uncollectedSupplySideTokenAmountsDeltas: BigInt[],
    uncollectedProtocolSideTokenAmountsDeltas: BigInt[]
  ) {
    this.inputTokenBalancesDeltas = inputTokenBalancesDeltas;
    this.totalLiquidityDelta = totalLiquidityDelta;
    this.activeLiquidityDelta = activeLiquidityDelta;
    this.uncollectedSupplySideTokenAmountsDeltas =
      uncollectedSupplySideTokenAmountsDeltas;
    this.uncollectedProtocolSideTokenAmountsDeltas =
      uncollectedProtocolSideTokenAmountsDeltas;
  }
}

export class DexEventHandler {
  event: ethereum.Event;
  eventType: i32;
  account: Account;
  protocol: DexAmmProtocol;
  pool: LiquidityPool;
  poolTokens: Token[];
  _poolAmounts: _LiquidityPoolAmount;

  totalValueLockedUSD: BigDecimal;
  totalValueLockedUSDDelta: BigDecimal;

  totalLiquidity: BigInt;
  totalLiquidityDelta: BigInt;
  totalLiquidityUSD: BigDecimal;
  totalLiquidityDeltaUSD: BigDecimal;

  activeLiquidity: BigInt;
  activeLiquidityDelta: BigInt;
  activeLiquidityUSD: BigDecimal;
  activeLiquidityDeltaUSD: BigDecimal;

  inputTokenBalances: BigInt[];
  inputTokenBalanceDeltas: BigInt[];
  inputTokenBalancesUSD: BigDecimal[];
  inputTokenBalanceDeltasUSD: BigDecimal[];

  inputTokenBalancesPoolAmounts: BigDecimal[];

  newLiquidityPricePerUnit: BigDecimal;

  trackedInputTokenBalanceDeltasUSD: BigDecimal[];
  trackedVolumeUSD: BigDecimal;

  trackedSupplySideRevenueUSD: BigDecimal;
  trackedSupplySideRevenueDeltaUSD: BigDecimal;
  trackedProtocolSideRevenueUSD: BigDecimal;
  trackedProtocolSideRevenueDeltaUSD: BigDecimal;

  uncollectedSupplySideTokenAmounts: BigInt[];
  uncollectedSupplySideTokenAmountsDeltas: BigInt[];
  uncollectedSupplySideValuesUSD: BigDecimal[];
  uncollectedSupplySideValuesDeltasUSD: BigDecimal[];
  uncollectedProtocolSideTokenAmounts: BigInt[];
  uncollectedProtocolSideTokenAmountsDeltas: BigInt[];
  uncollectedProtocolSideValuesUSD: BigDecimal[];
  uncollectedProtocolSideValuesDeltasUSD: BigDecimal[];

  tickUpper: Tick | null;
  tickLower: Tick | null;

  dayID: i32;
  hourID: i32;

  constructor(
    event: ethereum.Event,
    pool: LiquidityPool,
    trackVolume: bool,
    deltas: RawDeltas
  ) {
    this.event = event;
    this.eventType = EventType.UNKNOWN;
    this.account = getOrCreateAccount(event.transaction.from);
    this.protocol = getOrCreateProtocol();
    this.pool = pool;
    this.poolTokens = getTokens(event, pool);
    this._poolAmounts = getLiquidityPoolAmounts(pool.id)!;
    this.dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
    this.hourID = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

    const supplyFee = getLiquidityPoolFee(pool.fees[INT_ZERO]);
    const protocolFee = getLiquidityPoolFee(pool.fees[INT_ONE]);

    // Raw Deltas
    this.inputTokenBalanceDeltas = deltas.inputTokenBalancesDeltas;

    this.uncollectedSupplySideTokenAmountsDeltas =
      deltas.uncollectedSupplySideTokenAmountsDeltas;
    this.uncollectedProtocolSideTokenAmountsDeltas =
      deltas.uncollectedProtocolSideTokenAmountsDeltas;

    this.totalLiquidityDelta = deltas.totalLiquidityDelta;
    this.activeLiquidityDelta = deltas.activeLiquidityDelta;

    // Pool Token Deltas and Balances
    this.inputTokenBalanceDeltasUSD = getAbsUSDValues(
      this.poolTokens,
      this.inputTokenBalanceDeltas
    );
    this.inputTokenBalances = sumBigIntListByIndex([
      pool.inputTokenBalances,
      this.inputTokenBalanceDeltas,
    ]);
    this.inputTokenBalancesUSD = getAbsUSDValues(
      this.poolTokens,
      this.inputTokenBalances
    );
    this.inputTokenBalancesPoolAmounts = convertBigIntListToBigDecimalList(
      this.poolTokens,
      this.inputTokenBalances
    );

    // Liquidity Deltas and Balances
    this.totalLiquidity = pool.totalLiquidity.plus(this.totalLiquidityDelta);
    this.totalLiquidityUSD = BIGDECIMAL_ZERO;
    this.totalLiquidityDeltaUSD = BIGDECIMAL_ZERO;

    // Get the new liquidity price per unit
    this.newLiquidityPricePerUnit = safeDivBigDecimal(
      this.totalLiquidityUSD,
      this.totalLiquidity.toBigDecimal()
    );

    // Get the deltas and values of the liquidity that is wihtin tick range.
    this.activeLiquidity = pool.activeLiquidity.plus(this.activeLiquidityDelta);
    this.activeLiquidityUSD = BIGDECIMAL_ZERO;
    this.activeLiquidityDeltaUSD = BIGDECIMAL_ZERO;

    // TEMPORARILY DISABLED AS WE ARE NOT TRACKING UNCOLLECTED TOKENS ON THIS BRANCH
    this.uncollectedSupplySideTokenAmounts = sumBigIntListByIndex([
      pool.uncollectedSupplySideTokenAmounts,
      this.uncollectedSupplySideTokenAmountsDeltas,
    ]);
    this.uncollectedSupplySideValuesUSD = getAbsUSDValues(
      this.poolTokens,
      this.uncollectedSupplySideTokenAmounts
    );
    this.uncollectedSupplySideValuesDeltasUSD = subtractBigDecimalLists(
      this.uncollectedSupplySideValuesUSD,
      this.pool.uncollectedSupplySideValuesUSD
    );

    this.uncollectedProtocolSideTokenAmounts = sumBigIntListByIndex([
      pool.uncollectedProtocolSideTokenAmounts,
      this.uncollectedProtocolSideTokenAmountsDeltas,
    ]);
    this.uncollectedProtocolSideValuesUSD = getAbsUSDValues(
      this.poolTokens,
      this.uncollectedProtocolSideTokenAmounts
    );
    this.uncollectedProtocolSideValuesDeltasUSD = subtractBigDecimalLists(
      this.uncollectedProtocolSideValuesUSD,
      this.pool.uncollectedProtocolSideValuesUSD
    );

    // Total Value Locked
    this.totalValueLockedUSD = sumBigDecimalList(this.inputTokenBalancesUSD);
    this.totalValueLockedUSDDelta = this.totalValueLockedUSD.minus(
      this.pool.totalValueLockedUSD
    );
    // Handle volumes
    if (trackVolume) {
      // Get the tracked volume and revenue - they are not tracked for non-whitelist token
      this.trackedInputTokenBalanceDeltasUSD = getTrackedVolumeUSD(
        pool,
        this.poolTokens,
        this.inputTokenBalanceDeltasUSD
      );
      this.trackedVolumeUSD = BigDecimalAverage(
        this.trackedInputTokenBalanceDeltasUSD
      );
      this.trackedSupplySideRevenueDeltaUSD = this.trackedVolumeUSD.times(
        percToDec(supplyFee.feePercentage!)
      );
      this.trackedProtocolSideRevenueDeltaUSD = this.trackedVolumeUSD.times(
        percToDec(protocolFee.feePercentage!)
      );
      this.trackedSupplySideRevenueUSD =
        pool.cumulativeSupplySideRevenueUSD.plus(
          this.trackedSupplySideRevenueDeltaUSD
        );
      this.trackedProtocolSideRevenueUSD =
        pool.cumulativeProtocolSideRevenueUSD.plus(
          this.trackedProtocolSideRevenueDeltaUSD
        );
    } else {
      // Array with zeros
      this.trackedInputTokenBalanceDeltasUSD = new Array<BigDecimal>(
        this.poolTokens.length
      ).fill(BIGDECIMAL_ZERO);
      this.trackedVolumeUSD = BIGDECIMAL_ZERO;
      this.trackedSupplySideRevenueDeltaUSD = BIGDECIMAL_ZERO;
      this.trackedProtocolSideRevenueDeltaUSD = BIGDECIMAL_ZERO;
      this.trackedSupplySideRevenueUSD = BIGDECIMAL_ZERO;
      this.trackedProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    }
  }

  createWithdraw(
    from: Address,
    tickLower: Tick | null,
    tickUpper: Tick | null,
    position: Position | null
  ): void {
    this.eventType = EventType.WITHDRAW;
    this.tickUpper = tickUpper;
    this.tickLower = tickLower;

    const withdraw = new Deposit(
      this.event.transaction.hash.concatI32(this.event.logIndex.toI32())
    );

    withdraw.hash = this.event.transaction.hash;
    withdraw.nonce = this.event.transaction.nonce;
    withdraw.logIndex = this.event.logIndex.toI32();
    withdraw.gasLimit = this.event.transaction.gasLimit;
    withdraw.gasPrice = this.event.transaction.gasPrice;
    withdraw.protocol = this.protocol.id;
    withdraw.pool = this.pool.id;
    withdraw.position = position ? position.id : null;
    withdraw.account = from;
    withdraw.blockNumber = this.event.block.number;
    withdraw.timestamp = this.event.block.timestamp;
    withdraw.liquidity = this.totalLiquidityDelta.abs();
    withdraw.inputTokens = this.pool.inputTokens;
    withdraw.inputTokenAmounts = absBigIntList(this.inputTokenBalanceDeltas);
    withdraw.amountUSD = sumBigDecimalList(this.inputTokenBalanceDeltasUSD);
    withdraw.tickLower = this.tickLower ? this.tickLower!.index : null;
    withdraw.tickUpper = this.tickUpper ? this.tickUpper!.index : null;

    withdraw.save();
  }

  createDeposit(
    from: Address,
    tickLower: Tick | null,
    tickUpper: Tick | null,
    position: Position | null
  ): void {
    this.eventType = EventType.DEPOSIT;
    this.tickUpper = tickUpper;
    this.tickLower = tickLower;

    const deposit = new Withdraw(
      this.event.transaction.hash.concatI32(this.event.logIndex.toI32())
    );

    deposit.hash = this.event.transaction.hash;
    deposit.nonce = this.event.transaction.nonce;
    deposit.logIndex = this.event.logIndex.toI32();
    deposit.gasLimit = this.event.transaction.gasLimit;
    deposit.gasPrice = this.event.transaction.gasPrice;
    deposit.protocol = this.protocol.id;
    deposit.pool = this.pool.id;
    deposit.position = position ? position.id : null;
    deposit.account = from;
    deposit.blockNumber = this.event.block.number;
    deposit.timestamp = this.event.block.timestamp;
    deposit.liquidity = this.totalLiquidityDelta.abs();
    deposit.inputTokens = this.pool.inputTokens;
    deposit.inputTokenAmounts = absBigIntList(this.inputTokenBalanceDeltas);
    deposit.amountUSD = sumBigDecimalList(this.inputTokenBalanceDeltasUSD);
    deposit.tickLower = this.tickLower ? this.tickLower!.index : null;
    deposit.tickUpper = this.tickUpper ? this.tickUpper!.index : null;

    deposit.save();
  }

  createSwap(
    tokensInIdx: i32,
    tokensOutIdx: i32,
    from: Address,
    tick: BigInt | null
  ): void {
    this.eventType = EventType.SWAP;
    this.pool.tick = tick;

    // create Swap event
    const swap = new Swap(
      this.event.transaction.hash.concatI32(this.event.logIndex.toI32())
    );

    swap.hash = this.event.transaction.hash;
    swap.nonce = this.event.transaction.nonce;
    swap.logIndex = this.event.logIndex.toI32();
    swap.gasLimit = this.event.transaction.gasLimit;
    swap.gasPrice = this.event.transaction.gasPrice;
    swap.protocol = this.protocol.id;
    swap.account = from;
    swap.pool = this.pool.id;
    swap.blockNumber = this.event.block.number;
    swap.timestamp = this.event.block.timestamp;
    swap.tick = tick;
    swap.tokenIn = this.pool.inputTokens[tokensInIdx];
    swap.amountIn = this.inputTokenBalanceDeltas[tokensInIdx];
    swap.amountInUSD = this.inputTokenBalanceDeltasUSD[tokensInIdx];
    swap.tokenOut = this.pool.inputTokens[tokensOutIdx];
    swap.amountOut =
      this.inputTokenBalanceDeltas[tokensOutIdx].times(BIGINT_NEG_ONE);
    swap.amountOutUSD = this.inputTokenBalanceDeltasUSD[tokensOutIdx];

    swap.save();
    this.pool.save();
  }

  // Positions are only snapped once per interval to save space
  processLPBalanceChanges(): void {
    const protocolSnapshotDayID =
      this.protocol.lastUpdateTimestamp.toI32() / SECONDS_PER_DAY;
    if (protocolSnapshotDayID != this.dayID) {
      this.updateAndSaveFinancialMetrics(protocolSnapshotDayID);
      this.protocol.lastSnapshotDayID = protocolSnapshotDayID;
      this.protocol.save();
    }
    const poolSnapshotDayID =
      this.pool.lastUpdateTimestamp.toI32() / SECONDS_PER_DAY;
    const poolSnapshotHourID =
      this.pool.lastUpdateTimestamp.toI32() / SECONDS_PER_HOUR;
    if (poolSnapshotDayID != this.dayID) {
      this.updateAndSaveLiquidityPoolDailyMetrics(poolSnapshotDayID);
      this.pool.lastSnapshotDayID = poolSnapshotDayID;
      this.pool.save();
    }
    if (poolSnapshotHourID != this.hourID) {
      this.updateAndSaveLiquidityPoolHourlyMetrics(poolSnapshotHourID);
      this.pool.lastSnapshotHourID = poolSnapshotHourID;
      this.pool.save();
    }

    if (this.tickLower || this.tickUpper) {
      const tickLowerSnapshotDayID =
        this.tickLower!.lastUpdateTimestamp.toI32() / SECONDS_PER_DAY;
      const tickLowerSnapshotHourID =
        this.tickLower!.lastUpdateTimestamp.toI32() / SECONDS_PER_HOUR;
      const tickUpperSnapshotDayID =
        this.tickUpper!.lastUpdateTimestamp.toI32() / SECONDS_PER_DAY;
      const tickUpperSnapshotHourID =
        this.tickUpper!.lastUpdateTimestamp.toI32() / SECONDS_PER_HOUR;
      if (tickLowerSnapshotDayID != this.dayID) {
        this.updateAndSaveTickDailySnapshotEntity(
          this.tickLower!,
          tickLowerSnapshotDayID
        );
        this.tickLower!.lastSnapshotDayID = tickLowerSnapshotDayID;
        this.tickLower!.save();
      }
      // if the tick is the same, we don't need to update the upper tick
      if (
        tickUpperSnapshotDayID != this.dayID &&
        this.tickUpper!.index != this.tickLower!.index
      ) {
        this.updateAndSaveTickDailySnapshotEntity(
          this.tickUpper!,
          tickUpperSnapshotDayID
        );
        this.tickUpper!.lastSnapshotDayID = tickUpperSnapshotDayID;
        this.tickUpper!.save();
      }
      if (tickLowerSnapshotHourID != this.hourID) {
        this.updateAndSaveTickHourlySnapshotEntity(
          this.tickLower!,
          tickLowerSnapshotHourID
        );
        this.tickLower!.lastSnapshotHourID = tickLowerSnapshotHourID;
        this.tickLower!.save();
      }
      // if the tick is the same, we don't need to update the upper tick
      if (
        tickUpperSnapshotHourID != this.hourID &&
        this.tickUpper!.index != this.tickLower!.index
      ) {
        this.updateAndSaveTickHourlySnapshotEntity(
          this.tickUpper!,
          tickUpperSnapshotHourID
        );
        this.tickUpper!.lastSnapshotHourID = tickUpperSnapshotHourID;
        this.tickUpper!.save();
      }
      this.updateAndSaveTickEntity();
    }
    this.updateAndSaveProtocolEntity();
    this.updateAndSaveLiquidityPoolEntity();
    this.updateAndSaveAccountEntity();
    this.updateAndSaveUsageMetrics();
    this.updateAndSavePoolTokenEntities();
  }

  updateAndSaveProtocolEntity(): void {
    this.protocol.totalValueLockedUSD = this.protocol.totalValueLockedUSD.plus(
      this.totalValueLockedUSDDelta
    );
    this.protocol.totalLiquidityUSD = this.protocol.totalLiquidityUSD.plus(
      this.totalLiquidityDeltaUSD
    );
    this.protocol.activeLiquidityUSD = this.protocol.activeLiquidityUSD.plus(
      this.activeLiquidityDeltaUSD
    );

    if (
      this.account.depositCount +
        this.account.withdrawCount +
        this.account.swapCount ==
      0
    ) {
      this.protocol.cumulativeUniqueUsers += 1;
    }
    if (
      this.account.depositCount + this.account.withdrawCount == 0 &&
      (this.eventType == EventType.DEPOSIT ||
        this.eventType == EventType.WITHDRAW)
    ) {
      this.protocol.cumulativeUniqueLPs += 1;
    }
    if (this.account.swapCount == 0 && this.eventType == EventType.SWAP) {
      this.protocol.cumulativeUniqueTraders += 1;
    }

    this.protocol.cumulativeVolumeUSD = this.protocol.cumulativeVolumeUSD.plus(
      this.trackedVolumeUSD
    );

    this.protocol.cumulativeSupplySideRevenueUSD =
      this.protocol.cumulativeSupplySideRevenueUSD.plus(
        this.trackedSupplySideRevenueDeltaUSD
      );
    this.protocol.cumulativeProtocolSideRevenueUSD =
      this.protocol.cumulativeProtocolSideRevenueUSD.plus(
        this.trackedProtocolSideRevenueDeltaUSD
      );
    this.protocol.cumulativeTotalRevenueUSD =
      this.protocol.cumulativeSupplySideRevenueUSD.plus(
        this.protocol.cumulativeProtocolSideRevenueUSD
      );

    this.protocol.uncollectedSupplySideValueUSD =
      this.protocol.uncollectedSupplySideValueUSD.plus(
        sumBigDecimalList(this.uncollectedSupplySideValuesDeltasUSD)
      );
    this.protocol.uncollectedProtocolSideValueUSD =
      this.protocol.uncollectedProtocolSideValueUSD.plus(
        sumBigDecimalList(this.uncollectedProtocolSideValuesDeltasUSD)
      );

    this.protocol.lastUpdateBlockNumber = this.event.block.number;
    this.protocol.lastUpdateTimestamp = this.event.block.timestamp;

    this.protocol.save();
  }

  updateAndSaveLiquidityPoolEntity(): void {
    this.pool.totalValueLockedUSD = this.totalValueLockedUSD;
    this.pool.totalLiquidity = this.totalLiquidity;
    this.pool.totalLiquidityUSD = this.totalLiquidityUSD;
    this.pool.activeLiquidity = this.activeLiquidity;
    this.pool.activeLiquidityUSD = this.activeLiquidityUSD;

    this.pool.inputTokenBalances = this.inputTokenBalances;
    this.pool.inputTokenBalancesUSD = this.inputTokenBalancesUSD;

    this.pool.cumulativeVolumeUSD = this.pool.cumulativeVolumeUSD.plus(
      this.trackedVolumeUSD
    );
    this.pool.cumulativeVolumesUSD = sumBigDecimalListByIndex([
      this.pool.cumulativeVolumesUSD,
      this.trackedInputTokenBalanceDeltasUSD,
    ]);
    this.pool.cumulativeVolumeTokenAmounts = sumBigIntListByIndex([
      this.pool.cumulativeVolumeTokenAmounts,
      absBigIntList(this.inputTokenBalanceDeltas),
    ]);

    this.pool.cumulativeSupplySideRevenueUSD =
      this.pool.cumulativeSupplySideRevenueUSD.plus(
        this.trackedSupplySideRevenueDeltaUSD
      );
    this.pool.cumulativeProtocolSideRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD.plus(
        this.trackedProtocolSideRevenueDeltaUSD
      );
    this.pool.cumulativeTotalRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD.plus(
        this.pool.cumulativeSupplySideRevenueUSD
      );

    this.pool.uncollectedProtocolSideTokenAmounts =
      this.uncollectedProtocolSideTokenAmounts;
    this.pool.uncollectedSupplySideTokenAmounts =
      this.uncollectedSupplySideTokenAmounts;
    this.pool.uncollectedProtocolSideValuesUSD =
      this.uncollectedProtocolSideValuesUSD;
    this.pool.uncollectedSupplySideValuesUSD =
      this.uncollectedSupplySideValuesUSD;

    if (this.eventType == EventType.DEPOSIT) {
      this.pool.cumulativeDepositCount += INT_ONE;
    } else if (this.eventType == EventType.WITHDRAW) {
      this.pool.cumulativeWithdrawCount += INT_ONE;
    } else if (this.eventType == EventType.SWAP) {
      this.pool.cumulativeSwapCount += INT_ONE;
    }

    this.pool.lastUpdateBlockNumber = this.event.block.number;
    this.pool.lastUpdateTimestamp = this.event.block.timestamp;

    this._poolAmounts.inputTokenBalances = this.inputTokenBalancesPoolAmounts;
    this._poolAmounts.save();

    this.pool.save();
  }

  updateAndSavePoolTokenEntities(): void {
    for (let i = 0; i < this.poolTokens.length; i++) {
      const poolToken = this.poolTokens[i];
      poolToken._totalSupply = poolToken._totalSupply.plus(
        this.inputTokenBalanceDeltas[i]
      );
      poolToken._totalValueLockedUSD = convertTokenToDecimal(
        poolToken._totalSupply,
        poolToken.decimals
      ).times(poolToken.lastPriceUSD!);
      poolToken.save();
    }
  }

  updateAndSaveFinancialMetrics(day: i32): void {
    const id = Bytes.fromI32(day);

    const financialMetrics = new FinancialsDailySnapshot(id);
    const prevFinancialMetrics = FinancialsDailySnapshot.load(
      Bytes.fromI32(this.protocol.lastSnapshotDayID)
    );

    let prevCumulativeVolumeUSD = BIGDECIMAL_ZERO;
    let prevCumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    let prevCumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    let prevCumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    if (prevFinancialMetrics != null) {
      prevCumulativeVolumeUSD = prevFinancialMetrics.cumulativeVolumeUSD;
      prevCumulativeSupplySideRevenueUSD =
        prevFinancialMetrics.cumulativeSupplySideRevenueUSD;
      prevCumulativeProtocolSideRevenueUSD =
        prevFinancialMetrics.cumulativeProtocolSideRevenueUSD;
      prevCumulativeTotalRevenueUSD =
        prevFinancialMetrics.cumulativeTotalRevenueUSD;
    } else if (this.pool.lastSnapshotDayID > INT_ZERO) {
      log.critical(
        "Missing pool snapshot at ID that has been snapped: Pool {}, ID {} ",
        [this.pool.id.toHexString(), this.pool.lastSnapshotDayID.toString()]
      );
    }

    financialMetrics.day = day;
    financialMetrics.timestamp = this.event.block.timestamp;
    financialMetrics.blockNumber = this.event.block.number;
    financialMetrics.protocol = NetworkConfigs.getFactoryAddress();

    financialMetrics.totalValueLockedUSD = this.protocol.totalValueLockedUSD;
    financialMetrics.totalLiquidityUSD = this.protocol.totalLiquidityUSD;
    financialMetrics.activeLiquidityUSD = this.protocol.activeLiquidityUSD;

    financialMetrics.uncollectedProtocolSideValueUSD =
      this.protocol.uncollectedProtocolSideValueUSD;
    financialMetrics.uncollectedSupplySideValueUSD =
      this.protocol.uncollectedSupplySideValueUSD;

    financialMetrics.cumulativeVolumeUSD = this.protocol.cumulativeVolumeUSD;
    financialMetrics.dailyVolumeUSD = this.protocol.cumulativeVolumeUSD.minus(
      prevCumulativeVolumeUSD
    );
    financialMetrics.cumulativeSupplySideRevenueUSD =
      this.protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.dailySupplySideRevenueUSD =
      this.protocol.cumulativeSupplySideRevenueUSD.minus(
        prevCumulativeSupplySideRevenueUSD
      );
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      this.protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.dailyProtocolSideRevenueUSD =
      this.protocol.cumulativeProtocolSideRevenueUSD.minus(
        prevCumulativeProtocolSideRevenueUSD
      );
    financialMetrics.cumulativeTotalRevenueUSD =
      this.protocol.cumulativeTotalRevenueUSD;
    financialMetrics.dailyTotalRevenueUSD =
      this.protocol.cumulativeTotalRevenueUSD.minus(
        prevCumulativeTotalRevenueUSD
      );

    financialMetrics.save();
  }

  updateAndSaveLiquidityPoolDailyMetrics(day: i32): void {
    const id = this.event.address.concatI32(day);
    const poolMetrics = new LiquidityPoolDailySnapshot(id);
    const prevPoolMetrics = LiquidityPoolDailySnapshot.load(
      this.event.address.concatI32(this.pool.lastSnapshotDayID)
    );

    let prevCumulativeVolumeUSD = BIGDECIMAL_ZERO;
    let prevCumulativeVolumesUSD = new Array<BigDecimal>(
      this.pool.inputTokens.length
    ).fill(BIGDECIMAL_ZERO);
    let prevCumulativeVolumeTokenAmounts = new Array<BigInt>(
      this.pool.inputTokens.length
    ).fill(BIGINT_ZERO);
    let prevCumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    let prevCumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    let prevCumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    let prevCumulativeDepositCount = INT_ZERO;
    let prevCumulativeWithdrawCount = INT_ZERO;
    let prevCumulativeSwapCount = INT_ZERO;

    if (prevPoolMetrics != null) {
      prevCumulativeVolumeUSD = prevPoolMetrics.cumulativeVolumeUSD;
      prevCumulativeVolumesUSD = prevPoolMetrics.cumulativeVolumesUSD;
      prevCumulativeVolumeTokenAmounts =
        prevPoolMetrics.cumulativeVolumeTokenAmounts;
      prevCumulativeSupplySideRevenueUSD =
        prevPoolMetrics.cumulativeSupplySideRevenueUSD;
      prevCumulativeProtocolSideRevenueUSD =
        prevPoolMetrics.cumulativeProtocolSideRevenueUSD;
      prevCumulativeTotalRevenueUSD = prevPoolMetrics.cumulativeTotalRevenueUSD;
      prevCumulativeDepositCount = prevPoolMetrics.cumulativeDepositCount;
      prevCumulativeWithdrawCount = prevPoolMetrics.cumulativeWithdrawCount;
      prevCumulativeSwapCount = prevPoolMetrics.cumulativeSwapCount;
    } else if (this.pool.lastSnapshotDayID > INT_ZERO) {
      log.critical(
        "Missing pool snapshot at ID that has been snapped: Pool {}, ID {} ",
        [this.pool.id.toHexString(), this.pool.lastSnapshotDayID.toString()]
      );
    }

    poolMetrics.day = day;
    poolMetrics.timestamp = this.event.block.timestamp;
    poolMetrics.blockNumber = this.event.block.number;
    poolMetrics.protocol = NetworkConfigs.getFactoryAddress();
    poolMetrics.pool = this.event.address;
    poolMetrics.tick = this.pool.tick;
    poolMetrics.totalValueLockedUSD = this.pool.totalValueLockedUSD;
    poolMetrics.totalLiquidity = this.pool.totalLiquidity;
    poolMetrics.totalLiquidityUSD = this.pool.totalLiquidityUSD;
    poolMetrics.activeLiquidity = this.pool.activeLiquidity;
    poolMetrics.activeLiquidityUSD = this.pool.activeLiquidityUSD;

    poolMetrics.uncollectedProtocolSideTokenAmounts =
      this.pool.uncollectedProtocolSideTokenAmounts;
    poolMetrics.uncollectedProtocolSideValuesUSD =
      this.pool.uncollectedProtocolSideValuesUSD;
    poolMetrics.uncollectedSupplySideTokenAmounts =
      this.pool.uncollectedSupplySideTokenAmounts;
    poolMetrics.uncollectedSupplySideValuesUSD =
      this.pool.uncollectedSupplySideValuesUSD;

    poolMetrics.cumulativeVolumeUSD = this.pool.cumulativeVolumeUSD;
    poolMetrics.dailyTotalVolumeUSD = this.pool.cumulativeVolumeUSD.minus(
      prevCumulativeVolumeUSD
    );
    poolMetrics.cumulativeVolumesUSD = this.pool.cumulativeVolumesUSD;
    poolMetrics.dailyVolumesUSD = subtractBigDecimalLists(
      this.pool.cumulativeVolumesUSD,
      prevCumulativeVolumesUSD
    );
    poolMetrics.cumulativeVolumeTokenAmounts =
      this.pool.cumulativeVolumeTokenAmounts;
    poolMetrics.dailyVolumeTokenAmounts = subtractBigIntLists(
      this.pool.cumulativeVolumeTokenAmounts,
      prevCumulativeVolumeTokenAmounts
    );

    poolMetrics.inputTokenBalances = this.pool.inputTokenBalances;
    poolMetrics.inputTokenBalancesUSD = this.pool.inputTokenBalancesUSD;

    poolMetrics.inputTokenWeights = this.pool.inputTokenWeights;

    poolMetrics.cumulativeSupplySideRevenueUSD =
      this.pool.cumulativeSupplySideRevenueUSD;
    poolMetrics.dailySupplySideRevenueUSD =
      this.pool.cumulativeSupplySideRevenueUSD.minus(
        prevCumulativeSupplySideRevenueUSD
      );
    poolMetrics.cumulativeProtocolSideRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD;
    poolMetrics.dailyProtocolSideRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD.minus(
        prevCumulativeProtocolSideRevenueUSD
      );
    poolMetrics.cumulativeTotalRevenueUSD = this.pool.cumulativeTotalRevenueUSD;
    poolMetrics.dailyTotalRevenueUSD =
      this.pool.cumulativeTotalRevenueUSD.minus(prevCumulativeTotalRevenueUSD);

    poolMetrics.cumulativeDepositCount = this.pool.cumulativeDepositCount;
    poolMetrics.dailyDepositCount =
      this.pool.cumulativeDepositCount - prevCumulativeDepositCount;
    poolMetrics.cumulativeWithdrawCount = this.pool.cumulativeWithdrawCount;
    poolMetrics.dailyWithdrawCount =
      this.pool.cumulativeWithdrawCount - prevCumulativeWithdrawCount;
    poolMetrics.cumulativeSwapCount = this.pool.cumulativeSwapCount;
    poolMetrics.dailySwapCount =
      this.pool.cumulativeSwapCount - prevCumulativeSwapCount;

    poolMetrics.positionCount = this.pool.positionCount;
    poolMetrics.openPositionCount = this.pool.openPositionCount;
    poolMetrics.closedPositionCount = this.pool.closedPositionCount;

    poolMetrics.blockNumber = this.pool.lastUpdateBlockNumber;
    poolMetrics.timestamp = this.pool.lastUpdateTimestamp;

    poolMetrics.save();
  }

  updateAndSaveLiquidityPoolHourlyMetrics(hour: i32): void {
    const id = this.event.address.concatI32(hour);
    const poolMetrics = new LiquidityPoolHourlySnapshot(id);
    const prevPoolMetrics = LiquidityPoolHourlySnapshot.load(
      this.event.address.concatI32(this.pool.lastSnapshotHourID)
    );

    let prevCumulativeVolumeUSD = BIGDECIMAL_ZERO;
    let prevCumulativeVolumesUSD = new Array<BigDecimal>(
      this.pool.inputTokens.length
    ).fill(BIGDECIMAL_ZERO);
    let prevCumulativeVolumeTokenAmounts = new Array<BigInt>(
      this.pool.inputTokens.length
    ).fill(BIGINT_ZERO);
    let prevCumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    let prevCumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    let prevCumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    let prevCumulativeDepositCount = INT_ZERO;
    let prevCumulativeWithdrawCount = INT_ZERO;
    let prevCumulativeSwapCount = INT_ZERO;

    if (prevPoolMetrics != null) {
      prevCumulativeVolumeUSD = prevPoolMetrics.cumulativeVolumeUSD;
      prevCumulativeVolumesUSD = prevPoolMetrics.cumulativeVolumesUSD;
      prevCumulativeVolumeTokenAmounts =
        prevPoolMetrics.cumulativeVolumeTokenAmounts;
      prevCumulativeSupplySideRevenueUSD =
        prevPoolMetrics.cumulativeSupplySideRevenueUSD;
      prevCumulativeProtocolSideRevenueUSD =
        prevPoolMetrics.cumulativeProtocolSideRevenueUSD;
      prevCumulativeTotalRevenueUSD = prevPoolMetrics.cumulativeTotalRevenueUSD;
      prevCumulativeDepositCount = prevPoolMetrics.cumulativeDepositCount;
      prevCumulativeWithdrawCount = prevPoolMetrics.cumulativeWithdrawCount;
      prevCumulativeSwapCount = prevPoolMetrics.cumulativeSwapCount;
    } else if (this.pool.lastSnapshotHourID > INT_ZERO) {
      log.critical(
        "Missing pool snapshot at ID that has been snapped: Pool {}, ID {} ",
        [this.pool.id.toHexString(), this.pool.lastSnapshotHourID.toString()]
      );
    }

    poolMetrics.hour = hour;
    poolMetrics.timestamp = this.event.block.timestamp;
    poolMetrics.blockNumber = this.event.block.number;
    poolMetrics.protocol = NetworkConfigs.getFactoryAddress();
    poolMetrics.pool = this.event.address;
    poolMetrics.tick = this.pool.tick;
    poolMetrics.totalValueLockedUSD = this.pool.totalValueLockedUSD;
    poolMetrics.totalLiquidity = this.pool.totalLiquidity;
    poolMetrics.totalLiquidityUSD = this.pool.totalLiquidityUSD;
    poolMetrics.activeLiquidity = this.pool.activeLiquidity;
    poolMetrics.activeLiquidityUSD = this.pool.activeLiquidityUSD;

    poolMetrics.uncollectedProtocolSideTokenAmounts =
      this.pool.uncollectedProtocolSideTokenAmounts;
    poolMetrics.uncollectedProtocolSideValuesUSD =
      this.pool.uncollectedProtocolSideValuesUSD;
    poolMetrics.uncollectedSupplySideTokenAmounts =
      this.pool.uncollectedSupplySideTokenAmounts;
    poolMetrics.uncollectedSupplySideValuesUSD =
      this.pool.uncollectedSupplySideValuesUSD;

    poolMetrics.cumulativeVolumeUSD = this.pool.cumulativeVolumeUSD;
    poolMetrics.hourlyTotalVolumeUSD = this.pool.cumulativeVolumeUSD.minus(
      prevCumulativeVolumeUSD
    );
    poolMetrics.cumulativeVolumesUSD = this.pool.cumulativeVolumesUSD;
    poolMetrics.hourlyVolumesUSD = subtractBigDecimalLists(
      this.pool.cumulativeVolumesUSD,
      prevCumulativeVolumesUSD
    );
    poolMetrics.cumulativeVolumeTokenAmounts =
      this.pool.cumulativeVolumeTokenAmounts;
    poolMetrics.hourlyVolumeTokenAmounts = subtractBigIntLists(
      this.pool.cumulativeVolumeTokenAmounts,
      prevCumulativeVolumeTokenAmounts
    );

    poolMetrics.inputTokenBalances = this.pool.inputTokenBalances;
    poolMetrics.inputTokenBalancesUSD = this.pool.inputTokenBalancesUSD;

    poolMetrics.inputTokenWeights = this.pool.inputTokenWeights;

    poolMetrics.cumulativeSupplySideRevenueUSD =
      this.pool.cumulativeSupplySideRevenueUSD;
    poolMetrics.hourlySupplySideRevenueUSD =
      this.pool.cumulativeSupplySideRevenueUSD.minus(
        prevCumulativeSupplySideRevenueUSD
      );
    poolMetrics.cumulativeProtocolSideRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD;
    poolMetrics.hourlyProtocolSideRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD.minus(
        prevCumulativeProtocolSideRevenueUSD
      );
    poolMetrics.cumulativeTotalRevenueUSD = this.pool.cumulativeTotalRevenueUSD;
    poolMetrics.hourlyTotalRevenueUSD =
      this.pool.cumulativeTotalRevenueUSD.minus(prevCumulativeTotalRevenueUSD);

    poolMetrics.cumulativeDepositCount = this.pool.cumulativeDepositCount;
    poolMetrics.hourlyDepositCount =
      this.pool.cumulativeDepositCount - prevCumulativeDepositCount;
    poolMetrics.cumulativeWithdrawCount = this.pool.cumulativeWithdrawCount;
    poolMetrics.hourlyWithdrawCount =
      this.pool.cumulativeWithdrawCount - prevCumulativeWithdrawCount;
    poolMetrics.cumulativeSwapCount = this.pool.cumulativeSwapCount;
    poolMetrics.hourlySwapCount =
      this.pool.cumulativeSwapCount - prevCumulativeSwapCount;

    poolMetrics.positionCount = this.pool.positionCount;
    poolMetrics.openPositionCount = this.pool.openPositionCount;
    poolMetrics.closedPositionCount = this.pool.closedPositionCount;

    poolMetrics.blockNumber = this.pool.lastUpdateBlockNumber;
    poolMetrics.timestamp = this.pool.lastUpdateTimestamp;

    poolMetrics.save();
  }

  updateAndSaveTickEntity(): void {
    this.tickLower!.liquidityGross = this.tickLower!.liquidityGross.plus(
      this.totalLiquidityDelta
    );
    this.tickLower!.liquidityGrossUSD =
      this.tickLower!.liquidityGross.toBigDecimal().times(
        this.newLiquidityPricePerUnit
      );
    this.tickLower!.liquidityNet = this.tickLower!.liquidityNet.plus(
      this.totalLiquidityDelta
    );
    this.tickLower!.liquidityNetUSD =
      this.tickLower!.liquidityNet.toBigDecimal().times(
        this.newLiquidityPricePerUnit
      );
    this.tickUpper!.liquidityGross = this.tickUpper!.liquidityGross.plus(
      this.totalLiquidityDelta
    );
    this.tickUpper!.liquidityGrossUSD =
      this.tickUpper!.liquidityGross.toBigDecimal().times(
        this.newLiquidityPricePerUnit
      );
    this.tickUpper!.liquidityNet = this.tickUpper!.liquidityNet.minus(
      this.totalLiquidityDelta
    );
    this.tickUpper!.liquidityNetUSD =
      this.tickUpper!.liquidityNet.toBigDecimal().times(
        this.newLiquidityPricePerUnit
      );

    this.tickUpper!.lastUpdateBlockNumber = this.event.block.number;
    this.tickUpper!.lastUpdateTimestamp = this.event.block.timestamp;
    this.tickLower!.lastUpdateBlockNumber = this.event.block.number;
    this.tickLower!.lastUpdateTimestamp = this.event.block.timestamp;

    this.tickLower!.save();
    this.tickUpper!.save();
  }

  updateAndSaveTickDailySnapshotEntity(tick: Tick, day: i32): void {
    const tickID = this.pool.id.concatI32(tick.index.toI32()).concatI32(day);

    const tickSnapshot = new TickDailySnapshot(tickID);
    tickSnapshot.day = day;
    tickSnapshot.timestamp = this.event.block.timestamp;
    tickSnapshot.blockNumber = this.event.block.number;
    tickSnapshot.tick = this.tickLower!.id;
    tickSnapshot.pool = this.pool.id;
    tickSnapshot.timestamp = tick.lastUpdateTimestamp;
    tickSnapshot.blockNumber = tick.lastUpdateBlockNumber;
    tickSnapshot.liquidityGross = tick.liquidityGross;
    tickSnapshot.liquidityGrossUSD = tick.liquidityGrossUSD;
    tickSnapshot.liquidityNet = tick.liquidityNet;
    tickSnapshot.liquidityNetUSD = tick.liquidityNetUSD;
    tickSnapshot.save();
  }

  updateAndSaveTickHourlySnapshotEntity(tick: Tick, hour: i32): void {
    const tickID = this.pool.id.concatI32(tick.index.toI32()).concatI32(hour);

    const tickSnapshot = new TickHourlySnapshot(tickID);
    tickSnapshot.hour = hour;
    tickSnapshot.timestamp = this.event.block.timestamp;
    tickSnapshot.blockNumber = this.event.block.number;
    tickSnapshot.tick = tick.id;
    tickSnapshot.pool = this.pool.id;
    tickSnapshot.timestamp = tick.lastUpdateTimestamp;
    tickSnapshot.blockNumber = tick.lastUpdateBlockNumber;
    tickSnapshot.liquidityGross = tick.liquidityGross;
    tickSnapshot.liquidityGrossUSD = tick.liquidityGrossUSD;
    tickSnapshot.liquidityNet = tick.liquidityNet;
    tickSnapshot.liquidityNetUSD = tick.liquidityNetUSD;
    tickSnapshot.save();
  }

  updateAndSaveAccountEntity(): void {
    switch (this.eventType) {
      case EventType.SWAP:
        this.account.swapCount += INT_ONE;
      case EventType.DEPOSIT:
        this.account.depositCount += INT_ONE;
      case EventType.WITHDRAW:
        this.account.withdrawCount += INT_ONE;
    }

    this.account.save();
  }

  updateAndSaveUsageMetrics(): void {
    const from = this.event.transaction.from;

    const usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(this.event);
    const usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(this.event);

    // Update the block number and timestamp to that of the last transaction of that day
    usageMetricsDaily.day = this.dayID;
    usageMetricsDaily.timestamp = this.event.block.timestamp;
    usageMetricsDaily.blockNumber = this.event.block.number;
    usageMetricsDaily.dailyTransactionCount += INT_ONE;
    usageMetricsDaily.totalPoolCount = this.protocol.totalPoolCount;

    usageMetricsHourly.hour = this.hourID;
    usageMetricsHourly.timestamp = this.event.block.timestamp;
    usageMetricsHourly.blockNumber = this.event.block.number;
    usageMetricsHourly.hourlyTransactionCount += INT_ONE;

    if (this.eventType == EventType.DEPOSIT) {
      usageMetricsDaily.dailyDepositCount += INT_ONE;
      usageMetricsHourly.hourlyDepositCount += INT_ONE;
    } else if (this.eventType == EventType.WITHDRAW) {
      usageMetricsDaily.dailyWithdrawCount += INT_ONE;
      usageMetricsHourly.hourlyWithdrawCount += INT_ONE;
    } else if (this.eventType == EventType.SWAP) {
      usageMetricsDaily.dailySwapCount += INT_ONE;
      usageMetricsHourly.hourlySwapCount += INT_ONE;
    }

    // Number of days since Unix epoch
    const day = this.event.block.timestamp.toI32() / SECONDS_PER_DAY;
    const hour = this.event.block.timestamp.toI32() / SECONDS_PER_HOUR;

    // Combine the id and the user address to generate a unique user id for the day
    const dailyActiveAccountId = from.concatI32(day);
    let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
    if (!dailyActiveAccount) {
      dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
      usageMetricsDaily.dailyActiveUsers += INT_ONE;
      dailyActiveAccount.save();
    }

    const hourlyActiveAccountId = from.concatI32(hour);
    let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
    if (!hourlyActiveAccount) {
      hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
      usageMetricsHourly.hourlyActiveUsers += INT_ONE;
      hourlyActiveAccount.save();
    }

    usageMetricsDaily.cumulativeUniqueUsers =
      this.protocol.cumulativeUniqueUsers;
    usageMetricsHourly.cumulativeUniqueUsers =
      this.protocol.cumulativeUniqueUsers;

    usageMetricsDaily.save();
    usageMetricsHourly.save();
  }
}

// Return all tokens given a pool
function getTokens(event: ethereum.Event, pool: LiquidityPool): Token[] {
  const tokens: Token[] = [];
  for (let i = 0; i < pool.inputTokens.length; i++) {
    tokens.push(getOrCreateToken(event, pool.inputTokens[i]));
  }
  return tokens;
}

// Get USD Value given raw token amounts and a token
function getAbsUSDValues(
  tokens: Token[],
  tokenAmounts: BigInt[]
): BigDecimal[] {
  const usdValues: BigDecimal[] = [];

  // Check for fake versions of whitelisted tokens. Do not price these tokens.
  for (let i = 0; i < tokens.length; i++) {
    if (isFakeWhitelistToken(tokens[i])) {
      for (let i = 0; i < tokens.length; i++) {
        usdValues.push(BIGDECIMAL_ZERO);
      }
      return usdValues;
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    usdValues.push(
      bigDecimalAbs(
        convertTokenToDecimal(tokenAmounts[i], tokens[i].decimals).times(
          tokens[i].lastPriceUSD!
        )
      )
    );
  }
  return usdValues;
}
