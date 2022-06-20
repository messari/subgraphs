import { Address, BigInt, log } from "@graphprotocol/graph-ts";
// import from the generated at root in order to reuse methods from root
import {
  NewPriceOracle,
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
  ActionPaused1,
} from "../generated/Comptroller/Core";
import {
  Mint,
  Redeem,
  Borrow as BorrowEvent,
  RepayBorrow,
  LiquidateBorrow,
  AccrueInterest,
  NewReserveFactor,
} from "../../generated/templates/CToken/CToken";
import { LendingProtocol, Token } from "../../generated/schema";
import {
  cTokenDecimals,
  Network,
  BIGINT_ZERO,
  SECONDS_PER_YEAR,
} from "../../src/constants";
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
// otherwise import from the specific subgraph root
import { CToken } from "../generated/Comptroller/CToken";
import { Comptroller } from "../generated/Comptroller/Comptroller";
import { CToken as CTokenTemplate } from "../generated/templates";
import { ERC20 } from "../generated/Comptroller/ERC20";
import { comptrollerAddr, 
  tCROToken,
  tETHToken,
  tWBTCToken,
  tUSDCToken,
  tUSDTToken,
  tDAIToken,
  tTONICToken
  , nativeToken } from "./constants";
import { PriceOracle } from "../generated/templates/CToken/PriceOracle";

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let protocol = getOrCreateProtocol();
  log.debug('[Test Log] arbitrary argument {}', ["test handlenewpriceoracle"]);
  _handleNewPriceOracle(protocol, event.params.newPriceOracle);
}

function getOrCreateProtocol(): LendingProtocol {
  log.warning(
    "logging: {}", ["does this work"])
  let comptroller = Comptroller.bind(comptrollerAddr);
  let protocolData = new ProtocolData(
    comptrollerAddr,
    "Tectonic Protocol",
    "tectonic-protocol",
    "1.0.1",
    "1.0.0",
    "1.0.0",
    Network.CRONOS,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );
  return _getOrCreateProtocol(protocolData);
}


export function handleMarketListed(event: MarketListed): void {
  CTokenTemplate.create(event.params.tToken);
  log.warning(
    "logging: {}",
    [event.params.tToken.toHexString()]
  );
  let cTokenAddr = event.params.tToken;
  let cToken = Token.load(cTokenAddr.toHexString());
  if (cToken != null) {
    return;
  }
  
  // this is a new cToken, a new underlying token, and a new market

  let protocol = getOrCreateProtocol();
  let cTokenContract = CToken.bind(event.params.tToken);
  let cTokenReserveFactorMantissa = getOrElse<BigInt>(
    cTokenContract.try_reserveFactorMantissa(),
    BIGINT_ZERO
  );
  if (cTokenAddr == tCROToken.address) {
    let marketListedData = new MarketListedData(
      protocol,
      nativeToken,
      tCROToken,
      cTokenReserveFactorMantissa
    );
    _handleMarketListed(marketListedData, event);
    return;
  }

  let underlyingTokenAddrResult = cTokenContract.try_underlying();
  if (underlyingTokenAddrResult.reverted) {
    log.warning(
      "[handleMarketListed] could not fetch underlying token of cToken: {}",
      [cTokenAddr.toHexString()]
    );
    return;
  }
  let underlyingTokenAddr = underlyingTokenAddrResult.value;
  let underlyingTokenContract = ERC20.bind(underlyingTokenAddr);
  _handleMarketListed(
    new MarketListedData(
      protocol,
      new TokenData(
        underlyingTokenAddr,
        getOrElse<string>(underlyingTokenContract.try_name(), "unknown"),
        getOrElse<string>(underlyingTokenContract.try_symbol(), "unknown"),
        getOrElse<i32>(underlyingTokenContract.try_decimals(), 0)
      ),
      new TokenData(
        cTokenAddr,
        getOrElse<string>(cTokenContract.try_name(), "unknown"),
        getOrElse<string>(cTokenContract.try_symbol(), "unknown"),
        cTokenDecimals
      ),
      cTokenReserveFactorMantissa
    ),
    event
  );
}

// export function handleNewCollateralFactor(event: NewCollateralFactor): void {
//   log.debug('[Test Log] arbitrary argument {}', ["test handlenewcollateralfactor"]);
//   _handleNewCollateralFactor(event);
// }

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive
): void {
  let protocol = getOrCreateProtocol();
  log.debug('[Test Log] arbitrary argument {}', ["test handlenewliquidationincentive"]);
  _handleNewLiquidationIncentive(protocol, event.params.newLiquidationIncentiveMantissa);
}

// export function handleActionPaused(event: ActionPaused1): void {
//   _handleActionPaused(event);
// }

// export function handleNewReserveFactor(event: NewReserveFactor): void {
//   _handleNewReserveFactor(event);
// }

// export function handleMint(event: Mint): void {
//   _handleMint(comptrollerAddr, event);
// }

// export function handleRedeem(event: Redeem): void {
//   _handleRedeem(comptrollerAddr, event);
// }

// export function handleBorrow(event: BorrowEvent): void {
//   _handleBorrow(comptrollerAddr, event);
// }

// export function handleRepayBorrow(event: RepayBorrow): void {
//   _handleRepayBorrow(comptrollerAddr, event);
// }

// export function handleLiquidateBorrow(event: LiquidateBorrow): void {
//   _handleLiquidateBorrow(comptrollerAddr, event);
// }

// export function handleAccrueInterest(event: AccrueInterest): void {
//   let marketAddress = event.address;
//   let cTokenContract = CToken.bind(marketAddress);
//   let protocol = getOrCreateProtocol();
//   let oracleContract = PriceOracle.bind(
//     Address.fromString(protocol._priceOracle)
//   );
//   let updateMarketData = new UpdateMarketData(
//     cTokenContract.try_totalSupply(),
//     cTokenContract.try_exchangeRateStored(),
//     cTokenContract.try_supplyRatePerBlock(),
//     cTokenContract.try_borrowRatePerBlock(),
//     oracleContract.try_getUnderlyingPrice(marketAddress),
//     SECONDS_PER_YEAR
//   );
//   _handleAccrueInterest(updateMarketData, comptrollerAddr, event);
// }

