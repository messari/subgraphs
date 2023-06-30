import { Address, log } from "@graphprotocol/graph-ts";
import {
  ActivePool,
  CdpManagerAddressChanged,
} from "../../generated/ActivePool/ActivePool";
import { OracleSource, BIGDECIMAL_ZERO } from "../sdk/util/constants";
import { DataManager } from "../sdk/manager";
import {
  ACTIVE_POOL,
  EBTC_ADDRESS,
  LIQUIDATION_FEE_PERCENT,
  MAXIMUM_LTV,
  PRICE_FEED,
  STETH_ADDRESS,
  getProtocolData,
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
    log.error(
      "deployed ActivePool address {} does not match expected address",
      [event.address.toHexString()]
    );
    return;
  }

  const manager = new DataManager(
    activePool._address, // marketID: Bytes
    STETH_ADDRESS, // inputToken: Bytes
    event, // event: ethereum.Event
    getProtocolData() // protocolData: ProtocolData
  );

  const market = manager.getMarket();

  // update market with ebtc specifics
  market.canBorrowFrom = true;
  market.maximumLTV = MAXIMUM_LTV;
  market.liquidationThreshold = MAXIMUM_LTV;
  market.liquidationPenalty = LIQUIDATION_FEE_PERCENT;
  market.borrowedToken = EBTC_ADDRESS;
  market.save();

  const lendingProtocol = manager.getOrCreateLendingProtocol(
    getProtocolData() // data: ProtocolData
  );

  const oracle = manager.getOrCreateOracle(
    Address.fromBytes(PRICE_FEED), // oracleAddress: Address
    false, // isUSD: boolean
    OracleSource.CHAINLINK // source?: string
  );
}
