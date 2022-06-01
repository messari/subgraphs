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
import {
  LendingProtocol,
  Market,
  RewardToken,
  Token,
} from "../../generated/schema";
import {
  cTokenDecimals,
  Network,
  BIGINT_ZERO,
  SECONDS_PER_YEAR,
  InterestRateSide,
  RewardTokenType,
  BIGDECIMAL_ZERO,
  exponentToBigDecimal,
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
} from "../../src/mapping";
// otherwise import from the specific subgraph root
import { CToken } from "../generated/Comptroller/CToken";
import {
  ActionPaused1,
  Comptroller,
} from "../generated/Comptroller/Comptroller";
import { SolarBeamLPToken } from "../generated/templates/CToken/SolarBeamLPToken";
import { CToken as CTokenTemplate } from "../generated/templates";
import { ERC20 } from "../generated/Comptroller/ERC20";
import {
  comptrollerAddr,
  MFAMAddr,
  mMOVRAddr,
  MOVRAddr,
  nativeCToken,
  nativeToken,
  SolarBeamMfamMovrPairAddr,
  SolarBeamMfamMovrPairStartBlock,
} from "./constants";
import { PriceOracle } from "../generated/templates/CToken/PriceOracle";

class RewardTokenEmission {
  amount: BigInt;
  USD: BigDecimal;
  constructor(amount: BigInt, USD: BigDecimal) {
    this.amount = amount;
    this.USD = USD;
  }
}

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
  if (cTokenAddr == nativeCToken.address) {
    let marketListedData = new MarketListedData(
      protocol,
      nativeToken,
      nativeCToken,
      cTokenReserveFactorMantissa
    );
    _handleMarketListed(marketListedData, event);
    initMarketRewards(cTokenAddr.toHexString());
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
  initMarketRewards(cTokenAddr.toHexString());
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  _handleNewCollateralFactor(event);
}

export function handleActionPaused(event: ActionPaused1): void {
  let marketID = event.params.mToken.toHexString();
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[handleActionPaused] Market not found: {}", [marketID]);
    return;
  }

  if (event.params.action == "Mint") {
    market.isActive = event.params.pauseState;
  } else if (event.params.action == "Borrow") {
    market.canBorrowFrom = event.params.pauseState;
  }

  market.save();
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
  setMarketRewards(marketAddress, event.block.number.toI32());

  let cTokenContract = CToken.bind(marketAddress);
  let protocol = getOrCreateProtocol();
  let oracleContract = PriceOracle.bind(
    Address.fromString(protocol._priceOracle)
  );
  let updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_supplyRatePerTimestamp(),
    cTokenContract.try_borrowRatePerTimestamp(),
    oracleContract.try_getUnderlyingPrice(marketAddress),
    SECONDS_PER_YEAR
  );

  _handleAccrueInterest(updateMarketData, comptrollerAddr, event);
}

function getOrCreateProtocol(): LendingProtocol {
  let comptroller = Comptroller.bind(comptrollerAddr);
  let protocolData = new ProtocolData(
    comptrollerAddr,
    "Moonwell",
    "moonwell",
    "1.2.1",
    "1.0.5",
    "1.0.0",
    Network.MOONRIVER,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );

  return _getOrCreateProtocol(protocolData);
}

// rewardTokens = [MFAM-supply, MOVR-supply, MFAM-borrow, MOVR-borrow]
function initMarketRewards(marketID: string): void {
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[initMarketRewards] market not found: {}", [marketID]);
    return;
  }

  let MFAMToken = Token.load(MFAMAddr.toHexString());
  if (!MFAMToken) {
    MFAMToken = new Token(MFAMAddr.toHexString());
    MFAMToken.name = "MFAM";
    MFAMToken.symbol = "MFAM";
    MFAMToken.decimals = 18;
    MFAMToken.save();
  }
  let MOVRToken = Token.load(MOVRAddr.toHexString());
  if (!MOVRToken) {
    MOVRToken = new Token(MOVRAddr.toHexString());
    MOVRToken.name = "MOVR";
    MOVRToken.symbol = "MOVR";
    MOVRToken.decimals = 18;
    MOVRToken.save();
  }

  let supplyRewardToken0 = RewardToken.load(
    InterestRateSide.LENDER.concat("-").concat(MFAMAddr.toHexString())
  );
  if (!supplyRewardToken0) {
    supplyRewardToken0 = new RewardToken(
      InterestRateSide.LENDER.concat("-").concat(MFAMAddr.toHexString())
    );
    supplyRewardToken0.token = MFAMToken.id;
    supplyRewardToken0.type = RewardTokenType.DEPOSIT;
    supplyRewardToken0.save();
  }

  let supplyRewardToken1 = RewardToken.load(
    InterestRateSide.LENDER.concat("-").concat(MOVRAddr.toHexString())
  );
  if (!supplyRewardToken1) {
    supplyRewardToken1 = new RewardToken(
      InterestRateSide.LENDER.concat("-").concat(MOVRAddr.toHexString())
    );
    supplyRewardToken1.token = MOVRToken.id;
    supplyRewardToken1.type = RewardTokenType.DEPOSIT;
    supplyRewardToken1.save();
  }

  let borrowRewardToken0 = RewardToken.load(
    InterestRateSide.BORROWER.concat("-").concat(MFAMAddr.toHexString())
  );
  if (!borrowRewardToken0) {
    borrowRewardToken0 = new RewardToken(
      InterestRateSide.BORROWER.concat("-").concat(MFAMAddr.toHexString())
    );
    borrowRewardToken0.token = MFAMToken.id;
    borrowRewardToken0.type = RewardTokenType.BORROW;
    borrowRewardToken0.save();
  }

  let borrowRewardToken1 = RewardToken.load(
    InterestRateSide.BORROWER.concat("-").concat(MOVRAddr.toHexString())
  );
  if (!borrowRewardToken1) {
    borrowRewardToken1 = new RewardToken(
      InterestRateSide.BORROWER.concat("-").concat(MOVRAddr.toHexString())
    );
    borrowRewardToken1.token = MOVRToken.id;
    borrowRewardToken1.type = RewardTokenType.BORROW;
    borrowRewardToken1.save();
  }

  market.rewardTokens = [
    supplyRewardToken0.id,
    supplyRewardToken1.id,
    borrowRewardToken0.id,
    borrowRewardToken1.id,
  ];
  market.rewardTokenEmissionsAmount = [
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
  ];
  market.rewardTokenEmissionsUSD = [
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
    BIGDECIMAL_ZERO,
  ];
  market.save();
}

function setMarketRewards(marketAddress: Address, blockNumber: i32): void {
  let marketID = marketAddress.toHexString();
  let market = Market.load(marketID);
  if (!market) {
    log.warning("[setMarketRewards] Market not found: {}", [marketID]);
    return;
  }

  let MOVRMarket = Market.load(mMOVRAddr.toHexString());
  if (!MOVRMarket) {
    log.warning("[setMarketRewards] mMOVR market not found: {}", [
      mMOVRAddr.toHexString(),
    ]);
    return;
  }

  let MOVRPriceUSD = MOVRMarket.inputTokenPriceUSD;
  let MFAMPriceUSD = BIGDECIMAL_ZERO;
  if (blockNumber >= SolarBeamMfamMovrPairStartBlock) {
    let oneMFAMInMOVR = getOneMFAMInMOVR();
    MFAMPriceUSD = MOVRPriceUSD.times(oneMFAMInMOVR);
  }
  let comptroller = Comptroller.bind(comptrollerAddr);

  // In Comptroller, 0 = MFAM, 1 = MOVR
  let supplyMFAMEmission = getRewardTokenEmission(
    comptroller.try_supplyRewardSpeeds(0, marketAddress),
    18,
    MFAMPriceUSD
  );
  let supplyMOVREmission = getRewardTokenEmission(
    comptroller.try_supplyRewardSpeeds(1, marketAddress),
    18,
    MOVRPriceUSD
  );
  let borrowMFAMEmission = getRewardTokenEmission(
    comptroller.try_borrowRewardSpeeds(0, marketAddress),
    18,
    MFAMPriceUSD
  );
  let borrowMOVREmission = getRewardTokenEmission(
    comptroller.try_borrowRewardSpeeds(1, marketAddress),
    18,
    MOVRPriceUSD
  );

  market.rewardTokenEmissionsAmount = [
    supplyMFAMEmission.amount,
    supplyMOVREmission.amount,
    borrowMFAMEmission.amount,
    borrowMOVREmission.amount,
  ];
  market.rewardTokenEmissionsUSD = [
    supplyMFAMEmission.USD,
    supplyMOVREmission.USD,
    borrowMFAMEmission.USD,
    borrowMOVREmission.USD,
  ];
  market.save();
}

function getRewardTokenEmission(
  rewardSpeedsResult: ethereum.CallResult<BigInt>,
  tokenDecimals: i32,
  tokenPriceUSD: BigDecimal
): RewardTokenEmission {
  if (rewardSpeedsResult.reverted) {
    log.warning("[getRewardTokenEmission] result reverted", []);
    return new RewardTokenEmission(BIGINT_ZERO, BIGDECIMAL_ZERO);
  }
  let rewardAmountPerSecond = rewardSpeedsResult.value;
  let rewardAmount = rewardAmountPerSecond.times(
    BigInt.fromI32(SECONDS_PER_YEAR)
  );
  let rewardUSD = rewardAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(tokenDecimals))
    .times(tokenPriceUSD);
  return new RewardTokenEmission(rewardAmount, rewardUSD);
}

// Fetch MFAM vs MOVR price from SolarBeam, as suggested by Luke, Moonwell's CEO.
function getOneMFAMInMOVR(): BigDecimal {
  let lpTokenContract = SolarBeamLPToken.bind(SolarBeamMfamMovrPairAddr);
  let getReservesResult = lpTokenContract.try_getReserves();
  if (getReservesResult.reverted) {
    log.warning("[getOneMFAMInMOVR] result reverted", []);
    return BIGDECIMAL_ZERO;
  }
  let MOVRReserve = getReservesResult.value.value0;
  let MFAMReserve = getReservesResult.value.value1;
  return MOVRReserve.toBigDecimal().div(MFAMReserve.toBigDecimal());
}
