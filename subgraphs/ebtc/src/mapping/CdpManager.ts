import { CdpUpdated } from "../../generated/CdpManager/CdpManager";
import { AccountManager } from "../sdk/account";
import { PositionManager } from "../sdk/position";
import { TokenManager } from "../sdk/token";
import { PositionSide, TransactionType } from "../sdk/util/constants";
import { getProtocolData, getDataManager, STETH_ADDRESS } from "../constants";

/**
 * Make necessary adjustments to the system when a CDP changes.
 * @param event The event emitted by the CdpManager when a CDP changes.
 */
export function handleCdpUpdated(event: CdpUpdated): void {
  const dataManager = getDataManager(event);
  const accountManager = new AccountManager(event.params._borrower);
  const positionManager = new PositionManager(
    accountManager.getAccount(), // account: Account
    dataManager.getMarket(), // market: Market
    PositionSide.COLLATERAL //side
  );
  const stEthTokenManager = new TokenManager(STETH_ADDRESS, event);

  // TODO: there is also a subtractPosition method
  positionManager.addPosition(
    event, // event: ethereum.Event
    STETH_ADDRESS, // asset: Bytes
    dataManager.getOrCreateLendingProtocol(getProtocolData()), // protocol: LendingProtocol
    event.params._coll, // newBalance: BigInt
    // TODO: obivously the transaction type needs to be determined properly
    TransactionType.BORROW, // transactionType: string
    stEthTokenManager.getPriceUSD() // priceUSD: BigDecimal
  );
  if (positionManager.getPositionID()) {
    positionManager.setCollateral(true);
    positionManager.setIsolation(true);
  }

  // createLiquidate(
  //     asset: Bytes
  //     liquidator: Address
  //     liquidatee: Address
  //     amount: BigInt
  //     amountUSD: BigDecimal
  //     profitUSD: BigDecimal
  //     newBalance: BigInt // repaid token balance for liquidatee
  // )
}
