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
import {
  LendingProtocol,
  Market,
  RewardToken,
  Token,
} from "../../../generated/schema";
import {
  cTokenDecimals,
  Network,
  BIGINT_ZERO,
  SECONDS_PER_YEAR,
  InterestRateSide,
  RewardTokenType,
  BIGDECIMAL_ZERO,
  exponentToBigDecimal,
  SECONDS_PER_DAY,
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
  _handleMarketEntered,
  _handleTransfer,
} from "../../../src/mapping";
// otherwise import from the specific subgraph root
import { CToken } from "../../../generated/Comptroller/CToken";
import {
  ActionPaused1,
  Comptroller,
} from "../../../generated/Comptroller/Comptroller";
import { SolarBeamLPToken } from "../../../generated/templates/CToken/SolarBeamLPToken";
import { CToken as CTokenTemplate } from "../../../generated/templates";
import { ERC20 } from "../../../generated/Comptroller/ERC20";
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
import { PriceOracle } from "../../../generated/templates/CToken/PriceOracle";

class RewardTokenEmission {
  amount: BigInt;
  USD: BigDecimal;
  constructor(amount: BigInt, USD: BigDecimal) {
    this.amount = amount;
    this.USD = USD;
  }
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  const protocol = getOrCreateProtocol();
  const newPriceOracle = event.params.newPriceOracle;
  _handleNewPriceOracle(protocol, newPriceOracle);
}

export function handleMarketEntered(event: MarketEntered): void {
  _handleMarketEntered(
    comptrollerAddr,
    event.params.mToken.toHexString(),
    event.params.account.toHexString(),
    true
  );
}

export function handleMarketExited(event: MarketExited): void {
  _handleMarketEntered(
    comptrollerAddr,
    event.params.mToken.toHexString(),
    event.params.account.toHexString(),
    false
  );
}

export function handleMarketListed(event: MarketListed): void {
  CTokenTemplate.create(event.params.mToken);

  const cTokenAddr = event.params.mToken;
  const cToken = Token.load(cTokenAddr.toHexString());
  if (cToken != null) {
    return;
  }
  // this is a new cToken, a new underlying token, and a new market

  const protocol = getOrCreateProtocol();
  const cTokenContract = CToken.bind(event.params.mToken);
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
    initMarketRewards(cTokenAddr.toHexString());
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
  initMarketRewards(cTokenAddr.toHexString());
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  const marketID = event.params.mToken.toHexString();
  const collateralFactorMantissa = event.params.newCollateralFactorMantissa;
  _handleNewCollateralFactor(marketID, collateralFactorMantissa);
}

export function handleActionPaused(event: ActionPaused1): void {
  const marketID = event.params.mToken.toHexString();
  const market = Market.load(marketID);
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
  const protocol = getOrCreateProtocol();
  const newLiquidationIncentive = event.params.newLiquidationIncentiveMantissa;
  _handleNewLiquidationIncentive(protocol, newLiquidationIncentive);
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
  const balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.minter
  );
  _handleMint(
    comptrollerAddr,
    minter,
    mintAmount,
    balanceOfUnderlyingResult,
    event
  );
}

export function handleRedeem(event: Redeem): void {
  const redeemer = event.params.redeemer;
  const redeemAmount = event.params.redeemAmount;
  const contract = CToken.bind(event.address);
  const balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.redeemer
  );
  _handleRedeem(
    comptrollerAddr,
    redeemer,
    redeemAmount,
    balanceOfUnderlyingResult,
    event
  );
}

export function handleBorrow(event: BorrowEvent): void {
  const borrower = event.params.borrower;
  const borrowAmount = event.params.borrowAmount;
  const contract = CToken.bind(event.address);
  const borrowBalanceStoredResult = contract.try_borrowBalanceStored(
    event.params.borrower
  );
  _handleBorrow(
    comptrollerAddr,
    borrower,
    borrowAmount,
    borrowBalanceStoredResult,
    event
  );
}

export function handleRepayBorrow(event: RepayBorrow): void {
  const borrower = event.params.borrower;
  const payer = event.params.payer;
  const repayAmount = event.params.repayAmount;
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
    event
  );
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  const cTokenCollateral = event.params.mTokenCollateral;
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
  setMarketRewards(marketAddress, event.block.number.toI32());

  const cTokenContract = CToken.bind(marketAddress);
  const protocol = getOrCreateProtocol();
  const oracleContract = PriceOracle.bind(
    Address.fromString(protocol._priceOracle)
  );
  const updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_supplyRatePerTimestamp(),
    cTokenContract.try_borrowRatePerTimestamp(),
    oracleContract.try_getUnderlyingPrice(marketAddress),
    SECONDS_PER_YEAR
  );

  const interestAccumulated = event.params.interestAccumulated;
  const totalBorrows = event.params.totalBorrows;
  _handleAccrueInterest(
    updateMarketData,
    comptrollerAddr,
    interestAccumulated,
    totalBorrows,
    false, // do not update all prices
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
    "Moonwell",
    "moonwell",
    "2.0.1",
    "1.1.4",
    "1.0.0",
    Network.MOONRIVER,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );

  return _getOrCreateProtocol(protocolData);
}

// rewardTokens = [MFAM-supply, MOVR-supply, MFAM-borrow, MOVR-borrow]
function initMarketRewards(marketID: string): void {
  const market = Market.load(marketID);
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
  const marketID = marketAddress.toHexString();
  const market = Market.load(marketID);
  if (!market) {
    log.warning("[setMarketRewards] Market not found: {}", [marketID]);
    return;
  }

  const MOVRMarket = Market.load(mMOVRAddr.toHexString());
  if (!MOVRMarket) {
    log.warning("[setMarketRewards] mMOVR market not found: {}", [
      mMOVRAddr.toHexString(),
    ]);
    return;
  }

  const MOVRPriceUSD = MOVRMarket.inputTokenPriceUSD;
  let MFAMPriceUSD = BIGDECIMAL_ZERO;
  if (blockNumber >= SolarBeamMfamMovrPairStartBlock) {
    const oneMFAMInMOVR = getOneMFAMInMOVR();
    MFAMPriceUSD = MOVRPriceUSD.times(oneMFAMInMOVR);
  }
  const comptroller = Comptroller.bind(comptrollerAddr);

  // In Comptroller, 0 = MFAM, 1 = MOVR
  const supplyMFAMEmission = getRewardTokenEmission(
    comptroller.try_supplyRewardSpeeds(0, marketAddress),
    18,
    MFAMPriceUSD
  );
  const supplyMOVREmission = getRewardTokenEmission(
    comptroller.try_supplyRewardSpeeds(1, marketAddress),
    18,
    MOVRPriceUSD
  );
  const borrowMFAMEmission = getRewardTokenEmission(
    comptroller.try_borrowRewardSpeeds(0, marketAddress),
    18,
    MFAMPriceUSD
  );
  const borrowMOVREmission = getRewardTokenEmission(
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
  const rewardAmountPerSecond = rewardSpeedsResult.value;
  const rewardAmount = rewardAmountPerSecond.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );
  const rewardUSD = rewardAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(tokenDecimals))
    .times(tokenPriceUSD);
  return new RewardTokenEmission(rewardAmount, rewardUSD);
}

// Fetch MFAM vs MOVR price from SolarBeam, as suggested by Luke, Moonwell's CEO.
function getOneMFAMInMOVR(): BigDecimal {
  const lpTokenContract = SolarBeamLPToken.bind(SolarBeamMfamMovrPairAddr);
  const getReservesResult = lpTokenContract.try_getReserves();
  if (getReservesResult.reverted) {
    log.warning("[getOneMFAMInMOVR] result reverted", []);
    return BIGDECIMAL_ZERO;
  }
  const MOVRReserve = getReservesResult.value.value0;
  const MFAMReserve = getReservesResult.value.value1;
  return MOVRReserve.toBigDecimal().div(MFAMReserve.toBigDecimal());
}
