import { Address, log } from "@graphprotocol/graph-ts";
import { ActivePoolAddressChanged } from "../../generated/CdpManager/CdpManager";
import { ActivePool } from "../../generated/ActivePool/ActivePool";
import { OracleSource } from "../sdk/util/constants";
import { DataManager } from "../sdk/manager";
import {
  ACTIVE_POOL,
  PRICE_FEED,
  STETH_ADDRESS,
  getProtocolData,
} from "../constants";

////////////////////////////////////////
//// Initialise Protocol and Oracle ////
////////////////////////////////////////
export function handleSystemDeployed(event: ActivePoolAddressChanged): void {
  const activePool = ActivePool.bind(event.params._activePoolAddress);
  if (activePool._address != ACTIVE_POOL) {
    log.error(
      "deployed ActivePool address {} does not match expected address",
      [event.params._activePoolAddress.toHexString()]
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

  // TODO: update market with ebtc specifics
  // market.name = outputToken.getToken().name;
  // market.outputToken = outputToken.getToken().id;
  // market.outputTokenSupply = BIGINT_ZERO;
  // market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  // market.exchangeRate = BIGDECIMAL_ZERO; // exchange rate = (inputTokenBalance / outputTokenSupply) OR (totalAssets() / totalSupply())
  // market.isActive = false; // controlled with setAsActive
  // market.canBorrowFrom = false; // controlled with setAsActive
  // market.canUseAsCollateral = false; // collateral is posted during loans separate from any deposits
  // market.borrowedToken = tryInputToken.value;
  // market.stableBorrowedTokenBalance = BIGINT_ZERO;
  // market._poolManager = event.params.instance_;
  // market.save();

  const lendingProtocol = manager.getOrCreateLendingProtocol(getProtocolData());

  const oracle = manager.getOrCreateOracle(
    Address.fromBytes(PRICE_FEED), // oracleAddress: Address
    false, // isUSD: boolean
    OracleSource.CHAINLINK // source?: string
  );
}
