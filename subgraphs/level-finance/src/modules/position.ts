import {
  Address,
  Bytes,
  ethereum,
  BigInt,
  BigDecimal,
  log,
} from "@graphprotocol/graph-ts";
import * as utils from "../common/utils";
import { increasePoolVolume } from "./volume";
import * as constants from "../common/constants";
import { SDK } from "../sdk/protocols/perpfutures";
import { updatePoolOpenInterestUSD } from "./interest";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { getOrCreateAccount } from "../common/initializers";
import { Token, _PositionMap } from "../../generated/schema";
import { Account } from "../sdk/protocols/perpfutures/account";
import { Pool as PoolContract } from "../../generated/Pool/Pool";
import { Position } from "../sdk/protocols/perpfutures/position";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";
import { bigDecimalToBigInt, exponentToBigDecimal } from "../sdk/util/numbers";

export function updatePosition(
  event: ethereum.Event,
  positionKey: Bytes,
  accountAddress: Address,
  collateralTokenAddress: Address,
  collateralDelta: BigInt,
  isCollateralUSD: bool,
  indexTokenAddress: Address,
  sizeDelta: BigInt,
  indexTokenPrice: BigInt,
  fee: BigInt,
  isLong: boolean,
  transactionType: TransactionType,
  liqudateProfit: BigInt,
  sdk: SDK,
  pool: Pool
): void {
  const account = getOrCreateAccount(accountAddress, pool, sdk);
  const indexToken = sdk.Tokens.getOrCreateToken(indexTokenAddress);
  utils.checkAndUpdateInputTokens(pool, indexToken);

  sdk.Tokens.updateTokenPrice(
    indexToken,
    utils.bigIntToBigDecimal(
      indexTokenPrice,
      constants.VALUE_DECIMALS - indexToken.decimals
    ),
    event.block
  );
  const sizeUSDDelta = utils.bigIntToBigDecimal(
    sizeDelta,
    constants.VALUE_DECIMALS
  );
  const collateralToken = sdk.Tokens.getOrCreateToken(collateralTokenAddress);
  utils.checkAndUpdateInputTokens(pool, collateralToken);
  let collateralUSDDelta = constants.BIGDECIMAL_ZERO;

  let collateralTokenAmountDelta = constants.BIGINT_ZERO;
  if (
    collateralToken.lastPriceUSD &&
    collateralToken.lastPriceUSD! > constants.BIGDECIMAL_ZERO
  ) {
    if (isCollateralUSD) {
      collateralUSDDelta = utils.bigIntToBigDecimal(
        collateralDelta,
        constants.VALUE_DECIMALS
      );
      collateralTokenAmountDelta = bigDecimalToBigInt(
        collateralUSDDelta
          .times(exponentToBigDecimal(collateralToken.decimals))
          .div(collateralToken.lastPriceUSD!)
      );
      log.warning(
        "[positionUpdated] collateralDelta {} collateralUsdDelta {} collateralTokenAmountDelta {} collateralTokenDecimals {} token {} ",
        [
          collateralDelta.toString(),
          collateralUSDDelta.toString(),
          collateralTokenAmountDelta.toString(),
          collateralToken.decimals.toString(),
          collateralToken.name.toString(),
        ]
      );
    } else {
      collateralTokenAmountDelta = collateralDelta;
    }
  }

  const inputTokenAmounts = new Array<BigInt>(
    pool.getInputTokens().length
  ).fill(constants.BIGINT_ZERO);

  const inputTokenIndex = pool.getInputTokens().indexOf(collateralToken.id);
  if (inputTokenIndex >= 0) {
    inputTokenAmounts[inputTokenIndex] = collateralTokenAmountDelta;
  }

  let positionSide = constants.PositionSide.SHORT;
  if (isLong) {
    positionSide = constants.PositionSide.LONG;
  }
  //update position
  const position = updateUserPosition(
    positionKey,
    account,
    pool,
    collateralTokenAddress,
    indexTokenAddress,
    positionSide,
    transactionType,
    sdk
  );
  //update premium
  pool.addUsdPremium(
    utils.bigIntToBigDecimal(fee, constants.VALUE_DECIMALS),
    transactionType
  );
  //update volume
  increasePoolVolume(
    pool,
    sizeUSDDelta,
    collateralTokenAddress,
    collateralTokenAmountDelta,
    transactionType,
    constants.BIGDECIMAL_ZERO,
    false,
    sdk
  );

  const indexTokenIdx = pool
    .getInputTokens()
    .indexOf(Bytes.fromHexString(indexTokenAddress.toHexString()));

  const borrowedAssetAmountUSD = pool.pool._borrowedAssetsAmountUSD;

  if (transactionType == TransactionType.COLLATERAL_IN) {
    updatePoolOpenInterestUSD(pool, sizeUSDDelta, true, isLong);
    account.collateralIn(
      pool,
      position.getBytesID(),
      inputTokenAmounts,
      constants.BIGINT_ZERO,
      true
    );

    if (sizeUSDDelta > constants.BIGDECIMAL_ZERO) {
      let indexTokenAmountDelta = constants.BIGINT_ZERO;
      if (
        indexToken.lastPriceUSD &&
        indexToken.lastPriceUSD! > constants.BIGDECIMAL_ZERO
      ) {
        indexTokenAmountDelta = bigDecimalToBigInt(
          sizeUSDDelta
            .times(exponentToBigDecimal(indexToken.decimals))
            .div(indexToken.lastPriceUSD!)
        );
      }
      account.borrow(
        pool,
        position.getBytesID(),
        indexTokenAddress,
        indexTokenAmountDelta,
        true
      );
      borrowedAssetAmountUSD[indexTokenIdx] =
        borrowedAssetAmountUSD[indexTokenIdx].plus(sizeUSDDelta);
    }
  }
  if (transactionType == TransactionType.COLLATERAL_OUT) {
    updatePoolOpenInterestUSD(pool, sizeUSDDelta, false, isLong);
    account.collateralOut(
      pool,
      position.getBytesID(),
      inputTokenAmounts,
      constants.BIGINT_ZERO,
      true
    );

    borrowedAssetAmountUSD[indexTokenIdx] =
      borrowedAssetAmountUSD[indexTokenIdx].minus(sizeUSDDelta);
  }
  if (transactionType == TransactionType.LIQUIDATE) {
    updatePoolOpenInterestUSD(pool, sizeUSDDelta, false, isLong);
    account.liquidate(
      pool,
      indexTokenAddress,
      collateralTokenAddress,
      collateralTokenAmountDelta,
      event.transaction.from,
      accountAddress,
      position.getBytesID(),
      utils.bigIntToBigDecimal(liqudateProfit, constants.VALUE_DECIMALS),
      true
    );

    getOrCreateAccount(event.transaction.from, pool, sdk);

    borrowedAssetAmountUSD[indexTokenIdx] =
      borrowedAssetAmountUSD[indexTokenIdx].minus(sizeUSDDelta);
  }
  pool.setBorrowedAssetAmountUSD(borrowedAssetAmountUSD);
  pool.updateFundingRates();
}

export function updateUserPosition(
  positionKey: Bytes,
  account: Account,
  pool: Pool,
  collateralTokenAddress: Address,
  indexTokenAddress: Address,
  positionSide: string,
  transactionType: TransactionType,
  sdk: SDK
): Position {
  const indexToken = sdk.Tokens.getOrCreateToken(indexTokenAddress);
  const collateralToken = sdk.Tokens.getOrCreateToken(collateralTokenAddress);
  const position = sdk.Positions.loadPosition(
    positionKey,
    pool,
    account,
    indexToken,
    collateralToken,
    positionSide
  );
  createPositionMap(
    positionKey,
    Address.fromBytes(account.getBytesId()),
    pool,
    collateralToken,
    indexToken,
    positionSide
  );

  if (transactionType == TransactionType.COLLATERAL_IN) {
    position.addCollateralInCount();
  }
  if (transactionType == TransactionType.COLLATERAL_OUT) {
    position.addCollateralOutCount();
  }
  if (transactionType == TransactionType.LIQUIDATE) {
    position.addLiquidationCount();
  }

  const prevBalance = position.position.balance;
  const prevCollateralBalance = position.position.collateralBalance;
  const poolContract = PoolContract.bind(
    Address.fromBytes(constants.VAULT_ADDRESS)
  );
  const tryGetPosition = poolContract.try_positions(positionKey);
  if (!tryGetPosition.reverted) {
    const balanceUSD = utils.bigIntToBigDecimal(
      tryGetPosition.value.getSize(),
      constants.VALUE_DECIMALS
    );
    const collateralBalanceUSD = utils.bigIntToBigDecimal(
      tryGetPosition.value.getCollateralValue(),
      constants.VALUE_DECIMALS
    );

    if (
      indexToken.lastPriceUSD &&
      indexToken.lastPriceUSD! > constants.BIGDECIMAL_ZERO
    ) {
      const balance = bigDecimalToBigInt(
        balanceUSD
          .times(exponentToBigDecimal(indexToken.decimals))
          .div(indexToken.lastPriceUSD!)
      );
      position.setBalance(indexToken, balance);
    }
    if (
      collateralToken.lastPriceUSD &&
      collateralToken.lastPriceUSD! > constants.BIGDECIMAL_ZERO
    ) {
      const collateralBalance = bigDecimalToBigInt(
        collateralBalanceUSD
          .times(exponentToBigDecimal(collateralToken.decimals))
          .div(collateralToken.lastPriceUSD!)
      );
      position.setCollateralBalance(collateralToken, collateralBalance);
    }

    if (collateralBalanceUSD != constants.BIGDECIMAL_ZERO) {
      const leverage = balanceUSD.div(collateralBalanceUSD);
      position.setLeverage(leverage);
    }
  }

  if (position.position.balanceUSD == constants.BIGDECIMAL_ZERO) {
    const fundingTokenIndex = pool
      .getInputTokens()
      .indexOf(position.position.collateral);
    if (fundingTokenIndex >= 0) {
      position.setFundingrateClosed(pool.pool.fundingrate[fundingTokenIndex]);
    }
    position.setBalanceClosed(indexToken, prevBalance);
    position.setCollateralBalanceClosed(collateralToken, prevCollateralBalance);
    position.closePosition();
  }
  log.warning(
    "[UpdateUserPosition] positionKey {}  transactionType {} tryGetPosition.reverted {}",
    [
      positionKey.toHexString(),
      transactionType,
      tryGetPosition.reverted.toString(),
    ]
  );
  return position;
}

export function updatePositionRealisedPnlUSD(
  positionKey: Bytes,
  realisedPnlUSD: BigDecimal,
  pool: Pool,
  sdk: SDK
): void {
  const positionMap = _PositionMap.load(positionKey);
  if (!positionMap) {
    return;
  }
  const account = getOrCreateAccount(
    Address.fromString(positionMap.account),
    pool,
    sdk
  );
  const asset = sdk.Tokens.getOrCreateTokenFromBytes(positionMap.asset);
  const collateral = sdk.Tokens.getOrCreateTokenFromBytes(
    positionMap.collateral
  );

  const position = sdk.Positions.loadPosition(
    positionKey,
    pool,
    account,
    asset,
    collateral,
    positionMap.positionSide
  );
  position.setRealisedPnlUsd(realisedPnlUSD);
}

export function createPositionMap(
  positionKey: Bytes,
  account: Address,
  pool: Pool,
  collateralToken: Token,
  indexToken: Token,
  positionSide: string
): _PositionMap {
  const positionMap = new _PositionMap(positionKey);
  positionMap.account = account.toHexString();
  positionMap.pool = pool.getBytesID();
  positionMap.asset = indexToken.id;
  positionMap.collateral = collateralToken.id;
  positionMap.positionSide = positionSide;
  positionMap.save();

  return positionMap;
}
