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
  exponentToBigDecimal,
  RewardTokenType,
  BIGINT_ONE,
  SECONDS_PER_DAY,
  BIGDECIMAL_ZERO,
  SECONDS_PER_YEAR,
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
} from "../../../src/mapping";
// otherwise import from the specific subgraph root
import { CToken } from "../../../generated/Comptroller/CToken";
import { Comptroller } from "../../../generated/Comptroller/Comptroller";
import { CToken as CTokenTemplate } from "../../../generated/templates";
import { ERC20 } from "../../../generated/Comptroller/ERC20";
import { Pair } from "../../../generated/templates/CToken/Pair";
import {
  comptrollerAddr,
  DEFAULT_DECIMALS,
  nativeCToken,
  nativeToken,
  SONNE_ADDRESS,
  SONNE_USDC_LP,
  USDC_DECIMALS,
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
  const cTokenCollateral = event.params.cTokenCollateral;
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
    cTokenContract.try_supplyRatePerBlock(),
    cTokenContract.try_borrowRatePerBlock(),
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

  updateRewards(event.address);
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
    "Sonne Finance",
    "sonne-finance",
    Network.OPTIMISM,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );
  return _getOrCreateProtocol(protocolData);
}

/////////////////
//// Helpers ////
/////////////////

class RewardTokenEmission {
  constructor(
    public readonly amount: BigInt,
    public readonly amountUSD: BigDecimal
  ) {}
}

// calculate SONNE reward speeds
function updateRewards(marketID: Address): void {
  const market = Market.load(marketID.toHexString());
  if (!market) {
    log.warning("Market not found for address {}", [marketID.toHexString()]);
    return;
  }
  const comptroller = Comptroller.bind(comptrollerAddr);
  const tryBorrowRate = comptroller.try_compBorrowSpeeds(marketID);
  const trySupplyRate = comptroller.try_compSupplySpeeds(marketID);
  if (tryBorrowRate.reverted || trySupplyRate.reverted) {
    log.warning("Failed to get reward speed for market {}", [
      marketID.toHexString(),
    ]);
    return;
  }

  const borrowRewardToken = getOrCreateRewardToken(
    SONNE_ADDRESS,
    RewardTokenType.BORROW
  );
  const supplyRewardToken = getOrCreateRewardToken(
    SONNE_ADDRESS,
    RewardTokenType.DEPOSIT
  );

  const sonnePriceUSD = getSonnePrice();
  const borrowRewards = getRewardsPerDay(
    tryBorrowRate.value,
    borrowRewardToken,
    sonnePriceUSD
  );
  const supplyRewards = getRewardsPerDay(
    trySupplyRate.value,
    supplyRewardToken,
    sonnePriceUSD
  );

  market.rewardTokens = [borrowRewardToken.id, supplyRewardToken.id];
  market.rewardTokenEmissionsAmount = [
    borrowRewards.amount,
    supplyRewards.amount,
  ];
  market.rewardTokenEmissionsUSD = [
    borrowRewards.amountUSD,
    supplyRewards.amountUSD,
  ];
  market.save();
}

function getRewardsPerDay(
  rewardSpeed: BigInt,
  rewardToken: RewardToken | null,
  priceUSD: BigDecimal
): RewardTokenEmission {
  // Reward speed of <= 1 is 0
  if (rewardSpeed.gt(BIGINT_ONE) && rewardToken) {
    const token = getOrCreateToken(Address.fromString(rewardToken.token));
    const amount = rewardSpeed.times(BigInt.fromI64(SECONDS_PER_DAY));
    const amountUSD = amount
      .toBigDecimal()
      .div(exponentToBigDecimal(token.decimals))
      .times(priceUSD);
    return new RewardTokenEmission(amount, amountUSD);
  }

  return new RewardTokenEmission(BIGINT_ZERO, BIGDECIMAL_ZERO);
}

function getOrCreateRewardToken(
  tokenAddress: Address,
  type: string
): RewardToken {
  const rewardTokenId = type.concat("-").concat(tokenAddress.toHexString());
  let rewardToken = RewardToken.load(rewardTokenId);
  if (!rewardToken) {
    rewardToken = new RewardToken(rewardTokenId);
    rewardToken.token = getOrCreateToken(tokenAddress).id;
    rewardToken.type = type;
    rewardToken.save();
  }
  return rewardToken;
}

function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    const erc20Contract = ERC20.bind(tokenAddress);
    token.name = getOrElse(erc20Contract.try_name(), "Unknown");
    token.symbol = getOrElse(erc20Contract.try_symbol(), "UNKWN");
    token.decimals = getOrElse(erc20Contract.try_decimals(), 0);
    token.save();
  }
  return token;
}

function getPrice(
  marketAddress: Address,
  priceOracle: string
): ethereum.CallResult<BigInt> {
  // get the price normally
  const oracleContract = PriceOracle.bind(Address.fromString(priceOracle));
  return oracleContract.try_getUnderlyingPrice(marketAddress);
}

// get $SONNE price from SONNE/USDC lp pair on Velodrome
// SONNE/USDC was created before Sonne Finance was launched
function getSonnePrice(): BigDecimal {
  const lpPair = Pair.bind(SONNE_USDC_LP);
  const tryReserves = lpPair.try_getReserves();
  if (tryReserves.reverted) {
    log.warning("tryReserves reverted", []);
    return BIGDECIMAL_ZERO;
  }

  // no divide by zero
  if (
    tryReserves.value.value0.equals(BIGINT_ZERO) ||
    tryReserves.value.value1.equals(BIGINT_ZERO)
  ) {
    log.warning("tryReserves value is zero for LP: ", [
      SONNE_USDC_LP.toHexString(),
    ]);
    return BIGDECIMAL_ZERO;
  }

  // $SONNE = reserve1 / reserve0
  // Note: must normalize decimals
  const reserveBalance0 = tryReserves.value.value0
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS));
  const reserveBalance1 = tryReserves.value.value1
    .toBigDecimal()
    .div(exponentToBigDecimal(USDC_DECIMALS));

  return reserveBalance1.div(reserveBalance0);
}
