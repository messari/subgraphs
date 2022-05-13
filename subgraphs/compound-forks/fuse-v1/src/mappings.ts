// fuse v1 handlers
import { Address, ethereum, log } from "@graphprotocol/graph-ts";
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
import { FusePoolDirectory } from "../generated/FusePoolDirectory/FusePoolDirectory";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  DAYS_PER_YEAR,
  exponentToBigDecimal,
  InterestRateSide,
  mantissaFactor,
  mantissaFactorBD,
  RewardTokenType,
  SECONDS_PER_DAY,
} from "../../src/constants";
import { InterestRate, Market, Token } from "../generated/schema";
import {
  getOrCreateCircularBuffer,
  getRewardsPerDay,
  RewardIntervalType,
} from "./rewards";
import { PriceOracle } from "../generated/templates/CToken/PriceOracle";

////////////////////
//// Fuse Enums ////
////////////////////

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
// TODO: add fuse/admin fees
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

  // get fuse fee - rari collects this
  // let tryFuseFee = cTokenContract.try_fuseFeeMantissa();

  // let fuseFeeId =
  //   InterestRateSide.BORROWER +
  //   "-" +
  //   RariFee.FUSE_FEE +
  //   "-" +
  //   event.params.cToken.toHexString();
  // let fuseFee = new InterestRate(fuseFeeId);
  // fuseFee.rate = tryFuseFee.reverted
  //   ? BIGDECIMAL_ZERO
  //   : tryFuseFee.value
  //       .toBigDecimal()
  //       .div(mantissaFactorBD)
  //       .times(BIGDECIMAL_HUNDRED);
  // fuseFee.side = InterestRateSide.BORROWER;
  // fuseFee.type = RariFee.FUSE_FEE;
  // fuseFee.save();

  // // get admin fee - pool owners (admin) collect this
  // let tryAdminFee = cTokenContract.try_adminFeeMantissa();
  // let adminFeeId =
  //   InterestRateSide.BORROWER +
  //   "-" +
  //   RariFee.ADMIN_FEE +
  //   "-" +
  //   event.params.cToken.toHexString();
  // let adminFee = new InterestRate(adminFeeId);
  // adminFee.rate = tryAdminFee.reverted
  //   ? BIGDECIMAL_ZERO
  //   : tryAdminFee.value
  //       .toBigDecimal()
  //       .div(mantissaFactorBD)
  //       .times(BIGDECIMAL_HUNDRED);
  // adminFee.side = InterestRateSide.BORROWER;
  // adminFee.type = RariFee.ADMIN_FEE;
  // adminFee.save();

  // let market = Market.load(event.params.cToken.toHexString());
  // if (!market) {
  //   // seemingly impossible, but want to
  //   return;
  // }
  // let marketRates = market.rates;
  // marketRates.push(fuseFee.id);
  // marketRates.push(adminFee.id);
  // market.rates = marketRates;
  // market.save();
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
    4 * 60 * 24 * DAYS_PER_YEAR
  );

  _handleAccrueInterest(updateMarketData, trollerAddr, event);
}

export function handleNewFuseFee(event: NewFuseFee): void {
  // calculate fee
  let fuseFeeDecimal = event.params.newFuseFeeMantissa
    .toBigDecimal()
    .div(mantissaFactorBD)
    .times(BIGDECIMAL_HUNDRED);

  let fuseFeeId =
    InterestRateSide.BORROWER +
    "-" +
    RariFee.FUSE_FEE +
    "-" +
    event.address.toHexString();
  let fuseFee = InterestRate.load(fuseFeeId);

  // create fee and add to market if non-existant
  if (!fuseFee) {
    fuseFee = new InterestRate(fuseFeeId);
    fuseFee.rate = fuseFeeDecimal;
    fuseFee.side = InterestRateSide.BORROWER;
    fuseFee.type = RariFee.FUSE_FEE;
    fuseFee.save();

    let market = Market.load(event.address.toHexString());
    if (!market) {
      // best effort
      return;
    }
    let rates = market.rates;
    rates.push(fuseFee.id);
    market.save();

    return;
  }

  fuseFee.rate = fuseFeeDecimal;
  fuseFee.save();
}

export function handleNewAdminFee(event: NewAdminFee): void {
  // calculate fee
  let adminFeeDecimal = event.params.newAdminFeeMantissa
    .toBigDecimal()
    .div(mantissaFactorBD)
    .times(BIGDECIMAL_HUNDRED);

  let adminFeeId =
    InterestRateSide.BORROWER +
    "-" +
    RariFee.ADMIN_FEE +
    "-" +
    event.address.toHexString();
  let adminFee = InterestRate.load(adminFeeId);

  // create fee and add to market if non-existant
  if (!adminFee) {
    adminFee = new InterestRate(adminFeeId);
    adminFee.rate = adminFeeDecimal;
    adminFee.side = InterestRateSide.BORROWER;
    adminFee.type = RariFee.ADMIN_FEE;
    adminFee.save();

    let market = Market.load(event.address.toHexString());
    if (!market) {
      // best effort
      return;
    }
    let rates = market.rates;
    rates.push(adminFee.id);
    market.save();

    return;
  }

  adminFee.rate = adminFeeDecimal;
  adminFee.save();
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
