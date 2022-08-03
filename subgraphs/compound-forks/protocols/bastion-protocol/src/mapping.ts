import { Address, BigInt, log } from "@graphprotocol/graph-ts";
// import from the generated at root in order to reuse methods from root
import {
  NewPriceOracle,
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
  ActionPaused1,
  MarketExited,
  MarketEntered,
} from "../../../generated/Comptroller/Comptroller";
import {
  Mint,
  Redeem,
  Borrow as BorrowEvent,
  RepayBorrow,
  LiquidateBorrow,
  AccrueInterest,
  NewReserveFactor,
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
  SECONDS_PER_DAY,
  RewardTokenType,
  exponentToBigDecimal,
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
} from "../../../src/mapping";
// otherwise import from the specific subgraph root
import { CToken } from "../../../generated/Comptroller/CToken";
import { Comptroller } from "../../../generated/Comptroller/Comptroller";
import { CToken as CTokenTemplate } from "../../../generated/templates";
import { ERC20 } from "../../../generated/Comptroller/ERC20";
import {
  comptrollerAddr,
  nativeCToken,
  nativeToken,
  REWARD_TOKENS,
} from "./constants";
import { PriceOracle } from "../../../generated/templates/CToken/PriceOracle";
import {
  RewardSupplySpeedUpdated,
  RewardBorrowSpeedUpdated,
} from "../../../generated/RewardDistributor/RewardDistributor";

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let protocol = getOrCreateProtocol();
  let newPriceOracle = event.params.newPriceOracle;
  _handleNewPriceOracle(protocol, newPriceOracle);
}

export function handleMarketEntered(event: MarketEntered): void {
  _handleMarketEntered(
    event.params.cToken.toHexString(),
    event.params.account.toHexString(),
    true
  );
}

export function handleMarketExited(event: MarketExited): void {
  _handleMarketEntered(
    event.params.cToken.toHexString(),
    event.params.account.toHexString(),
    false
  );
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

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  let marketID = event.params.cToken.toHexString();
  let collateralFactorMantissa = event.params.newCollateralFactorMantissa;
  _handleNewCollateralFactor(marketID, collateralFactorMantissa);
}

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive
): void {
  let protocol = getOrCreateProtocol();
  let newLiquidationIncentive = event.params.newLiquidationIncentiveMantissa;
  _handleNewLiquidationIncentive(protocol, newLiquidationIncentive);
}

export function handleActionPaused(event: ActionPaused1): void {
  let marketID = event.params.cToken.toHexString();
  let action = event.params.action;
  let pauseState = event.params.pauseState;
  _handleActionPaused(marketID, action, pauseState);
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  let marketID = event.address.toHexString();
  let newReserveFactorMantissa = event.params.newReserveFactorMantissa;
  _handleNewReserveFactor(marketID, newReserveFactorMantissa);
}

export function handleMint(event: Mint): void {
  let minter = event.params.minter;
  let mintAmount = event.params.mintAmount;
  let contract = CToken.bind(event.address);
  let balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
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
  let redeemer = event.params.redeemer;
  let redeemAmount = event.params.redeemAmount;
  let contract = CToken.bind(event.address);
  let balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
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
  let borrower = event.params.borrower;
  let borrowAmount = event.params.borrowAmount;
  let contract = CToken.bind(event.address);
  let borrowBalanceStoredResult = contract.try_borrowBalanceStored(
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
  let borrower = event.params.borrower;
  let payer = event.params.payer;
  let repayAmount = event.params.repayAmount;
  let contract = CToken.bind(event.address);
  let borrowBalanceStoredResult = contract.try_borrowBalanceStored(
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
  let cTokenCollateral = event.params.cTokenCollateral;
  let liquidator = event.params.liquidator;
  let borrower = event.params.borrower;
  let seizeTokens = event.params.seizeTokens;
  let repayAmount = event.params.repayAmount;
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
  let marketAddress = event.address;
  // update rewards for market
  updateRewardsPrices(marketAddress);

  let cTokenContract = CToken.bind(marketAddress);
  let protocol = getOrCreateProtocol();
  let oracleContract = PriceOracle.bind(
    Address.fromString(protocol._priceOracle)
  );
  let updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_supplyRatePerBlock(),
    cTokenContract.try_borrowRatePerBlock(),
    oracleContract.try_getUnderlyingPrice(marketAddress),
    SECONDS_PER_YEAR
  );
  let interestAccumulated = event.params.interestAccumulated;
  let totalBorrows = event.params.totalBorrows;
  _handleAccrueInterest(
    updateMarketData,
    comptrollerAddr,
    interestAccumulated,
    totalBorrows,
    event
  );
}

export function handleRewardSupplySpeedUpdated(
  event: RewardSupplySpeedUpdated
): void {
  let market = Market.load(event.params.cToken.toHexString());
  if (!market) {
    log.warning("[handleRewardSupplySpeedUpdate] Market not found", [
      event.params.cToken.toHexString(),
    ]);
    return;
  }

  let rewardTokenAddress = REWARD_TOKENS[event.params.rewardType];
  let token = Token.load(rewardTokenAddress.toHexString());
  if (!token) {
    log.warning("[handleSupplySpeedUpdate] Token not found", [
      rewardTokenAddress.toHexString(),
    ]);
    return;
  }
  let rewardSpeed = event.params.newSpeed.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );
  let rewardToken = getOrCreateRewardToken(token, RewardTokenType.DEPOSIT);

  updateRewards(market, rewardToken, rewardSpeed);
}

export function handleRewardBorrowSpeedUpdated(
  event: RewardBorrowSpeedUpdated
): void {
  let market = Market.load(event.params.cToken.toHexString());
  if (!market) {
    log.warning("[handleRewardBorrowSpeedUpdate] Market not found", [
      event.params.cToken.toHexString(),
    ]);
    return;
  }

  let rewardTokenAddress = REWARD_TOKENS[event.params.rewardType];
  let token = Token.load(rewardTokenAddress.toHexString());
  if (!token) {
    log.warning("[handleBorrowSpeedUpdate] Token not found", [
      rewardTokenAddress.toHexString(),
    ]);
    return;
  }
  let rewardSpeed = event.params.newSpeed.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );
  let rewardToken = getOrCreateRewardToken(token, RewardTokenType.BORROW);

  updateRewards(market, rewardToken, rewardSpeed);
}

function getOrCreateProtocol(): LendingProtocol {
  let comptroller = Comptroller.bind(comptrollerAddr);
  let protocolData = new ProtocolData(
    comptrollerAddr,
    "Bastion Protocol",
    "bastion-protocol",
    "2.0.1",
    "1.1.0",
    "1.0.0",
    Network.AURORA,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );
  return _getOrCreateProtocol(protocolData);
}

//
//
// Update the rewards arrays in a given market
// can be done for supply / borrow side triggered by Supply/BorrowSpeedUpdate events
function updateRewards(
  market: Market,
  rewardToken: RewardToken,
  rewardsPerDay: BigInt
): void {
  let token = Token.load(rewardToken.token);
  if (!token) {
    log.warning("[updateRewards] Token not found", [rewardToken.id]);
    return;
  }
  let rewardTokenPrice = token.lastPriceUSD!;

  let rewardTokens = market.rewardTokens;
  let rewardEmissions = market.rewardTokenEmissionsAmount;
  let rewardEmissionsUSD = market.rewardTokenEmissionsUSD;
  let isAdded = false; // tracks if reward token is added yet
  if (rewardTokens) {
    // try to find index of rewards
    for (let i = 0; i < rewardTokens.length; i++) {
      if (rewardTokens[i].toLowerCase() === rewardToken.id.toLowerCase()) {
        rewardEmissions![i] = rewardsPerDay;
        rewardEmissionsUSD![i] = rewardsPerDay
          .toBigDecimal()
          .div(exponentToBigDecimal(token.decimals))
          .times(rewardTokenPrice);
        isAdded = true;
        break;
      }
    }
  } else {
    // if no rewards yet, create new array
    rewardTokens = [rewardToken.id];
    rewardEmissions = [rewardsPerDay];
    rewardEmissionsUSD = [
      rewardsPerDay
        .toBigDecimal()
        .div(exponentToBigDecimal(token.decimals))
        .times(rewardTokenPrice),
    ];
    isAdded = true;
  }

  // add token to the end of the existing array
  if (!isAdded) {
    rewardTokens.push(rewardToken.id);
    rewardEmissions!.push(rewardsPerDay);
    rewardEmissionsUSD!.push(
      rewardsPerDay
        .toBigDecimal()
        .div(exponentToBigDecimal(token.decimals))
        .times(rewardTokenPrice)
    );
  }

  market.rewardTokens = rewardTokens;
  market.rewardTokenEmissionsAmount = rewardEmissions;
  market.rewardTokenEmissionsUSD = rewardEmissionsUSD;
  market.save();
}

//
//
// market.rewardTokenEmissionsUSD
// both wNEAR and BSTN prices can be updated from cTokens
function updateRewardsPrices(marketAddress: Address): void {
  let market = Market.load(marketAddress.toHexString());
  if (!market) {
    log.warning("[updateRewardsPrices] Market not found", [
      marketAddress.toHexString(),
    ]);
    return;
  }

  if (market.rewardTokens) {
    for (let i = 0; i < market.rewardTokens!.length; i++) {
      let rewardToken = RewardToken.load(market.rewardTokens![i]);
      let token = Token.load(rewardToken!.token);

      market.rewardTokenEmissionsUSD![i] = market
        .rewardTokenEmissionsAmount![i].toBigDecimal()
        .div(exponentToBigDecimal(token!.decimals))
        .times(token!.lastPriceUSD!);
    }
    market.save();
  }
}

function getOrCreateRewardToken(token: Token, type: string): RewardToken {
  let rewardTokenId = type + "-" + token.id;
  let rewardToken = RewardToken.load(rewardTokenId);

  if (!rewardToken) {
    rewardToken = new RewardToken(rewardTokenId);
    rewardToken.token = token.id;
    rewardToken.type = type;
    rewardToken.save();
  }

  return rewardToken;
}
