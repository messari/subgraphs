import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
} from "@graphprotocol/graph-ts";
import {
  LiquidityPool,
  LiquidityPoolFee,
  RewardToken,
  Token,
} from "../../generated/schema";
import { EventType } from "./event";
import {
  increaseProtocolVolume,
  decrementProtocolOpenPositionCount,
  getOrCreateProtocol,
  incrementProtocolOpenPositionCount,
  updateProtocolTVL,
  increaseProtocolPremium,
  increaseProtocolTotalRevenue,
  increaseProtocolSideRevenue,
  increaseProtocolSupplySideRevenue,
  updateProtocolOpenInterestUSD,
  incrementProtocolUniqueUsers,
  incrementProtocolUniqueDepositors,
  incrementProtocolUniqueBorrowers,
  incrementProtocolUniqueLiquidators,
  incrementProtocolUniqueLiquidatees,
  increaseProtocolStakeSideRevenue,
} from "./protocol";
import { getOrCreateToken } from "./token";
import {
  BIGDECIMAL_ZERO,
  INT_ZERO,
  BIGINT_ZERO,
  PositionSide,
  INT_ONE,
  LiquidityPoolFeeType,
  INT_NEGATIVE_ONE,
  DEFAULT_DECIMALS,
} from "../utils/constants";
import {
  convertToDecimal,
  multiArraySort,
  poolArraySort,
} from "../utils/numbers";
import { enumToPrefix } from "../utils/strings";

export function getOrCreateLiquidityPool(
  event: ethereum.Event,
  poolAddress: Address,
  poolName: string,
  poolSymbol: string
): LiquidityPool {
  const protocol = getOrCreateProtocol();
  let pool = LiquidityPool.load(poolAddress);

  if (!pool) {
    pool = new LiquidityPool(poolAddress);

    // Metadata
    pool.protocol = protocol.id;
    pool.name = poolName;
    pool.symbol = poolSymbol;
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;

    // Tokens
    pool.inputTokens = [];
    pool.outputToken = null;
    pool.rewardTokens = [];

    pool.fees = createPoolFees(poolAddress);

    // Quantitative Revenue Data
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeStakeSideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    pool.cumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;

    pool.cumulativeUniqueUsers = INT_ZERO;
    pool.cumulativeUniqueDepositors = INT_ZERO;
    pool.cumulativeUniqueBorrowers = INT_ZERO;
    pool.cumulativeUniqueLiquidators = INT_ZERO;
    pool.cumulativeUniqueLiquidatees = INT_ZERO;

    pool.longOpenInterestUSD = BIGDECIMAL_ZERO;
    pool.shortOpenInterestUSD = BIGDECIMAL_ZERO;
    pool.totalOpenInterestUSD = BIGDECIMAL_ZERO;
    pool.longPositionCount = INT_ZERO;
    pool.shortPositionCount = INT_ZERO;
    pool.openPositionCount = INT_ZERO;
    pool.closedPositionCount = INT_ZERO;
    pool.cumulativePositionCount = INT_ZERO;

    // Quantitative Token Data
    pool.inputTokenBalances = [];
    pool.inputTokenWeights = [];
    pool.outputTokenSupply = BIGINT_ZERO;
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    pool.stakedOutputTokenAmount = BIGINT_ZERO;
    pool.rewardTokenEmissionsAmount = [];
    pool.rewardTokenEmissionsUSD = [];

    pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeVolumeByTokenAmount = [];
    pool.cumulativeVolumeByTokenUSD = [];
    pool.cumulativeInflowVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeInflowVolumeByTokenAmount = [];
    pool.cumulativeInflowVolumeByTokenUSD = [];
    pool.cumulativeClosedInflowVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeClosedInflowVolumeByTokenAmount = [];
    pool.cumulativeClosedInflowVolumeByTokenUSD = [];
    pool.cumulativeOutflowVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeOutflowVolumeByTokenAmount = [];
    pool.cumulativeOutflowVolumeByTokenUSD = [];

    pool.fundingrate = [];
    pool.cumulativeUniqueUsers = INT_ZERO;
    pool._lastSnapshotDayID = BIGINT_ZERO;
    pool._lastSnapshotHourID = BIGINT_ZERO;
    pool._lastUpdateTimestamp = BIGINT_ZERO;

    // update number of pools
    protocol.totalPoolCount += 1;
    protocol.save();

    pool.save();
  }

  return pool;
}

export function increasePoolVolume(
  event: ethereum.Event,
  pool: LiquidityPool,
  sizeUSDDelta: BigDecimal,
  collateralTokenAddress: Address | null,
  collateralTokenAmountDelta: BigInt,
  collateralUSDDelta: BigDecimal,
  eventType: EventType
): void {
  let collateralTokenIndex = INT_NEGATIVE_ONE;
  if (collateralTokenAddress) {
    collateralTokenIndex = pool.inputTokens.indexOf(collateralTokenAddress);
    if (collateralTokenIndex < 0) {
      updatePoolInputTokenBalance(
        event,
        pool,
        getOrCreateToken(event, collateralTokenAddress),
        BIGINT_ZERO,
        eventType
      );
      collateralTokenIndex = pool.inputTokens.indexOf(collateralTokenAddress);
    }
  }

  switch (eventType) {
    case EventType.CollateralIn:
      pool.cumulativeInflowVolumeUSD =
        pool.cumulativeInflowVolumeUSD.plus(collateralUSDDelta);
      pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(sizeUSDDelta);

      const cumulativeInflowVolumeByTokenAmount =
        pool.cumulativeInflowVolumeByTokenAmount;
      const cumulativeInflowVolumeByTokenUSD =
        pool.cumulativeInflowVolumeByTokenUSD;
      if (collateralTokenIndex >= 0) {
        cumulativeInflowVolumeByTokenAmount[collateralTokenIndex] =
          cumulativeInflowVolumeByTokenAmount[collateralTokenIndex].plus(
            collateralTokenAmountDelta
          );
        cumulativeInflowVolumeByTokenUSD[collateralTokenIndex] =
          cumulativeInflowVolumeByTokenUSD[collateralTokenIndex].plus(
            collateralUSDDelta
          );
      }
      pool.cumulativeInflowVolumeByTokenAmount =
        cumulativeInflowVolumeByTokenAmount;
      pool.cumulativeInflowVolumeByTokenUSD = cumulativeInflowVolumeByTokenUSD;

      break;
    case EventType.CollateralOut:
      pool.cumulativeOutflowVolumeUSD =
        pool.cumulativeOutflowVolumeUSD.plus(collateralUSDDelta);
      pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(sizeUSDDelta);

      const cumulativeOutflowVolumeByTokenAmount =
        pool.cumulativeOutflowVolumeByTokenAmount;
      const cumulativeOutflowVolumeByTokenUSD =
        pool.cumulativeOutflowVolumeByTokenUSD;
      if (collateralTokenIndex >= 0) {
        cumulativeOutflowVolumeByTokenAmount[collateralTokenIndex] =
          cumulativeOutflowVolumeByTokenAmount[collateralTokenIndex].plus(
            collateralTokenAmountDelta
          );
        cumulativeOutflowVolumeByTokenUSD[collateralTokenIndex] =
          cumulativeOutflowVolumeByTokenUSD[collateralTokenIndex].plus(
            collateralUSDDelta
          );
      }
      pool.cumulativeOutflowVolumeByTokenAmount =
        cumulativeOutflowVolumeByTokenAmount;
      pool.cumulativeOutflowVolumeByTokenUSD =
        cumulativeOutflowVolumeByTokenUSD;

      break;
    case EventType.ClosePosition:
    case EventType.Liquidated:
      pool.cumulativeClosedInflowVolumeUSD =
        pool.cumulativeClosedInflowVolumeUSD.plus(collateralUSDDelta);

      const cumulativeClosedInflowVolumeByTokenAmount =
        pool.cumulativeClosedInflowVolumeByTokenAmount;
      const cumulativeClosedInflowVolumeByTokenUSD =
        pool.cumulativeClosedInflowVolumeByTokenUSD;
      if (collateralTokenIndex >= 0) {
        cumulativeClosedInflowVolumeByTokenAmount[collateralTokenIndex] =
          cumulativeClosedInflowVolumeByTokenAmount[collateralTokenIndex].plus(
            collateralTokenAmountDelta
          );
        cumulativeClosedInflowVolumeByTokenUSD[collateralTokenIndex] =
          cumulativeClosedInflowVolumeByTokenUSD[collateralTokenIndex].plus(
            collateralUSDDelta
          );
      }
      pool.cumulativeClosedInflowVolumeByTokenAmount =
        cumulativeClosedInflowVolumeByTokenAmount;
      pool.cumulativeClosedInflowVolumeByTokenUSD =
        cumulativeClosedInflowVolumeByTokenUSD;

      break;

    default:
      break;
  }

  const cumulativeVolumeByTokenAmount = pool.cumulativeVolumeByTokenAmount;
  const cumulativeVolumeByTokenUSD = pool.cumulativeVolumeByTokenUSD;
  if (collateralTokenIndex >= 0) {
    cumulativeVolumeByTokenAmount[collateralTokenIndex] =
      cumulativeVolumeByTokenAmount[collateralTokenIndex].plus(
        collateralTokenAmountDelta
      );
    cumulativeVolumeByTokenUSD[collateralTokenIndex] =
      cumulativeVolumeByTokenUSD[collateralTokenIndex].plus(collateralUSDDelta);
  }
  pool.cumulativeVolumeByTokenAmount = cumulativeVolumeByTokenAmount;
  pool.cumulativeVolumeByTokenUSD = cumulativeVolumeByTokenUSD;

  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  increaseProtocolVolume(event, sizeUSDDelta, collateralUSDDelta, eventType);
}

export function increasePoolPremium(
  event: ethereum.Event,
  pool: LiquidityPool,
  amountUSD: BigDecimal,
  eventType: EventType
): void {
  switch (eventType) {
    case EventType.Deposit:
      pool.cumulativeDepositPremiumUSD =
        pool.cumulativeDepositPremiumUSD.plus(amountUSD);
      pool.cumulativeTotalLiquidityPremiumUSD =
        pool.cumulativeTotalLiquidityPremiumUSD.plus(amountUSD);
      break;
    case EventType.Withdraw:
      pool.cumulativeWithdrawPremiumUSD =
        pool.cumulativeWithdrawPremiumUSD.plus(amountUSD);
      pool.cumulativeTotalLiquidityPremiumUSD =
        pool.cumulativeTotalLiquidityPremiumUSD.plus(amountUSD);
      break;
    case EventType.CollateralIn:
      pool.cumulativeEntryPremiumUSD =
        pool.cumulativeEntryPremiumUSD.plus(amountUSD);
      pool.cumulativeTotalPremiumUSD =
        pool.cumulativeTotalPremiumUSD.plus(amountUSD);
      break;
    case EventType.CollateralOut:
      pool.cumulativeExitPremiumUSD =
        pool.cumulativeExitPremiumUSD.plus(amountUSD);
      pool.cumulativeTotalPremiumUSD =
        pool.cumulativeTotalPremiumUSD.plus(amountUSD);
      break;

    default:
      break;
  }
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  increaseProtocolPremium(event, amountUSD, eventType);
}

export function incrementPoolOpenPositionCount(
  event: ethereum.Event,
  pool: LiquidityPool,
  positionSide: string
): void {
  if (PositionSide.LONG == positionSide) {
    pool.longPositionCount += INT_ONE;
  } else {
    pool.shortPositionCount += INT_ONE;
  }
  pool.openPositionCount += INT_ONE;

  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  incrementProtocolOpenPositionCount(event, positionSide);
}

export function decrementPoolOpenPositionCount(
  event: ethereum.Event,
  pool: LiquidityPool,
  positionSide: string
): void {
  if (PositionSide.LONG == positionSide) {
    pool.longPositionCount -= INT_ONE;
  } else {
    pool.shortPositionCount -= INT_ONE;
  }
  pool.openPositionCount -= INT_ONE;
  pool.closedPositionCount += INT_ONE;

  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  decrementProtocolOpenPositionCount(event, positionSide);
}

export function updatePoolOutputToken(
  event: ethereum.Event,
  pool: LiquidityPool,
  outputTokenAddress: Address
): void {
  pool.outputToken = getOrCreateToken(event, outputTokenAddress).id;
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();
}

export function updatePoolTvl(
  event: ethereum.Event,
  pool: LiquidityPool,
  outputTokenAmount: BigInt,
  outputTokenPrice: BigInt,
  eventType: EventType
): void {
  const prevPoolTVL = pool.totalValueLockedUSD;
  if (eventType == EventType.Deposit) {
    pool.outputTokenSupply = pool.outputTokenSupply!.plus(outputTokenAmount);
  } else if (eventType == EventType.Withdraw) {
    pool.outputTokenSupply = pool.outputTokenSupply!.minus(outputTokenAmount);
  }
  pool.outputTokenPriceUSD = convertToDecimal(
    outputTokenPrice,
    DEFAULT_DECIMALS
  );
  pool.totalValueLockedUSD = convertToDecimal(
    pool.outputTokenSupply!,
    DEFAULT_DECIMALS
  ).times(pool.outputTokenPriceUSD!);
  const tvlChangeUSD = pool.totalValueLockedUSD.minus(prevPoolTVL);
  pool.stakedOutputTokenAmount = pool.outputTokenSupply;

  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  updateProtocolTVL(event, tvlChangeUSD);
}

export function updatePoolOpenInterestUSD(
  event: ethereum.Event,
  pool: LiquidityPool,
  amountChangeUSD: BigDecimal,
  isLong: boolean
): void {
  if (isLong) {
    pool.longOpenInterestUSD =
      pool.longOpenInterestUSD.plus(amountChangeUSD) >= BIGDECIMAL_ZERO
        ? pool.longOpenInterestUSD.plus(amountChangeUSD)
        : BIGDECIMAL_ZERO;
  } else {
    pool.shortOpenInterestUSD =
      pool.shortOpenInterestUSD.plus(amountChangeUSD) >= BIGDECIMAL_ZERO
        ? pool.shortOpenInterestUSD.plus(amountChangeUSD)
        : BIGDECIMAL_ZERO;
  }

  const preTotalOpenInterestUSD = pool.totalOpenInterestUSD;
  pool.totalOpenInterestUSD = pool.longOpenInterestUSD.plus(
    pool.shortOpenInterestUSD
  );
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  updateProtocolOpenInterestUSD(
    event,
    pool.totalOpenInterestUSD.minus(preTotalOpenInterestUSD),
    isLong
  );
}

export function updatePoolInputTokenBalance(
  event: ethereum.Event,
  pool: LiquidityPool,
  inputToken: Token,
  inputTokenAmount: BigInt,
  eventType: EventType
): void {
  const inputTokens = pool.inputTokens;
  const inputTokenBalances = pool.inputTokenBalances;
  const inputTokenIndex = inputTokens.indexOf(inputToken.id);
  if (inputTokenIndex >= 0) {
    if (eventType == EventType.Deposit) {
      inputTokenBalances[inputTokenIndex] =
        inputTokenBalances[inputTokenIndex].plus(inputTokenAmount);
    } else if (eventType == EventType.Withdraw) {
      inputTokenBalances[inputTokenIndex] =
        inputTokenBalances[inputTokenIndex].minus(inputTokenAmount) >=
        BIGINT_ZERO
          ? inputTokenBalances[inputTokenIndex].minus(inputTokenAmount)
          : BIGINT_ZERO;
    }
  } else {
    const inputTokenWeights = pool.inputTokenWeights;
    const fundingrates = pool.fundingrate;
    const cumulativeVolumeByTokenAmount = pool.cumulativeVolumeByTokenAmount;
    const cumulativeVolumeByTokenUSD = pool.cumulativeVolumeByTokenUSD;
    const cumulativeInflowVolumeByTokenAmount =
      pool.cumulativeInflowVolumeByTokenAmount;
    const cumulativeInflowVolumeByTokenUSD =
      pool.cumulativeInflowVolumeByTokenUSD;
    const cumulativeClosedInflowVolumeByTokenAmount =
      pool.cumulativeClosedInflowVolumeByTokenAmount;
    const cumulativeClosedInflowVolumeByTokenUSD =
      pool.cumulativeClosedInflowVolumeByTokenUSD;
    const cumulativeOutflowVolumeByTokenAmount =
      pool.cumulativeOutflowVolumeByTokenAmount;
    const cumulativeOutflowVolumeByTokenUSD =
      pool.cumulativeOutflowVolumeByTokenUSD;

    inputTokens.push(inputToken.id);
    inputTokenBalances.push(inputTokenAmount);
    fundingrates.push(BIGDECIMAL_ZERO);
    inputTokenWeights.push(BIGDECIMAL_ZERO);
    cumulativeVolumeByTokenAmount.push(BIGINT_ZERO);
    cumulativeVolumeByTokenUSD.push(BIGDECIMAL_ZERO);
    cumulativeInflowVolumeByTokenAmount.push(BIGINT_ZERO);
    cumulativeInflowVolumeByTokenUSD.push(BIGDECIMAL_ZERO);
    cumulativeClosedInflowVolumeByTokenAmount.push(BIGINT_ZERO);
    cumulativeClosedInflowVolumeByTokenUSD.push(BIGDECIMAL_ZERO);
    cumulativeOutflowVolumeByTokenAmount.push(BIGINT_ZERO);
    cumulativeOutflowVolumeByTokenUSD.push(BIGDECIMAL_ZERO);

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

    for (let i = 0; i < inputTokens.length; i++) {
      inputTokenWeights[i] = BIGDECIMAL_ZERO;
    }
    pool.inputTokenWeights = inputTokenWeights;
    pool.fundingrate = fundingrates;
    pool.cumulativeVolumeByTokenAmount = cumulativeVolumeByTokenAmount;
    pool.cumulativeVolumeByTokenUSD = cumulativeVolumeByTokenUSD;
    pool.cumulativeInflowVolumeByTokenAmount =
      cumulativeInflowVolumeByTokenAmount;
    pool.cumulativeInflowVolumeByTokenUSD = cumulativeInflowVolumeByTokenUSD;
    pool.cumulativeClosedInflowVolumeByTokenAmount =
      cumulativeClosedInflowVolumeByTokenAmount;
    pool.cumulativeClosedInflowVolumeByTokenUSD =
      cumulativeClosedInflowVolumeByTokenUSD;
    pool.cumulativeOutflowVolumeByTokenAmount =
      cumulativeOutflowVolumeByTokenAmount;
    pool.cumulativeOutflowVolumeByTokenUSD = cumulativeOutflowVolumeByTokenUSD;
  }

  pool.inputTokens = inputTokens;
  pool.inputTokenBalances = inputTokenBalances;

  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();
}

export function updatePoolRewardToken(
  event: ethereum.Event,
  pool: LiquidityPool,
  rewardToken: RewardToken,
  tokensPerDay: BigInt,
  tokensPerDayUSD: BigDecimal
): void {
  const rewardTokens = pool.rewardTokens!;
  const rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount!;
  const rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD!;

  const rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);
  if (rewardTokenIndex >= 0) {
    rewardTokenEmissionsAmount[rewardTokenIndex] = tokensPerDay;
    rewardTokenEmissionsUSD[rewardTokenIndex] = tokensPerDayUSD;
  } else {
    rewardTokens.push(rewardToken.id);
    rewardTokenEmissionsAmount.push(tokensPerDay);
    rewardTokenEmissionsUSD.push(tokensPerDayUSD);

    multiArraySort(
      rewardTokens,
      rewardTokenEmissionsAmount,
      rewardTokenEmissionsUSD
    );
  }
  pool.rewardTokens = rewardTokens;
  pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();
}

export function updatePoolFundingRate(
  event: ethereum.Event,
  pool: LiquidityPool,
  fundingToken: Token,
  fundingrate: BigDecimal
): void {
  const fundingTokens = pool.inputTokens;
  const fundingrates = pool.fundingrate;
  const fundingTokenIndex = fundingTokens.indexOf(fundingToken.id);
  if (fundingTokenIndex >= 0) {
    fundingrates[fundingTokenIndex] = fundingrate;
  }
  pool.fundingrate = fundingrates;
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();
}

export function increasePoolTotalRevenue(
  event: ethereum.Event,
  pool: LiquidityPool,
  amountChangeUSD: BigDecimal
): void {
  pool.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD.plus(amountChangeUSD);
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  increaseProtocolTotalRevenue(event, amountChangeUSD);
}

export function increasePoolProtocolSideRevenue(
  event: ethereum.Event,
  pool: LiquidityPool,
  amountChangeUSD: BigDecimal
): void {
  pool.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD.plus(amountChangeUSD);
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  increaseProtocolSideRevenue(event, amountChangeUSD);
}

export function increasePoolSupplySideRevenue(
  event: ethereum.Event,
  pool: LiquidityPool,
  amountChangeUSD: BigDecimal
): void {
  pool.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD.plus(amountChangeUSD);
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  increaseProtocolSupplySideRevenue(event, amountChangeUSD);
}

export function increasePoolStakeSideRevenue(
  event: ethereum.Event,
  pool: LiquidityPool,
  amountChangeUSD: BigDecimal
): void {
  pool.cumulativeStakeSideRevenueUSD =
    pool.cumulativeStakeSideRevenueUSD.plus(amountChangeUSD);
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  increaseProtocolStakeSideRevenue(event, amountChangeUSD);
}

export function incrementPoolUniqueUsers(
  event: ethereum.Event,
  pool: LiquidityPool
): void {
  pool.cumulativeUniqueUsers += INT_ONE;
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  incrementProtocolUniqueUsers(event);
}

export function incrementPoolUniqueDepositors(
  event: ethereum.Event,
  pool: LiquidityPool
): void {
  pool.cumulativeUniqueDepositors += INT_ONE;
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  incrementProtocolUniqueDepositors(event);
}

export function incrementPoolUniqueBorrowers(
  event: ethereum.Event,
  pool: LiquidityPool
): void {
  pool.cumulativeUniqueBorrowers += INT_ONE;
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  incrementProtocolUniqueBorrowers(event);
}

export function incrementPoolUniqueLiquidators(
  event: ethereum.Event,
  pool: LiquidityPool
): void {
  pool.cumulativeUniqueLiquidators += INT_ONE;
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  incrementProtocolUniqueLiquidators(event);
}

export function incrementPoolUniqueLiquidatees(
  event: ethereum.Event,
  pool: LiquidityPool
): void {
  pool.cumulativeUniqueLiquidatees += INT_ONE;
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  incrementProtocolUniqueLiquidatees(event);
}

export function updatePoolSnapshotDayID(
  event: ethereum.Event,
  pool: LiquidityPool,
  snapshotDayID: i32
): void {
  pool._lastSnapshotDayID = BigInt.fromI32(snapshotDayID);
  pool.save();
}

export function updatePoolSnapshotHourID(
  event: ethereum.Event,
  pool: LiquidityPool,
  snapshotHourID: i32
): void {
  pool._lastSnapshotHourID = BigInt.fromI32(snapshotHourID);
  pool.save();
}

function createPoolFees(poolAddress: Bytes): Bytes[] {
  // get or create fee entities, set fee types
  const tradingFeeId = Bytes.fromUTF8(
    enumToPrefix(LiquidityPoolFeeType.FIXED_TRADING_FEE)
  ).concat(poolAddress);
  const tradingFee = getOrCreateLiquidityPoolFee(
    tradingFeeId,
    LiquidityPoolFeeType.FIXED_TRADING_FEE
  );

  const protocolFeeId = Bytes.fromUTF8(
    enumToPrefix(LiquidityPoolFeeType.FIXED_PROTOCOL_FEE)
  ).concat(poolAddress);
  const protocolFee = getOrCreateLiquidityPoolFee(
    protocolFeeId,
    LiquidityPoolFeeType.FIXED_PROTOCOL_FEE
  );

  const lpFeeId = Bytes.fromUTF8(
    enumToPrefix(LiquidityPoolFeeType.FIXED_LP_FEE)
  ).concat(poolAddress);
  const lpFee = getOrCreateLiquidityPoolFee(
    lpFeeId,
    LiquidityPoolFeeType.FIXED_LP_FEE
  );

  const stakeFeeId = Bytes.fromUTF8(
    enumToPrefix(LiquidityPoolFeeType.FIXED_STAKE_FEE)
  ).concat(poolAddress);
  const stakeFee = getOrCreateLiquidityPoolFee(
    stakeFeeId,
    LiquidityPoolFeeType.FIXED_STAKE_FEE
  );

  const depositFeeId = Bytes.fromUTF8(
    enumToPrefix(LiquidityPoolFeeType.DEPOSIT_FEE)
  ).concat(poolAddress);
  const depositFee = getOrCreateLiquidityPoolFee(
    depositFeeId,
    LiquidityPoolFeeType.DEPOSIT_FEE
  );

  const withdrawalFeeId = Bytes.fromUTF8(
    enumToPrefix(LiquidityPoolFeeType.WITHDRAWAL_FEE)
  ).concat(poolAddress);
  const withdrawalFee = getOrCreateLiquidityPoolFee(
    withdrawalFeeId,
    LiquidityPoolFeeType.WITHDRAWAL_FEE
  );

  return [
    tradingFee.id,
    protocolFee.id,
    lpFee.id,
    stakeFee.id,
    depositFee.id,
    withdrawalFee.id,
  ];
}

function getOrCreateLiquidityPoolFee(
  feeId: Bytes,
  feeType: string,
  feePercentage: BigDecimal = BIGDECIMAL_ZERO
): LiquidityPoolFee {
  let fees = LiquidityPoolFee.load(feeId);

  if (!fees) {
    fees = new LiquidityPoolFee(feeId);

    fees.feeType = feeType;
    fees.feePercentage = feePercentage;

    fees.save();
  }

  if (feePercentage.notEqual(BIGDECIMAL_ZERO)) {
    fees.feePercentage = feePercentage;
    fees.save();
  }

  return fees;
}
