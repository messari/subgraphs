import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
// import from the generated at root in order to reuse methods from root
import {
  NewPriceOracle,
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
  ActionPausedMarket,
  MarketEntered,
  MarketExited,
  VenusSpeedUpdated,
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
  Token,
  RewardToken,
  Market,
} from "../../../generated/schema";
import {
  cTokenDecimals,
  exponentToBigDecimal,
  Network,
  BIGINT_ZERO,
  BSC_BLOCKS_PER_YEAR,
  RewardTokenType,
  BIGDECIMAL_ZERO,
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
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
} from "../../../src/mapping";
// otherwise import from the specific subgraph root
import { CToken } from "../../../generated/Comptroller/CToken";
import { Comptroller } from "../../../generated/Comptroller/Comptroller";
import {
  CToken as CTokenTemplate,
  VTokenV2 as VTokenV2Template,
} from "../../../generated/templates";
import { ERC20 } from "../../../generated/Comptroller/ERC20";
import {
  comptrollerAddr,
  nativeCToken,
  nativeToken,
  vXVS,
  XVS,
  VDAI_MARKET_ADDRESS,
  ORACLE_PRECISION,
} from "./constants";
import { PriceOracle } from "../../../generated/templates/CToken/PriceOracle";
import { getRewardsPerDay, RewardIntervalType } from "./rewards";

export function handleNewPriceOracle(event: NewPriceOracle): void {
  const protocol = getOrCreateProtocol();
  const newPriceOracle = event.params.newPriceOracle;
  _handleNewPriceOracle(protocol, newPriceOracle);
}

export function handleMarketEntered(event: MarketEntered): void {
  _handleMarketEntered(
    comptrollerAddr,
    event.params.vToken.toHexString(),
    event.params.account.toHexString(),
    true,
  );
}

export function handleMarketExited(event: MarketExited): void {
  _handleMarketEntered(
    comptrollerAddr,
    event.params.vToken.toHexString(),
    event.params.account.toHexString(),
    false,
  );
}

export function handleMarketListed(event: MarketListed): void {
  CTokenTemplate.create(event.params.vToken);
  VTokenV2Template.create(event.params.vToken);

  const cTokenAddr = event.params.vToken;
  const cToken = Token.load(cTokenAddr.toHexString());
  if (cToken != null) {
    return;
  }
  // this is a new cToken, a new underlying token, and a new market

  const protocol = getOrCreateProtocol();
  const cTokenContract = CToken.bind(event.params.vToken);
  const cTokenReserveFactorMantissa = getOrElse<BigInt>(
    cTokenContract.try_reserveFactorMantissa(),
    BIGINT_ZERO,
  );
  if (cTokenAddr == nativeCToken.address) {
    const marketListedData = new MarketListedData(
      protocol,
      nativeToken,
      nativeCToken,
      cTokenReserveFactorMantissa,
    );
    _handleMarketListed(marketListedData, event);
    return;
  }

  const underlyingTokenAddrResult = cTokenContract.try_underlying();
  if (underlyingTokenAddrResult.reverted) {
    log.warning(
      "[handleMarketListed] could not fetch underlying token of cToken: {}",
      [cTokenAddr.toHexString()],
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
        getOrElse<i32>(underlyingTokenContract.try_decimals(), 0),
      ),
      new TokenData(
        cTokenAddr,
        getOrElse<string>(cTokenContract.try_name(), "unknown"),
        getOrElse<string>(cTokenContract.try_symbol(), "unknown"),
        cTokenDecimals,
      ),
      cTokenReserveFactorMantissa,
    ),
    event,
  );
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  const marketID = event.params.vToken.toHexString();
  const collateralFactorMantissa = event.params.newCollateralFactorMantissa;
  _handleNewCollateralFactor(marketID, collateralFactorMantissa);
}

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive,
): void {
  const protocol = getOrCreateProtocol();
  const newLiquidationIncentive = event.params.newLiquidationIncentiveMantissa;
  _handleNewLiquidationIncentive(protocol, newLiquidationIncentive);
}

export function handleActionPaused(event: ActionPausedMarket): void {
  const marketID = event.params.vToken.toHexString();
  const action = actionEnumToString(event.params.action);
  const pauseState = event.params.pauseState;
  _handleActionPaused(marketID, action, pauseState);
}

function actionEnumToString(action: i32): string {
  // https://github.com/VenusProtocol/venus-protocol/blob/develop/contracts/ComptrollerStorage.sol#L214
  switch (action) {
    case 0:
      return "Mint";
    case 1:
      return "Redeem";
    case 2:
      return "Borrow";
    case 3:
      return "RepayBorrow";
    case 4:
      return "Seize";
    case 5:
      return "LiquidateBorrow";
    case 6:
      return "Transfer";
    case 7:
      return "EnterMarket";
    case 8:
      return "ExitMarket";
    default:
      return "Unknown";
  }
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
    event.params.minter,
  );
  _handleMint(
    comptrollerAddr,
    minter,
    mintAmount,
    outputTokenSupplyResult,
    balanceOfUnderlyingResult,
    event,
  );
}

export function handleRedeem(event: Redeem): void {
  const redeemer = event.params.redeemer;
  const redeemAmount = event.params.redeemAmount;
  const contract = CToken.bind(event.address);
  const outputTokenSupplyResult = contract.try_totalSupply();
  const balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.redeemer,
  );
  _handleRedeem(
    comptrollerAddr,
    redeemer,
    redeemAmount,
    outputTokenSupplyResult,
    balanceOfUnderlyingResult,
    event,
  );
}

export function handleBorrow(event: BorrowEvent): void {
  const borrower = event.params.borrower;
  const borrowAmount = event.params.borrowAmount;
  const totalBorrows = event.params.totalBorrows;
  const contract = CToken.bind(event.address);
  const borrowBalanceStoredResult = contract.try_borrowBalanceStored(
    event.params.borrower,
  );
  _handleBorrow(
    comptrollerAddr,
    borrower,
    borrowAmount,
    borrowBalanceStoredResult,
    totalBorrows,
    event,
  );
}

export function handleRepayBorrow(event: RepayBorrow): void {
  const borrower = event.params.borrower;
  const payer = event.params.payer;
  const repayAmount = event.params.repayAmount;
  const totalBorrows = event.params.totalBorrows;
  const contract = CToken.bind(event.address);
  const borrowBalanceStoredResult = contract.try_borrowBalanceStored(
    event.params.borrower,
  );
  _handleRepayBorrow(
    comptrollerAddr,
    borrower,
    payer,
    repayAmount,
    borrowBalanceStoredResult,
    totalBorrows,
    event,
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
    event,
  );
}

export function handleAccrueInterest(event: AccrueInterest): void {
  const marketAddress = event.address;
  const market = Market.load(marketAddress.toHexString())!;
  updateRewardValueUSD(market);

  const cTokenContract = CToken.bind(marketAddress);
  const protocol = getOrCreateProtocol();
  const oracleContract = PriceOracle.bind(
    Address.fromString(protocol._priceOracle),
  );

  // DAI price oracle broken from blocks 17803407 - 17836448
  // We will override it to exactly 1 USD for those blocks
  let tryUnderlyingPrice = oracleContract.try_getUnderlyingPrice(marketAddress);
  if (
    marketAddress == VDAI_MARKET_ADDRESS &&
    event.block.number.toI32() >= 17803407 &&
    event.block.number.toI32() <= 17836448
  ) {
    tryUnderlyingPrice = ethereum.CallResult.fromValue(
      BigInt.fromI64(1000000000000000000),
    );
  }

  const updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_supplyRatePerBlock(),
    cTokenContract.try_borrowRatePerBlock(),
    tryUnderlyingPrice,
    BSC_BLOCKS_PER_YEAR,
  );
  const interestAccumulated = event.params.interestAccumulated;
  const totalBorrows = event.params.totalBorrows;
  _handleAccrueInterest(
    updateMarketData,
    comptrollerAddr,
    interestAccumulated,
    totalBorrows,
    false, // do not update all prices
    event,
  );
}

export function handleTransfer(event: Transfer): void {
  _handleTransfer(
    event,
    event.address.toHexString(),
    event.params.to,
    event.params.from,
    comptrollerAddr,
  );
}

// update market reward amounts based on event data.
export function handleVenusSpeedUpdated(event: VenusSpeedUpdated): void {
  const marketAddress = event.params.vToken;
  const speed = event.params.newSpeed;
  const rewards = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    speed.toBigDecimal(),
    RewardIntervalType.BLOCK,
  );

  const rewardAmount = BigInt.fromString(rewards.truncate(0).toString());
  const borrowRewardToken = getOrCreateRewardToken(RewardTokenType.BORROW);
  const supplyRewardToken = getOrCreateRewardToken(RewardTokenType.DEPOSIT);

  const market = Market.load(marketAddress.toHexString())!;
  market.rewardTokens = [
    borrowRewardToken.rewardToken.id,
    supplyRewardToken.rewardToken.id,
  ];
  market.rewardTokenEmissionsAmount = [rewardAmount, rewardAmount]; // venus gives the same amount to borrowers and suppliers for each market
  market.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  updateRewardValueUSD(market);
  market.save();

  // update market snapshots.
  getOrCreateMarketDailySnapshot(
    market,
    event.block.timestamp,
    event.block.number,
  );
  getOrCreateMarketHourlySnapshot(
    market,
    event.block.timestamp,
    event.block.number,
  );
}

// updateRewardValueUSD will update the reward value in USD, assuming
// the reward amount hasn't changed. If it changes it will be updated on VenusSpeedUpdated.
// This function can be called anytime and it will update the reward value in USD.
function updateRewardValueUSD(market: Market): void {
  if (!market.rewardTokens || market.rewardTokens!.length == 0) {
    return;
  }

  const protocol = getOrCreateProtocol();
  const oracleContract = PriceOracle.bind(
    Address.fromString(protocol._priceOracle),
  );
  const priceCall = oracleContract.try_getUnderlyingPrice(vXVS.address);
  if (priceCall.reverted) {
    log.error("unable to calculate rewards: priceCall reverted for vXVS {}", [
      vXVS.address.toHexString(),
    ]);
    return;
  }

  const rewardAmount = market.rewardTokenEmissionsAmount![0];
  const rewardAmountUSD = rewardAmount
    .times(priceCall.value)
    .divDecimal(exponentToBigDecimal(ORACLE_PRECISION))
    .div(exponentToBigDecimal(XVS.decimals));
  market.rewardTokenEmissionsUSD = [rewardAmountUSD, rewardAmountUSD];
  market.save();
}

class rewardToken {
  token: Token;
  rewardToken: RewardToken;
}

function getOrCreateRewardToken(type: string): rewardToken {
  let token = Token.load(XVS.address.toHexString());
  if (!token) {
    token = new Token(XVS.address.toHexString());
    token.symbol = "XVS";
    token.decimals = 18;
    token.name = "Venus";
    token.save();
  }

  const rewardTokenId = type + "-" + token.id;
  let rToken = RewardToken.load(rewardTokenId);
  if (!rToken) {
    rToken = new RewardToken(rewardTokenId);
    rToken.token = token.id;
    rToken.type = type;
    rToken.save();
  }

  return {
    token: token,
    rewardToken: rToken,
  };
}

function getOrCreateProtocol(): LendingProtocol {
  const comptroller = Comptroller.bind(comptrollerAddr);
  const protocolData = new ProtocolData(
    comptrollerAddr,
    "Venus",
    "venus",
    Network.BSC,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle(),
  );
  return _getOrCreateProtocol(protocolData);
}
