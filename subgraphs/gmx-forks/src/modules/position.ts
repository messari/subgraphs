import {
  getOrCreateAccount,
  getOrCreatePool,
  initializeSDK,
} from "../common/initializers";
import {
  Address,
  Bytes,
  ethereum,
  BigInt,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import * as utils from "../common/utils";
import { increasePoolVolume } from "./volume";
import * as constants from "../common/constants";
import { SDK } from "../sdk/protocols/perpfutures";
import { Vault } from "../../generated/Vault/Vault";
import { updatePoolOpenInterestUSD } from "./interest";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { Token, _PositionMap } from "../../generated/schema";
import { Account } from "../sdk/protocols/perpfutures/account";
import { Position } from "../sdk/protocols/perpfutures/position";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";
import { bigDecimalToBigInt, exponentToBigDecimal } from "../sdk/util/numbers";

export function updatePosition(
  event: ethereum.Event,
  positionKey: Bytes,
  accountAddress: Address,
  collateralTokenAddress: Address,
  collateralDelta: BigInt,
  indexTokenAddress: Address,
  sizeDelta: BigInt,
  indexTokenPrice: BigInt,
  fee: BigInt,
  isLong: boolean,
  transactionType: TransactionType,
  liqudateProfit: BigInt
): void {
  const sdk = initializeSDK(event);

  const pool = getOrCreatePool(sdk);
  const account = getOrCreateAccount(accountAddress, pool, sdk);
  const indexToken = sdk.Tokens.getOrCreateToken(indexTokenAddress);
  sdk.Tokens.updateTokenPrice(
    indexToken,
    utils.bigIntToBigDecimal(
      indexTokenPrice,
      constants.PRICE_PRECISION_DECIMALS
    ),
    event.block
  );
  const sizeUSDDelta = utils.bigIntToBigDecimal(
    sizeDelta,
    constants.PRICE_PRECISION_DECIMALS
  );
  const collateralToken = sdk.Tokens.getOrCreateToken(collateralTokenAddress);
  const collateralUSDDelta = utils.bigIntToBigDecimal(
    collateralDelta,
    constants.PRICE_PRECISION_DECIMALS
  );
  let collateralTokenAmountDelta = constants.BIGINT_ZERO;
  if (
    collateralToken.lastPriceUSD &&
    collateralToken.lastPriceUSD! > constants.BIGDECIMAL_ZERO
  ) {
    collateralTokenAmountDelta = bigDecimalToBigInt(
      collateralUSDDelta
        .times(exponentToBigDecimal(collateralToken.decimals))
        .div(collateralToken.lastPriceUSD!)
    );
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

  pool.addUsdPremium(
    utils.bigIntToBigDecimal(fee, constants.PRICE_PRECISION_DECIMALS),
    transactionType
  );

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
      utils.bigIntToBigDecimal(
        liqudateProfit,
        constants.PRICE_PRECISION_DECIMALS
      ),
      true
    );

    getOrCreateAccount(event.transaction.from, pool, sdk);
  }
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

  let isLong = true;
  if (position.position.side == constants.PositionSide.SHORT) {
    isLong = false;
  }

  const prevBalance = position.position.balance;
  const prevCollateralBalance = position.position.collateralBalance;
  const vaultContract = Vault.bind(Address.fromBytes(constants.VAULT_ADDRESS));
  const tryGetPosition = vaultContract.try_getPosition(
    Address.fromBytes(account.account.id),
    collateralTokenAddress,
    indexTokenAddress,
    isLong
  );
  if (!tryGetPosition.reverted) {
    const balanceUSD = utils.bigIntToBigDecimal(
      tryGetPosition.value.getValue0(),
      constants.PRICE_PRECISION_DECIMALS
    );
    const collateralBalanceUSD = utils.bigIntToBigDecimal(
      tryGetPosition.value.getValue1(),
      constants.PRICE_PRECISION_DECIMALS
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
