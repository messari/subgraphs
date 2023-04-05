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
  getOrCreateProtocol,
  updateProtocolTVL,
  increaseProtocolPremium,
  increaseProtocolSideRevenue,
  increaseProtocolSupplySideRevenue,
  updateProtocolOpenInterestUSD,
  incrementProtocolEventCount,
  updateProtocolOpenPositionCount,
} from "./protocol";
import { getOrCreateToken } from "./token";
import {
  BIGDECIMAL_ZERO,
  INT_ZERO,
  BIGINT_ZERO,
  INT_ONE,
  LiquidityPoolFeeType,
  BIGDECIMAL_HUNDRED,
  CHAIN_LINK,
  addressLookupTable,
} from "../utils/constants";
import { convertTokenToDecimal, multiArraySort } from "../utils/numbers";
import { enumToPrefix } from "../utils/strings";
import { Ssov } from "../../generated/BasicWeeklyCalls/Ssov";

export function getOrCreateLiquidityPool(
  event: ethereum.Event,
  poolAddress: Address
): LiquidityPool {
  let pool = LiquidityPool.load(poolAddress);

  if (!pool) {
    pool = new LiquidityPool(poolAddress);

    // Metadata
    const protocol = getOrCreateProtocol();
    pool.protocol = protocol.id;

    const ssovContract = Ssov.bind(event.address);
    const tryName = ssovContract.try_name();
    if (!tryName.reverted) {
      pool.name = tryName.value;
    }
    const trySymbol = ssovContract.try_symbol();
    if (!trySymbol.reverted) {
      pool.symbol = trySymbol.value;
    }
    const tryCollateralToken = ssovContract.try_collateralToken();
    if (!tryCollateralToken.reverted) {
      const collateralToken = getOrCreateToken(event, tryCollateralToken.value);
      pool.inputTokens = [collateralToken.id];
    }
    const tryUnderlyingSymbol = ssovContract.try_underlyingSymbol();
    if (!tryUnderlyingSymbol.reverted) {
      const UnderlyingAssetAddressString = addressLookupTable.get(
        tryUnderlyingSymbol.value
      );
      if (UnderlyingAssetAddressString) {
        pool._underlyingAsset = getOrCreateToken(
          event,
          Address.fromString(UnderlyingAssetAddressString)
        ).id;
      }
    }

    pool.oracle = CHAIN_LINK;
    const tryIsPut = ssovContract.try_isPut();
    if (!tryIsPut.reverted) {
      pool._isPut = tryIsPut.value;
    }
    pool.inputTokenBalances = [BIGINT_ZERO];
    pool.inputTokenWeights = [BIGDECIMAL_HUNDRED];
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;

    // Tokens
    pool.outputToken = null;
    pool.rewardTokens = [];

    pool.fees = createPoolFees(poolAddress);

    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;

    // Quantitative Revenue Data
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    pool.cumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;

    pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeCollateralVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeExercisedVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeClosedVolumeUSD = BIGDECIMAL_ZERO;
    pool.openInterestUSD = BIGDECIMAL_ZERO;
    pool.putsMintedCount = INT_ZERO;
    pool.callsMintedCount = INT_ZERO;
    pool.contractsMintedCount = INT_ZERO;
    pool.contractsTakenCount = INT_ZERO;
    pool.contractsExpiredCount = INT_ZERO;
    pool.contractsExercisedCount = INT_ZERO;
    pool.contractsClosedCount = INT_ZERO;
    pool.openPositionCount = INT_ZERO;
    pool.closedPositionCount = INT_ZERO;

    // Quantitative Token Data
    pool.outputTokenSupply = BIGINT_ZERO;
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    pool.stakedOutputTokenAmount = BIGINT_ZERO;
    pool.rewardTokenEmissionsAmount = [];
    pool.rewardTokenEmissionsUSD = [];

    pool.cumulativeDepositedVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeWithdrawVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeVolumeByTokenAmount = [BIGINT_ZERO];
    pool.cumulativeVolumeByTokenUSD = [BIGDECIMAL_ZERO];
    pool.cumulativeDepositedVolumeByTokenAmount = [BIGINT_ZERO];
    pool.cumulativeDepositedVolumeByTokenUSD = [BIGDECIMAL_ZERO];
    pool.cumulativeWithdrawVolumeByTokenAmount = [BIGINT_ZERO];
    pool.cumulativeWithdrawVolumeByTokenUSD = [BIGDECIMAL_ZERO];
    pool._currentEpoch = BIGINT_ZERO;
    pool._lastSnapshotDayID = INT_ZERO;
    pool._lastSnapshotHourID = INT_ZERO;
    pool._lastUpdateTimestamp = BIGINT_ZERO;

    // update number of pools
    protocol.totalPoolCount += INT_ONE;
    protocol.save();

    pool.save();
  }

  return pool;
}

export function increasePoolVolume(
  event: ethereum.Event,
  pool: LiquidityPool,
  sizeAmountDelta: BigInt,
  sizeUSDDelta: BigDecimal,
  collateralAmountDelta: BigInt,
  collateralUSDDelta: BigDecimal,
  eventType: EventType
): void {
  // sizeUSD and collateralUSD are unique concepts for derivative options trading.
  // For example, a user want to sell a call to be able to buy 1 BTC at the current 25K
  // price one month later. In this scenario, the sizeUSD is 1BTC * BTCPrice = 25K. But
  // in order to do so, he just needs to deposit right now 1 ETH as collateral, whose
  // value is 1 ETH * ETHPrice = 1.5K (Assuming ETH is 1.5K now)
  // So for derivative, there are normal two kind of values. One is the intended trading
  // size, which is called sizeUSD in the codes, while the other is the collateral size,
  // which is called collateralUSD in the codes.
  switch (eventType) {
    case EventType.Deposit:
      pool.cumulativeDepositedVolumeUSD =
        pool.cumulativeDepositedVolumeUSD.plus(collateralUSDDelta);

      const cumulativeDepositedVolumeByTokenAmount =
        pool.cumulativeDepositedVolumeByTokenAmount;
      const cumulativeDepositedVolumeByTokenUSD =
        pool.cumulativeDepositedVolumeByTokenUSD;
      cumulativeDepositedVolumeByTokenAmount[0] =
        cumulativeDepositedVolumeByTokenAmount[0].plus(collateralAmountDelta);
      cumulativeDepositedVolumeByTokenUSD[0] =
        cumulativeDepositedVolumeByTokenUSD[0].plus(collateralUSDDelta);
      pool.cumulativeDepositedVolumeByTokenAmount =
        cumulativeDepositedVolumeByTokenAmount;
      pool.cumulativeDepositedVolumeByTokenUSD =
        cumulativeDepositedVolumeByTokenUSD;

      break;
    case EventType.Withdraw:
      pool.cumulativeWithdrawVolumeUSD =
        pool.cumulativeWithdrawVolumeUSD.plus(collateralUSDDelta);

      const cumulativeWithdrawVolumeByTokenAmount =
        pool.cumulativeWithdrawVolumeByTokenAmount;
      const cumulativeWithdrawVolumeByTokenUSD =
        pool.cumulativeWithdrawVolumeByTokenUSD;
      cumulativeWithdrawVolumeByTokenAmount[0] =
        cumulativeWithdrawVolumeByTokenAmount[0].plus(collateralAmountDelta);
      cumulativeWithdrawVolumeByTokenUSD[0] =
        cumulativeWithdrawVolumeByTokenUSD[0].plus(collateralUSDDelta);
      pool.cumulativeWithdrawVolumeByTokenAmount =
        cumulativeWithdrawVolumeByTokenAmount;
      pool.cumulativeWithdrawVolumeByTokenUSD =
        cumulativeWithdrawVolumeByTokenUSD;

      break;
    case EventType.Settle:
      pool.cumulativeExercisedVolumeUSD =
        pool.cumulativeExercisedVolumeUSD.plus(sizeUSDDelta);
      pool.cumulativeClosedVolumeUSD =
        pool.cumulativeClosedVolumeUSD.plus(sizeUSDDelta);

    default:
      break;
  }

  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(sizeUSDDelta);
  pool.cumulativeCollateralVolumeUSD =
    pool.cumulativeCollateralVolumeUSD!.plus(collateralUSDDelta);

  const cumulativeVolumeByTokenAmount = pool.cumulativeVolumeByTokenAmount;
  const cumulativeVolumeByTokenUSD = pool.cumulativeVolumeByTokenUSD;
  cumulativeVolumeByTokenAmount[0] =
    cumulativeVolumeByTokenAmount[0].plus(sizeAmountDelta);
  cumulativeVolumeByTokenUSD[0] =
    cumulativeVolumeByTokenUSD[0].plus(sizeUSDDelta);
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
    case EventType.Purchase:
      pool.cumulativeEntryPremiumUSD =
        pool.cumulativeEntryPremiumUSD.plus(amountUSD);
      pool.cumulativeTotalPremiumUSD =
        pool.cumulativeTotalPremiumUSD.plus(amountUSD);
      break;
    case EventType.Settle:
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
  amountChange: BigInt,
  eventType: EventType
): void {
  const collateralToken = getOrCreateToken(
    event,
    Address.fromBytes(pool.inputTokens[0])
  );
  const inputTokenBalances = pool.inputTokenBalances;
  switch (eventType) {
    case EventType.Deposit:
    case EventType.Purchase:
      inputTokenBalances[0] = inputTokenBalances[0].plus(amountChange);
      break;
    case EventType.Withdraw:
    case EventType.Settle:
      inputTokenBalances[0] = inputTokenBalances[0].minus(amountChange);
      break;
    default:
      break;
  }
  pool.inputTokenBalances = inputTokenBalances;

  const prevPoolTVL = pool.totalValueLockedUSD;
  pool.totalValueLockedUSD = convertTokenToDecimal(
    pool.inputTokenBalances[0],
    collateralToken.decimals
  ).times(collateralToken.lastPriceUSD!);
  const tvlChangeUSD = pool.totalValueLockedUSD.minus(prevPoolTVL);

  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  updateProtocolTVL(event, tvlChangeUSD);
}

export function updatePoolOpenInterestUSD(
  event: ethereum.Event,
  pool: LiquidityPool,
  amountChangeUSD: BigDecimal,
  isIncrease: boolean
): void {
  if (isIncrease) {
    pool.openInterestUSD = pool.openInterestUSD.plus(amountChangeUSD);
  } else {
    pool.openInterestUSD = pool.openInterestUSD.minus(amountChangeUSD);
  }

  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  updateProtocolOpenInterestUSD(event, amountChangeUSD, isIncrease);
}

export function updatePoolOpenPositionCount(
  event: ethereum.Event,
  pool: LiquidityPool,
  isIncrease: boolean
): void {
  if (isIncrease) {
    pool.openPositionCount += INT_ONE;
  } else {
    pool.openPositionCount -= INT_ONE;
    pool.closedPositionCount += INT_ONE;
  }

  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  updateProtocolOpenPositionCount(event, isIncrease);
}

export function incrementPoolEventCount(
  event: ethereum.Event,
  pool: LiquidityPool,
  eventType: EventType
): void {
  const isPut = pool._isPut;
  switch (eventType) {
    case EventType.Deposit:
      if (isPut) {
        pool.putsMintedCount += INT_ONE;
      } else {
        pool.callsMintedCount += INT_ONE;
      }
      pool.contractsMintedCount += INT_ONE;
      break;
    case EventType.Withdraw:
      pool.contractsExpiredCount += INT_ONE;
      pool.contractsClosedCount += INT_ONE;
      break;
    case EventType.Purchase:
      pool.contractsTakenCount += INT_ONE;
      break;
    case EventType.Settle:
      pool.contractsExercisedCount += INT_ONE;
      break;
    default:
      break;
  }
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  incrementProtocolEventCount(event, eventType, isPut);
}

export function increasePoolInputTokenBalance(
  event: ethereum.Event,
  pool: LiquidityPool,
  inputToken: Token,
  inputTokenAmount: BigInt,
  isIncrease: boolean
): void {
  const inputTokens = pool.inputTokens;
  const inputTokenBalances = pool.inputTokenBalances;
  const inputTokenIndex = inputTokens.indexOf(inputToken.id);
  if (inputTokenIndex >= 0) {
    if (isIncrease) {
      inputTokenBalances[inputTokenIndex] =
        inputTokenBalances[inputTokenIndex].plus(inputTokenAmount);
    } else {
      inputTokenBalances[inputTokenIndex] =
        inputTokenBalances[inputTokenIndex].minus(inputTokenAmount);
    }
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
  newTokensPerDay: BigInt,
  newTokensPerDayUSD: BigDecimal
): void {
  const rewardTokens = pool.rewardTokens!;
  const rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount!;
  const rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD!;

  const rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);
  if (rewardTokenIndex >= 0) {
    rewardTokenEmissionsAmount[rewardTokenIndex] = newTokensPerDay;
    rewardTokenEmissionsUSD[rewardTokenIndex] = newTokensPerDayUSD;
  } else {
    rewardTokens.push(rewardToken.id);
    rewardTokenEmissionsAmount.push(newTokensPerDay);
    rewardTokenEmissionsUSD.push(newTokensPerDayUSD);
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

export function increasePoolProtocolSideRevenue(
  event: ethereum.Event,
  pool: LiquidityPool,
  amountChangeUSD: BigDecimal
): void {
  pool.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD.plus(amountChangeUSD);
  // Pool total revenue
  pool.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD.plus(amountChangeUSD);
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
  // Pool total revenue
  pool.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD.plus(amountChangeUSD);
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  increaseProtocolSupplySideRevenue(event, amountChangeUSD);
}

export function updatePoolCurrentEpoch(
  event: ethereum.Event,
  pool: LiquidityPool,
  epoch: BigInt
): void {
  pool._currentEpoch = epoch;
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();
}

export function updatePoolSnapshotDayID(
  pool: LiquidityPool,
  snapshotDayID: i32
): void {
  pool._lastSnapshotDayID = snapshotDayID;
  pool.save();
}

export function updatePoolSnapshotHourID(
  pool: LiquidityPool,
  snapshotHourID: i32
): void {
  pool._lastSnapshotHourID = snapshotHourID;
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

  return [tradingFee.id, protocolFee.id];
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
