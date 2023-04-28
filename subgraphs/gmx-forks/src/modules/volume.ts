import { Address, BigDecimal, ethereum, BigInt } from "@graphprotocol/graph-ts";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { initializeSDK } from "../common/initializers";

export function increasePoolVolume(
  event: ethereum.Event,
  pool: Pool,
  sizeUSDDelta: BigDecimal,
  collateralTokenAddress: Address,
  collateralTokenAmountDelta: BigInt,
  collateralUSDDelta: BigDecimal,
  transactionType: TransactionType
): void {
  const collateralToken = initializeSDK(event).Tokens.getOrCreateToken(
    collateralTokenAddress
  );
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
  //     switch (transactionType) {
  //       case TransactionType.COLLATERAL_IN:
  //           pool.addInflowVolumeByToken(collateralToken, collateralTokenAmountDelta);
  //       break;
  //     case TransactionType.COLLATERAL_OUT:
  //                pool.addOutflowVolumeByToken(
  //                  collateralToken,
  //                  collateralTokenAmountDelta
  //                );

  //       break;
  //     case TransactionType.LIQUIDATE:
  //       pool.addClosedInflowVolumeByToken(
  //                  collateralToken,
  //                  collateralTokenAmountDelta
  //                );
  //       break;

  //     default:
  //       break;
  //   }

  pool.addVolumeByToken(collateralToken, collateralTokenAmountDelta);
}
