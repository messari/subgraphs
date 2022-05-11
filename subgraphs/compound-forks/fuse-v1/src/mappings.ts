// fuse v1 handlers
import { log } from "@graphprotocol/graph-ts";
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
    AccruePer,
    _handleAccrueInterest,
    getOrElse,
  } from "../../src/mapping";

import { PoolRegistered } from "../generated/FusePoolDirectory/FusePoolDirectory"
import { Comptroller } from "../generated/templates"
import {_Comptroller } from "../generated/schema"

export function handlePoolRegistered(event: PoolRegistered): void {
    log.warning("creating Pool aka new comptroller", []);
    let troller = Comptroller.create(event.params.pool.comptroller);

    // create comptroller entity
    let comptroller = new _Comptroller(event.params.pool.comptroller.toHexString());

    comptroller.name = event.params.pool.name.toString();
    comptroller.save();
}