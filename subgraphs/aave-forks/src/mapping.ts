// generic aave-v2 handlers
import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  Account,
  Market,
  Position,
  RewardToken,
  _DefaultOracle,
  _FlashLoanPremium,
  _MarketList,
} from "../generated/schema";
import { AToken } from "../generated/LendingPool/AToken";
import { StableDebtToken } from "../generated/LendingPool/StableDebtToken";
import { VariableDebtToken } from "../generated/LendingPool/VariableDebtToken";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  IavsTokenType,
  INT_FOUR,
  RAY_OFFSET,
  ZERO_ADDRESS,
  BIGDECIMAL_ONE,
  BIGINT_ONE_RAY,
  BIGDECIMAL_NEG_ONE_CENT,
} from "./constants";
import {
  InterestRateSide,
  InterestRateType,
  OracleSource,
  PositionSide,
  RewardTokenType,
  SECONDS_PER_DAY,
  TransactionType,
} from "./sdk/constants";
import {
  getBorrowBalances,
  getCollateralBalance,
  getMarketByAuxillaryToken,
  restorePrePauseState,
  storePrePauseState,
  exponentToBigDecimal,
  rayToWad,
  getMarketFromToken,
  getOrCreateFlashloanPremium,
  getInterestRateType,
  getFlashloanPremiumAmount,
  calcuateFlashLoanPremiumToLPUSD,
} from "./helpers";
import {
  AToken as ATokenTemplate,
  VariableDebtToken as VTokenTemplate,
  StableDebtToken as STokenTemplate,
} from "../generated/templates";
import { ERC20 } from "../generated/LendingPool/ERC20";
import { DataManager, ProtocolData, RewardData } from "./sdk/manager";
import { FeeType, TokenType } from "./sdk/constants";
import { TokenManager } from "./sdk/token";
import { AccountManager } from "./sdk/account";
import { PositionManager } from "./sdk/position";

//////////////////////////////////
///// Configuration Handlers /////
//////////////////////////////////

export function _handlePriceOracleUpdated(
  newPriceOracle: Address,
  protocolData: ProtocolData,
  event: ethereum.Event
): void {
  log.info("[_handlePriceOracleUpdated] New oracleAddress: {}", [
    newPriceOracle.toHexString(),
  ]);

  // since all aave markets share the same oracle
  // we will use _DefaultOracle entity for markets whose oracle is not set
  let defaultOracle = _DefaultOracle.load(protocolData.protocolID);
  if (!defaultOracle) {
    defaultOracle = new _DefaultOracle(protocolData.protocolID);
  }
  defaultOracle.oracle = newPriceOracle;
  defaultOracle.save();

  const marketList = _MarketList.load(protocolData.protocolID);
  if (!marketList) {
    log.warning("[_handlePriceOracleUpdated]marketList for {} does not exist", [
      protocolData.protocolID.toHexString(),
    ]);
    return;
  }

  const markets = marketList.markets;
  for (let i = 0; i < markets.length; i++) {
    const _market = Market.load(markets[i]);
    if (!_market) {
      log.warning("[_handlePriceOracleUpdated] Market not found: {}", [
        markets[i].toHexString(),
      ]);
      continue;
    }
    const manager = new DataManager(
      markets[i],
      _market.inputToken,
      event,
      protocolData
    );
    _market.oracle = manager.getOrCreateOracle(
      newPriceOracle,
      true,
      OracleSource.CHAINLINK
    ).id;
    _market.save();
  }
}

export function _handleReserveInitialized(
  event: ethereum.Event,
  underlyingToken: Address,
  outputToken: Address,
  variableDebtToken: Address,
  protocolData: ProtocolData,
  stableDebtToken: Address = Address.fromString(ZERO_ADDRESS)
): void {
  // create VToken template
  VTokenTemplate.create(variableDebtToken);
  // create AToken template to watch Transfer
  ATokenTemplate.create(outputToken);

  const manager = new DataManager(
    outputToken,
    underlyingToken,
    event,
    protocolData
  );
  const market = manager.getMarket();
  const outputTokenManager = new TokenManager(outputToken, event);
  const vDebtTokenManager = new TokenManager(
    variableDebtToken,
    event,
    TokenType.REBASING
  );
  market.outputToken = outputTokenManager.getToken().id;
  market.name = outputTokenManager._getName();
  market._vToken = vDebtTokenManager.getToken().id;

  // map tokens to market
  const inputToken = manager.getInputToken();
  inputToken._market = market.id;
  inputToken._iavsTokenType = IavsTokenType.INPUTTOKEN;
  inputToken.save();

  const aToken = outputTokenManager.getToken();
  aToken._market = market.id;
  aToken._iavsTokenType = IavsTokenType.ATOKEN;
  aToken.save();

  const vToken = vDebtTokenManager.getToken();
  vToken._market = market.id;
  vToken._iavsTokenType = IavsTokenType.VTOKEN;
  vToken.save();

  if (stableDebtToken != Address.zero()) {
    const sDebtTokenManager = new TokenManager(stableDebtToken, event);
    const sToken = sDebtTokenManager.getToken();
    sToken._market = market.id;
    sToken._iavsTokenType = IavsTokenType.STOKEN;
    sToken.save();

    market._sToken = sToken.id;

    STokenTemplate.create(stableDebtToken);
  }

  const defaultOracle = _DefaultOracle.load(protocolData.protocolID);
  if (!market.oracle && defaultOracle) {
    market.oracle = manager.getOrCreateOracle(
      Address.fromBytes(defaultOracle.oracle),
      true,
      OracleSource.CHAINLINK
    ).id;
  }

  market.save();
}

export function _handleCollateralConfigurationChanged(
  asset: Address,
  liquidationPenalty: BigInt,
  liquidationThreshold: BigInt,
  maximumLTV: BigInt,
  protocolData: ProtocolData
): void {
  const market = getMarketFromToken(asset, protocolData);
  if (!market) {
    log.warning(
      "[_handleCollateralConfigurationChanged] Market for asset {} not found",
      [asset.toHexString()]
    );
    return;
  }

  market.maximumLTV = maximumLTV.toBigDecimal().div(BIGDECIMAL_HUNDRED);
  market.liquidationThreshold = liquidationThreshold
    .toBigDecimal()
    .div(BIGDECIMAL_HUNDRED);

  // The liquidation bonus value is equal to the liquidation penalty, the naming is a matter of which side of the liquidation a user is on
  // The liquidationBonus parameter comes out as above 100%, represented by a 5 digit integer over 10000 (100%).
  // To extract the expected value in the liquidationPenalty field: convert to BigDecimal, subtract by 10000 and divide by 100
  const bdLiquidationPenalty = liquidationPenalty.toBigDecimal();
  if (bdLiquidationPenalty.gt(exponentToBigDecimal(INT_FOUR))) {
    market.liquidationPenalty = bdLiquidationPenalty
      .minus(exponentToBigDecimal(INT_FOUR))
      .div(BIGDECIMAL_HUNDRED);
  }

  market.save();
}

export function _handleBorrowingEnabledOnReserve(
  asset: Address,
  procotolData: ProtocolData
): void {
  const market = getMarketFromToken(asset, procotolData);
  if (!market) {
    log.warning("[_handleBorrowingEnabledOnReserve] Market not found {}", [
      asset.toHexString(),
    ]);
    return;
  }

  market.canBorrowFrom = true;
  market.save();
  storePrePauseState(market);
}

export function _handleBorrowingDisabledOnReserve(
  asset: Address,
  procotolData: ProtocolData
): void {
  const market = getMarketFromToken(asset, procotolData);
  if (!market) {
    log.warning(
      "[_handleBorrowingDisabledOnReserve] Market for token {} not found",
      [asset.toHexString()]
    );
    return;
  }

  market.canBorrowFrom = false;
  market.save();
  storePrePauseState(market);
}

export function _handleReserveActivated(
  asset: Address,
  protocolData: ProtocolData
): void {
  const market = getMarketFromToken(asset, protocolData);
  if (!market) {
    log.warning("[_handleReserveActivated] Market for token {} not found", [
      asset.toHexString(),
    ]);
    return;
  }

  market.isActive = true;
  market.save();
  storePrePauseState(market);
}

export function _handleReserveDeactivated(
  asset: Address,
  procotolData: ProtocolData
): void {
  const market = getMarketFromToken(asset, procotolData);
  if (!market) {
    log.warning("[_handleReserveDeactivated] Market for token {} not found", [
      asset.toHexString(),
    ]);
    return;
  }

  market.isActive = false;
  market.save();
  storePrePauseState(market);
}

export function _handleReserveFactorChanged(
  asset: Address,
  reserveFactor: BigInt,
  procotolData: ProtocolData
): void {
  const market = getMarketFromToken(asset, procotolData);
  if (!market) {
    log.warning("[_handleReserveFactorChanged] Market for token {} not found", [
      asset.toHexString(),
    ]);
    return;
  }

  market.reserveFactor = reserveFactor
    .toBigDecimal()
    .div(exponentToBigDecimal(INT_FOUR));
  market.save();
}

export function _handleLiquidationProtocolFeeChanged(
  asset: Address,
  liquidationProtocolFee: BigInt,
  procotolData: ProtocolData
): void {
  const market = getMarketFromToken(asset, procotolData);
  if (!market) {
    log.warning(
      "[_handleLiquidationProtocolFeeChanged] Market for token {} not found",
      [asset.toHexString()]
    );
    return;
  }

  market._liquidationProtocolFee = liquidationProtocolFee
    .toBigDecimal()
    .div(exponentToBigDecimal(INT_FOUR));
  market.save();
}

export function _handleReserveUsedAsCollateralEnabled(
  asset: Address,
  accountID: Address,
  procotolData: ProtocolData
): void {
  const market = getMarketFromToken(asset, procotolData);
  if (!market) {
    log.warning(
      "[_handleReserveUsedAsCollateralEnabled] Market for token {} not found",
      [asset.toHexString()]
    );
    return;
  }
  const accountManager = new AccountManager(accountID);
  const account = accountManager.getAccount();

  const markets = account._enabledCollaterals
    ? account._enabledCollaterals!
    : [];
  markets.push(market.id);
  account._enabledCollaterals = markets;

  account.save();
}

export function _handleReserveUsedAsCollateralDisabled(
  asset: Address,
  accountID: Address,
  procotolData: ProtocolData
): void {
  const market = getMarketFromToken(asset, procotolData);
  if (!market) {
    log.warning(
      "[_handleReserveUsedAsCollateralEnabled] Market for token {} not found",
      [asset.toHexString()]
    );
    return;
  }
  const accountManager = new AccountManager(accountID);
  const account = accountManager.getAccount();

  const markets = account._enabledCollaterals
    ? account._enabledCollaterals!
    : [];

  const index = markets.indexOf(market.id);
  if (index >= 0) {
    // drop 1 element at given index
    markets.splice(index, 1);
  }
  account._enabledCollaterals = markets;
  account.save();
}

export function _handleFlashloanPremiumTotalUpdated(
  rate: BigDecimal,
  procotolData: ProtocolData
): void {
  const flashloanPremium = getOrCreateFlashloanPremium(procotolData);
  flashloanPremium.premiumRateTotal = rate;
  flashloanPremium.save();
}

export function _handleFlashloanPremiumToProtocolUpdated(
  rate: BigDecimal,
  procotolData: ProtocolData
): void {
  const flashloanPremium = getOrCreateFlashloanPremium(procotolData);
  flashloanPremium.premiumRateToProtocol = rate;
  flashloanPremium.save();
}

export function _handlePaused(protocolData: ProtocolData): void {
  const marketList = _MarketList.load(protocolData.protocolID);
  if (!marketList) {
    log.warning("[_handlePaused]marketList for {} does not exist", [
      protocolData.protocolID.toHexString(),
    ]);
    return;
  }

  const markets = marketList.markets;
  for (let i = 0; i < markets.length; i++) {
    const market = Market.load(markets[i]);
    if (!market) {
      log.warning("[Paused] Market not found: {}", [markets[i].toHexString()]);
      continue;
    }

    storePrePauseState(market);
    market.isActive = false;
    market.canUseAsCollateral = false;
    market.canBorrowFrom = false;
    market.save();
  }
}

export function _handleUnpaused(protocolData: ProtocolData): void {
  const marketList = _MarketList.load(protocolData.protocolID);
  if (!marketList) {
    log.warning("[_handleUnpaused]marketList for {} does not exist", [
      protocolData.protocolID.toHexString(),
    ]);
    return;
  }

  const markets = marketList.markets;
  for (let i = 0; i < markets.length; i++) {
    const market = Market.load(markets[i]);
    if (!market) {
      log.warning("[_handleUnpaused] Market not found: {}", [
        markets[i].toHexString(),
      ]);
      continue;
    }

    restorePrePauseState(market);
  }
}

////////////////////////////////
///// Transaction Handlers /////
////////////////////////////////

export function _handleReserveDataUpdated(
  event: ethereum.Event,
  liquidityRate: BigInt, // deposit rate in ray
  liquidityIndex: BigInt,
  variableBorrowRate: BigInt,
  stableBorrowRate: BigInt,
  protocolData: ProtocolData,
  asset: Address,
  assetPriceUSD: BigDecimal = BIGDECIMAL_ZERO,
  updateRewards: bool = false
): void {
  let market = getMarketFromToken(asset, protocolData);
  if (!market) {
    log.warning("[_handlReserveDataUpdated] Market for asset {} not found", [
      asset.toHexString(),
    ]);
    return;
  }

  const manager = new DataManager(
    market.id,
    market.inputToken,
    event,
    protocolData
  );
  market = manager.getMarket();
  const inputToken = manager.getInputToken();
  // get current borrow balance
  let trySBorrowBalance: ethereum.CallResult<BigInt> | null = null;
  if (market._sToken) {
    const stableDebtContract = StableDebtToken.bind(
      Address.fromBytes(market._sToken!)
    );
    trySBorrowBalance = stableDebtContract.try_totalSupply();
  }

  const variableDebtContract = VariableDebtToken.bind(
    Address.fromBytes(market._vToken!)
  );
  const tryVBorrowBalance = variableDebtContract.try_totalSupply();
  let sBorrowBalance = BIGINT_ZERO;
  let vBorrowBalance = BIGINT_ZERO;

  if (trySBorrowBalance != null && !trySBorrowBalance.reverted) {
    sBorrowBalance = trySBorrowBalance.value;
  }
  if (!tryVBorrowBalance.reverted) {
    vBorrowBalance = tryVBorrowBalance.value;
  }

  // broken if both revert
  if (
    trySBorrowBalance != null &&
    trySBorrowBalance.reverted &&
    tryVBorrowBalance.reverted
  ) {
    log.warning("[ReserveDataUpdated] No borrow balance found", []);
    return;
  }

  // update total supply balance
  const aTokenContract = AToken.bind(Address.fromBytes(market.outputToken!));
  const tryTotalSupply = aTokenContract.try_totalSupply();
  if (tryTotalSupply.reverted) {
    log.warning(
      "[ReserveDataUpdated] Error getting total supply on market: {}",
      [market.id.toHexString()]
    );
    return;
  }

  if (assetPriceUSD.equals(BIGDECIMAL_ZERO)) {
    assetPriceUSD = market.inputTokenPriceUSD;
  }
  manager.updateMarketAndProtocolData(
    assetPriceUSD,
    tryTotalSupply.value,
    vBorrowBalance,
    sBorrowBalance
  );

  const tryScaledSupply = aTokenContract.try_scaledTotalSupply();
  if (tryScaledSupply.reverted) {
    log.warning(
      "[ReserveDataUpdated] Error getting scaled total supply on market: {}",
      [asset.toHexString()]
    );
    return;
  }

  // calculate new revenue
  // New Interest = totalScaledSupply * (difference in liquidity index)
  if (!market._liquidityIndex) {
    market._liquidityIndex = BIGINT_ONE_RAY;
  }
  const liquidityIndexDiff = liquidityIndex
    .minus(market._liquidityIndex!)
    .toBigDecimal()
    .div(exponentToBigDecimal(RAY_OFFSET));
  market._liquidityIndex = liquidityIndex; // must update to current liquidity index
  market.save();

  const newRevenueBD = tryScaledSupply.value
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals))
    .times(liquidityIndexDiff);
  let totalRevenueDeltaUSD = newRevenueBD.times(assetPriceUSD);

  const receipt = event.receipt;
  let FlashLoanPremiumToLPUSD = BIGDECIMAL_ZERO;
  if (!receipt) {
    log.warning(
      "[_handleReserveDataUpdated]No receipt for tx {}; cannot subtract Flashloan revenue",
      [event.transaction.hash.toHexString()]
    );
  } else {
    const flashLoanPremiumAmount = getFlashloanPremiumAmount(event, asset);
    const flashLoanPremiumUSD = flashLoanPremiumAmount
      .toBigDecimal()
      .div(exponentToBigDecimal(inputToken.decimals))
      .times(assetPriceUSD);
    const flashloanPremium = getOrCreateFlashloanPremium(protocolData);
    FlashLoanPremiumToLPUSD = calcuateFlashLoanPremiumToLPUSD(
      flashLoanPremiumUSD,
      flashloanPremium.premiumRateToProtocol
    );
  }

  // deduct flashloan premium that may have already been accounted for in
  // _handleFlashloan()
  totalRevenueDeltaUSD = totalRevenueDeltaUSD.minus(FlashLoanPremiumToLPUSD);
  if (
    totalRevenueDeltaUSD.lt(BIGDECIMAL_ZERO) &&
    totalRevenueDeltaUSD.gt(BIGDECIMAL_NEG_ONE_CENT)
  ) {
    // totalRevenueDeltaUSD may become a tiny negative number after
    // subtracting flashloan premium due to rounding
    // see https://github.com/messari/subgraphs/pull/1993#issuecomment-1608414803
    // for more details
    totalRevenueDeltaUSD = BIGDECIMAL_ZERO;
  }
  let reserveFactor = market.reserveFactor;
  if (!reserveFactor) {
    log.warning(
      "[_handleReserveDataUpdated]reserveFactor = null for market {}, default to 0.0",
      [asset.toHexString()]
    );
    reserveFactor = BIGDECIMAL_ZERO;
  }

  const protocolSideRevenueDeltaUSD = totalRevenueDeltaUSD.times(reserveFactor);
  const supplySideRevenueDeltaUSD = totalRevenueDeltaUSD.minus(
    protocolSideRevenueDeltaUSD
  );

  const fee = manager.getOrUpdateFee(
    FeeType.PROTOCOL_FEE,
    null,
    market.reserveFactor
  );

  manager.addProtocolRevenue(protocolSideRevenueDeltaUSD, fee);
  manager.addSupplyRevenue(supplySideRevenueDeltaUSD, fee);

  manager.getOrUpdateRate(
    InterestRateSide.BORROWER,
    InterestRateType.VARIABLE,
    rayToWad(variableBorrowRate)
      .toBigDecimal()
      .div(exponentToBigDecimal(DEFAULT_DECIMALS - 2))
  );

  if (market._sToken) {
    // geist does not have stable borrow rates
    manager.getOrUpdateRate(
      InterestRateSide.BORROWER,
      InterestRateType.STABLE,
      rayToWad(stableBorrowRate)
        .toBigDecimal()
        .div(exponentToBigDecimal(DEFAULT_DECIMALS - 2))
    );
  }

  manager.getOrUpdateRate(
    InterestRateSide.LENDER,
    InterestRateType.VARIABLE,
    rayToWad(liquidityRate)
      .toBigDecimal()
      .div(exponentToBigDecimal(DEFAULT_DECIMALS - 2))
  );

  // if updateRewards is true:
  // - check if reward distribution ends,
  // - refresh rewardEmissionAmountUSD with current token price
  // this is here because _handleReserveDataUpdated is called most frequently
  // if data freshness is a priority (at the cost of indexing speed)
  // we can iterate through all markets in _MarketList and get latest
  // token price from oracle (to be implemented)
  if (updateRewards && market.rewardTokens) {
    for (let i = 0; i < market.rewardTokens!.length; i++) {
      const rewardToken = RewardToken.load(market.rewardTokens![i]);
      if (!rewardToken) {
        continue;
      }
      const rewardTokenManager = new TokenManager(
        Address.fromBytes(rewardToken.token),
        event
      );
      let emission = market.rewardTokenEmissionsAmount![i];
      if (
        rewardToken._distributionEnd &&
        rewardToken._distributionEnd!.lt(event.block.timestamp)
      ) {
        emission = BIGINT_ZERO;
      }
      const emissionUSD = rewardTokenManager.getAmountUSD(emission);
      const rewardData = new RewardData(rewardToken, emission, emissionUSD);
      manager.updateRewards(rewardData);
    }
  }
}

export function _handleDeposit(
  event: ethereum.Event,
  amount: BigInt,
  asset: Address,
  protocolData: ProtocolData,
  accountID: Address
): void {
  const market = getMarketFromToken(asset, protocolData);
  if (!market) {
    log.warning("[_handleDeposit] Market for token {} not found", [
      asset.toHexString(),
    ]);
    return;
  }
  const manager = new DataManager(
    market.id,
    market.inputToken,
    event,
    protocolData
  );
  const tokenManager = new TokenManager(asset, event, TokenType.REBASING);
  const amountUSD = tokenManager.getAmountUSD(amount);
  const newCollateralBalance = getCollateralBalance(market, accountID);
  manager.createDeposit(
    asset,
    accountID,
    amount,
    amountUSD,
    newCollateralBalance
  );
  const account = Account.load(accountID);
  if (!account) {
    log.warning("[_handleDeposit]account {} not found", [
      accountID.toHexString(),
    ]);
    return;
  }
  const positionManager = new PositionManager(
    account,
    market,
    PositionSide.COLLATERAL
  );
  if (
    !account._enabledCollaterals ||
    account._enabledCollaterals!.indexOf(market.id) == -1
  ) {
    // Supply in isolated mode won't have ReserveUsedAsCollateralEnabled set
    // https://github.com/aave/aave-v3-core/blob/29ff9b9f89af7cd8255231bc5faf26c3ce0fb7ce/contracts/protocol/libraries/logic/SupplyLogic.sol#L76-L88
    positionManager.setIsolation(true);
    return;
  }
  positionManager.setCollateral(true);

  if (account._eMode) {
    const positionID = positionManager.getPositionID();
    if (!positionID) {
      log.error("[_handleDeposit]position not found", []);
      return;
    }
    const position = Position.load(positionID!);
    if (!position) {
      log.error("[_handleDeposit]position with ID {} not found", [positionID!]);
      return;
    }
    position._eMode = true;
    position.save();
  }
}

export function _handleWithdraw(
  event: ethereum.Event,
  amount: BigInt,
  asset: Address,
  protocolData: ProtocolData,
  accountID: Address
): void {
  const market = getMarketFromToken(asset, protocolData);
  if (!market) {
    log.warning("[_handleWithdraw] Market for token {} not found", [
      asset.toHexString(),
    ]);
    return;
  }
  const manager = new DataManager(
    market.id,
    market.inputToken,
    event,
    protocolData
  );
  const tokenManager = new TokenManager(asset, event, TokenType.REBASING);
  const amountUSD = tokenManager.getAmountUSD(amount);
  const newCollateralBalance = getCollateralBalance(market, accountID);
  manager.createWithdraw(
    asset,
    accountID,
    amount,
    amountUSD,
    newCollateralBalance
  );
}

export function _handleBorrow(
  event: ethereum.Event,
  amount: BigInt,
  asset: Address,
  protocolData: ProtocolData,
  accountID: Address,
  interestRateType: InterestRateType | null = null,
  isIsolated: boolean = false
): void {
  const market = getMarketFromToken(asset, protocolData);
  if (!market) {
    log.warning("[_handleBorrow] Market for token {} not found", [
      asset.toHexString(),
    ]);
    return;
  }
  const manager = new DataManager(
    market.id,
    market.inputToken,
    event,
    protocolData
  );
  const tokenManager = new TokenManager(asset, event, TokenType.REBASING);
  const amountUSD = tokenManager.getAmountUSD(amount);
  const newBorrowBalances = getBorrowBalances(market, accountID);

  manager.createBorrow(
    asset,
    accountID,
    amount,
    amountUSD,
    newBorrowBalances[0].plus(newBorrowBalances[1]),
    market.inputTokenPriceUSD,
    interestRateType,
    isIsolated
  );
}

export function _handleRepay(
  event: ethereum.Event,
  amount: BigInt,
  asset: Address,
  protocolData: ProtocolData,
  accountID: Address
): void {
  const market = getMarketFromToken(asset, protocolData);
  if (!market) {
    log.warning("[_handleRepay] Market for token {} not found", [
      asset.toHexString(),
    ]);
    return;
  }
  const manager = new DataManager(
    market.id,
    market.inputToken,
    event,
    protocolData
  );
  const tokenManager = new TokenManager(asset, event, TokenType.REBASING);
  const amountUSD = tokenManager.getAmountUSD(amount);
  const newBorrowBalances = getBorrowBalances(market, accountID);

  // use debtToken Transfer event for Burn/Mint to determine interestRateType of the Repay event
  const interestRateType = getInterestRateType(event);
  if (!interestRateType) {
    log.error(
      "[_handleRepay]Cannot determine interest rate type for Repay event {}-{}",
      [
        event.transaction.hash.toHexString(),
        event.transactionLogIndex.toString(),
      ]
    );
  }

  manager.createRepay(
    asset,
    accountID,
    amount,
    amountUSD,
    newBorrowBalances[0].plus(newBorrowBalances[1]),
    market.inputTokenPriceUSD,
    interestRateType
  );
}

export function _handleLiquidate(
  event: ethereum.Event,
  amount: BigInt, // amount of collateral liquidated
  collateralAsset: Address, // collateral market
  protocolData: ProtocolData,
  liquidator: Address,
  liquidatee: Address, // account liquidated
  debtAsset: Address, // token repaid to cover debt,
  debtToCover: BigInt // the amount of debt repaid by liquidator
): void {
  const market = getMarketFromToken(collateralAsset, protocolData);
  if (!market) {
    log.warning("[_handleLiquidate] Market for token {} not found", [
      collateralAsset.toHexString(),
    ]);
    return;
  }
  const manager = new DataManager(
    market.id,
    market.inputToken,
    event,
    protocolData
  );
  const inputToken = manager.getInputToken();
  let inputTokenPriceUSD = market.inputTokenPriceUSD;
  if (!inputTokenPriceUSD) {
    log.warning(
      "[_handleLiquidate] Price of input token {} is not set, default to 0.0",
      [inputToken.id.toHexString()]
    );
    inputTokenPriceUSD = BIGDECIMAL_ZERO;
  }
  const amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals))
    .times(inputTokenPriceUSD);

  // according to logic in _calculateAvailableCollateralToLiquidate()
  // liquidatedCollateralAmount = collateralAmount - liquidationProtocolFee
  // liquidationProtocolFee = bonusCollateral * liquidationProtocolFeePercentage
  // bonusCollateral = collateralAmount - (collateralAmount / liquidationBonus)
  // liquidationBonus = 1 + liquidationPenalty
  // => liquidationProtocolFee = liquidationPenalty * liquidationProtocolFeePercentage * liquidatedCollateralAmount / (1 + liquidationPenalty - liquidationPenalty*liquidationProtocolFeePercentage)
  if (!market._liquidationProtocolFee) {
    log.warning("[_handleLiquidate]market {} _liquidationProtocolFee = null ", [
      collateralAsset.toHexString(),
    ]);
    return;
  }
  const liquidationProtocolFeeUSD = amountUSD
    .times(market.liquidationPenalty)
    .times(market._liquidationProtocolFee!)
    .div(
      BIGDECIMAL_ONE.plus(market.liquidationPenalty).minus(
        market.liquidationPenalty.times(market._liquidationProtocolFee!)
      )
    );
  const fee = manager.getOrUpdateFee(
    FeeType.LIQUIDATION_FEE,
    null,
    market._liquidationProtocolFee
  );
  manager.addProtocolRevenue(liquidationProtocolFeeUSD, fee);

  const debtTokenMarket = getMarketFromToken(debtAsset, protocolData);
  if (!debtTokenMarket) {
    log.warning("[_handleLiquidate] market for Debt token  {} not found", [
      debtAsset.toHexString(),
    ]);
    return;
  }
  let debtTokenPriceUSD = debtTokenMarket.inputTokenPriceUSD;
  if (!debtTokenPriceUSD) {
    log.warning(
      "[_handleLiquidate] Price of token {} is not set, default to 0.0",
      [debtAsset.toHexString()]
    );
    debtTokenPriceUSD = BIGDECIMAL_ZERO;
  }
  const profitUSD = amountUSD.minus(
    debtToCover.toBigDecimal().times(debtTokenPriceUSD)
  );
  const collateralBalance = getCollateralBalance(market, liquidatee);
  const debtBalances = getBorrowBalances(debtTokenMarket, liquidatee);
  const totalDebtBalance = debtBalances[0].plus(debtBalances[1]);
  const subtractBorrowerPosition = false;
  const liquidate = manager.createLiquidate(
    collateralAsset,
    debtAsset,
    liquidator,
    liquidatee,
    amount,
    amountUSD,
    profitUSD,
    collateralBalance,
    totalDebtBalance,
    null,
    subtractBorrowerPosition
  );
  if (!liquidate) {
    return;
  }

  const liquidatedPositions = liquidate.positions;
  const liquidateeAccount = new AccountManager(liquidatee).getAccount();
  const protocol = manager.getOrCreateLendingProtocol(protocolData);
  // Use the Transfer event for debtToken to burn to determine the interestRateType for debtToken liquidated
  // e.g. https://polygonscan.com/tx/0x2578371e35a1fa146aa34ea3936678c20091a08d55fd8cb46e0292fd95fe7f60#eventlog (v2)
  // https://optimistic.etherscan.io/tx/0xea6110df93b6581cf47b7261b33d9a1ae5cc5cac3b55931a11b7843641780958#eventlog (v3)

  // Variable debt is liquidated first
  const vBorrowerPosition = new PositionManager(
    liquidateeAccount,
    debtTokenMarket,
    PositionSide.BORROWER,
    InterestRateType.VARIABLE
  );

  const vBorrowerPositionBalance = vBorrowerPosition._getPositionBalance();
  if (vBorrowerPositionBalance && vBorrowerPositionBalance.gt(BIGINT_ZERO)) {
    vBorrowerPosition.subtractPosition(
      event,
      protocol,
      debtBalances[1],
      TransactionType.LIQUIDATE,
      debtTokenMarket.inputTokenPriceUSD
    );
    liquidatedPositions.push(vBorrowerPosition.getPositionID()!);
  }

  const sBorrowerPosition = new PositionManager(
    liquidateeAccount,
    debtTokenMarket,
    PositionSide.BORROWER,
    InterestRateType.STABLE
  );

  const sBorrowerPositionBalance = sBorrowerPosition._getPositionBalance();
  // Stable debt is liquidated after exhuasting variable debt
  if (
    debtBalances[1].equals(BIGINT_ZERO) &&
    sBorrowerPositionBalance &&
    sBorrowerPositionBalance.gt(BIGINT_ZERO)
  ) {
    sBorrowerPosition.subtractPosition(
      event,
      protocol,
      debtBalances[0],
      TransactionType.LIQUIDATE,
      debtTokenMarket.inputTokenPriceUSD
    );
    liquidatedPositions.push(sBorrowerPosition.getPositionID()!);
  }

  liquidate.positions = liquidatedPositions;
  liquidate.save();
}

export function _handleFlashLoan(
  asset: Address,
  amount: BigInt,
  account: Address,
  procotolData: ProtocolData,
  event: ethereum.Event,
  premiumAmount: BigInt,
  flashloanPremium: _FlashLoanPremium
): void {
  const market = getMarketFromToken(asset, procotolData);
  if (!market) {
    log.warning("[_handleFlashLoan] market for token {} not found", [
      asset.toHexString(),
    ]);
    return;
  }
  const manager = new DataManager(
    market.id,
    market.inputToken,
    event,
    procotolData
  );
  const tokenManager = new TokenManager(asset, event);
  const amountUSD = tokenManager.getAmountUSD(amount);
  const premiumUSDTotal = tokenManager.getAmountUSD(premiumAmount);
  const flashloan = manager.createFlashloan(asset, account, amount, amountUSD);
  flashloan.feeAmount = premiumAmount;
  flashloan.feeAmountUSD = premiumUSDTotal;
  flashloan.save();

  let reserveFactor = market.reserveFactor;
  if (!reserveFactor) {
    reserveFactor = BIGDECIMAL_ZERO;
  }
  const protocolRevenueShare = reserveFactor;
  let premiumUSDToProtocol = premiumUSDTotal.times(protocolRevenueShare);
  let premiumUSDToLP = premiumUSDTotal.minus(premiumUSDToProtocol);
  const premiumRateTotal = flashloanPremium.premiumRateTotal;
  let premiumRateToProtocol = premiumRateTotal.times(protocolRevenueShare);
  let premiumRateToLP = premiumRateTotal.minus(premiumRateToProtocol);

  if (flashloanPremium.premiumRateToProtocol.gt(BIGDECIMAL_ZERO)) {
    // according to https://github.com/aave/aave-v3-core/blob/29ff9b9f89af7cd8255231bc5faf26c3ce0fb7ce/contracts/interfaces/IPool.sol#L634
    // premiumRateToProtocol is the percentage of premium to protocol
    premiumUSDToProtocol = premiumUSDTotal
      .times(flashloanPremium.premiumRateToProtocol)
      .plus(premiumUSDToProtocol);
    premiumRateToProtocol = premiumRateTotal
      .times(flashloanPremium.premiumRateToProtocol)
      .plus(premiumRateToProtocol);

    // premium to LP
    premiumUSDToLP = premiumUSDTotal.minus(premiumUSDToProtocol);
    premiumRateToLP = premiumRateTotal.minus(premiumRateToProtocol);
    // this part of the premium is transferred to the treasury and not
    // accrued to liquidityIndex and thus no need to deduct
  }

  const feeToProtocol = manager.getOrUpdateFee(
    FeeType.FLASHLOAN_PROTOCOL_FEE,
    null,
    premiumRateToProtocol
  );

  manager.addProtocolRevenue(premiumUSDToProtocol, feeToProtocol);

  // flashloan premium to LP is accrued in liquidityIndex and handled in
  // _handleReserveDataUpdated;
  // https://github.com/aave/aave-v3-core/blob/master/contracts/protocol/libraries/logic/FlashLoanLogic.sol#L233-L237
  const feeToLP = manager.getOrUpdateFee(
    FeeType.FLASHLOAN_LP_FEE,
    null,
    premiumRateToLP
  );

  manager.addSupplyRevenue(premiumUSDToLP, feeToLP);
}

/////////////////////////
//// Transfer Events ////
/////////////////////////
export function _handleTransfer(
  event: ethereum.Event,
  protocolData: ProtocolData,
  positionSide: string,
  to: Address,
  from: Address,
  amount: BigInt
): void {
  const asset = event.address;
  const market = getMarketByAuxillaryToken(asset, protocolData);
  if (!market) {
    log.warning("[_handleTransfer] market not found: {}", [
      asset.toHexString(),
    ]);
    return;
  }

  // if the to / from addresses are the same as the asset
  // then this transfer is emitted as part of another event
  // ie, a deposit, withdraw, borrow, repay, etc
  // we want to let that handler take care of position updates
  // and zero addresses mean it is a part of a burn / mint
  if (
    to == Address.fromString(ZERO_ADDRESS) ||
    from == Address.fromString(ZERO_ADDRESS) ||
    to == asset ||
    from == asset
  ) {
    return;
  }

  const tokenContract = ERC20.bind(asset);
  const senderBalanceResult = tokenContract.try_balanceOf(from);
  const receiverBalanceResult = tokenContract.try_balanceOf(to);
  if (senderBalanceResult.reverted) {
    log.warning(
      "[_handleTransfer]token {} balanceOf() call for account {} reverted",
      [asset.toHexString(), from.toHexString()]
    );
    return;
  }
  if (receiverBalanceResult.reverted) {
    log.warning(
      "[_handleTransfer]token {} balanceOf() call for account {} reverted",
      [asset.toHexString(), to.toHexString()]
    );
    return;
  }
  const tokenManager = new TokenManager(asset, event);
  const assetToken = tokenManager.getToken();
  let interestRateType: string | null;
  if (assetToken._iavsTokenType! == IavsTokenType.STOKEN) {
    interestRateType = InterestRateType.STABLE;
  } else if (assetToken._iavsTokenType! == IavsTokenType.VTOKEN) {
    interestRateType = InterestRateType.VARIABLE;
  } else {
    interestRateType = null;
  }

  const amountUSD = tokenManager.getAmountUSD(amount);
  const manager = new DataManager(
    market.id,
    market.inputToken,
    event,
    protocolData
  );
  manager.createTransfer(
    asset,
    from,
    to,
    amount,
    amountUSD,
    senderBalanceResult.value,
    receiverBalanceResult.value,
    interestRateType
  );
}

export function _handleAssetConfigUpdated(
  event: ethereum.Event,
  assetAddress: Address,
  rewardTokenAddress: Address,
  rewardTokenPriceUSD: BigDecimal,
  emissionPerSecond: BigInt, // amount/second
  distributionEnd: BigInt, // timestamp when emission ends
  protocolData: ProtocolData
): void {
  const market = getMarketFromToken(assetAddress, protocolData);
  if (!market) {
    log.error("[_handleAssetConfigUpdated]Market for token {} not found", [
      assetAddress.toHexString(),
    ]);
    return;
  }

  const manager = new DataManager(
    market.id,
    market.inputToken,
    event,
    protocolData
  );
  const assetToken = new TokenManager(assetAddress, event).getToken();

  if (!assetToken._iavsTokenType) {
    log.error(
      "[_handleAssetConfigUpdated]_iavsTokenType field for token {} is not set",
      [assetAddress.toHexString()]
    );
    return;
  }
  // There can be more than one reward tokens for a side,
  // e.g. one reward token for variable borrowing
  // and another for stable borrowing
  let rewardTokenType: string;
  if (assetToken._iavsTokenType! == IavsTokenType.ATOKEN) {
    rewardTokenType = RewardTokenType.DEPOSIT;
  } else if (assetToken._iavsTokenType! == IavsTokenType.STOKEN) {
    rewardTokenType = RewardTokenType.STABLE_BORROW;
  } else if (assetToken._iavsTokenType! == IavsTokenType.VTOKEN) {
    rewardTokenType = RewardTokenType.VARIABLE_BORROW;
  } else {
    log.error(
      "[_handleAssetConfigUpdated] _iavsTokenType field for token {} is not one of ATOKEN, STOKEN, or VTOKEN",
      [assetAddress.toHexString()]
    );
    return;
  }

  const rewardTokenManager = new TokenManager(rewardTokenAddress, event);
  const rewardToken =
    rewardTokenManager.getOrCreateRewardToken(rewardTokenType);
  rewardToken._distributionEnd = distributionEnd;
  rewardToken.save();

  let emission = emissionPerSecond.times(BigInt.fromI32(SECONDS_PER_DAY));
  if (
    rewardToken._distributionEnd &&
    rewardToken._distributionEnd!.lt(event.block.timestamp)
  ) {
    log.info(
      "[_handleAssetConfigUpdated]distributionEnd {} < block timestamp {}; emission set to 0",
      [event.block.timestamp.toString(), distributionEnd.toString()]
    );
    emission = BIGINT_ZERO;
  }

  if (rewardTokenPriceUSD.gt(BIGDECIMAL_ZERO)) {
    rewardTokenManager.updatePrice(rewardTokenPriceUSD);
  }

  const emissionUSD = rewardTokenManager.getAmountUSD(emission);
  const rewardData = new RewardData(rewardToken, emission, emissionUSD);
  manager.updateRewards(rewardData);
}

export function _handleSwapBorrowRateMode(
  event: ethereum.Event,
  market: Market,
  user: Address,
  newBorrowBalances: BigInt[],
  endInterestRateType: InterestRateType,
  protocolData: ProtocolData
): void {
  const account = new AccountManager(user).getAccount();
  const manager = new DataManager(
    market.id,
    market.inputToken,
    event,
    protocolData
  );
  const protocol = manager.getOrCreateLendingProtocol(protocolData);
  const sPositionManager = new PositionManager(
    account,
    market,
    PositionSide.BORROWER,
    InterestRateType.STABLE
  );
  const vPositionManager = new PositionManager(
    account,
    market,
    PositionSide.BORROWER,
    InterestRateType.VARIABLE
  );
  const stableTokenBalance = newBorrowBalances[0];
  const variableTokenBalance = newBorrowBalances[1];
  //all open position converted to STABLE
  if (endInterestRateType === InterestRateType.STABLE) {
    vPositionManager.subtractPosition(
      event,
      protocol,
      variableTokenBalance,
      TransactionType.SWAP,
      market.inputTokenPriceUSD
    );
    sPositionManager.addPosition(
      event,
      market.inputToken,
      protocol,
      stableTokenBalance,
      TransactionType.SWAP,
      market.inputTokenPriceUSD
    );
  } else {
    //all open position converted to VARIABLE
    vPositionManager.addPosition(
      event,
      market.inputToken,
      protocol,
      variableTokenBalance,
      TransactionType.SWAP,
      market.inputTokenPriceUSD
    );
    sPositionManager.subtractPosition(
      event,
      protocol,
      stableTokenBalance,
      TransactionType.SWAP,
      market.inputTokenPriceUSD
    );
  }
}
