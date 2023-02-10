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
import { Vault } from "../../generated/Vault/Vault";
import { NetworkConfigs } from "../../configurations/configure";
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
} from "./protocol";
import { getOrCreateToken, updateTokenPrice } from "./token";
import {
  BIGDECIMAL_ZERO,
  INT_ZERO,
  BIGINT_ZERO,
  PositionSide,
  INT_ONE,
  LiquidityPoolFeeType,
  BIGDECIMAL_THOUSAND,
} from "../utils/constants";
import { convertTokenToDecimal, multiArraySort } from "../utils/numbers";
import { enumToPrefix } from "../utils/strings";

export function getOrCreateLiquidityPool(event: ethereum.Event): LiquidityPool {
  const protocol = getOrCreateProtocol();
  const poolAddress = NetworkConfigs.getVaultAddress();
  let pool = LiquidityPool.load(poolAddress);

  if (!pool) {
    pool = new LiquidityPool(poolAddress);

    // Metadata
    pool.protocol = protocol.id;
    pool.name = "GMXVault";
    pool.symbol = "VAULT";
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
    pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    pool.cumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;

    pool.cumulativeUniqueBorrowers = INT_ZERO;
    pool.cumulativeUniqueLiquidators = INT_ZERO;
    pool.cumulativeUniqueLiquidatees = INT_ZERO;

    pool.openInterestUSD = BIGDECIMAL_ZERO;
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
    pool._cumulativeInflowVolumeUSD = BIGDECIMAL_ZERO;
    pool._cumulativeClosedInflowVolumeUSD = BIGDECIMAL_ZERO;
    pool._cumulativeOutflowVolumeUSD = BIGDECIMAL_ZERO;

    pool._fundingrate = [];
    pool._lastSnapshotDayID = INT_ZERO;
    pool._lastSnapshotHourID = INT_ZERO;
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
  amountUSD: BigDecimal,
  eventType: EventType
): void {
  switch (eventType) {
    case EventType.CollateralIn:
      pool._cumulativeInflowVolumeUSD =
        pool._cumulativeInflowVolumeUSD.plus(amountUSD);
      break;
    case EventType.CollateralOut:
      pool._cumulativeOutflowVolumeUSD =
        pool._cumulativeOutflowVolumeUSD.plus(amountUSD);
      break;
    case EventType.ClosePosition:
    case EventType.Liquidated:
      pool._cumulativeClosedInflowVolumeUSD =
        pool._cumulativeClosedInflowVolumeUSD.plus(amountUSD);
      break;

    default:
      break;
  }
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(amountUSD);
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  increaseProtocolVolume(event, amountUSD, eventType);
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
    pool.longPositionCount =
      pool.longPositionCount - INT_ONE >= INT_ZERO
        ? pool.longPositionCount - INT_ONE
        : INT_ZERO;
  } else {
    pool.shortPositionCount =
      pool.shortPositionCount - INT_ONE >= INT_ZERO
        ? pool.shortPositionCount - INT_ONE
        : INT_ZERO;
  }
  pool.openPositionCount =
    pool.openPositionCount - INT_ONE >= INT_ZERO
      ? pool.openPositionCount - INT_ONE
      : INT_ZERO;
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
  aumUSD: BigDecimal,
  outputTokenSupply: BigInt
): void {
  const prevPoolTVL = pool.totalValueLockedUSD;
  pool.totalValueLockedUSD = aumUSD;
  const tvlChangeUSD = pool.totalValueLockedUSD.minus(prevPoolTVL);

  pool.outputTokenSupply = outputTokenSupply;

  const outputToken = getOrCreateToken(
    event,
    Address.fromBytes(pool.outputToken!)
  );
  if (outputTokenSupply == BIGINT_ZERO) {
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  } else {
    pool.outputTokenPriceUSD = pool.totalValueLockedUSD.div(
      convertTokenToDecimal(outputTokenSupply, outputToken.decimals)
    );
  }
  pool.stakedOutputTokenAmount = pool.outputTokenSupply;

  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  updateTokenPrice(event, outputToken, pool.outputTokenPriceUSD!);

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

export function updatePoolInputTokenBalance(
  event: ethereum.Event,
  inputToken: Token,
  inputTokenAmount: BigInt,
  isIncrease: boolean
): void {
  const pool = getOrCreateLiquidityPool(event);

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
  } else {
    const inputTokenWeights = pool.inputTokenWeights;
    const fundingrates = pool._fundingrate;

    inputTokens.push(inputToken.id);
    inputTokenBalances.push(inputTokenAmount);
    fundingrates.push(BIGDECIMAL_ZERO);
    inputTokenWeights.push(BIGDECIMAL_ZERO);

    multiArraySort(inputTokens, inputTokenBalances, fundingrates);

    const vaultContract = Vault.bind(event.address);
    for (let i = 0; i < inputTokens.length; i++) {
      const tryTokenWeights = vaultContract.try_tokenWeights(
        Address.fromBytes(inputTokens[i])
      );
      if (tryTokenWeights.reverted) {
        inputTokenWeights[i] = BIGDECIMAL_ZERO;
      } else {
        inputTokenWeights[i] =
          tryTokenWeights.value.divDecimal(BIGDECIMAL_THOUSAND);
      }
    }

    pool._fundingrate = fundingrates;
    pool.inputTokenWeights = inputTokenWeights;
  }

  pool.inputTokens = inputTokens;
  pool.inputTokenBalances = inputTokenBalances;

  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();
}

export function updatePoolRewardToken(
  event: ethereum.Event,
  rewardToken: RewardToken,
  tokensPerDay: BigInt,
  tokensPerDayUSD: BigDecimal
): void {
  const pool = getOrCreateLiquidityPool(event);
  const rewardTokens = pool.rewardTokens!;
  const rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount!;
  const rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD!;

  const rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);
  if (rewardTokenIndex >= 0) {
    rewardTokenEmissionsAmount[rewardTokenIndex] =
      rewardTokenEmissionsAmount[rewardTokenIndex].plus(tokensPerDay);
    rewardTokenEmissionsUSD[rewardTokenIndex] =
      rewardTokenEmissionsUSD[rewardTokenIndex].plus(tokensPerDayUSD);
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
  fundingToken: Token,
  fundingrate: BigDecimal
): void {
  const pool = getOrCreateLiquidityPool(event);
  const fundingTokens = pool.inputTokens;
  const fundingrates = pool._fundingrate;
  const fundingTokenIndex = fundingTokens.indexOf(fundingToken.id);
  if (fundingTokenIndex >= 0) {
    fundingrates[fundingTokenIndex] = fundingrate;
  }
  pool._fundingrate = fundingrates;
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();
}

export function increasePoolTotalRevenue(
  event: ethereum.Event,
  amountChangeUSD: BigDecimal
): void {
  const pool = getOrCreateLiquidityPool(event);
  pool.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD.plus(amountChangeUSD);
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  increaseProtocolTotalRevenue(event, amountChangeUSD);
}

export function increasePoolProtocolSideRevenue(
  event: ethereum.Event,
  amountChangeUSD: BigDecimal
): void {
  const pool = getOrCreateLiquidityPool(event);
  pool.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD.plus(amountChangeUSD);
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  increaseProtocolSideRevenue(event, amountChangeUSD);
}

export function increasePoolSupplySideRevenue(
  event: ethereum.Event,
  amountChangeUSD: BigDecimal
): void {
  const pool = getOrCreateLiquidityPool(event);
  pool.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD.plus(amountChangeUSD);
  pool._lastUpdateTimestamp = event.block.timestamp;
  pool.save();

  // Protocol
  increaseProtocolSupplySideRevenue(event, amountChangeUSD);
}

export function updatePoolSnapshotDayID(
  event: ethereum.Event,
  snapshotDayID: i32
): void {
  const pool = getOrCreateLiquidityPool(event);
  pool._lastSnapshotDayID = snapshotDayID;
  pool.save();
}

export function updatePoolSnapshotHourID(
  event: ethereum.Event,
  snapshotHourID: i32
): void {
  const pool = getOrCreateLiquidityPool(event);
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
