// fuse v1 handlers
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
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
  _handleActionPaused,
} from "../../src/mapping";
import { PoolRegistered } from "../generated/FusePoolDirectory/FusePoolDirectory";
import {
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
  METHODOLOGY_VERSION,
  NETWORK_ETHEREUM,
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
  LiquidateBorrow,
  Mint,
  NewComptroller,
  NewReserveFactor,
  Redeem,
  RepayBorrow,
} from "../../generated/templates/CToken/CToken";
import {
  NewAdminFee,
  NewFuseFee,
  CToken,
} from "../generated/templates/CToken/CToken";
import {
  Comptroller as ComptrollerTemplate,
  CToken as CTokenTemplate,
} from "../generated/templates";
import { LendingProtocol } from "../../generated/schema";
import { ERC20 } from "../generated/templates/Comptroller/ERC20";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  DAYS_PER_YEAR,
  InterestRateSide,
  InterestRateType,
  mantissaFactor,
  mantissaFactorBD,
} from "../../src/constants";
import { InterestRate, Market } from "../generated/schema";
import { PriceOracle } from "../generated/templates/CToken/PriceOracle";

// TODO: fix inputTokenPriceUSD is in ETH from oracle

//////////////////////
//// Fuse Enum(s) ////
//////////////////////

export namespace RariFee {
  export const FUSE_FEE = "FUSE_FEE";
  export const ADMIN_FEE = "ADMIN_FEE";
}

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
    troller.try_liquidationIncentiveMantissa(),
    troller.try_oracle()
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

  let underlyingToken: TokenData;
  if (underlyingAddress == Address.fromString(ZERO_ADDRESS)) {
    // this is ETH
    underlyingToken = new TokenData(
      Address.fromString(ETH_ADDRESS),
      ETH_NAME,
      ETH_SYMBOL,
      mantissaFactor
    );
  } else {
    let underlyingContract = ERC20.bind(underlyingAddress);
    underlyingToken = new TokenData(
      underlyingAddress,
      getOrElse(underlyingContract.try_name(), "UNKNOWN"),
      getOrElse(underlyingContract.try_symbol(), "UNKOWN"),
      getOrElse(underlyingContract.try_decimals(), -1)
    );
  }

  // populatet market data
  let marketData = new MarketListedData(
    protocol,
    underlyingToken,
    cToken,
    getOrElse(cTokenContract.try_reserveFactorMantissa(), BIGINT_ZERO)
  );

  _handleMarketListed(marketData, event);

  // fuse-specific: add fuseFees and adminFees

  // get fuse fee - rari collects this (ie, protocol revenue)
  let tryFuseFeeMantissa = cTokenContract.try_fuseFeeMantissa();
  updateOrCreateRariFee(
    tryFuseFeeMantissa.reverted ? BIGINT_ZERO : tryFuseFeeMantissa.value,
    RariFee.FUSE_FEE,
    event.params.cToken.toHexString()
  );

  // get admin fee - pool owners (admin) collect this (ie, protocol revenue)
  let tryAdminFeeMantissa = cTokenContract.try_adminFeeMantissa();
  updateOrCreateRariFee(
    tryAdminFeeMantissa.reverted ? BIGINT_ZERO : tryAdminFeeMantissa.value,
    RariFee.ADMIN_FEE,
    event.params.cToken.toHexString()
  );
}

// update a given markets collateral factor
export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  _handleNewCollateralFactor(event);
}

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive
): void {
  let protocol = LendingProtocol.load(event.address.toHexString());
  if (!protocol) {
    // best effort
    log.warning("[handleMarketListed] Comptroller not found: {}", [
      event.address.toHexString(),
    ]);
    return;
  }
  _handleNewLiquidationIncentive(protocol, event);
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let protocol = LendingProtocol.load(event.address.toHexString());
  if (!protocol) {
    // best effort
    log.warning("[handleMarketListed] Comptroller not found: {}", [
      event.address.toHexString(),
    ]);
    return;
  }

  _handleNewPriceOracle(protocol, event);
}

export function handleActionPaused(event: ActionPaused1): void {
  _handleActionPaused(event);
}

/////////////////////////
//// CToken Handlers ////
/////////////////////////

export function handleMint(event: Mint): void {
  // get comptroller address
  let trollerAddr: Address;
  if (
    (trollerAddr = getComptrollerAddress(event)) ==
    Address.fromString(ZERO_ADDRESS)
  ) {
    return;
  }

  _handleMint(trollerAddr, event);
}

export function handleRedeem(event: Redeem): void {
  // get comptroller address
  let trollerAddr: Address;
  if (
    (trollerAddr = getComptrollerAddress(event)) ==
    Address.fromString(ZERO_ADDRESS)
  ) {
    return;
  }

  _handleRedeem(trollerAddr, event);
}

export function handleBorrow(event: Borrow): void {
  // get comptroller address
  let trollerAddr: Address;
  if (
    (trollerAddr = getComptrollerAddress(event)) ==
    Address.fromString(ZERO_ADDRESS)
  ) {
    return;
  }

  _handleBorrow(trollerAddr, event);
}

export function handleRepayBorrow(event: RepayBorrow): void {
  // get comptroller address
  let trollerAddr: Address;
  if (
    (trollerAddr = getComptrollerAddress(event)) ==
    Address.fromString(ZERO_ADDRESS)
  ) {
    return;
  }

  _handleRepayBorrow(trollerAddr, event);
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  // get comptroller address
  let trollerAddr: Address;
  if (
    (trollerAddr = getComptrollerAddress(event)) ==
    Address.fromString(ZERO_ADDRESS)
  ) {
    return;
  }

  _handleLiquidateBorrow(trollerAddr, event);
}

export function handleAccrueInterest(event: AccrueInterest): void {
  // get comptroller address
  let trollerAddr: Address;
  if (
    (trollerAddr = getComptrollerAddress(event)) ==
    Address.fromString(ZERO_ADDRESS)
  ) {
    return;
  }

  let marketAddress = event.address;

  let cTokenContract = CToken.bind(marketAddress);
  let protocol = LendingProtocol.load(trollerAddr.toHexString());
  let oracleContract = PriceOracle.bind(
    Address.fromString(protocol!._priceOracle)
  );
  let updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_totalBorrows(),
    cTokenContract.try_supplyRatePerBlock(),
    cTokenContract.try_borrowRatePerBlock(),
    oracleContract.try_getUnderlyingPrice(marketAddress),
    4 * 60 * 24 * DAYS_PER_YEAR // TODO: is this accurate enough ?
  );

  _handleAccrueInterest(updateMarketData, trollerAddr, event);

  // TODO: subtract admin/fuse fees from supply rev and add to protocol rev
  // 1- take accumlated interest and find fuse fee amount and admin fee amount
  // subtract these two amounts from supply revenues and add to protocol revenues
  // do this for protocol rev, market rev, financial daily snapshot rev, market daily rev
}

export function handleNewFuseFee(event: NewFuseFee): void {
  // TODO: remove
  log.warning("new fuse fee: {}", [event.params.newFuseFeeMantissa.toString()]);

  updateOrCreateRariFee(
    event.params.newFuseFeeMantissa,
    RariFee.FUSE_FEE,
    event.address.toHexString()
  );
}

export function handleNewAdminFee(event: NewAdminFee): void {
  // TODO: remove
  log.warning("new admin fee: {}", [
    event.params.newAdminFeeMantissa.toString(),
  ]);

  updateOrCreateRariFee(
    event.params.newAdminFeeMantissa,
    RariFee.ADMIN_FEE,
    event.address.toHexString()
  );
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  _handleNewReserveFactor(event);
}

// TODO: is this necessary, not much we can do, excpet delete old lendingProtocol and move to new lendingProtocol..
export function handleNewComptroller(event: NewComptroller): void {
  log.error("WOAH: NEW COMPTROLLER at transaction: {}", [
    event.transaction.hash.toHexString(),
  ]);
}

/////////////////
//// Helpers ////
/////////////////

function getComptrollerAddress(event: ethereum.Event): Address {
  let cTokenContract = CToken.bind(event.address);
  let tryComptroller = cTokenContract.try_comptroller();

  if (tryComptroller.reverted) {
    // comptroller does not exist
    log.warning(
      "[handleTransaction] Comptroller not found for transaction: {}",
      [event.transaction.hash.toHexString()]
    );
    return Address.fromString(ZERO_ADDRESS);
  }

  return tryComptroller.value;
}

// updates the rate or creates the rari fee (either fuse or admin fee)
function updateOrCreateRariFee(
  rateMantissa: BigInt,
  rariFeeType: string,
  marketID: string
): void {
  let rariFeeId =
    InterestRateSide.BORROWER + "-" + rariFeeType + "-" + marketID;
  let rariFee = InterestRate.load(rariFeeId);

  // calculate fee rate
  let rate = rateMantissa
    .toBigDecimal()
    .div(mantissaFactorBD)
    .times(BIGDECIMAL_HUNDRED);

  if (!rariFee) {
    rariFee = new InterestRate(rariFeeId);
    rariFee.side = InterestRateSide.BORROWER;
    rariFee.type = InterestRateType.STABLE;

    // add to market rates array
    let market = Market.load(marketID);
    if (!market) {
      // best effort
      return;
    }
    let rates = market.rates;
    rates.push(rariFee.id);
    market.save();
  }

  rariFee.rate = rate;
  rariFee.save();
}
