import { SDK } from "../sdk/protocols/perpfutures";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";
import { Address, BigInt } from "@graphprotocol/graph-ts";

export function increasePoolVolume(
  pool: Pool,

  collateralTokenAddress: Address,
  collateralTokenAmountDelta: BigInt,
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
