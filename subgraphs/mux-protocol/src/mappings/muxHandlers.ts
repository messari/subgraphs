import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  AddAsset,
  SetAssetSymbol,
  ClosePosition1 as ClosePositionOld,
  OpenPosition1 as OpenPositionOld,
  ClosePosition,
  OpenPosition,
  UpdateFundingRate,
  AddLiquidity,
  RemoveLiquidity,
  Liquidate,
  Liquidate1 as LiquidateOld,
  LiquidityPool,
} from "../../generated/LiquidityPool/LiquidityPool";
import {
  FeeDistributor,
  Distribute as FeeDistribute,
  NotifyReward as NotifyFeeReward,
} from "../../generated/LiquidityPool/FeeDistributor";
import {
  MuxDistributor,
  SetRewardRate as SetMuxRewardRate,
} from "../../generated/LiquidityPool/MuxDistributor";
import { NetworkConfigs } from "../../configurations/configure";
import { handleUpdatePositionEvent } from "./handlers";
import { createDeposit, createWithdraw, EventType } from "../entities/event";
import {
  getOrCreateMuxAsset,
  getOrCreateRewardToken,
  getOrCreateToken,
  updateTokenPrice,
} from "../entities/token";
import {
  getOrCreateAccount,
  incrementAccountEventCount,
} from "../entities/account";
import { createPositionMap, getUserPosition } from "../entities/position";
import { incrementProtocolEventCount } from "../entities/protocol";
import {
  getOrCreateLiquidityPool,
  increasePoolTotalRevenue,
  increasePoolProtocolSideRevenue,
  increasePoolSupplySideRevenue,
  increasePoolPremium,
  updatePoolInputTokenBalance,
  updatePoolFundingRate,
  updatePoolTvl,
  updatePoolOutputToken,
  updatePoolRewardToken,
  increasePoolStakeSideRevenue,
} from "../entities/pool";
import { takeSnapshots, updateTempUsageMetrics } from "../entities/snapshots";
import {
  BIGDECIMAL_ZERO,
  BIGINT_NEGONE,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  INT_ZERO,
  PositionSide,
  RewardTokenType,
  SECONDS_PER_DAY,
  MUX_FUNDING_DECIMALS,
  MUX_POOL_NAME,
  MUX_POOL_SYMBOL,
} from "../utils/constants";
import {
  bigDecimalToBigInt,
  convertToDecimal,
  exponentToBigDecimal,
} from "../utils/numbers";

export function handleAddAsset(event: AddAsset): void {
  const pool = getOrCreateLiquidityPool(
    event,
    event.address,
    MUX_POOL_NAME,
    MUX_POOL_SYMBOL
  );
  takeSnapshots(event, pool);

  const asset = getOrCreateMuxAsset(event.params.id);
  asset.isStable = event.params.isStable;
  asset.tokenAddress = event.params.tokenAddress;
  asset.muxTokenAddress = event.params.muxTokenAddress;
  asset.timestamp = event.block.timestamp;
  asset.save();

  const token = getOrCreateToken(event, event.params.tokenAddress);
  token.symbol = event.params.symbol.toString();
  token.decimals = event.params.decimals;
  token.save();
}

export function handleSetAssetSymbol(event: SetAssetSymbol): void {
  const pool = getOrCreateLiquidityPool(
    event,
    event.address,
    MUX_POOL_NAME,
    MUX_POOL_SYMBOL
  );
  takeSnapshots(event, pool);

  const asset = getOrCreateMuxAsset(event.params.assetId);
  const token = getOrCreateToken(event, Address.fromBytes(asset.tokenAddress));
  token.symbol = event.params.symbol.toString();
  token.save();
}

export function handleUpdateFundingRate(event: UpdateFundingRate): void {
  const pool = getOrCreateLiquidityPool(
    event,
    event.address,
    MUX_POOL_NAME,
    MUX_POOL_SYMBOL
  );
  takeSnapshots(event, pool);

  const asset = getOrCreateMuxAsset(event.params.tokenId);
  const token = getOrCreateToken(event, Address.fromBytes(asset.tokenAddress));
  updatePoolFundingRate(
    event,
    pool,
    token,
    convertToDecimal(event.params.longFundingRate, MUX_FUNDING_DECIMALS)
  );
}

export function handleOpenPositionOld(event: OpenPositionOld): void {
  handleMuxUpdatePositionEvent(
    event,
    event.params.args.subAccountId,
    event.params.trader,
    event.params.args.collateralId,
    event.params.args.collateralPrice,
    BIGINT_ZERO,
    event.params.assetId,
    event.params.args.amount,
    event.params.args.assetPrice,
    event.params.args.feeUsd,
    event.params.args.isLong,
    EventType.CollateralIn,
    BIGINT_ZERO
  );
}

export function handleOpenPosition(event: OpenPosition): void {
  handleMuxUpdatePositionEvent(
    event,
    event.params.args.subAccountId,
    event.params.trader,
    event.params.args.collateralId,
    event.params.args.collateralPrice,
    event.params.args.remainCollateral,
    event.params.assetId,
    event.params.args.amount,
    event.params.args.assetPrice,
    event.params.args.feeUsd,
    event.params.args.isLong,
    EventType.CollateralIn,
    BIGINT_ZERO
  );
}

export function handleClosePositionOld(event: ClosePositionOld): void {
  handleMuxUpdatePositionEvent(
    event,
    event.params.args.subAccountId,
    event.params.trader,
    event.params.args.collateralId,
    event.params.args.collateralPrice,
    BIGINT_ZERO,
    event.params.assetId,
    event.params.args.amount,
    event.params.args.assetPrice,
    event.params.args.feeUsd,
    event.params.args.isLong,
    EventType.CollateralOut,
    event.params.args.pnlUsd
  );
}

export function handleClosePosition(event: ClosePosition): void {
  handleMuxUpdatePositionEvent(
    event,
    event.params.args.subAccountId,
    event.params.trader,
    event.params.args.collateralId,
    event.params.args.collateralPrice,
    event.params.args.remainCollateral,
    event.params.assetId,
    event.params.args.amount,
    event.params.args.assetPrice,
    event.params.args.feeUsd,
    event.params.args.isLong,
    EventType.CollateralOut,
    event.params.args.pnlUsd
  );
}

export function handleLiquidatePositionOld(event: LiquidateOld): void {
  handleMuxUpdatePositionEvent(
    event,
    event.params.args.subAccountId,
    event.params.trader,
    event.params.args.collateralId,
    event.params.args.collateralPrice,
    BIGINT_ZERO,
    event.params.assetId,
    event.params.args.amount,
    event.params.args.assetPrice,
    event.params.args.feeUsd,
    event.params.args.isLong,
    EventType.Liquidated,
    event.params.args.pnlUsd
  );
}

export function handleLiquidatePosition(event: Liquidate): void {
  handleMuxUpdatePositionEvent(
    event,
    event.params.args.subAccountId,
    event.params.trader,
    event.params.args.collateralId,
    event.params.args.collateralPrice,
    event.params.args.remainCollateral,
    event.params.assetId,
    event.params.args.amount,
    event.params.args.assetPrice,
    event.params.args.feeUsd,
    event.params.args.isLong,
    EventType.Liquidated,
    event.params.args.pnlUsd
  );
}

export function handleMuxUpdatePositionEvent(
  event: ethereum.Event,
  positionKey: Bytes,
  accountAddress: Address,
  collateralTokenId: i32,
  collateralTokenPrice: BigInt,
  collateralAmountRemain: BigInt,
  indexTokenId: i32,
  indexTokenAmoutDelta: BigInt,
  indexTokenPrice: BigInt,
  fee: BigInt,
  isLong: boolean,
  eventType: EventType,
  pnl: BigInt
): void {
  const pool = getOrCreateLiquidityPool(
    event,
    event.address,
    MUX_POOL_NAME,
    MUX_POOL_SYMBOL
  );
  takeSnapshots(event, pool);

  const account = getOrCreateAccount(event, pool, accountAddress);
  incrementAccountEventCount(
    event,
    pool,
    account,
    eventType,
    indexTokenAmoutDelta
  );
  incrementProtocolEventCount(event, eventType, indexTokenAmoutDelta);

  const indexTokenAddress = Address.fromBytes(
    getOrCreateMuxAsset(indexTokenId).tokenAddress
  );
  const indexToken = getOrCreateToken(event, indexTokenAddress);
  const indexTokenPriceUSD = convertToDecimal(indexTokenPrice);
  updateTokenPrice(event, indexToken, indexTokenPriceUSD);
  const sizeUSDDelta =
    convertToDecimal(indexTokenAmoutDelta).times(indexTokenPriceUSD);
  const collateralTokenAddress = Address.fromBytes(
    getOrCreateMuxAsset(collateralTokenId).tokenAddress
  );

  let positionSide = PositionSide.SHORT;
  if (isLong) {
    positionSide = PositionSide.LONG;
  }
  let prevCollateralTokenAmount = BIGINT_ZERO;
  if (eventType == EventType.CollateralIn) {
    const existingPosition = getUserPosition(
      account,
      pool,
      collateralTokenAddress,
      indexTokenAddress,
      positionSide
    );
    if (existingPosition) {
      prevCollateralTokenAmount = existingPosition.collateralBalance;
    } else {
      createPositionMap(
        positionKey,
        account,
        pool,
        collateralTokenAddress,
        indexTokenAddress,
        positionSide
      );
    }
  }

  const collateralToken = getOrCreateToken(event, collateralTokenAddress);
  let collateralAmountDelta = collateralAmountRemain.minus(
    prevCollateralTokenAmount
  );
  if (collateralAmountDelta < BIGINT_ZERO) {
    collateralAmountDelta = collateralAmountDelta.times(BIGINT_NEGONE);
  }
  const collateralTokenPriceUSD = convertToDecimal(collateralTokenPrice);
  updateTokenPrice(event, collateralToken, collateralTokenPriceUSD);
  const collateralUSDDelta = convertToDecimal(collateralAmountDelta).times(
    collateralTokenPriceUSD
  );
  const pnlUSD = convertToDecimal(pnl);

  let positionBalance = BIGINT_ZERO;
  let positionBalanceUSD = BIGDECIMAL_ZERO;
  let positionCollateralBalance = BIGINT_ZERO;
  let positionCollateralBalanceUSD = BIGDECIMAL_ZERO;
  const poolContract = LiquidityPool.bind(event.address);
  const tryGetSubAccount = poolContract.try_getSubAccount(positionKey);
  if (!tryGetSubAccount.reverted) {
    positionBalance = bigDecimalToBigInt(
      tryGetSubAccount.value
        .getSize()
        .divDecimal(
          exponentToBigDecimal(DEFAULT_DECIMALS - indexToken.decimals)
        )
    );
    positionBalanceUSD = convertToDecimal(
      tryGetSubAccount.value.getSize()
    ).times(indexTokenPriceUSD);

    positionCollateralBalance = bigDecimalToBigInt(
      tryGetSubAccount.value
        .getCollateral()
        .divDecimal(
          exponentToBigDecimal(DEFAULT_DECIMALS - collateralToken.decimals)
        )
    );
    positionCollateralBalanceUSD = convertToDecimal(
      tryGetSubAccount.value.getCollateral()
    ).times(collateralTokenPriceUSD);
  }

  increasePoolPremium(event, pool, convertToDecimal(fee), eventType);

  handleUpdatePositionEvent(
    event,
    pool,
    account,
    collateralToken,
    collateralAmountDelta,
    collateralUSDDelta,
    positionCollateralBalance,
    positionCollateralBalanceUSD,
    indexToken,
    sizeUSDDelta,
    positionBalance,
    positionBalanceUSD,
    pnlUSD,
    isLong,
    eventType,
    pnlUSD
  );
}

export function handleAddLiquidity(event: AddLiquidity): void {
  handleUpdateLiquidityEvent(
    event,
    event.params.trader,
    event.params.tokenId,
    event.params.tokenPrice,
    event.params.mlpAmount,
    event.params.mlpPrice,
    event.params.fee,
    EventType.Deposit
  );
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  handleUpdateLiquidityEvent(
    event,
    event.params.trader,
    event.params.tokenId,
    event.params.tokenPrice,
    event.params.mlpAmount,
    event.params.mlpPrice,
    event.params.fee,
    EventType.Withdraw
  );
}

function handleUpdateLiquidityEvent(
  event: ethereum.Event,
  accountAddress: Address,
  inputTokenId: i32,
  inputTokenPrice: BigInt,
  outputTokenAmount: BigInt,
  outputTokenPrice: BigInt,
  fee: BigInt,
  eventType: EventType
): void {
  const pool = getOrCreateLiquidityPool(
    event,
    event.address,
    MUX_POOL_NAME,
    MUX_POOL_SYMBOL
  );
  takeSnapshots(event, pool);

  const account = getOrCreateAccount(event, pool, accountAddress);
  incrementAccountEventCount(event, pool, account, eventType, BIGINT_ZERO);
  incrementProtocolEventCount(event, eventType, BIGINT_ZERO);

  const inputAsset = getOrCreateMuxAsset(inputTokenId);
  const inputTokenAddress = Address.fromBytes(inputAsset.tokenAddress);
  const inputToken = getOrCreateToken(event, inputTokenAddress);
  const inputTokenPriceUSD = convertToDecimal(inputTokenPrice);
  updateTokenPrice(event, inputToken, inputTokenPriceUSD);
  const usdAmount = convertToDecimal(outputTokenAmount, DEFAULT_DECIMALS).times(
    convertToDecimal(outputTokenPrice, DEFAULT_DECIMALS)
  );
  const inputTokenAmount = bigDecimalToBigInt(
    usdAmount
      .times(exponentToBigDecimal(inputToken.decimals))
      .div(inputTokenPriceUSD)
  );
  updatePoolInputTokenBalance(
    event,
    pool,
    inputToken,
    inputTokenAmount,
    eventType
  );

  if (eventType == EventType.Deposit) {
    if (!pool.outputToken) {
      updatePoolOutputToken(
        event,
        pool,
        Address.fromBytes(NetworkConfigs.getMUXLPAddress())
      );
    }

    createDeposit(
      event,
      pool,
      accountAddress,
      inputTokenAddress,
      inputTokenAmount,
      usdAmount,
      outputTokenAmount
    );
  } else if (eventType == EventType.Withdraw) {
    createWithdraw(
      event,
      pool,
      accountAddress,
      inputTokenAddress,
      inputTokenAmount,
      usdAmount,
      outputTokenAmount
    );
  }

  updatePoolTvl(event, pool, outputTokenAmount, outputTokenPrice, eventType);

  updateTempUsageMetrics(event, accountAddress, eventType, INT_ZERO, null);
}

export function handleNotifyFeeReward(event: NotifyFeeReward): void {
  const pool = getOrCreateLiquidityPool(
    event,
    Address.fromBytes(NetworkConfigs.getPoolAddress()),
    MUX_POOL_NAME,
    MUX_POOL_SYMBOL
  );
  takeSnapshots(event, pool);

  const feeDistributorContract = FeeDistributor.bind(event.address);
  const tryRewardToken = feeDistributorContract.try_rewardToken();
  if (tryRewardToken.reverted) {
    return;
  }
  const rewardTokenAddress = tryRewardToken.value;
  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  const tokensPerDay = event.params.rewardRate.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );
  const rewardToken = getOrCreateRewardToken(
    event,
    rewardTokenAddress,
    RewardTokenType.DEPOSIT.toString()
  );
  const token = getOrCreateToken(event, rewardTokenAddress);
  const tokensPerDayUSD = convertToDecimal(tokensPerDay, token.decimals).times(
    token.lastPriceUSD!
  );

  updatePoolRewardToken(
    event,
    pool,
    rewardToken,
    tokensPerDay,
    tokensPerDayUSD
  );
}

export function handleFeeDistribute(event: FeeDistribute): void {
  const pool = getOrCreateLiquidityPool(
    event,
    Address.fromBytes(NetworkConfigs.getPoolAddress()),
    MUX_POOL_NAME,
    MUX_POOL_SYMBOL
  );
  takeSnapshots(event, pool);

  const feeDistributorContract = FeeDistributor.bind(event.address);
  const tryRewardToken = feeDistributorContract.try_rewardToken();
  if (tryRewardToken.reverted) {
    return;
  }
  const token = getOrCreateToken(event, tryRewardToken.value);

  increasePoolTotalRevenue(
    event,
    pool,
    convertToDecimal(event.params.amount, token.decimals).times(
      token.lastPriceUSD!
    )
  );
  increasePoolSupplySideRevenue(
    event,
    pool,
    convertToDecimal(event.params.toMlpAmount, token.decimals).times(
      token.lastPriceUSD!
    )
  );
  increasePoolProtocolSideRevenue(
    event,
    pool,
    convertToDecimal(event.params.toPorAmount, token.decimals).times(
      token.lastPriceUSD!
    )
  );
  increasePoolStakeSideRevenue(
    event,
    pool,
    convertToDecimal(event.params.toMuxAmount, token.decimals).times(
      token.lastPriceUSD!
    )
  );
}

export function handleSetMuxRewardRate(event: SetMuxRewardRate): void {
  const pool = getOrCreateLiquidityPool(
    event,
    Address.fromBytes(NetworkConfigs.getPoolAddress()),
    MUX_POOL_NAME,
    MUX_POOL_SYMBOL
  );
  takeSnapshots(event, pool);

  const muxDistributorContract = MuxDistributor.bind(event.address);
  const tryRewardToken = muxDistributorContract.try_rewardToken();
  if (tryRewardToken.reverted) {
    return;
  }
  const rewardTokenAddress = tryRewardToken.value;
  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  const tokensPerDay = event.params.newRewardRate.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );
  const rewardToken = getOrCreateRewardToken(
    event,
    rewardTokenAddress,
    RewardTokenType.STAKE.toString()
  );
  const token = getOrCreateToken(event, rewardTokenAddress);
  const tokensPerDayUSD = convertToDecimal(tokensPerDay, token.decimals).times(
    token.lastPriceUSD!
  );

  updatePoolRewardToken(
    event,
    pool,
    rewardToken,
    tokensPerDay,
    tokensPerDayUSD
  );
}
