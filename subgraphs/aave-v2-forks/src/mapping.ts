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
  ActorAccount,
  Borrow,
  Deposit,
  Liquidate,
  Market,
  Repay,
  Token,
  Withdraw,
} from "../generated/schema";
import { AToken } from "../generated/templates/LendingPool/AToken";
import { StableDebtToken } from "../generated/templates/LendingPool/StableDebtToken";
import { VariableDebtToken } from "../generated/templates/LendingPool/VariableDebtToken";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  EventType,
  exponentToBigDecimal,
  InterestRateSide,
  InterestRateType,
  INT_FOUR,
  INT_TWO,
  INT_ZERO,
  PositionSide,
  rayToWad,
  RAY_OFFSET,
} from "./constants";
import {
  addPosition,
  createAccount,
  createInterestRate,
  getOrCreateLendingProtocol,
  getOrCreateToken,
  snapshotUsage,
  subtractPosition,
  updateFinancials,
  updateMarketSnapshots,
  updateSnapshots,
} from "./helpers";

//////////////////////////
///// Helper Classes /////
//////////////////////////

export class ProtocolData {
  constructor(
    public readonly protocolAddress: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly schemaVersion: string,
    public readonly subgraphVersion: string,
    public readonly methodologyVersion: string,
    public readonly network: string
  ) {}
}

//////////////////////////////////
///// Configuration Handlers /////
//////////////////////////////////

export function _handlePriceOracleUpdated(
  newPriceOracle: Address,
  protocolData: ProtocolData
): void {
  log.info("[PriceOracleUpdated] OracleAddress: {}", [
    newPriceOracle.toHexString(),
  ]);
  let protocol = getOrCreateLendingProtocol(protocolData);
  protocol.priceOracle = newPriceOracle.toHexString();
  protocol.save();
}

export function _handleReserveInitialized(
  event: ethereum.Event,
  underlyingToken: Address,
  outputToken: Address,
  stableDebtToken: Address,
  variableDebtToken: Address,
  protocolData: ProtocolData
): void {
  // create tokens
  let underlyingTokenEntity = getOrCreateToken(underlyingToken);
  let outputTokenEntity = getOrCreateToken(outputToken);
  let stableDebtTokenEntity = getOrCreateToken(stableDebtToken);
  let variableDebtTokenEntity = getOrCreateToken(variableDebtToken);

  // get protocol
  let protocol = getOrCreateLendingProtocol(protocolData);
  protocol.totalPoolCount++;
  let markets = protocol.marketIDs;
  markets.push(underlyingToken.toHexString());
  protocol.marketIDs = markets;
  protocol.save();

  // Create a new Market
  let market = new Market(underlyingToken.toHexString());

  market.protocol = protocol.name;
  market.name = outputTokenEntity.name;
  market.isActive = true; // initialized to true on creation
  market.canUseAsCollateral = true; // only stopped when protocol is paused
  market.canBorrowFrom = true; // this field changes occasinally, but all markets are set to true after creation
  market.maximumLTV = BIGDECIMAL_ZERO;
  market.liquidationThreshold = BIGDECIMAL_ZERO;
  market.liquidationPenalty = BIGDECIMAL_ZERO;
  market.inputToken = underlyingTokenEntity.id;
  market.outputToken = outputTokenEntity.id;
  market.totalValueLockedUSD = BIGDECIMAL_ZERO;
  market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
  market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
  market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
  market.inputTokenBalance = BIGINT_ZERO;
  market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
  market.outputTokenSupply = BIGINT_ZERO;
  market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  market.exchangeRate = BIGDECIMAL_ONE; // this is constant
  market.reserveFactor = BIGDECIMAL_ZERO;
  market.totalStableValueLocked = BIGINT_ZERO;
  market.totalVariableValueLocked = BIGINT_ZERO;
  market.rewardTokens = []; // updated once used
  market.rewardTokenEmissionsAmount = [];
  market.rewardTokenEmissionsUSD = [];
  market.sToken = stableDebtTokenEntity.id;
  market.vToken = variableDebtTokenEntity.id;
  market.liquidityIndex = BIGINT_ZERO;
  market.createdTimestamp = event.block.timestamp;
  market.createdBlockNumber = event.block.number;
  market.positionCount = INT_ZERO;
  market.openPositionCount = INT_ZERO;
  market.closedPositionCount = INT_ZERO;
  market.lendingPositionCount = INT_ZERO;
  market.borrowingPositionCount = INT_ZERO;
  market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
  market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  market.rates = []; // calculated in event ReserveDataUpdated
  market.prePauseState = [true, true, true];

  market.save();
}

export function _handleCollateralConfigurationChanged(
  marketId: Address,
  liquidationPenalty: BigInt,
  liquidationThreshold: BigInt,
  maximumLTV: BigInt
): void {
  // Adjust market LTV, liquidation, and collateral data when a reserve's collateral configuration has changed
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[CollateralConfigurationChanged] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  market.maximumLTV = maximumLTV.toBigDecimal().div(BIGDECIMAL_HUNDRED);
  market.liquidationThreshold = liquidationThreshold
    .toBigDecimal()
    .div(BIGDECIMAL_HUNDRED);

  // The liquidation bonus value is equal to the liquidation penalty, the naming is a matter of which side of the liquidation a user is on
  // The liquidationBonus parameter comes out as above 100%, represented by a 5 digit integer over 10000 (100%).
  // To extract the expected value in the liquidationPenalty field: convert to BigDecimal, subtract by 10000 and divide by 100
  market.liquidationPenalty = liquidationPenalty.toBigDecimal();
  if (market.liquidationPenalty.gt(BIGDECIMAL_ZERO)) {
    market.liquidationPenalty = market.liquidationPenalty
      .minus(exponentToBigDecimal(INT_FOUR))
      .div(BIGDECIMAL_HUNDRED);
  }

  market.save();
}

export function _handleBorrowingEnabledOnReserve(marketId: Address): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[BorrowingEnabledOnReserve] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  market.canBorrowFrom = true;
  market.prePauseState = [
    market.prePauseState[0],
    market.prePauseState[1],
    true,
  ];
  market.save();
}

export function _handleBorrowingDisabledOnReserve(marketId: Address): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[BorrowingDisabledOnReserve] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  market.canBorrowFrom = false;
  market.prePauseState = [
    market.prePauseState[0],
    market.prePauseState[1],
    false,
  ];
  market.save();
}

export function _handleReserveActivated(marketId: Address): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[ReserveActivated] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  market.isActive = true;
  market.prePauseState = [
    true,
    market.prePauseState[1],
    market.prePauseState[2],
  ];
  market.save();
}

export function _handleReserveDeactivated(marketId: Address): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[ReserveDeactivated] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  market.isActive = false;
  market.prePauseState = [
    false,
    market.prePauseState[1],
    market.prePauseState[2],
  ];
  market.save();
}

export function _handleReserveFactorChanged(
  marketId: Address,
  reserveFactor: BigInt
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[ReserveFactorChanged] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  market.reserveFactor = reserveFactor
    .toBigDecimal()
    .div(exponentToBigDecimal(INT_TWO));
  market.save();
}

export function _handleReserveUsedAsCollateralEnabled(
  marketId: Address,
  accountID: Address,
  protocolData: ProtocolData
): void {
  let protocol = getOrCreateLendingProtocol(protocolData);

  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[ReserveUsedAsCollateralEnabled] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  // grab account
  let account = Account.load(accountID.toHexString());
  if (!account) {
    account = createAccount(accountID.toHexString());
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  let markets = account.enabledCollaterals;
  markets.push(market.id);
  account.enabledCollaterals = markets;
  account.save();
}

export function _handleReserveUsedAsCollateralDisabled(
  marketId: Address,
  accountID: Address
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[ReserveUsedAsCollateralDisabled] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }

  // grab account
  let account = Account.load(accountID.toHexString());
  if (!account) {
    log.warning("[ReserveUsedAsCollateralEnabled] Account not found: {}", [
      accountID.toHexString(),
    ]);
    return;
  }
  let markets = account.enabledCollaterals;
  let index = markets.indexOf(market.id);
  if (index >= 0) {
    // drop 1 element at given index
    markets.splice(index, 1);
  }
  account.enabledCollaterals = markets;
  account.save();
}

export function _handlePaused(protocolData: ProtocolData): void {
  let protocol = getOrCreateLendingProtocol(protocolData);

  for (let i = 0; i < protocol.marketIDs.length; i++) {
    let market = Market.load(protocol.marketIDs[i]);
    if (!market) {
      log.warning("[Paused] Market not found: {}", [protocol.marketIDs[i]]);
      continue;
    }

    market.prePauseState = [
      market.isActive,
      market.canUseAsCollateral,
      market.canBorrowFrom,
    ];

    market.isActive = false;
    market.canUseAsCollateral = false;
    market.canBorrowFrom = false;
    market.save();
  }
}

export function _handleUnpaused(protocolData: ProtocolData): void {
  let protocol = getOrCreateLendingProtocol(protocolData);

  for (let i = 0; i < protocol.marketIDs.length; i++) {
    let market = Market.load(protocol.marketIDs[i]);
    if (!market) {
      log.warning("[Paused] Market not found: {}", [protocol.marketIDs[i]]);
      continue;
    }

    market.isActive = market.prePauseState[0];
    market.canUseAsCollateral = market.prePauseState[1];
    market.canBorrowFrom = market.prePauseState[2];

    market.save();
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
  marketId: Address,
  assetPriceUSD: BigDecimal
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[ReserveDataUpdated] Market not found: {}", [
      marketId.toHexString(),
    ]);
    return;
  }
  let protocol = getOrCreateLendingProtocol(protocolData);

  // get input token and decimals
  let inputToken = getOrCreateToken(Address.fromString(market.inputToken));

  // update market prices
  market.inputTokenPriceUSD = assetPriceUSD;
  market.outputTokenPriceUSD = assetPriceUSD;

  // get current borrow balance
  let stableDebtContract = StableDebtToken.bind(
    Address.fromString(market.sToken)
  );
  let variableDebtContract = VariableDebtToken.bind(
    Address.fromString(market.vToken)
  );
  let trySBorrowBalance = stableDebtContract.try_totalSupply();
  let tryVBorrowBalance = variableDebtContract.try_totalSupply();
  let sBorrowBalance = BIGINT_ZERO;
  let vBorrowBalance = BIGINT_ZERO;

  if (!trySBorrowBalance.reverted) {
    sBorrowBalance = trySBorrowBalance.value;
  }
  if (!tryVBorrowBalance.reverted) {
    vBorrowBalance = tryVBorrowBalance.value;
  }

  // broken if both revert
  if (trySBorrowBalance.reverted && tryVBorrowBalance.reverted) {
    log.warning("[ReserveDataUpdated] No borrow balance found", []);
    return;
  }

  let totalBorrowBalance = sBorrowBalance
    .plus(vBorrowBalance)
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));
  market.totalBorrowBalanceUSD = totalBorrowBalance.times(assetPriceUSD);

  // update total supply balance
  let aTokenContract = AToken.bind(Address.fromString(market.outputToken!));
  let tryTotalSupply = aTokenContract.try_totalSupply();
  if (tryTotalSupply.reverted) {
    log.warning(
      "[ReserveDataUpdated] Error getting total supply on market: {}",
      [marketId.toHexString()]
    );
    return;
  }
  let tryScaledSupply = aTokenContract.try_scaledTotalSupply();
  if (tryScaledSupply.reverted) {
    log.warning(
      "[ReserveDataUpdated] Error getting scaled total supply on market: {}",
      [marketId.toHexString()]
    );
    return;
  }

  market.inputTokenBalance = tryTotalSupply.value;
  market.outputTokenSupply = tryTotalSupply.value;
  market.totalDepositBalanceUSD = market.inputTokenBalance
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals))
    .times(assetPriceUSD);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;

  // calculate new revenue
  // New Interest = totalScaledSupply * (difference in liquidity index)
  let liquidityIndexDiff = liquidityIndex
    .minus(market.liquidityIndex)
    .toBigDecimal()
    .div(exponentToBigDecimal(RAY_OFFSET));
  market.liquidityIndex = liquidityIndex; // must update to current liquidity index
  let newRevenueBD = tryScaledSupply.value
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals))
    .times(liquidityIndexDiff);
  let totalRevenueDeltaUSD = newRevenueBD.times(assetPriceUSD);
  let protocolSideRevenueDeltaUSD = totalRevenueDeltaUSD.times(
    market.reserveFactor.div(exponentToBigDecimal(INT_TWO))
  );
  let supplySideRevenueDeltaUSD = totalRevenueDeltaUSD.minus(
    protocolSideRevenueDeltaUSD
  );

  market.cumulativeTotalRevenueUSD =
    market.cumulativeTotalRevenueUSD.plus(totalRevenueDeltaUSD);
  market.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueDeltaUSD);
  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueDeltaUSD);

  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(totalRevenueDeltaUSD);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueDeltaUSD);
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueDeltaUSD);

  log.info("[ReserveDataUpdated] New total revenue: {}", [
    totalRevenueDeltaUSD.toString(),
  ]);

  // update rates
  let sBorrowRate = createInterestRate(
    market.id,
    InterestRateSide.BORROWER,
    InterestRateType.STABLE,
    rayToWad(stableBorrowRate)
      .toBigDecimal()
      .div(exponentToBigDecimal(DEFAULT_DECIMALS - 2))
  );

  let vBorrowRate = createInterestRate(
    market.id,
    InterestRateSide.BORROWER,
    InterestRateType.VARIABLE,
    rayToWad(variableBorrowRate)
      .toBigDecimal()
      .div(exponentToBigDecimal(DEFAULT_DECIMALS - 2))
  );

  let depositRate = createInterestRate(
    market.id,
    InterestRateSide.LENDER,
    InterestRateType.VARIABLE,
    rayToWad(liquidityRate)
      .toBigDecimal()
      .div(exponentToBigDecimal(DEFAULT_DECIMALS - 2))
  );

  market.rates = [depositRate.id, vBorrowRate.id, sBorrowRate.id];
  market.save();

  // update protocol TVL / BorrowUSD / SupplyUSD
  let tvl = BIGDECIMAL_ZERO;
  let depositUSD = BIGDECIMAL_ZERO;
  let borrowUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < protocol.marketIDs.length; i++) {
    let thisMarket = Market.load(protocol.marketIDs[i])!;
    tvl = tvl.plus(thisMarket.totalValueLockedUSD);
    depositUSD = depositUSD.plus(thisMarket.totalDepositBalanceUSD);
    borrowUSD = borrowUSD.plus(thisMarket.totalBorrowBalanceUSD);
  }
  protocol.totalValueLockedUSD = tvl;
  protocol.totalDepositBalanceUSD = depositUSD;
  protocol.totalBorrowBalanceUSD = borrowUSD;
  protocol.save();

  // update financial snapshot
  updateFinancials(
    event,
    protocol,
    totalRevenueDeltaUSD,
    protocolSideRevenueDeltaUSD,
    supplySideRevenueDeltaUSD
  );

  // update revenue in market snapshots
  updateMarketSnapshots(
    event.block.number,
    event.block.timestamp,
    market,
    totalRevenueDeltaUSD,
    supplySideRevenueDeltaUSD,
    protocolSideRevenueDeltaUSD
  );
}

export function _handleDeposit(
  event: ethereum.Event,
  amount: BigInt,
  marketId: Address,
  protocolData: ProtocolData,
  accountID: Address
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[Deposit] Market not found on protocol: {}", [
      marketId.toHexString(),
    ]);
    return;
  }
  let inputToken = Token.load(market.inputToken);
  let protocol = getOrCreateLendingProtocol(protocolData);

  // create deposit entity
  let id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  let deposit = new Deposit(id);

  // create account
  let account = Account.load(accountID.toHexString());
  if (!account) {
    account = createAccount(accountID.toHexString());
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  account.depositCount += 1;
  account.save();

  // update position
  let aTokenContract = AToken.bind(Address.fromString(market.outputToken!));
  let positionId = addPosition(
    protocol,
    market,
    account,
    aTokenContract.try_balanceOf(accountID), // try getting balance of account
    PositionSide.LENDER,
    EventType.DEPOSIT,
    event
  );

  deposit.position = positionId;
  deposit.nonce = event.transaction.nonce;
  deposit.account = accountID.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.market = marketId.toHexString();
  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.asset = inputToken!.id;
  deposit.amount = amount;
  deposit.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken!.decimals))
    .times(market.inputTokenPriceUSD);
  deposit.save();

  // update metrics
  protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(
    deposit.amountUSD
  );
  protocol.save();
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(
    deposit.amountUSD
  );
  market.save();

  // update usage metrics
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    deposit.account,
    EventType.DEPOSIT,
    true
  );

  // udpate market daily / hourly snapshots / financialSnapshots
  updateSnapshots(
    protocol,
    market,
    deposit.amountUSD,
    EventType.DEPOSIT,
    event.block.timestamp,
    event.block.number
  );
}

export function _handleWithdraw(
  event: ethereum.Event,
  amount: BigInt,
  marketId: Address,
  protocolData: ProtocolData,
  accountID: Address
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[Withdraw] Market not found on protocol: {}", [
      marketId.toHexString(),
    ]);
    return;
  }
  let inputToken = Token.load(market.inputToken);
  let protocol = getOrCreateLendingProtocol(protocolData);

  // create withdraw entity
  let id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  let withdraw = new Withdraw(id);

  // get account
  let account = Account.load(accountID.toHexString());
  if (!account) {
    account = createAccount(accountID.toHexString());
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  account.withdrawCount += 1;
  account.save();

  let aTokenContract = AToken.bind(Address.fromString(market.outputToken!));
  let positionId = subtractPosition(
    protocol,
    market,
    account,
    aTokenContract.try_balanceOf(accountID), // try getting balance of account
    PositionSide.LENDER,
    EventType.WITHDRAW,
    event
  );
  if (positionId === null) {
    log.warning("[handleWithdraw] Position not found for account: {}", [
      accountID.toHexString(),
    ]);
    return;
  }

  withdraw.position = positionId;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.account = account.id;
  withdraw.market = market.id;
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.nonce = event.transaction.nonce;
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.asset = inputToken!.id;
  withdraw.amount = amount;
  withdraw.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken!.decimals))
    .times(market.inputTokenPriceUSD);
  withdraw.save();

  // update usage metrics
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    withdraw.account,
    EventType.WITHDRAW,
    true
  );

  // udpate market daily / hourly snapshots / financialSnapshots
  updateSnapshots(
    protocol,
    market,
    withdraw.amountUSD,
    EventType.WITHDRAW,
    event.block.timestamp,
    event.block.number
  );
}

export function _handleBorrow(
  event: ethereum.Event,
  amount: BigInt,
  marketId: Address,
  protocolData: ProtocolData,
  accountID: Address
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[Borrow] Market not found on protocol: {}", [
      marketId.toHexString(),
    ]);
    return;
  }
  let inputToken = Token.load(market.inputToken);
  let protocol = getOrCreateLendingProtocol(protocolData);

  // create borrow entity
  let id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  let borrow = new Borrow(id);

  // create account
  let account = Account.load(accountID.toHexString());
  if (!account) {
    account = createAccount(accountID.toHexString());
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  account.borrowCount += 1;
  account.save();

  // update position
  let aTokenContract = AToken.bind(Address.fromString(market.outputToken!));
  let positionId = addPosition(
    protocol,
    market,
    account,
    aTokenContract.try_balanceOf(accountID), // try getting balance of account
    PositionSide.BORROWER,
    EventType.BORROW,
    event
  );

  borrow.position = positionId;
  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.account = account.id;
  borrow.nonce = event.transaction.nonce;
  borrow.market = market.id;
  borrow.hash = event.transaction.hash.toHexString();
  borrow.logIndex = event.logIndex.toI32();
  borrow.asset = inputToken!.id;
  borrow.amount = amount;
  borrow.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken!.decimals))
    .times(market.inputTokenPriceUSD);
  borrow.save();

  // update metrics
  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(
    borrow.amountUSD
  );
  protocol.save();
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(
    borrow.amountUSD
  );
  market.save();

  // update usage metrics
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    borrow.account,
    EventType.BORROW,
    true
  );

  // udpate market daily / hourly snapshots / financialSnapshots
  updateSnapshots(
    protocol,
    market,
    borrow.amountUSD,
    EventType.BORROW,
    event.block.timestamp,
    event.block.number
  );
}

export function _handleRepay(
  event: ethereum.Event,
  amount: BigInt,
  marketId: Address,
  protocolData: ProtocolData,
  accountID: Address
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[Repay] Market not found on protocol: {}", [
      marketId.toHexString(),
    ]);
    return;
  }
  let inputToken = Token.load(market.inputToken);
  let protocol = getOrCreateLendingProtocol(protocolData);

  // create repay entity
  let id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  let repay = new Repay(id);

  // get account
  let account = Account.load(accountID.toHexString());
  if (!account) {
    account = createAccount(accountID.toHexString());
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  account.repayCount += 1;
  account.save();

  let aTokenContract = AToken.bind(Address.fromString(market.outputToken!));
  let positionId = subtractPosition(
    protocol,
    market,
    account,
    aTokenContract.try_balanceOf(accountID), // try getting balance of account
    PositionSide.LENDER,
    EventType.REPAY,
    event
  );
  if (positionId === null) {
    log.warning("[handleRepay] Position not found for account: {}", [
      accountID.toHexString(),
    ]);
    return;
  }

  repay.position = positionId;
  repay.blockNumber = event.block.number;
  repay.timestamp = event.block.timestamp;
  repay.account = account.id;
  repay.market = market.id;
  repay.hash = event.transaction.hash.toHexString();
  repay.nonce = event.transaction.nonce;
  repay.logIndex = event.logIndex.toI32();
  repay.asset = inputToken!.id;
  repay.amount = amount;
  repay.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken!.decimals))
    .times(market.inputTokenPriceUSD);
  repay.save();

  // update usage metrics
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    repay.account,
    EventType.REPAY,
    true
  );

  // udpate market daily / hourly snapshots / financialSnapshots
  updateSnapshots(
    protocol,
    market,
    repay.amountUSD,
    EventType.REPAY,
    event.block.timestamp,
    event.block.number
  );
}

export function _handleLiquidate(
  event: ethereum.Event,
  amount: BigInt,
  marketId: Address, // collateral market
  protocolData: ProtocolData,
  liquidator: Address,
  borrower: Address, // account liquidated
  repayToken: Address // token repaid to cover debt
): void {
  let market = Market.load(marketId.toHexString());
  if (!market) {
    log.warning("[Liquidate] Market not found on protocol: {}", [
      marketId.toHexString(),
    ]);
    return;
  }
  let inputToken = Token.load(market.inputToken);
  let protocol = getOrCreateLendingProtocol(protocolData);

  // create liquidate entity
  let id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  let liquidate = new Liquidate(id);

  // update liquidators account
  let liquidatorAccount = Account.load(liquidator.toHexString());
  if (!liquidatorAccount) {
    liquidatorAccount = createAccount(liquidator.toHexString());
    liquidatorAccount.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  liquidatorAccount.liquidateCount += 1;
  let liquidatorActorID = "liquidator"
    .concat("-")
    .concat(liquidator.toHexString());
  let liquidatorActor = ActorAccount.load(liquidatorActorID);
  if (!liquidatorActor) {
    liquidatorActor = new ActorAccount(liquidatorActorID);
    liquidatorActor.save();

    protocol.cumulativeUniqueLiquidators += 1;
    protocol.save();
  }

  // get borrower account
  let account = Account.load(borrower.toHexString());
  if (!account) {
    account = createAccount(borrower.toHexString());
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  account.liquidationCount += 1;
  account.save();

  let repayTokenMarket = Market.load(repayToken.toHexString());
  if (!repayTokenMarket) {
    log.warning("[Liquidate] Repay token market not found on protocol: {}", [
      repayToken.toHexString(),
    ]);
  }
  let aTokenContract = AToken.bind(Address.fromString(market.outputToken!));
  let positionId = subtractPosition(
    protocol,
    market,
    account,
    aTokenContract.try_balanceOf(borrower), // try getting balance of account
    PositionSide.LENDER,
    EventType.LIQUIDATEE,
    event
  );
  if (positionId === null) {
    log.warning("[handleLiquidate] Position not found for account: {}", [
      borrower.toHexString(),
    ]);
    return;
  }

  liquidate.position = positionId;
  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.liquidator = liquidator.toHexString();
  liquidate.liquidatee = borrower.toHexString();
  liquidate.market = market.id;
  liquidate.hash = event.transaction.hash.toHexString();
  liquidate.nonce = event.transaction.nonce;
  liquidate.logIndex = event.logIndex.toI32();
  liquidate.asset = inputToken!.id;
  liquidate.amount = amount;
  liquidate.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken!.decimals))
    .times(market.inputTokenPriceUSD);
  liquidate.profitUSD = liquidate.amountUSD.times(
    market.liquidationPenalty.div(BIGDECIMAL_HUNDRED)
  );
  liquidate.save();

  market.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD.plus(
    liquidate.amountUSD
  );
  market.save();

  // update usage metrics
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    liquidate.liquidatee,
    EventType.LIQUIDATEE,
    true // only count this liquidate as new tx
  );
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    liquidate.liquidator,
    EventType.LIQUIDATOR, // updates dailyActiveLiquidators
    false
  );

  // udpate market daily / hourly snapshots / financialSnapshots
  updateSnapshots(
    protocol,
    market,
    liquidate.amountUSD,
    EventType.LIQUIDATOR,
    event.block.timestamp,
    event.block.number
  );
}
