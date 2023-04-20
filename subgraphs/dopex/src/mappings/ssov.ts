import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Bootstrap,
  Deposit,
  Purchase,
  Settle,
  Ssov,
  Withdraw,
} from "../../generated/BasicWeeklyCalls/Ssov";
import { updateRewards } from "./stakingStrategy";
import {
  getOrCreateLiquidityPool,
  updatePoolTvl,
  updatePoolOpenInterestUSD,
  incrementPoolEventCount,
  increasePoolPremium,
  increasePoolVolume,
  increasePoolProtocolSideRevenue,
  updatePoolCurrentEpoch,
} from "../entities/pool";
import { createDeposit, createWithdraw, EventType } from "../entities/event";
import {
  getOrCreateAccount,
  incrementAccountEventCount,
} from "../entities/account";
import { getOrCreateToken, updateTokenPrice } from "../entities/token";
import { closeUserPosition, createUserPosition } from "../entities/position";
import { takeSnapshots, updateTempUsageMetrics } from "../entities/snapshots";
import { convertTokenToDecimal } from "../utils/numbers";
import { BIGINT_ZERO, OptionType, PRICE_PRECISION } from "../utils/constants";
import { createOption } from "../entities/option";

export function handleDeposit(event: Deposit): void {
  handleUpdateLiquidityEvent(
    event,
    event.params.sender,
    event.params.tokenId,
    EventType.Deposit,
    BIGINT_ZERO
  );
}

export function handleWithdraw(event: Withdraw): void {
  handleUpdateLiquidityEvent(
    event,
    event.params.sender,
    event.params.tokenId,
    EventType.Withdraw,
    event.params.collateralTokenWithdrawn
  );
}

function handleUpdateLiquidityEvent(
  event: ethereum.Event,
  sender: Address,
  tokenId: BigInt,
  eventType: EventType,
  collateralTokenWithdrawn: BigInt
): void {
  takeSnapshots(event, event.address);

  const account = getOrCreateAccount(event, sender);
  const pool = getOrCreateLiquidityPool(event, event.address);
  incrementAccountEventCount(event, account, eventType, pool._isPut);
  incrementPoolEventCount(event, pool, eventType);

  const inputTokenAddress = Address.fromBytes(pool.inputTokens[0]);
  const ssoveContract = Ssov.bind(event.address);
  let amountChange = BIGINT_ZERO;

  if (eventType == EventType.Deposit) {
    const tryCurrentEpoch = ssoveContract.try_currentEpoch();
    const tryAddresses = ssoveContract.try_addresses();
    if (!tryCurrentEpoch.reverted && !tryAddresses.reverted) {
      if (tryCurrentEpoch.value != pool._currentEpoch!) {
        updatePoolCurrentEpoch(event, pool, tryCurrentEpoch.value);
        updateRewards(
          event,
          pool,
          tryCurrentEpoch.value,
          tryAddresses.value.getStakingStrategy()
        );
      }
    }

    const tryWritePosition = ssoveContract.try_writePosition(tokenId);
    if (!tryWritePosition.reverted) {
      amountChange = tryWritePosition.value.getCollateralAmount();
    }
    createDeposit(event, pool, sender, inputTokenAddress, amountChange);
  } else if (eventType == EventType.Withdraw) {
    amountChange = collateralTokenWithdrawn;
    createWithdraw(event, pool, sender, inputTokenAddress, amountChange);
  }

  const collateralToken = getOrCreateToken(event, inputTokenAddress);
  const tryGetCollateralPrice = ssoveContract.try_getCollateralPrice();
  if (!tryGetCollateralPrice.reverted) {
    const collateralPrice =
      tryGetCollateralPrice.value.divDecimal(PRICE_PRECISION);
    updateTokenPrice(event, collateralToken, collateralPrice);
  }
  const amountChangeUSD = convertTokenToDecimal(
    amountChange,
    collateralToken.decimals
  ).times(collateralToken.lastPriceUSD!);

  increasePoolVolume(
    event,
    pool,
    BIGINT_ZERO,
    amountChangeUSD,
    amountChange,
    amountChangeUSD,
    eventType
  );
  updatePoolTvl(event, pool, amountChange, eventType);
  updateTempUsageMetrics(event, sender, eventType);
}

export function handlePurchase(event: Purchase): void {
  handleUpdatePositionEvent(
    event,
    event.params.sender,
    event.params.epoch,
    event.params.amount,
    event.params.strike,
    event.params.premium,
    BIGINT_ZERO,
    event.params.fee,
    EventType.Purchase
  );
}

export function handleSettle(event: Settle): void {
  handleUpdatePositionEvent(
    event,
    event.params.sender,
    event.params.epoch,
    event.params.amount,
    event.params.strike,
    BIGINT_ZERO,
    event.params.pnl,
    event.params.fee,
    EventType.Settle
  );
}

export function handleUpdatePositionEvent(
  event: ethereum.Event,
  accountAddress: Address,
  epoch: BigInt,
  optionAmount: BigInt,
  optionStikePrice: BigInt,
  purchasePremiumAmount: BigInt,
  settlePnLAmount: BigInt,
  feeAmount: BigInt,
  eventType: EventType
): void {
  takeSnapshots(event, event.address);

  const account = getOrCreateAccount(event, accountAddress);
  const pool = getOrCreateLiquidityPool(event, event.address);
  incrementAccountEventCount(event, account, eventType, pool._isPut);
  incrementPoolEventCount(event, pool, eventType);

  const sizeUSDDelta = convertTokenToDecimal(optionAmount).times(
    optionStikePrice.divDecimal(PRICE_PRECISION)
  );
  const collateralToken = getOrCreateToken(
    event,
    Address.fromBytes(pool.inputTokens[0])
  );
  const ssoveContract = Ssov.bind(event.address);
  const tryGetCollateralPrice = ssoveContract.try_getCollateralPrice();
  if (!tryGetCollateralPrice.reverted) {
    const collateralPrice =
      tryGetCollateralPrice.value.divDecimal(PRICE_PRECISION);
    updateTokenPrice(event, collateralToken, collateralPrice);
  }
  const feeUSD = convertTokenToDecimal(
    feeAmount,
    collateralToken.decimals
  ).times(collateralToken.lastPriceUSD!);

  increasePoolProtocolSideRevenue(event, pool, feeUSD);
  updateTempUsageMetrics(event, accountAddress, eventType);

  let optionType = OptionType.CALL;
  if (pool._isPut) {
    optionType = OptionType.PUT;
  }
  if (eventType == EventType.Purchase) {
    const purchasePremiumUSD = convertTokenToDecimal(
      purchasePremiumAmount,
      collateralToken.decimals
    ).times(collateralToken.lastPriceUSD!);
    createUserPosition(
      event,
      account,
      pool,
      epoch,
      optionAmount,
      optionStikePrice,
      purchasePremiumUSD,
      optionType
    );
    increasePoolPremium(event, pool, purchasePremiumUSD, eventType);
    increasePoolVolume(
      event,
      pool,
      optionAmount,
      sizeUSDDelta,
      purchasePremiumAmount,
      purchasePremiumUSD,
      eventType
    );
    updatePoolTvl(event, pool, purchasePremiumAmount, eventType);
    updatePoolOpenInterestUSD(event, pool, sizeUSDDelta, true);
  } else if (eventType == EventType.Settle) {
    const settlePnLUSD = convertTokenToDecimal(
      settlePnLAmount,
      collateralToken.decimals
    ).times(collateralToken.lastPriceUSD!);
    closeUserPosition(
      event,
      account,
      pool,
      epoch,
      optionStikePrice,
      optionType
    );
    increasePoolVolume(
      event,
      pool,
      optionAmount,
      sizeUSDDelta,
      settlePnLAmount,
      settlePnLUSD,
      eventType
    );
    updatePoolTvl(event, pool, settlePnLAmount, eventType);
    updatePoolOpenInterestUSD(event, pool, sizeUSDDelta, false);
  }
}

export function handleBootstrap(event: Bootstrap): void {
  takeSnapshots(event, event.address);

  const pool = getOrCreateLiquidityPool(event, event.address);
  for (let i = 0; i < event.params.strikes.length; i++) {
    const ssoveContract = Ssov.bind(event.address);
    const tryGetEpochStrikeData = ssoveContract.try_getEpochStrikeData(
      event.params.epoch,
      event.params.strikes[i]
    );
    if (!tryGetEpochStrikeData.reverted) {
      const strikeTokenAddress = tryGetEpochStrikeData.value.strikeToken;
      createOption(
        event,
        pool,
        event.params.epoch,
        event.params.strikes[i],
        strikeTokenAddress
      );
    }
  }
}
