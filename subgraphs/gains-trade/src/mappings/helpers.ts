import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

import { NetworkConfigs } from "../../configurations/configure";
import { PRECISION_BD } from "../common/constants";

import { Pool } from "../sdk/protocols/perpfutures/pool";
import { Account } from "../sdk/protocols/perpfutures/account";
import { Position } from "../sdk/protocols/perpfutures/position";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
} from "../sdk/util/constants";
import { bigDecimalToBigInt } from "../sdk/util/numbers";
import { getRewardsPerDay, RewardIntervalType } from "../sdk/util/rewards";

import { Token } from "../../generated/schema";
import { Storage } from "../../generated/Vault/Storage";
import { PairInfo } from "../../generated/Vault/PairInfo";
import { Vault } from "../../generated/Vault/Vault";
import { PairStorage } from "../../generated/Vault/PairStorage";

export function createTokenAmountArray(
  pool: Pool,
  tokens: Token[],
  amounts: BigInt[]
): BigInt[] {
  if (tokens.length != amounts.length) {
    return new Array<BigInt>();
  }

  const tokenAmounts = new Array<BigInt>(pool.getInputTokens().length).fill(
    BIGINT_ZERO
  );

  for (let idx = 0; idx < amounts.length; idx++) {
    const indexOfToken = pool.getInputTokens().indexOf(tokens[idx].id);
    tokenAmounts[indexOfToken] = amounts[idx];
  }

  return tokenAmounts;
}

class OpenInterest {
  long: BigInt;
  short: BigInt;

  constructor(long: BigInt, short: BigInt) {
    this.long = long;
    this.short = short;
  }
}

export function getPairOpenInterest(
  pairIndex: BigInt,
  event: ethereum.Event
): OpenInterest {
  const storageContract = Storage.bind(NetworkConfigs.getStorageAddress());
  const openInterestLongCall = storageContract.try_openInterestDai(
    pairIndex,
    BIGINT_ZERO
  );
  if (openInterestLongCall.reverted) {
    log.error("[openInterestLongCall reverted] hash: {} pairIndex: {}", [
      event.transaction.hash.toHexString(),
      pairIndex.toString(),
    ]);
    return new OpenInterest(BIGINT_ZERO, BIGINT_ZERO);
  }
  const openInterestLong = openInterestLongCall.value;

  const openInterestShortCall = storageContract.try_openInterestDai(
    pairIndex,
    BIGINT_ONE
  );
  if (openInterestShortCall.reverted) {
    log.error("[openInterestShortCall reverted] hash: {} pairIndex: {}", [
      event.transaction.hash.toHexString(),
      pairIndex.toString(),
    ]);
    return new OpenInterest(BIGINT_ZERO, BIGINT_ZERO);
  }
  const openInterestShort = openInterestShortCall.value;

  return new OpenInterest(openInterestLong, openInterestShort);
}

export function getFundingRate(
  pairIndex: BigInt,
  event: ethereum.Event
): BigDecimal {
  const pairInfoContract = PairInfo.bind(NetworkConfigs.getPairInfoAddress());
  const fundingRatePerBlockCall =
    pairInfoContract.try_getFundingFeePerBlockP(pairIndex);
  if (fundingRatePerBlockCall.reverted) {
    log.error(
      "[fundingRatePerBlockCall reverted]  hash: {} pairInfoContract: {} pairIndex: {}",
      [
        event.transaction.hash.toHexString(),
        NetworkConfigs.getPairInfoAddress().toHexString(),
        pairIndex.toString(),
      ]
    );
    return BIGDECIMAL_ZERO;
  }
  const fundingRatePerBlock = fundingRatePerBlockCall.value;
  const fundingRatePerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    fundingRatePerBlock.toBigDecimal(),
    RewardIntervalType.BLOCK
  ).div(PRECISION_BD);

  return fundingRatePerDay;
}

export function getSharesTransferred(
  collateralAmount: BigInt,
  event: ethereum.Event
): BigInt {
  const vaultContract = Vault.bind(NetworkConfigs.getVaultAddress());
  const sharesTransferredCall =
    vaultContract.try_convertToShares(collateralAmount);
  if (sharesTransferredCall.reverted) {
    log.error(
      "[sharesTransferredCall reverted] hash: {} collateralAmount: {}",
      [event.transaction.hash.toHexString(), collateralAmount.toString()]
    );
    return BIGINT_ZERO;
  }
  const sharesTransferred = sharesTransferredCall.value;

  return sharesTransferred;
}

export function openTrade(
  pool: Pool,
  account: Account,
  position: Position,
  pairIndex: BigInt,
  collateralToken: Token,
  collateralAmount: BigInt,
  leverage: BigInt,
  sharesTransferred: BigInt,
  fundingRatePerDay: BigDecimal,
  event: ethereum.Event
): void {
  const leveragedAmount = collateralAmount.times(leverage);
  pool.addInflowVolumeByToken(collateralToken, leveragedAmount);
  pool.addVolumeByToken(collateralToken, leveragedAmount);

  const pairStorageContract = PairStorage.bind(
    NetworkConfigs.getPairStorageAddress()
  );
  const openFeePCall = pairStorageContract.try_pairOpenFeeP(pairIndex);
  if (openFeePCall.reverted) {
    log.error("[openFeePCall reverted] hash: {} pairIndex: {}", [
      event.transaction.hash.toHexString(),
      pairIndex.toString(),
    ]);
    return;
  }
  const openFeeP = openFeePCall.value;
  const openingFee = bigDecimalToBigInt(
    leveragedAmount
      .times(openFeeP)
      .toBigDecimal()
      .div(PRECISION_BD.times(BIGDECIMAL_HUNDRED))
  );
  pool.addPremiumByToken(
    collateralToken,
    openingFee,
    TransactionType.COLLATERAL_IN
  );

  const positionID = position.getBytesID();
  const collateralAmounts = createTokenAmountArray(
    pool,
    [collateralToken],
    [collateralAmount]
  );
  account.collateralIn(pool, positionID, collateralAmounts, sharesTransferred);

  if (leverage > BIGINT_ONE) {
    account.borrow(
      pool,
      positionID,
      Address.fromBytes(collateralToken.id),
      leveragedAmount.minus(collateralAmount)
    );
  }

  position.setLeverage(leverage.toBigDecimal());
  position.setBalance(collateralToken, collateralAmount);
  position.setCollateralBalance(collateralToken, collateralAmount);
  position.addCollateralInCount();
  position.setFundingrateOpen(fundingRatePerDay);
}

export function closeTrade(
  pool: Pool,
  account: Account,
  position: Position,
  pairIndex: BigInt,
  collateralToken: Token,
  collateralAmount: BigInt,
  leverage: BigInt,
  sharesTransferred: BigInt,
  fundingRatePerDay: BigDecimal,
  percentProfit: BigInt,
  isExistingOpenPosition: boolean,
  event: ethereum.Event,
  isLiquidation: boolean,
  liquidator: Address | null = null,
  liquidatee: Address | null = null
): void {
  const leveragedAmount = collateralAmount.times(leverage);
  const pnl = collateralAmount
    .times(percentProfit)
    .toBigDecimal()
    .div(PRECISION_BD.times(BIGDECIMAL_HUNDRED));
  const pnlAmount = collateralAmount.plus(bigDecimalToBigInt(pnl));

  const pairStorageContract = PairStorage.bind(
    NetworkConfigs.getPairStorageAddress()
  );
  const closeFeePCall = pairStorageContract.try_pairCloseFeeP(pairIndex);
  if (closeFeePCall.reverted) {
    log.error("[closeFeePCall reverted] hash: {} pairIndex: {}", [
      event.transaction.hash.toHexString(),
      pairIndex.toString(),
    ]);
    return;
  }
  const closeFeeP = closeFeePCall.value;
  const closingFee = bigDecimalToBigInt(
    leveragedAmount
      .times(closeFeeP)
      .toBigDecimal()
      .div(PRECISION_BD.times(BIGDECIMAL_HUNDRED))
  );

  const positionID = position.getBytesID();
  position.setFundingrateClosed(fundingRatePerDay);
  position.closePosition(isExistingOpenPosition);

  if (isLiquidation) {
    if (percentProfit <= BIGINT_ZERO) {
      pool.addClosedInflowVolumeByToken(collateralToken, collateralAmount);
    }
    pool.addPremiumByToken(
      collateralToken,
      closingFee,
      TransactionType.LIQUIDATE
    );

    account.liquidate(
      pool,
      Address.fromBytes(collateralToken.id),
      Address.fromBytes(collateralToken.id),
      collateralAmount,
      liquidator!,
      liquidatee!,
      positionID,
      pnl
    );

    position.addLiquidationCount();
    position.setBalanceClosed(collateralToken, BIGINT_ZERO);
    position.setCollateralBalanceClosed(collateralToken, BIGINT_ZERO);
    position.setRealisedPnlClosed(collateralToken, bigDecimalToBigInt(pnl));
  } else {
    if (percentProfit <= BIGINT_ZERO) {
      pool.addClosedInflowVolumeByToken(
        collateralToken,
        collateralAmount.minus(pnlAmount)
      );
      pool.addOutflowVolumeByToken(collateralToken, pnlAmount);
      pool.addVolumeByToken(collateralToken, pnlAmount);

      position.setBalanceClosed(collateralToken, pnlAmount);
      position.setCollateralBalanceClosed(collateralToken, pnlAmount);
      position.setRealisedPnlClosed(collateralToken, bigDecimalToBigInt(pnl));
    } else {
      const leveragedPnlAmount = pnlAmount.times(leverage);

      pool.addOutflowVolumeByToken(collateralToken, leveragedPnlAmount);
      pool.addVolumeByToken(collateralToken, leveragedPnlAmount);

      position.setBalanceClosed(collateralToken, leveragedPnlAmount);
      position.setCollateralBalanceClosed(collateralToken, leveragedPnlAmount);
      position.setRealisedPnlClosed(
        collateralToken,
        bigDecimalToBigInt(pnl).times(leverage)
      );
    }

    pool.addPremiumByToken(
      collateralToken,
      closingFee,
      TransactionType.COLLATERAL_OUT
    );

    const collateralAmounts = createTokenAmountArray(
      pool,
      [collateralToken],
      [pnlAmount]
    );
    account.collateralOut(
      pool,
      positionID,
      collateralAmounts,
      sharesTransferred
    );

    position.addCollateralOutCount();
  }
}
