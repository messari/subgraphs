import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { SDK } from "../sdk/protocols/perpfutures";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export function increasePoolVolume(
  pool: Pool,
  sizeUSDDelta: BigDecimal,
  collateralTokenAddress: Address,
  collateralTokenAmountDelta: BigInt,
  transactionType: TransactionType,
  realisedPnlUSD: BigDecimal,
  isRealisedPnl: bool,
  sdk: SDK
): void {
  const collateralToken = sdk.Tokens.getOrCreateToken(collateralTokenAddress);
  if (!collateralTokenAddress.equals(constants.NULL.TYPE_ADDRESS))
    utils.checkAndUpdateInputTokens(pool, collateralToken);

  if (transactionType == TransactionType.COLLATERAL_IN) {
    pool.addInflowVolumeByToken(collateralToken, collateralTokenAmountDelta);
    pool.addVolume(sizeUSDDelta);
  }
  if (transactionType == TransactionType.COLLATERAL_OUT) {
    pool.addOutflowVolumeByToken(collateralToken, collateralTokenAmountDelta);
    pool.addVolume(sizeUSDDelta);
  }
  if (transactionType == TransactionType.LIQUIDATE) {
    if (isRealisedPnl) {
      pool.addClosedInflowVolumeUSD(realisedPnlUSD);
    } else {
      pool.addClosedInflowVolumeByToken(
        collateralToken,
        collateralTokenAmountDelta
      );
    }
  }
  pool.addCumulativeVolumeByTokenAmount(
    collateralToken,
    collateralTokenAmountDelta
  );
}
