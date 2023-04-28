import { Address, Bytes, ethereum, BigInt } from "@graphprotocol/graph-ts";

import {
  getOrCreateAccount,
  getOrCreatePool,
  initializeSDK,
} from "../common/initializers";
import * as constants from "../common/constants";
import * as utils from "../common/utils";
import { bigDecimalToBigInt, exponentToBigDecimal } from "../sdk/util/numbers";
import { Account } from "../sdk/protocols/perpfutures/account";
import { Position } from "../sdk/protocols/perpfutures/position";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { Vault } from "../../generated/Vault/Vault";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";
import { increasePoolVolume } from "./volume";
import { updatePoolOpenInterestUSD } from "./interest";

export function handleUpdatePositionEvent(
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
  const account = getOrCreateAccount(event, accountAddress);
  const sdk = initializeSDK(event);

  const pool = getOrCreatePool(event);
  const indexToken = sdk.Tokens.getOrCreateToken(indexTokenAddress);
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
    event,
    positionKey,
    account,
    pool,
    collateralTokenAddress,
    indexTokenAddress,
    positionSide,
    transactionType
  );

  pool.addUsdPremium(
    utils.bigIntToBigDecimal(fee, constants.PRICE_PRECISION_DECIMALS),
    transactionType
  );

  increasePoolVolume(
    event,
    pool,
    sizeUSDDelta,
    collateralTokenAddress,
    collateralTokenAmountDelta,
    collateralUSDDelta,
    transactionType
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

    getOrCreateAccount(event, event.transaction.from);
  }
}

export function updateUserPosition(
  event: ethereum.Event,
  positionKey: Bytes,
  account: Account,
  pool: Pool,
  collateralTokenAddress: Address,
  indexTokenAddress: Address,
  positionSide: string,
  transactionType: TransactionType
): Position {
  const sdk = initializeSDK(event);
  const indexToken = sdk.Tokens.getOrCreateToken(indexTokenAddress);
  const collateralToken = sdk.Tokens.getOrCreateToken(collateralTokenAddress);
  const position = sdk.Positions.loadPosition(
    pool,
    account,
    indexToken,
    collateralToken,
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
  const vaultContract = Vault.bind(Address.fromBytes(constants.POOL_ADDRESS));
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
