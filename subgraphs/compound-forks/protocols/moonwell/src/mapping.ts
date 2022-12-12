import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
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
  RewardTokenType,
  BIGDECIMAL_ZERO,
  exponentToBigDecimal,
  SECONDS_PER_DAY,
  equalsIgnoreCase,
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
import { PriceOracle } from "../../../generated/templates/CToken/PriceOracle";
import { getProtocolData } from "./constants";

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
  const protocolData = getProtocolData();
  _handleMarketEntered(
    protocolData.comptrollerAddress,
    event.params.mToken.toHexString(),
    event.params.account.toHexString(),
    true
  );
}

export function handleMarketExited(event: MarketExited): void {
  const protocolData = getProtocolData();
  _handleMarketEntered(
    protocolData.comptrollerAddress,
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
  const protocolData = getProtocolData();
  if (cTokenAddr == protocolData.nativeCToken.address) {
    const marketListedData = new MarketListedData(
      protocol,
      protocolData.nativeToken,
      protocolData.nativeCToken,
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
  const outputTokenSupplyResult = contract.try_totalSupply();
  const balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.minter
  );
  const protocolData = getProtocolData();
  _handleMint(
    protocolData.comptrollerAddress,
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
  const protocolData = getProtocolData();
  _handleRedeem(
    protocolData.comptrollerAddress,
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
  const protocolData = getProtocolData();
  _handleBorrow(
    protocolData.comptrollerAddress,
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
  const protocolData = getProtocolData();
  _handleRepayBorrow(
    protocolData.comptrollerAddress,
    borrower,
    payer,
    repayAmount,
    borrowBalanceStoredResult,
    totalBorrows,
    event
  );
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  const cTokenCollateral = event.params.mTokenCollateral;
  const liquidator = event.params.liquidator;
  const borrower = event.params.borrower;
  const seizeTokens = event.params.seizeTokens;
  const repayAmount = event.params.repayAmount;
  const protocolData = getProtocolData();
  _handleLiquidateBorrow(
    protocolData.comptrollerAddress,
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
  const protocolData = getProtocolData();
  _handleAccrueInterest(
    updateMarketData,
    protocolData.comptrollerAddress,
    interestAccumulated,
    totalBorrows,
    false, // do not update all prices
    event
  );
}

export function handleTransfer(event: Transfer): void {
  const protocolData = getProtocolData();
  _handleTransfer(
    event,
    event.address.toHexString(),
    event.params.to,
    event.params.from,
    protocolData.comptrollerAddress
  );
}

function getOrCreateProtocol(): LendingProtocol {
  const protocolData = getProtocolData();
  const comptroller = Comptroller.bind(protocolData.comptrollerAddress);
  const data = new ProtocolData(
    protocolData.comptrollerAddress,
    "Moonwell",
    "moonwell",
    protocolData.network,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );

  return _getOrCreateProtocol(data);
}

function initMarketRewards(marketID: string): void {
  const market = Market.load(marketID);
  if (!market) {
    log.warning("[initMarketRewards] market not found: {}", [marketID]);
    return;
  }
  const protocolData = getProtocolData();

  // Moonriver rewardTokens = [BORROW-MOVR, BORROW-MFAM, DEPOSIT-MOVR, DEPOSIT-MFAM]
  // Moonbeam rewardTokens = [BORROW-GLMR, BORROW-WELL, DEPOSIT-GLMR, DEPOSIT-WELL]
  let _rewardToken0 = Token.load(
    protocolData.nativeToken.address.toHexString()
  );
  if (!_rewardToken0) {
    _rewardToken0 = new Token(protocolData.nativeToken.address.toHexString());
    _rewardToken0.name = protocolData.nativeToken.name;
    _rewardToken0.symbol = protocolData.nativeToken.symbol;
    _rewardToken0.decimals = protocolData.nativeToken.decimals;
    _rewardToken0.save();
  }
  const rewardToken0 = _rewardToken0;
  let _rewardToken1 = Token.load(
    protocolData.auxilaryRewardToken.address.toHexString()
  );
  if (!_rewardToken1) {
    _rewardToken1 = new Token(
      protocolData.auxilaryRewardToken.address.toHexString()
    );
    _rewardToken1.name = protocolData.auxilaryRewardToken.name;
    _rewardToken1.symbol = protocolData.auxilaryRewardToken.symbol;
    _rewardToken1.decimals = protocolData.auxilaryRewardToken.decimals;
    _rewardToken1.save();
  }
  const rewardToken1 = _rewardToken1;

  let supplyRewardToken0 = RewardToken.load(
    RewardTokenType.DEPOSIT.concat("-").concat(rewardToken0.id)
  );
  if (!supplyRewardToken0) {
    supplyRewardToken0 = new RewardToken(
      RewardTokenType.DEPOSIT.concat("-").concat(rewardToken0.id)
    );
    supplyRewardToken0.token = rewardToken0!.id;
    supplyRewardToken0.type = RewardTokenType.DEPOSIT;
    supplyRewardToken0.save();
  }

  let supplyRewardToken1 = RewardToken.load(
    RewardTokenType.DEPOSIT.concat("-").concat(rewardToken1.id)
  );
  if (!supplyRewardToken1) {
    supplyRewardToken1 = new RewardToken(
      RewardTokenType.DEPOSIT.concat("-").concat(rewardToken1.id)
    );
    supplyRewardToken1.token = rewardToken1!.id;
    supplyRewardToken1.type = RewardTokenType.DEPOSIT;
    supplyRewardToken1.save();
  }

  let borrowRewardToken0 = RewardToken.load(
    RewardTokenType.BORROW.concat("-").concat(rewardToken0.id)
  );
  if (!borrowRewardToken0) {
    borrowRewardToken0 = new RewardToken(
      RewardTokenType.BORROW.concat("-").concat(rewardToken0.id)
    );
    borrowRewardToken0.token = rewardToken0!.id;
    borrowRewardToken0.type = RewardTokenType.BORROW;
    borrowRewardToken0.save();
  }

  let borrowRewardToken1 = RewardToken.load(
    RewardTokenType.BORROW.concat("-").concat(rewardToken1.id)
  );
  if (!borrowRewardToken1) {
    borrowRewardToken1 = new RewardToken(
      RewardTokenType.BORROW.concat("-").concat(rewardToken1.id)
    );
    borrowRewardToken1.token = rewardToken1!.id;
    borrowRewardToken1.type = RewardTokenType.BORROW;
    borrowRewardToken1.save();
  }

  market.rewardTokens = [
    borrowRewardToken0.id,
    borrowRewardToken1.id,
    supplyRewardToken0.id,
    supplyRewardToken1.id,
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
  const protocolData = getProtocolData();

  const nativeMarket = Market.load(
    protocolData.nativeCToken.address.toHexString()
  );
  if (!nativeMarket) {
    log.warning("[setMarketRewards] nativeMarket not found: {}", [
      protocolData.nativeCToken.address.toHexString(),
    ]);
    return;
  }
  const token0PriceUSD = nativeMarket.inputTokenPriceUSD;
  let token1PriceUSD = BIGDECIMAL_ZERO;
  if (blockNumber >= protocolData.nativeLPStartBlock) {
    let oneAuxillaryInNative = BIGDECIMAL_ZERO;
    if (equalsIgnoreCase(dataSource.network(), Network.MOONRIVER)) {
      oneAuxillaryInNative = getOneMFAMInMOVR(protocolData.nativeLPAddress);
    } else {
      oneAuxillaryInNative = getOneWELLInGLMR(protocolData.nativeLPAddress);
    }
    token1PriceUSD = oneAuxillaryInNative.times(token0PriceUSD);
  }
  const comptroller = Comptroller.bind(protocolData.comptrollerAddress);

  // In Comptroller, 0 = MFAM, 1 = MOVR || 0 = WELL, 1 = GLMR
  const supplyNativeEmission = getRewardTokenEmission(
    comptroller.try_supplyRewardSpeeds(1, marketAddress),
    18,
    token0PriceUSD
  );
  const supplyAuxEmission = getRewardTokenEmission(
    comptroller.try_supplyRewardSpeeds(0, marketAddress),
    18,
    token1PriceUSD
  );
  const borrowNativeEmission = getRewardTokenEmission(
    comptroller.try_borrowRewardSpeeds(1, marketAddress),
    18,
    token0PriceUSD
  );
  const borrowAuxEmission = getRewardTokenEmission(
    comptroller.try_borrowRewardSpeeds(0, marketAddress),
    18,
    token1PriceUSD
  );

  market.rewardTokenEmissionsAmount = [
    borrowNativeEmission.amount,
    borrowAuxEmission.amount,
    supplyNativeEmission.amount,
    supplyAuxEmission.amount,
  ];
  market.rewardTokenEmissionsUSD = [
    borrowNativeEmission.USD,
    borrowAuxEmission.USD,
    supplyNativeEmission.USD,
    supplyAuxEmission.USD,
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
function getOneMFAMInMOVR(lpAddress: Address): BigDecimal {
  const lpTokenContract = SolarBeamLPToken.bind(lpAddress);
  const getReservesResult = lpTokenContract.try_getReserves();
  if (getReservesResult.reverted) {
    log.warning("[getOneMFAMInMOVR] result reverted", []);
    return BIGDECIMAL_ZERO;
  }
  const MOVRReserve = getReservesResult.value.value0;
  const MFAMReserve = getReservesResult.value.value1;
  return MOVRReserve.toBigDecimal().div(MFAMReserve.toBigDecimal());
}

// Fetch WELL vs GLMR price from SolarBeam
function getOneWELLInGLMR(lpAddress: Address): BigDecimal {
  const lpTokenContract = SolarBeamLPToken.bind(lpAddress);
  const getReservesResult = lpTokenContract.try_getReserves();
  if (getReservesResult.reverted) {
    log.warning("[getOneWELLInGLMR] result reverted", []);
    return BIGDECIMAL_ZERO;
  }
  const GLMRReserve = getReservesResult.value.value1;
  const WELLReserve = getReservesResult.value.value0;
  return GLMRReserve.toBigDecimal().div(WELLReserve.toBigDecimal());
}
