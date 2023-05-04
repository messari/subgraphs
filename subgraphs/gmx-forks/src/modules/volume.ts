import { Address, BigDecimal, ethereum, BigInt } from "@graphprotocol/graph-ts";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { SDK } from "../sdk/protocols/perpfutures";

export function increasePoolVolume(
  event: ethereum.Event,
  pool: Pool,
  sizeUSDDelta: BigDecimal,
  collateralTokenAddress: Address,
  collateralTokenAmountDelta: BigInt,
  collateralUSDDelta: BigDecimal,
  transactionType: TransactionType,
  sdk: SDK
): void {
  const collateralToken = sdk.Tokens.getOrCreateToken(collateralTokenAddress);
  if (transactionType == TransactionType.COLLATERAL_IN) {
    pool.addInflowVolumeByToken(collateralToken, collateralTokenAmountDelta);
  }
  if (transactionType == TransactionType.COLLATERAL_OUT) {
    pool.addOutflowVolumeByToken(collateralToken, collateralTokenAmountDelta);
  }
  if (transactionType == TransactionType.LIQUIDATE) {
    pool.addClosedInflowVolumeByToken(
      collateralToken,
      collateralTokenAmountDelta
    );
  }

  pool.addVolumeByToken(collateralToken, collateralTokenAmountDelta);
}
