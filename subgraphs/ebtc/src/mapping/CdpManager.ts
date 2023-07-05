import { Address, log } from "@graphprotocol/graph-ts";
import {
  ActivePool,
  CdpManagerAddressChanged,
} from "../../generated/ActivePool/ActivePool";
import { CdpUpdated } from "../../generated/CdpManager/CdpManager";
import { AccountManager } from "../sdk/account";
import { PositionManager } from "../sdk/position";
import { TokenManager } from "../sdk/token";
import {
  OracleSource,
  PositionSide,
  TransactionType,
} from "../sdk/util/constants";
import {
  ACTIVE_POOL,
  EBTC_ADDRESS,
  LIQUIDATION_FEE_PERCENT,
  MAXIMUM_LTV,
  PRICE_FEED,
  getProtocolData,
  getDataManager,
  STETH_ADDRESS,
} from "../constants";

/**
 * On deployment of the pool, initialise and populate the market,
 * lendingProtocol and oracle entities.
 * @param event An event emitted by the constructor of the ActivePool proving
 * it was deployed successfully.
 */
export function handleSystemDeployed(event: CdpManagerAddressChanged): void {
  const activePool = ActivePool.bind(event.address);
  if (activePool._address != ACTIVE_POOL) {
    // quick check to make sure our configurations.json is correct
    log.error(
      "deployed ActivePool address {} does not match expected address",
      [event.address.toHexString()]
    );
    return;
  }

  const dataManager = getDataManager(event);

  // update market with ebtc specifics
  const market = dataManager.getMarket();
  market.canBorrowFrom = true;
  market.maximumLTV = MAXIMUM_LTV;
  market.liquidationThreshold = MAXIMUM_LTV;
  market.liquidationPenalty = LIQUIDATION_FEE_PERCENT;
  market.borrowedToken = EBTC_ADDRESS;
  market.save();

  const lendingProtocol = dataManager.getOrCreateLendingProtocol(
    getProtocolData() // data: ProtocolData
  );

  const oracle = dataManager.getOrCreateOracle(
    Address.fromBytes(PRICE_FEED), // oracleAddress: Address
    false, // isUSD: boolean
    OracleSource.CHAINLINK // source?: string
  );
}

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
}
