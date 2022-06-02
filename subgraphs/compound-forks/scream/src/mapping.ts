import { Address, BigInt, log } from "@graphprotocol/graph-ts";
// import from the generated at root in order to reuse methods from root
import {
  NewPriceOracle,
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
  ActionPaused1,
} from "../../generated/Comptroller/Comptroller";
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
  FANTOM_BLOCKS_PER_YEAR,
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
import { comptrollerAddr } from "./constants";
import { PriceOracle } from "../generated/templates/CToken/PriceOracle";

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let protocol = getOrCreateProtocol();
  _handleNewPriceOracle(protocol, event);
}

export function handleMarketListed(event: MarketListed): void {
  CTokenTemplate.create(event.params.cToken);

  let cTokenAddr = event.params.cToken;
  let cToken = Token.load(cTokenAddr.toHexString());
  if (cToken != null) {
    return;
  }
  // this is a new cToken, a new underlying token, and a new market

  let protocol = getOrCreateProtocol();
  let cTokenContract = CToken.bind(event.params.cToken);
  let cTokenReserveFactorMantissa = getOrElse<BigInt>(
    cTokenContract.try_reserveFactorMantissa(),
    BIGINT_ZERO
  );

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
        getOrElse<string>(cTokenContract.try_name(), "unknown"),
        getOrElse<string>(cTokenContract.try_symbol(), "unknown"),
        cTokenDecimals
      ),
      new TokenData(
        cTokenAddr,
        getOrElse<string>(underlyingTokenContract.try_name(), "unknown"),
        getOrElse<string>(underlyingTokenContract.try_symbol(), "unknown"),
        getOrElse<i32>(underlyingTokenContract.try_decimals(), 0)
      ),
      cTokenReserveFactorMantissa
    ),
    event
  );
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  _handleNewCollateralFactor(event);
}

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive
): void {
  let protocol = getOrCreateProtocol();
  _handleNewLiquidationIncentive(protocol, event);
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  _handleNewReserveFactor(event);
}

export function handleActionPaused(event: ActionPaused1): void {
  _handleActionPaused(event);
}

export function handleMint(event: Mint): void {
  _handleMint(comptrollerAddr, event);
}

export function handleRedeem(event: Redeem): void {
  _handleRedeem(comptrollerAddr, event);
}

export function handleBorrow(event: BorrowEvent): void {
  _handleBorrow(comptrollerAddr, event);
}

export function handleRepayBorrow(event: RepayBorrow): void {
  _handleRepayBorrow(comptrollerAddr, event);
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  _handleLiquidateBorrow(comptrollerAddr, event);
}

export function handleAccrueInterest(event: AccrueInterest): void {
  let marketAddress = event.address;
  let cTokenContract = CToken.bind(marketAddress);
  let protocol = getOrCreateProtocol();
  let oracleContract = PriceOracle.bind(
    Address.fromString(protocol._priceOracle)
  );
  let updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_totalBorrows(),
    cTokenContract.try_supplyRatePerBlock(),
    cTokenContract.try_borrowRatePerBlock(),
    oracleContract.try_getUnderlyingPrice(marketAddress),
    FANTOM_BLOCKS_PER_YEAR
  );
  _handleAccrueInterest(updateMarketData, comptrollerAddr, event);
}

function getOrCreateProtocol(): LendingProtocol {
  let comptroller = Comptroller.bind(comptrollerAddr);
  let protocolData = new ProtocolData(
    comptrollerAddr,
    "Scream",
    "scream",
    "1.2.1",
    "1.0.2",
    "1.0.0",
    Network.FANTOM,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );
  return _getOrCreateProtocol(protocolData);
}
