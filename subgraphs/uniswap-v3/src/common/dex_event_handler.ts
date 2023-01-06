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
} from "./constants";
import { getOrCreateAccount } from "./entities/account";
import { getLiquidityPoolFee, getLiquidityPoolAmounts } from "./entities/pool";
import { getOrCreateProtocol } from "./entities/protocol";
import { getOrCreateToken } from "./entities/token";
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

export class DexEventHandler {
  event: ethereum.Event;
  eventType: i32;
  account: Account;
  protocol: DexAmmProtocol;
  pool: LiquidityPool;
  _poolAmounts: _LiquidityPoolAmount;
  newUser: bool;

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
    account: Address,
    pool: LiquidityPool,
    isSwap: bool,
    inputTokenBalancesDeltas: BigInt[],
    totalLiquidityDelta: BigInt,
    activeLiquidityDelta: BigInt,
    uncollectedSupplySideTokenAmountsDeltas: BigInt[],
    uncollectedProtocolSideTokenAmountsDeltas: BigInt[]
  ) {
    this.event = event;
    this.eventType = EventType.UNKNOWN;
    this.account = getOrCreateAccount(account);
    this.protocol = getOrCreateProtocol();
    this.pool = pool;
    this._poolAmounts = getLiquidityPoolAmounts(pool.id)!;
    this.newUser = this.account._newUser;
    this.dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
    this.hourID = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

    const tokens = getTokens(event, pool);
    const supplyFee = getLiquidityPoolFee(pool.fees[INT_ZERO]);
    const protocolFee = getLiquidityPoolFee(pool.fees[INT_ONE]);

    // Raw Deltas
    this.inputTokenBalanceDeltas = inputTokenBalancesDeltas;
    this.uncollectedSupplySideTokenAmountsDeltas =
      uncollectedSupplySideTokenAmountsDeltas;
    this.uncollectedProtocolSideTokenAmountsDeltas =
      uncollectedProtocolSideTokenAmountsDeltas;
    this.totalLiquidityDelta = totalLiquidityDelta;
    this.activeLiquidityDelta = activeLiquidityDelta;

    // Pool Token Deltas and Balances
    this.inputTokenBalanceDeltasUSD = getAbsUSDValues(
      tokens,
      this.inputTokenBalanceDeltas
    );
    this.inputTokenBalances = sumBigIntListByIndex([
      pool.inputTokenBalances,
      this.inputTokenBalanceDeltas,
    ]);
    this.inputTokenBalancesUSD = getAbsUSDValues(
      tokens,
      this.inputTokenBalances
    );
    this.inputTokenBalancesPoolAmounts = convertBigIntListToBigDecimalList(
      tokens,
      this.inputTokenBalances
    );

    // Liquidity Deltas and Balances
    this.totalLiquidity = pool.totalLiquidity.plus(this.totalLiquidityDelta);
    this.totalLiquidityUSD = sumBigDecimalList(this.inputTokenBalancesUSD);
    this.totalLiquidityDeltaUSD = this.totalLiquidityUSD.minus(
      this.pool.totalLiquidityUSD
    );

    // Get the new liquidity price per unit
    this.newLiquidityPricePerUnit = safeDivBigDecimal(
      this.totalLiquidityUSD,
      this.totalLiquidity.toBigDecimal()
    );

    // Get the deltas and values of the liquidity that is wihtin tick range.
    this.activeLiquidity = pool.activeLiquidity.plus(this.activeLiquidityDelta);
    this.activeLiquidityUSD = this.activeLiquidity
      .toBigDecimal()
      .times(this.newLiquidityPricePerUnit);
    this.activeLiquidityDeltaUSD = this.activeLiquidityUSD.minus(
      this.pool.activeLiquidityUSD
    );

    // Uncollected Token Deltas and Balances
    this.uncollectedSupplySideTokenAmounts = sumBigIntListByIndex([
      pool.uncollectedSupplySideTokenAmounts,
      this.uncollectedSupplySideTokenAmountsDeltas,
    ]);
    this.uncollectedSupplySideValuesUSD = getAbsUSDValues(
      tokens,
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
      tokens,
      this.uncollectedProtocolSideTokenAmounts
    );
    this.uncollectedProtocolSideValuesDeltasUSD = subtractBigDecimalLists(
      this.uncollectedProtocolSideValuesUSD,
      this.pool.uncollectedProtocolSideValuesUSD
    );

    // Total Value Locked
    this.totalValueLockedUSD = this.totalLiquidityUSD.plus(
      sumBigDecimalList(this.uncollectedProtocolSideValuesUSD).plus(
        sumBigDecimalList(this.uncollectedSupplySideValuesUSD)
      )
    );
    this.totalValueLockedUSDDelta = this.totalValueLockedUSD.minus(
      this.pool.totalValueLockedUSD
    );

    // Handle volumes
    if ((isSwap = true)) {
      // Get the tracked volume and revenue - they are not tracked for non-whitelist token
      this.trackedInputTokenBalanceDeltasUSD = getTrackedVolumeUSD(
        pool,
        tokens,
        this.inputTokenBalanceDeltasUSD
      );
      this.trackedVolumeUSD = BigDecimalAverage(
        this.trackedInputTokenBalanceDeltasUSD
      );
      log.warning("TRACKED VOLUME:" + this.trackedVolumeUSD.toString(), []);

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
    }
  }

  createWithdraw(
    owner: Address,
    tickLower: Tick | null,
    tickUpper: Tick | null,
    position: Position | null
  ): void {
    this.eventType = EventType.DEPOSIT;
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
    withdraw.account = owner;
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
    owner: Address,
    tickLower: Tick | null,
    tickUpper: Tick | null,
    position: Position | null
  ): void {
    this.eventType = EventType.WITHDRAW;
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
    deposit.account = owner;
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
    sender: Address,
    tick: BigInt | null
  ): void {
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
    swap.account = sender;
    swap.pool = this.pool.id;
    swap.blockNumber = this.event.block.number;
    swap.timestamp = this.event.block.timestamp;
    swap.tick = tick;
    swap.tokenIn = this.pool.inputTokens[tokensInIdx];
    swap.amountIn = this.inputTokenBalanceDeltas[tokensInIdx];
    swap.amountInUSD = this.inputTokenBalanceDeltasUSD[tokensInIdx];
    swap.tokenOut = this.pool.inputTokens[tokensOutIdx];
    swap.amountOut = this.inputTokenBalanceDeltas[tokensOutIdx];
    swap.amountOutUSD = this.inputTokenBalanceDeltasUSD[tokensOutIdx];

    swap.save();
    this.pool.save();
  }

  // Positions are only snapped once per interval to save space
  processLPBalanceChanges(): void {
    if (this.protocol._mostRecentSnapshotsDayID != this.dayID) {
      this.updateAndSaveFinancialMetrics();
      this.protocol._mostRecentSnapshotsDayID = this.dayID;
      this.protocol.save();
    }

    if (this.pool._mostRecentSnapshotsDayID != this.dayID) {
      this.updateAndSaveLiquidityPoolDailyMetrics();
      this.pool._mostRecentSnapshotsDayID = this.dayID;
      this.pool.save();
    }
    if (this.pool._mostRecentSnapshotsHourID != this.hourID) {
      this.updateAndSaveLiquidityPoolHourlyMetrics();
      this.pool._mostRecentSnapshotsHourID = this.hourID;
      this.pool.save();
    }

    if (this.tickLower || this.tickUpper) {
      if (
        this.tickLower!._mostRecentSnapshotsDayID != this.dayID ||
        this.tickUpper!._mostRecentSnapshotsDayID != this.dayID
      ) {
        this.updateAndSaveTickDailySnapshotEntity();
        this.tickLower!._mostRecentSnapshotsDayID = this.dayID;
        this.tickUpper!._mostRecentSnapshotsDayID = this.dayID;
        this.tickLower!.save();
        this.tickUpper!.save();
      }
      if (
        this.tickLower!._mostRecentSnapshotsHourID != this.hourID ||
        this.tickUpper!._mostRecentSnapshotsHourID != this.hourID
      ) {
        this.updateAndSaveTickHourlySnapshotEntity();
        this.tickLower!._mostRecentSnapshotsHourID = this.hourID;
        this.tickUpper!._mostRecentSnapshotsHourID = this.hourID;
        this.tickLower!.save();
        this.tickUpper!.save();
      }
      this.updateAndSaveTickEntity();
    }
    this.updateAndSaveProtocolEntity();
    this.updateAndSaveLiquidityPoolEntity();
    this.updateAndSaveAccountEntity();
    this.updateAndSaveUsageMetrics();
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
    if (this.newUser) {
      this.protocol.cumulativeUniqueUsers += INT_ONE;
    }

    this.protocol.cumulativeTotalVolumeUSD =
      this.protocol.cumulativeTotalVolumeUSD.plus(this.trackedVolumeUSD);

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

    this.protocol.save();

    if (
      this.account.depositCount == INT_ZERO &&
      this.account.withdrawCount == INT_ZERO
    ) {
      this.protocol.cumulativeUniqueLPs += INT_ONE;
    }

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

    this.pool.cumulativeTotalVolumeUSD =
      this.pool.cumulativeTotalVolumeUSD.plus(this.trackedVolumeUSD);
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

    this._poolAmounts.inputTokenBalances = this.inputTokenBalancesPoolAmounts;
    this._poolAmounts.save();

    this.pool.save();
  }

  updateAndSaveFinancialMetrics(): void {
    const id = Bytes.fromI32(this.dayID);

    const financialMetrics = new FinancialsDailySnapshot(id);
    const prevFinancialMetrics = FinancialsDailySnapshot.load(
      Bytes.fromI32(this.protocol._mostRecentSnapshotsDayID)
    );

    let prevCumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    let prevCumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    let prevCumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    let prevCumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    if (prevFinancialMetrics != null) {
      prevCumulativeTotalVolumeUSD =
        prevFinancialMetrics.cumulativeTotalVolumeUSD;
      prevCumulativeSupplySideRevenueUSD =
        prevFinancialMetrics.cumulativeSupplySideRevenueUSD;
      prevCumulativeProtocolSideRevenueUSD =
        prevFinancialMetrics.cumulativeProtocolSideRevenueUSD;
      prevCumulativeTotalRevenueUSD =
        prevFinancialMetrics.cumulativeTotalRevenueUSD;
    } else if (this.pool._mostRecentSnapshotsDayID > INT_ZERO) {
      log.critical(
        "Missing pool snapshot at ID that has been snapped: Pool {}, ID {} ",
        [
          this.pool.id.toHexString(),
          this.pool._mostRecentSnapshotsDayID.toString(),
        ]
      );
    }

    financialMetrics.days = this.dayID;
    financialMetrics.protocol = NetworkConfigs.getFactoryAddress();

    financialMetrics.totalValueLockedUSD = this.protocol.totalValueLockedUSD;
    financialMetrics.totalLiquidityUSD = this.protocol.totalLiquidityUSD;
    financialMetrics.activeLiquidityUSD = this.protocol.activeLiquidityUSD;

    financialMetrics.uncollectedProtocolSideValueUSD =
      this.protocol.uncollectedProtocolSideValueUSD;
    financialMetrics.uncollectedSupplySideValueUSD =
      this.protocol.uncollectedSupplySideValueUSD;

    financialMetrics.cumulativeTotalVolumeUSD =
      this.protocol.cumulativeTotalVolumeUSD;
    financialMetrics.dailyVolumeUSD =
      this.protocol.cumulativeTotalVolumeUSD.minus(
        prevCumulativeTotalVolumeUSD
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

    financialMetrics.blockNumber = this.event.block.number;
    financialMetrics.timestamp = this.event.block.timestamp;

    financialMetrics.save();
  }

  updateAndSaveLiquidityPoolDailyMetrics(): void {
    const id = this.event.address.concatI32(this.dayID);
    const poolMetrics = new LiquidityPoolDailySnapshot(id);
    const prevPoolMetrics = LiquidityPoolDailySnapshot.load(
      this.event.address.concatI32(this.pool._mostRecentSnapshotsDayID)
    );

    let prevCumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    let prevCumulativeVolumesUSD = new Array<BigDecimal>(
      this.pool.inputTokens.length
    ).fill(BIGDECIMAL_ZERO);
    let prevCumulativeVolumeTokenAmounts = new Array<BigInt>(
      this.pool.inputTokens.length
    ).fill(BIGINT_ZERO);
    let prevCumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    let prevCumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    let prevCumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    if (prevPoolMetrics != null) {
      prevCumulativeTotalVolumeUSD = prevPoolMetrics.cumulativeTotalVolumeUSD;
      prevCumulativeVolumesUSD = prevPoolMetrics.cumulativeVolumesUSD;
      prevCumulativeVolumeTokenAmounts =
        prevPoolMetrics.cumulativeVolumeTokenAmounts;
      prevCumulativeSupplySideRevenueUSD =
        prevPoolMetrics.cumulativeSupplySideRevenueUSD;
      prevCumulativeProtocolSideRevenueUSD =
        prevPoolMetrics.cumulativeProtocolSideRevenueUSD;
      prevCumulativeTotalRevenueUSD = prevPoolMetrics.cumulativeTotalRevenueUSD;
    } else if (this.pool._mostRecentSnapshotsDayID > INT_ZERO) {
      log.critical(
        "Missing pool snapshot at ID that has been snapped: Pool {}, ID {} ",
        [
          this.pool.id.toHexString(),
          this.pool._mostRecentSnapshotsDayID.toString(),
        ]
      );
    }

    poolMetrics.days = this.dayID;
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

    poolMetrics.cumulativeTotalVolumeUSD = this.pool.cumulativeTotalVolumeUSD;
    poolMetrics.dailyTotalVolumeUSD = this.pool.cumulativeTotalVolumeUSD.minus(
      prevCumulativeTotalVolumeUSD
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

    poolMetrics.positionCount = this.pool.positionCount;
    poolMetrics.openPositionCount = this.pool.openPositionCount;
    poolMetrics.closedPositionCount = this.pool.closedPositionCount;

    poolMetrics.blockNumber = this.event.block.number;
    poolMetrics.timestamp = this.event.block.timestamp;

    poolMetrics.save();
  }

  updateAndSaveLiquidityPoolHourlyMetrics(): void {
    const id = this.event.address.concatI32(this.hourID);
    const poolMetrics = new LiquidityPoolHourlySnapshot(id);
    const prevPoolMetrics = LiquidityPoolHourlySnapshot.load(
      this.event.address.concatI32(this.pool._mostRecentSnapshotsHourID)
    );

    let prevCumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    let prevCumulativeVolumesUSD = new Array<BigDecimal>(
      this.pool.inputTokens.length
    ).fill(BIGDECIMAL_ZERO);
    let prevCumulativeVolumeTokenAmounts = new Array<BigInt>(
      this.pool.inputTokens.length
    ).fill(BIGINT_ZERO);
    let prevCumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    let prevCumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    let prevCumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    if (prevPoolMetrics != null) {
      prevCumulativeTotalVolumeUSD = prevPoolMetrics.cumulativeTotalVolumeUSD;
      prevCumulativeVolumesUSD = prevPoolMetrics.cumulativeVolumesUSD;
      prevCumulativeVolumeTokenAmounts =
        prevPoolMetrics.cumulativeVolumeTokenAmounts;
      prevCumulativeSupplySideRevenueUSD =
        prevPoolMetrics.cumulativeSupplySideRevenueUSD;
      prevCumulativeProtocolSideRevenueUSD =
        prevPoolMetrics.cumulativeProtocolSideRevenueUSD;
      prevCumulativeTotalRevenueUSD = prevPoolMetrics.cumulativeTotalRevenueUSD;
    } else if (this.pool._mostRecentSnapshotsHourID > INT_ZERO) {
      log.critical(
        "Missing pool snapshot at ID that has been snapped: Pool {}, ID {} ",
        [
          this.pool.id.toHexString(),
          this.pool._mostRecentSnapshotsHourID.toString(),
        ]
      );
    }

    poolMetrics.hours = this.hourID;
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

    poolMetrics.cumulativeTotalVolumeUSD = this.pool.cumulativeTotalVolumeUSD;
    poolMetrics.hourlyTotalVolumeUSD = this.pool.cumulativeTotalVolumeUSD.minus(
      prevCumulativeTotalVolumeUSD
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

    poolMetrics.positionCount = this.pool.positionCount;
    poolMetrics.openPositionCount = this.pool.openPositionCount;
    poolMetrics.closedPositionCount = this.pool.closedPositionCount;

    poolMetrics.blockNumber = this.event.block.number;
    poolMetrics.timestamp = this.event.block.timestamp;

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

    this.tickLower!.save();
    this.tickUpper!.save();
  }

  updateAndSaveTickDailySnapshotEntity(): void {
    const lowerTickID = this.pool.id
      .concatI32(this.tickLower!.index.toI32())
      .concatI32(this.dayID);
    const upperTickID = this.pool.id
      .concatI32(this.tickUpper!.index.toI32())
      .concatI32(this.dayID);

    const tickLowerSnapshot = new TickDailySnapshot(lowerTickID);
    const tickUpperSnapshot = new TickDailySnapshot(upperTickID);

    tickLowerSnapshot.days = this.dayID;
    tickLowerSnapshot.tick = this.tickLower!.id;
    tickLowerSnapshot.pool = this.pool.id;
    tickLowerSnapshot.timestamp = this.event.block.timestamp;
    tickLowerSnapshot.blockNumber = this.event.block.number;
    tickLowerSnapshot.liquidityGross = this.tickLower!.liquidityGross;
    tickLowerSnapshot.liquidityGrossUSD = this.tickLower!.liquidityGrossUSD;
    tickLowerSnapshot.liquidityNet = this.tickLower!.liquidityNet;
    tickLowerSnapshot.liquidityNetUSD = this.tickLower!.liquidityNetUSD;

    tickLowerSnapshot.days = this.dayID;
    tickUpperSnapshot.tick = this.tickLower!.id;
    tickUpperSnapshot.pool = this.pool.id;
    tickUpperSnapshot.timestamp = this.event.block.timestamp;
    tickUpperSnapshot.blockNumber = this.event.block.number;
    tickUpperSnapshot.liquidityGross = this.tickLower!.liquidityGross;
    tickUpperSnapshot.liquidityGrossUSD = this.tickLower!.liquidityGrossUSD;
    tickUpperSnapshot.liquidityNet = this.tickLower!.liquidityNet;
    tickUpperSnapshot.liquidityNetUSD = this.tickLower!.liquidityNetUSD;

    tickLowerSnapshot.save();
    tickUpperSnapshot.save();
  }

  updateAndSaveTickHourlySnapshotEntity(): void {
    const lowerTickID = this.pool.id
      .concatI32(this.tickLower!.index.toI32())
      .concatI32(this.hourID);
    const upperTickID = this.pool.id
      .concatI32(this.tickUpper!.index.toI32())
      .concatI32(this.hourID);

    const tickLowerSnapshot = new TickHourlySnapshot(lowerTickID);
    const tickUpperSnapshot = new TickHourlySnapshot(upperTickID);

    tickLowerSnapshot.hours = this.hourID;
    tickLowerSnapshot.tick = this.tickLower!.id;
    tickLowerSnapshot.pool = this.pool.id;
    tickLowerSnapshot.timestamp = this.event.block.timestamp;
    tickLowerSnapshot.blockNumber = this.event.block.number;
    tickLowerSnapshot.liquidityGross = this.tickLower!.liquidityGross;
    tickLowerSnapshot.liquidityGrossUSD = this.tickLower!.liquidityGrossUSD;
    tickLowerSnapshot.liquidityNet = this.tickLower!.liquidityNet;
    tickLowerSnapshot.liquidityNetUSD = this.tickLower!.liquidityNetUSD;

    tickLowerSnapshot.hours = this.hourID;
    tickUpperSnapshot.tick = this.tickLower!.id;
    tickUpperSnapshot.pool = this.pool.id;
    tickUpperSnapshot.timestamp = this.event.block.timestamp;
    tickUpperSnapshot.blockNumber = this.event.block.number;
    tickUpperSnapshot.liquidityGross = this.tickLower!.liquidityGross;
    tickUpperSnapshot.liquidityGrossUSD = this.tickLower!.liquidityGrossUSD;
    tickUpperSnapshot.liquidityNet = this.tickLower!.liquidityNet;
    tickUpperSnapshot.liquidityNetUSD = this.tickLower!.liquidityNetUSD;

    tickLowerSnapshot.save();
    tickUpperSnapshot.save();
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
    usageMetricsDaily.days = this.dayID;
    usageMetricsDaily.blockNumber = this.event.block.number;
    usageMetricsDaily.timestamp = this.event.block.timestamp;
    usageMetricsDaily.dailyTransactionCount += INT_ONE;
    usageMetricsDaily.totalPoolCount = this.protocol.totalPoolCount;

    usageMetricsHourly.hours = this.hourID;
    usageMetricsHourly.blockNumber = this.event.block.number;
    usageMetricsHourly.timestamp = this.event.block.timestamp;
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
