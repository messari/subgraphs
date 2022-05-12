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
  FACTORY_CONTRACT,
  METHODOLOGY_VERSION,
  NETWORK_ETHEREUM,
  PROTOCOL_NAME,
  SCHEMA_VERSION,
  SUBGRAPH_VERSION,
  ZERO_ADDRESS,
} from "./constants";
import {
  ActionPaused1,
  Comptroller,
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewPriceOracle,
} from "../../generated/Comptroller/Comptroller";
import {
  AccrueInterest,
  Borrow,
  CToken,
  LiquidateBorrow,
  Mint,
  NewAdminFee,
  NewComptroller,
  NewFuseFee,
  NewReserveFactor,
  Redeem,
  RepayBorrow,
} from "../generated/templates/CToken/CToken";
import {
  Comptroller as ComptrollerTemplate,
  CToken as CTokenTemplate,
} from "../generated/templates";
import { LendingProtocol } from "../../generated/schema";
import { ERC20 } from "../generated/templates/Comptroller/ERC20";
import { FusePoolDirectory } from "../generated/FusePoolDirectory/FusePoolDirectory";
import { BIGINT_ZERO } from "../../src/constants";

/////////////////////////////////
//// Pool Directory Handlers ////
/////////////////////////////////

// creates a new LendingProtocol for a new fuse "pool"
export function handlePoolRegistered(event: PoolRegistered): void {
  // create Comptroller template
  ComptrollerTemplate.create(event.params.pool.comptroller);

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
}

//////////////////////////////
//// Comptroller Handlers ////
//////////////////////////////

// Note: these are pool level functions in fuse, but each pool is a Comptroller impl
// Source: https://docs.rari.capital/fuse

// add a new market
export function handleMarketListed(event: MarketListed): void {
  let protocol = LendingProtocol.load(event.address.toHexString());
  if (!protocol) {
    // best effort
    log.warning("[handleMarketListed] Comptroller not found: {}", [
      event.address.toHexString(),
    ]);
    return;
  }

  // get/create ctoken
  CTokenTemplate.create(event.params.cToken);
  let cTokenContract = CToken.bind(event.params.cToken);
  let cToken = new TokenData(
    event.params.cToken,
    getOrElse(cTokenContract.try_name(), "UNKNOWN"),
    getOrElse(cTokenContract.try_symbol(), "UNKNOWN"),
    getOrElse(cTokenContract.try_decimals(), -1)
  );

  // get/create underlying token
  let underlyingAddress = getOrElse(
    cTokenContract.try_underlying(),
    Address.fromString(ZERO_ADDRESS)
  );
  let underlyingContract = ERC20.bind(underlyingAddress);
  let underlyingToken = new TokenData( // TODO: handle ETH
    underlyingAddress,
    getOrElse(underlyingContract.try_name(), "UNKNOWN"),
    getOrElse(underlyingContract.try_symbol(), "UNKOWN"),
    getOrElse(underlyingContract.try_decimals(), -1)
  );

  // populatet market data
  let marketData = new MarketListedData(
    protocol,
    underlyingToken,
    cToken,
    getOrElse(cTokenContract.try_reserveFactorMantissa(), BIGINT_ZERO)
  );

  _handleMarketListed(marketData, event);
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  log.warning("new collateral factor", []);
}

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive
): void {
  log.warning("new liq incentive", []);
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  log.warning("new price oracle", []);
}

export function handleActionPaused(event: ActionPaused1): void {
  log.warning("Action paused", []);
}

/////////////////////////
//// CToken Handlers ////
/////////////////////////

export function handleMint(event: Mint): void {}

export function handleRedeem(event: Redeem): void {}

export function handleBorrow(event: Borrow): void {}

export function handleRepayBorrow(event: RepayBorrow): void {}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {}

export function handleAccrueInterest(event: AccrueInterest): void {}

export function handleNewFuseFee(event: NewFuseFee): void {
  log.warning("new fuse fee", []);
}

export function handleNewAdminFee(event: NewAdminFee): void {}

export function handleNewReserveFactor(event: NewReserveFactor): void {}

export function handleNewComptroller(event: NewComptroller): void {}

/////////////////
//// Helpers ////
/////////////////
