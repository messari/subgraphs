import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
// import from the generated at root in order to reuse methods from root
import {
  NewPriceOracle,
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
  ActionPaused1,
  MarketEntered,
  MarketExited,
} from "../../../generated/Comptroller/Comptroller";
import {
  Mint,
  Redeem,
  Borrow as BorrowEvent,
  RepayBorrow,
  LiquidateBorrow,
  AccrueInterest,
  NewReserveFactor,
  Transfer,
} from "../../../generated/templates/CToken/CToken";
import { LendingProtocol, Market, Token } from "../../../generated/schema";
import {
  cTokenDecimals,
  Network,
  BIGINT_ZERO,
  SECONDS_PER_YEAR,
  exponentToBigDecimal,
  BIGDECIMAL_HUNDRED,
} from "../../../src/constants";
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
  _handleMarketEntered,
  _handleTransfer,
  getTokenPriceUSD,
} from "../../../src/mapping";
// otherwise import from the specific subgraph root
import { CToken } from "../../../generated/Comptroller/CToken";
import { Comptroller } from "../../../generated/Comptroller/Comptroller";
import { CToken as CTokenTemplate } from "../../../generated/templates";
import { ERC20 } from "../../../generated/Comptroller/ERC20";
import { Pair } from "../../../generated/templates/CToken/Pair";
import {
  AURORA_ETH_LP,
  AURORA_MARKET,
  comptrollerAddr,
  ETH_MARKET,
  nativeCToken,
  nativeToken,
  PLY_MARKET,
  TRI_MARKET,
  TRI_USDT_LP,
  USDT_MARKET,
  USN_MARKET,
  WNEAR_MARKET,
  WNEAR_PLY_LP,
  WNEAR_USN_LP,
} from "./constants";
import { PriceOracle } from "../../../generated/templates/CToken/PriceOracle";

export function handleNewPriceOracle(event: NewPriceOracle): void {
  const protocol = getOrCreateProtocol();
  const newPriceOracle = event.params.newPriceOracle;
  _handleNewPriceOracle(protocol, newPriceOracle);
}

export function handleMarketListed(event: MarketListed): void {
  CTokenTemplate.create(event.params.cToken);

  const cTokenAddr = event.params.cToken;
  const cToken = Token.load(cTokenAddr.toHexString());
  if (cToken != null) {
    return;
  }
  // this is a new cToken, a new underlying token, and a new market

  const protocol = getOrCreateProtocol();
  const cTokenContract = CToken.bind(event.params.cToken);
  const cTokenReserveFactorMantissa = getOrElse<BigInt>(
    cTokenContract.try_reserveFactorMantissa(),
    BIGINT_ZERO
  );
  if (cTokenAddr == nativeCToken.address) {
    const marketListedData = new MarketListedData(
      protocol,
      nativeToken,
      nativeCToken,
      cTokenReserveFactorMantissa
    );
    _handleMarketListed(marketListedData, event);
    return;
  }

  const underlyingTokenAddrResult = cTokenContract.try_underlying();
  if (underlyingTokenAddrResult.reverted) {
    log.warning(
      "[handleMarketListed] could not fetch underlying token of cToken: {}",
      [cTokenAddr.toHexString()]
    );
    return;
  }
  const underlyingTokenAddr = underlyingTokenAddrResult.value;
  const underlyingTokenContract = ERC20.bind(underlyingTokenAddr);
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

export function handleMarketEntered(event: MarketEntered): void {
  _handleMarketEntered(
    comptrollerAddr,
    event.params.cToken.toHexString(),
    event.params.account.toHexString(),
    true
  );
}

export function handleMarketExited(event: MarketExited): void {
  _handleMarketEntered(
    comptrollerAddr,
    event.params.cToken.toHexString(),
    event.params.account.toHexString(),
    false
  );
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  const marketID = event.params.cToken.toHexString();
  const collateralFactorMantissa = event.params.newCollateralFactorMantissa;
  _handleNewCollateralFactor(marketID, collateralFactorMantissa);
}

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive
): void {
  const protocol = getOrCreateProtocol();
  const newLiquidationIncentive = event.params.newLiquidationIncentiveMantissa;
  _handleNewLiquidationIncentive(protocol, newLiquidationIncentive);
}

export function handleActionPaused(event: ActionPaused1): void {
  const marketID = event.params.cToken.toHexString();
  const action = event.params.action;
  const pauseState = event.params.pauseState;
  _handleActionPaused(marketID, action, pauseState);
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  const marketID = event.address.toHexString();
  const newReserveFactorMantissa = event.params.newReserveFactorMantissa;
  _handleNewReserveFactor(marketID, newReserveFactorMantissa);
}

export function handleMint(event: Mint): void {
  const minter = event.params.minter;
  const mintAmount = event.params.mintAmount;
  const contract = CToken.bind(event.address);
  const outputTokenSupplyResult = contract.try_totalSupply();
  const balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.minter
  );
  _handleMint(
    comptrollerAddr,
    minter,
    mintAmount,
    outputTokenSupplyResult,
    balanceOfUnderlyingResult,
    event
  );
}

export function handleRedeem(event: Redeem): void {
  const redeemer = event.params.redeemer;
  const redeemAmount = event.params.redeemAmount;
  const contract = CToken.bind(event.address);
  const outputTokenSupplyResult = contract.try_totalSupply();
  const balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.redeemer
  );
  _handleRedeem(
    comptrollerAddr,
    redeemer,
    redeemAmount,
    outputTokenSupplyResult,
    balanceOfUnderlyingResult,
    event
  );
}

export function handleBorrow(event: BorrowEvent): void {
  const borrower = event.params.borrower;
  const borrowAmount = event.params.borrowAmount;
  const totalBorrows = event.params.totalBorrows;
  const contract = CToken.bind(event.address);
  const borrowBalanceStoredResult = contract.try_borrowBalanceStored(
    event.params.borrower
  );
  _handleBorrow(
    comptrollerAddr,
    borrower,
    borrowAmount,
    borrowBalanceStoredResult,
    totalBorrows,
    event
  );
}

export function handleRepayBorrow(event: RepayBorrow): void {
  const borrower = event.params.borrower;
  const payer = event.params.payer;
  const repayAmount = event.params.repayAmount;
  const totalBorrows = event.params.totalBorrows;
  const contract = CToken.bind(event.address);
  const borrowBalanceStoredResult = contract.try_borrowBalanceStored(
    event.params.borrower
  );
  _handleRepayBorrow(
    comptrollerAddr,
    borrower,
    payer,
    repayAmount,
    borrowBalanceStoredResult,
    totalBorrows,
    event
  );
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  const cTokenCollateral = event.params.auTokenCollateral;
  const liquidator = event.params.liquidator;
  const borrower = event.params.borrower;
  const seizeTokens = event.params.seizeTokens;
  const repayAmount = event.params.repayAmount;
  _handleLiquidateBorrow(
    comptrollerAddr,
    cTokenCollateral,
    liquidator,
    borrower,
    seizeTokens,
    repayAmount,
    event
  );
}

export function handleAccrueInterest(event: AccrueInterest): void {
  const marketAddress = event.address;
  const cTokenContract = CToken.bind(marketAddress);
  const protocol = getOrCreateProtocol();
  const updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_supplyRatePerTimestamp(),
    cTokenContract.try_borrowRatePerTimestamp(),
    getPrice(marketAddress, protocol._priceOracle),
    SECONDS_PER_YEAR
  );

  const interestAccumulated = event.params.interestAccumulated;
  const totalBorrows = event.params.totalBorrows;
  _handleAccrueInterest(
    updateMarketData,
    comptrollerAddr,
    interestAccumulated,
    totalBorrows,
    false, // do not update market prices since not all markets have proper price oracle
    event
  );
}

export function handleTransfer(event: Transfer): void {
  _handleTransfer(
    event,
    event.address.toHexString(),
    event.params.to,
    event.params.from,
    comptrollerAddr
  );
}

function getOrCreateProtocol(): LendingProtocol {
  const comptroller = Comptroller.bind(comptrollerAddr);
  const protocolData = new ProtocolData(
    comptrollerAddr,
    "Aurigami",
    "aurigami",
    "2.0.1",
    "1.1.7",
    "1.0.0",
    Network.AURORA,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );
  return _getOrCreateProtocol(protocolData);
}

/////////////////
//// Helpers ////
/////////////////

function getPrice(
  marketAddress: Address,
  priceOracle: string
): ethereum.CallResult<BigInt> {
  //
  //
  // There are 4 markets where the price oracle does not work
  // PLY, AURORA, TRI, USN
  // Use Trisolaris LP pool pairs to derive price

  if (marketAddress == PLY_MARKET) {
    return getPriceFromLp(
      priceOracle,
      WNEAR_MARKET,
      PLY_MARKET,
      WNEAR_PLY_LP,
      true
    );
  }
  if (marketAddress == AURORA_MARKET) {
    return getPriceFromLp(
      priceOracle,
      ETH_MARKET,
      AURORA_MARKET,
      AURORA_ETH_LP,
      true
    );
  }
  if (marketAddress == TRI_MARKET) {
    return getPriceFromLp(
      priceOracle,
      USDT_MARKET,
      TRI_MARKET,
      TRI_USDT_LP,
      false
    );
  }
  if (marketAddress == USN_MARKET) {
    return getPriceFromLp(
      priceOracle,
      WNEAR_MARKET,
      USN_MARKET,
      WNEAR_USN_LP,
      false
    );
  }

  // get the price normally
  const oracleContract = PriceOracle.bind(Address.fromString(priceOracle));
  return oracleContract.try_getUnderlyingPrice(marketAddress);
}

//
//
// Gets the price of wantAddress.inputToken from an LP from Trisolaris
function getPriceFromLp(
  priceOracle: string, // aurigami price oracle
  knownMarketID: Address, // address of the market we know the price of
  wantAddress: Address, // market address of token we want to price
  lpAddress: Address, // address of LP token
  whichPrice: boolean // true to find token0 price in LP, false for token1
): ethereum.CallResult<BigInt> {
  const oracleContract = PriceOracle.bind(Address.fromString(priceOracle));
  const knownMarket = Market.load(knownMarketID.toHexString());
  if (!knownMarket) {
    log.warning("knownMarket not found", []);
    return ethereum.CallResult.fromValue(BIGINT_ZERO);
  }
  const knownMarketDecimals = Token.load(knownMarket.inputToken)!.decimals;
  const knownPriceUSD = getTokenPriceUSD(
    oracleContract.try_getUnderlyingPrice(knownMarketID),
    knownMarketDecimals
  );

  const lpPair = Pair.bind(lpAddress);
  const tryReserves = lpPair.try_getReserves();
  if (tryReserves.reverted) {
    log.warning("tryReserves reverted", []);
    return ethereum.CallResult.fromValue(BIGINT_ZERO);
  }

  const wantMarket = Market.load(wantAddress.toHexString());
  if (!wantMarket) {
    log.warning("wantMarket not found", []);
    return ethereum.CallResult.fromValue(BIGINT_ZERO);
  }
  const wantMarketDecimals = Token.load(wantMarket.inputToken)!.decimals;

  let priceBD: BigDecimal;
  if (whichPrice) {
    const reserveBalance0 = tryReserves.value.value0
      .toBigDecimal()
      .div(exponentToBigDecimal(wantMarketDecimals));
    const reserveBalance1 = tryReserves.value.value1
      .toBigDecimal()
      .div(exponentToBigDecimal(knownMarketDecimals));

    // price of reserve0 = price of reserve1 / (reserve0 / reserve1)
    priceBD = knownPriceUSD.div(reserveBalance1.div(reserveBalance0));
  } else {
    const reserveBalance0 = tryReserves.value.value0
      .toBigDecimal()
      .div(exponentToBigDecimal(knownMarketDecimals));
    const reserveBalance1 = tryReserves.value.value1
      .toBigDecimal()
      .div(exponentToBigDecimal(wantMarketDecimals));

    // price of reserve1 = price of reserve0 * (reserve0 / reserve1)
    priceBD = knownPriceUSD.times(reserveBalance0.div(reserveBalance1));
  }

  log.warning(
    "wtf, price is: ${} LP: {} reserve0: {} reserve1: {} known price: ${}",
    [
      priceBD.toString(),
      lpAddress.toHexString(),
      tryReserves.value.value0.toString(),
      tryReserves.value.value1.toString(),
      knownPriceUSD.toString(),
    ]
  );

  // TODO: remove
  log.warning("{} costs ${}", [wantAddress.toHexString(), priceBD.toString()]);

  // convert back to BigInt
  return ethereum.CallResult.fromValue(
    BigInt.fromString(
      priceBD
        .times(exponentToBigDecimal(wantMarketDecimals))
        .truncate(0)
        .toString()
    )
  );
}
