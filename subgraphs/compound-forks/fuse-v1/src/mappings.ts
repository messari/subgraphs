// fuse v1 handlers
import { Address, log } from "@graphprotocol/graph-ts";
import {
  ProtocolData,
  _getOrCreateProtocol,
  _handleNewReserveFactor,
  _handleNewCollateralFactor,
  _handleNewPriceOracle,
  _handleMarketListed,
  MarketListedData,
  TokenData,
  _handleNewLiquidationIncentive,
  _handleMint,
  _handleRedeem,
  _handleBorrow,
  _handleRepayBorrow,
  _handleLiquidateBorrow,
  UpdateMarketData,
  _handleAccrueInterest,
  getOrElse,
} from "../../src/mapping";

import { PoolRegistered } from "../generated/FusePoolDirectory/FusePoolDirectory";
import {
  METHODOLOGY_VERSION,
  NETWORK_ETHEREUM,
  PROTOCOL_NAME,
  SCHEMA_VERSION,
  SUBGRAPH_VERSION,
} from "./constants";
import {
  Comptroller,
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
} from "../../generated/Comptroller/Comptroller";
import { Comptroller as ComptrollerEntity } from "../generated/templates";

/////////////////////////////////
//// Pool Directory Handlers ////
/////////////////////////////////

// creates a new LendingProtocol for a new fuse "pool"
export function handlePoolRegistered(event: PoolRegistered): void {
  let troller = Comptroller.bind(event.params.pool.comptroller);

  // populate pool data
  let poolData = new ProtocolData(
    event.params.pool.comptroller,
    event.params.pool.name,
    event.params.index.toString(),
    SCHEMA_VERSION,
    SUBGRAPH_VERSION,
    METHODOLOGY_VERSION,
    NETWORK_ETHEREUM,
    troller.try_liquidationIncentiveMantissa()
  );

  // only needed to create the new pool (ie, pool's Comptroller implementation)
  _getOrCreateProtocol(poolData);

  // create Comptroller template
  ComptrollerEntity.create(event.params.pool.comptroller);
}

//////////////////////////////
//// Comptroller Handlers ////
//////////////////////////////

// Note: these are pool level functions in fuse, but each pool is a Comptroller impl
// Source: https://docs.rari.capital/fuse

// add a new market
export function handleMarketListed(event: MarketListed): void {
  log.warning("new market listed {}", [event.transaction.hash.toHexString()]);
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  log.warning("new collateral factor", []);
}

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive
): void {
  log.warning("new liq incentive", []);
}

// export function

/////////////////
//// Helpers ////
/////////////////
