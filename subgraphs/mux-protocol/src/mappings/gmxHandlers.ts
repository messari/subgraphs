import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { _ProxyMap } from "../../generated/schema";
import { CreateProxy } from "../../generated/ProxyFactory/ProxyFactory";
import {
  IncreasePosition,
  DecreasePosition,
  ClosePosition,
  LiquidatePosition,
  Vault,
} from "../../generated/Vault/Vault";
import { EventType } from "../entities/event";
import { getOrCreateToken, updateTokenPrice } from "../entities/token";
import {
  getOrCreateAccount,
  incrementAccountEventCount,
} from "../entities/account";
import {
  createPositionMap,
  getUserPosition,
  updatePositionRealisedPnlUSD,
} from "../entities/position";
import { incrementProtocolEventCount } from "../entities/protocol";
import { getOrCreateLiquidityPool, increasePoolVolume } from "../entities/pool";
import { takeSnapshots } from "../entities/snapshots";
import {
  BIGDECIMAL_ZERO,
  BIGINT_NEGONE,
  BIGINT_ZERO,
  PositionSide,
  GMX_PRICE_DECIMALS,
  GMX_POOL_NAME,
  GMX_POOL_SYMBOL,
} from "../utils/constants";
import {
  bigDecimalToBigInt,
  convertToDecimal,
  exponentToBigDecimal,
} from "../utils/numbers";
import { handleUpdatePositionEvent } from "./handlers";

export function handleCreateProxyForGmx(event: CreateProxy): void {
  const proxyMap = new _ProxyMap(event.params.proxy);
  proxyMap.positionId = event.params.owner;
  proxyMap.save();
}

export function handleIncreasePosition(event: IncreasePosition): void {
  handleGmxUpdatePositionEvent(
    event,
    event.params.key,
    event.params.account,
    event.params.collateralToken,
    event.params.collateralDelta,
    event.params.indexToken,
    event.params.sizeDelta,
    event.params.price,
    event.params.isLong,
    EventType.CollateralIn,
    BIGINT_ZERO
  );
}

export function handleDecreasePosition(event: DecreasePosition): void {
  handleGmxUpdatePositionEvent(
    event,
    event.params.key,
    event.params.account,
    event.params.collateralToken,
    event.params.collateralDelta,
    event.params.indexToken,
    event.params.sizeDelta,
    event.params.price,
    event.params.isLong,
    EventType.CollateralOut,
    BIGINT_ZERO
  );
}

export function handleLiquidatePosition(event: LiquidatePosition): void {
  handleGmxUpdatePositionEvent(
    event,
    event.params.key,
    event.params.account,
    event.params.collateralToken,
    event.params.collateral,
    event.params.indexToken,
    event.params.size,
    event.params.markPrice,
    event.params.isLong,
    EventType.Liquidated,
    event.params.realisedPnl
  );
}

export function handleGmxUpdatePositionEvent(
  event: ethereum.Event,
  positionKey: Bytes,
  accountAddress: Address,
  collateralTokenAddress: Address,
  collateralDelta: BigInt,
  indexTokenAddress: Address,
  sizeDelta: BigInt,
  indexTokenPrice: BigInt,
  isLong: boolean,
  eventType: EventType,
  liqudateProfit: BigInt
): void {
  // For every trading being routed to GMX, MUX protocol creates a proxy address for the trader.
  // If the trader address from GMX contract does not exist in proxy address list in MUX protocol, the trading does not come from MUX protocol.
  const proxyMap = _ProxyMap.load(accountAddress);
  if (!proxyMap) {
    return;
  }

  const pool = getOrCreateLiquidityPool(
    event,
    event.address,
    GMX_POOL_NAME,
    GMX_POOL_SYMBOL
  );
  takeSnapshots(event, pool);

  const account = getOrCreateAccount(event, pool, accountAddress);
  incrementAccountEventCount(event, pool, account, eventType, sizeDelta);
  incrementProtocolEventCount(event, eventType, sizeDelta);

  const indexToken = getOrCreateToken(event, indexTokenAddress);
  updateTokenPrice(
    event,
    indexToken,
    convertToDecimal(indexTokenPrice, GMX_PRICE_DECIMALS)
  );
  const sizeUSDDelta = convertToDecimal(sizeDelta, GMX_PRICE_DECIMALS);
  const collateralToken = getOrCreateToken(event, collateralTokenAddress);
  const collateralUSDDelta = convertToDecimal(
    collateralDelta,
    GMX_PRICE_DECIMALS
  );
  let collateralAmountDelta = BIGINT_ZERO;
  if (
    collateralToken.lastPriceUSD &&
    collateralToken.lastPriceUSD! > BIGDECIMAL_ZERO
  ) {
    collateralAmountDelta = bigDecimalToBigInt(
      collateralUSDDelta
        .times(exponentToBigDecimal(collateralToken.decimals))
        .div(collateralToken.lastPriceUSD!)
    );
  }

  let positionSide = PositionSide.SHORT;
  if (isLong) {
    positionSide = PositionSide.LONG;
  }
  if (eventType == EventType.CollateralIn) {
    const existingPosition = getUserPosition(
      account,
      pool,
      collateralTokenAddress,
      indexTokenAddress,
      positionSide
    );
    if (!existingPosition) {
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

  let positionBalance = BIGINT_ZERO;
  let positionBalanceUSD = BIGDECIMAL_ZERO;
  let positionCollateralBalance = BIGINT_ZERO;
  let positionCollateralBalanceUSD = BIGDECIMAL_ZERO;
  const vaultContract = Vault.bind(event.address);
  const tryGetPosition = vaultContract.try_getPosition(
    Address.fromBytes(account.id),
    collateralTokenAddress,
    indexTokenAddress,
    isLong
  );
  if (!tryGetPosition.reverted) {
    positionBalanceUSD = convertToDecimal(
      tryGetPosition.value.getValue0(),
      GMX_PRICE_DECIMALS
    );
    positionCollateralBalanceUSD = convertToDecimal(
      tryGetPosition.value.getValue1(),
      GMX_PRICE_DECIMALS
    );

    const indexToken = getOrCreateToken(event, indexTokenAddress);
    if (indexToken.lastPriceUSD && indexToken.lastPriceUSD! > BIGDECIMAL_ZERO) {
      positionBalance = bigDecimalToBigInt(
        positionBalanceUSD
          .times(exponentToBigDecimal(indexToken.decimals))
          .div(indexToken.lastPriceUSD!)
      );
    }
    const collateralToken = getOrCreateToken(event, collateralTokenAddress);
    if (
      collateralToken.lastPriceUSD &&
      collateralToken.lastPriceUSD! > BIGDECIMAL_ZERO
    ) {
      positionCollateralBalance = bigDecimalToBigInt(
        positionCollateralBalanceUSD
          .times(exponentToBigDecimal(collateralToken.decimals))
          .div(collateralToken.lastPriceUSD!)
      );
    }
  }

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
    null,
    isLong,
    eventType,
    convertToDecimal(liqudateProfit, GMX_PRICE_DECIMALS)
  );
}

export function handleClosePosition(event: ClosePosition): void {
  const pool = getOrCreateLiquidityPool(
    event,
    event.address,
    GMX_POOL_NAME,
    GMX_POOL_SYMBOL
  );
  takeSnapshots(event, pool);
  const realisedPnlUSD = convertToDecimal(
    event.params.realisedPnl,
    GMX_PRICE_DECIMALS
  );
  updatePositionRealisedPnlUSD(event.params.key, realisedPnlUSD);

  // For GMX, every closePosition action will emit both ClosePosition() and DecreasePosition() event.
  // Most of pool volume computation has already been covered in DecreasePosition() event handler.
  // As there is not pnl in DecreasePosition() event parameters, here in ClosePosition() event handler
  // we just needs to cover the extra volumes when a users has a loss and has to use some of collateral to cover the loss.
  if (event.params.realisedPnl < BIGINT_ZERO) {
    increasePoolVolume(
      event,
      pool,
      BIGDECIMAL_ZERO,
      null,
      BIGINT_ZERO,
      BIGINT_NEGONE.toBigDecimal().times(realisedPnlUSD),
      EventType.ClosePosition
    );
  }
}
