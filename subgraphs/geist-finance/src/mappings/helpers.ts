import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

import {
  Token,
  Market,
  RewardToken,
  MarketDailySnapshot,
  LendingProtocol,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  Account,
  ActiveAccount,
  UsageMetricsHourlySnapshot,
  InterestRate,
} from "../../generated/schema";

import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_TWO,
  BIGINT_ZERO,
  SchemaNetwork,
  ProtocolType,
  RewardTokenType,
  LENDING_TYPE,
  RISK_TYPE,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  SCHEMA_VERSION,
  SUBGRAPH_VERSION,
  REWARD_TOKEN_ADDRESS,
  PROTOCOL_METHODOLOGY_VERSION,
  InterestRateSide,
  InterestRateType,
} from "../common/constants";

import * as addresses from "../common/addresses";

import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
} from "../common/tokens";

import { emissionsPerDay } from "../common/rewards";

import {
  getDaysSinceEpoch,
  getHoursSinceEpoch,
  getPreviousDaysSinceEpoch,
} from "../common/utils/datetime";

import { getOrCreateToken } from "../common/getters";

import { bigIntToBigDecimal, rayToWad } from "../common/utils/numbers";

import { GToken } from "../../generated/templates/GToken/GToken";

import { LendingPool } from "../../generated/templates/LendingPool/LendingPool";

import { SpookySwapGEISTFTM } from "../../generated/templates/LendingPool/SpookySwapGEISTFTM";

import { AaveOracle } from "../../generated/templates/LendingPool/AaveOracle";

import { AaveProtocolDataProvider } from "../../generated/templates/LendingPool/AaveProtocolDataProvider";

export function getOrCreateInterestRate(
  marketId: string,
  side: string,
  type: string
): InterestRate {
  const interestRateID = side + "-" + type + "-" + marketId;
  let interestRate = InterestRate.load(interestRateID);
  if (interestRate == null) {
    interestRate = new InterestRate(interestRateID);
    interestRate.rate = BIGDECIMAL_ZERO;
  }

  if (side == "LENDER") {
    interestRate.side = InterestRateSide.LENDER;
  } else if (side == "BORROWER") {
    interestRate.side = InterestRateSide.BORROWER;
  }

  if (type == "STABLE") {
    interestRate.type = InterestRateType.STABLE;
  } else if (type == "VARIABLE") {
    interestRate.type = InterestRateType.VARIABLE;
  } else if (type == "FIXED_TERM") {
    interestRate.type = InterestRateType.FIXED_TERM;
  }

  interestRate.save();
  return interestRate as InterestRate;
}

export function initializeMarket(
  blockNumber: BigInt,
  timestamp: BigInt,
  id: string
): Market {
  // Create (or load) a Market and give it default values
  const token = getOrCreateToken(Address.fromString(id)) as Token;

  let market = Market.load(id);
  if (market === null) {
    // Get the lending pool to get the reserve data for this Market entity
    const lendingPool = getLendingPoolFromCtx();
    const lendingPoolContract = LendingPool.bind(
      Address.fromString(lendingPool)
    );
    // The input token, which would be the token instantiated from the id/address input
    // Populate fields with data that has been passed to the function
    // Other data fields are initialized as 0/[]/false
    const protocolId = getProtocolIdFromCtx();
    const protocol = getOrCreateProtocol(protocolId);
    // Initialize market fields as zero
    market = new Market(id);
    market.name = token.name;
    market.protocol = protocol.name;
    market.outputToken = addresses.ZERO_ADDRESS.toHexString();
    market.inputToken = token.id;
    market.inputTokenBalance = BIGINT_ZERO;
    market.rewardTokens = [];
    market.rewardTokenEmissionsAmount = [];
    market.rewardTokenEmissionsUSD = [];
    market.createdBlockNumber = blockNumber;
    market.createdTimestamp = timestamp;
    market.isActive = false;
    market.canBorrowFrom = false;
    market.canUseAsCollateral = false;
    market.maximumLTV = BIGDECIMAL_ZERO;
    market.liquidationPenalty = BIGDECIMAL_ZERO;
    market.liquidationThreshold = BIGDECIMAL_ZERO;
    market.outputTokenSupply = BIGINT_ZERO;
    market.exchangeRate = BIGDECIMAL_ZERO;
    market.rates = [];
    const tryReserve = lendingPoolContract.try_getReserveData(
      Address.fromString(id)
    );

    let stableBorrowRate = getOrCreateInterestRate(
      market.id,
      "BORROWER",
      "STABLE"
    );
    stableBorrowRate.rate = bigIntToBigDecimal(
      rayToWad(tryReserve.value.currentStableBorrowRate)
    );

    let variableBorrowRate = getOrCreateInterestRate(
      market.id,
      "BORROWER",
      "VARIABLE"
    );
    variableBorrowRate.rate = bigIntToBigDecimal(
      rayToWad(tryReserve.value.currentVariableBorrowRate)
    );

    market.rates = [stableBorrowRate.id, variableBorrowRate.id];
  } else {
    log.error("Failed to get market ID={} reserve data", [market.id]);
  }

  let rewardTokens = market.rewardTokens;
  if (rewardTokens === null) rewardTokens = [];
  if (rewardTokens.length === 0) {
    // If the reward tokens have not been initialized on the market, attempt to pull them from the incentive controller
    const rewardTokenFromIncController = Address.fromString(
      REWARD_TOKEN_ADDRESS
    );
    const depositRewardToken = getOrCreateRewardToken(
      rewardTokenFromIncController,
      RewardTokenType.DEPOSIT
    );
    const borrowRewardToken = getOrCreateRewardToken(
      rewardTokenFromIncController,
      RewardTokenType.BORROW
    );
    market.rewardTokens = [depositRewardToken.id, borrowRewardToken.id];
    market.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
    market.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  }
  // Get reward emissions
  market.rewardTokenEmissionsAmount = getCurrentRewardEmissions(market);
  market.rewardTokenEmissionsUSD = getCurrentRewardEmissionsUSD(market);

  const currentPriceUSD = getAssetPriceInUSDC(Address.fromString(market.id));
  market.outputTokenPriceUSD = currentPriceUSD;
  market.inputTokenPriceUSD = currentPriceUSD;
  market.save();
  return market as Market;
}

export function getCurrentRewardEmissions(market: Market): BigInt[] {
  // Get the current reward emission rate array in form [deposit_emissions, borrow_emissions] for a Market
  let depositRewardEmissions = market.rewardTokenEmissionsAmount[0];
  let borrowRewardEmissions = market.rewardTokenEmissionsAmount[1];

  // Use the Aave protocol data provider to extract emission rate
  const dataProviderContract = AaveProtocolDataProvider.bind(
    addresses.AAVE_PROTOCOL_DATA_PROVIDER
  );

  const reserve_data = dataProviderContract.try_getReserveData(
    Address.fromString(market.id)
  );

  if (!reserve_data.reverted) {
    const assetDataSupply = reserve_data.value.value0;
    const assetDataBorrowStable = reserve_data.value.value1;
    const assetDataBorrowVariable = reserve_data.value.value2;

    // Get the emissions per day for the GToken rewards for deposits
    if (!assetDataSupply.equals(BIGINT_ZERO)) {
      depositRewardEmissions = emissionsPerDay(assetDataSupply);
    } else {
      depositRewardEmissions = BIGINT_ZERO;
    }
    const borrowRewardsAvgRate = assetDataBorrowStable
      .plus(assetDataBorrowVariable)
      .div(BIGINT_TWO);
    log.info(
      "Stable borrow rate={}, Variable borrow rate={}, Total rate={}, Average rate={}",
      [
        assetDataBorrowStable.toString(),
        assetDataBorrowVariable.toString(),
        assetDataBorrowStable.plus(assetDataBorrowVariable).toString(),
        borrowRewardsAvgRate.toString(),
      ]
    );
    if (!borrowRewardsAvgRate.equals(BIGINT_ZERO)) {
      borrowRewardEmissions = emissionsPerDay(borrowRewardsAvgRate);
    } else {
      borrowRewardEmissions = BIGINT_ZERO;
    }
  } else {
    log.error("Could not get reward emissions for market ID={}", [market.id]);
  }
  return [depositRewardEmissions, borrowRewardEmissions];
}

export function updateOutputTokenSupply(event: ethereum.Event): void {
  // Update the token supply
  const outputTokenAddress = event.address;
  const gTokenInstance = GToken.bind(outputTokenAddress);

  const tryTokenSupply = gTokenInstance.try_totalSupply();
  if (!tryTokenSupply.reverted) {
    const gToken = getOrCreateToken(outputTokenAddress);
    log.info("For token={}, token supply={}", [
      outputTokenAddress.toHexString(),
      tryTokenSupply.value.toString(),
    ]);

    let marketId = gTokenInstance.UNDERLYING_ASSET_ADDRESS().toHexString();

    const market = Market.load(marketId);
    if (!market) {
      return;
    }
    market.outputTokenSupply = tryTokenSupply.value;
    market.save();

    const marketDailyId = getMarketDailyId(event, market);
    const marketDailySnapshot = MarketDailySnapshot.load(marketDailyId);

    if (!marketDailySnapshot) {
      return;
    }
    marketDailySnapshot.outputTokenSupply = market.outputTokenSupply;
    marketDailySnapshot.save();
  } else {
    log.info("Unable to get token supply for token={}", [
      outputTokenAddress.toHexString(),
    ]);
  }
}

export function getOrCreateRewardToken(
  assetAddr: Address,
  type: string
): RewardToken {
  // Create (or load) a specific reward token
  let rewardToken = RewardToken.load(type + "-" + assetAddr.toHex());
  if (rewardToken === null) {
    rewardToken = new RewardToken(type + "-" + assetAddr.toHex());
    let token = getOrCreateToken(assetAddr);
    rewardToken.token = token.id;
    rewardToken.type = type;
    rewardToken.save();
  }
  getOrCreateToken(assetAddr);
  log.info(
    "Created (or loaded) reward token with ID={}, with TokenID={}, and type={}",
    [rewardToken.id, rewardToken.token, rewardToken.type]
  );
  return rewardToken as RewardToken;
}

export function getOrCreateProtocol(protocolId: string): LendingProtocol {
  // Create (or load) the Lending protocol entity
  let lendingProtocol = LendingProtocol.load(protocolId);

  if (!lendingProtocol) {
    lendingProtocol = new LendingProtocol(protocolId);
    lendingProtocol.name = PROTOCOL_NAME;
    lendingProtocol.slug = PROTOCOL_SLUG;
    lendingProtocol.schemaVersion = SCHEMA_VERSION;
    lendingProtocol.subgraphVersion = SUBGRAPH_VERSION;
    lendingProtocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
    lendingProtocol.network = SchemaNetwork.FANTOM;
    lendingProtocol.type = ProtocolType.LENDING;
    lendingProtocol.lendingType = LENDING_TYPE;
    lendingProtocol.riskType = RISK_TYPE;
    lendingProtocol.mintedTokens = [];
    lendingProtocol.cumulativeUniqueUsers = 0;
    lendingProtocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    lendingProtocol.protocolControlledValueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    lendingProtocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    lendingProtocol.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    lendingProtocol.mintedTokenSupplies = [];
    lendingProtocol.save();
  }
  log.info("Created (or loaded) lending protocol with ID={}", [
    lendingProtocol.id,
  ]);

  return lendingProtocol as LendingProtocol;
}

export function initializeIncentivesController(market: Market): Address {
  // Initialize the incentives controller for a specific gToken
  if (market.outputToken) {
    log.info(
      "Initializing incentives controller for market with ID={}, gToken={}",
      [market.id, market.outputToken]
    );
  } else {
    log.error("No output token for for market with ID={}", [market.id]);
    return addresses.INCENTIVE_CONTROLLER_ADDRESS;
  }

  const gToken = GToken.bind(Address.fromString(market.outputToken));
  if (!gToken.try_getIncentivesController().reverted) {
    const incentivesControllerAddress = gToken.try_getIncentivesController()
      .value;
    log.info(
      "Set incentives controller for ID={} successfully with address={}",
      [market.id, incentivesControllerAddress.toHexString()]
    );
    return incentivesControllerAddress;
  } else {
    log.error(
      "Failed to get incentives controller for market ID={}, gToken={}",
      [market.id, gToken._address.toHexString()]
    );
    return addresses.INCENTIVE_CONTROLLER_ADDRESS;
  }
}

// SNAPSHOT FUNCTIONS
// ------------------

export function getMarketDailyId(
  event: ethereum.Event,
  market: Market
): string {
  const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
  const id = market.id.concat("-").concat(daysSinceEpoch);
  return id;
}

// For the lack of closure support, the recommendation is to loop into a global variable
let rewardEmissionsAmounts: BigInt[] = [];
let rewardEmissionsAmountsUSD: BigDecimal[] = [];
export function getMarketDailySnapshot(
  event: ethereum.Event,
  market: Market
): MarketDailySnapshot {
  // Create a snapshot of market data throughout the day. One snapshot per market per day.
  // Attempt to load Snapshot entity implementation based on days since epoch in id.
  // Snapshot is created at the start of a new day and updated after transactions change certain market data.
  const snapshotId = getMarketDailyId(event, market);
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);

  let marketSnapshot = MarketDailySnapshot.load(snapshotId);
  if (marketSnapshot === null) {
    marketSnapshot = new MarketDailySnapshot(snapshotId);
    marketSnapshot.market = market.id;
    marketSnapshot.protocol = protocol.id;
    let rewardTokenList: string[] = [];

    if (market.rewardTokens) {
      rewardTokenList = market.rewardTokens as string[];
      rewardEmissionsAmounts = [];
      rewardEmissionsAmountsUSD = [];
      rewardTokenList.forEach(() => {
        rewardEmissionsAmounts.push(BIGINT_ZERO);
        rewardEmissionsAmountsUSD.push(BIGDECIMAL_ZERO);
      });
      marketSnapshot.rewardTokenEmissionsAmount = rewardEmissionsAmounts;
      marketSnapshot.rewardTokenEmissionsUSD = rewardEmissionsAmountsUSD;
    } else {
      marketSnapshot.rewardTokenEmissionsAmount = [];
      marketSnapshot.rewardTokenEmissionsUSD = [];
    }
  }

  const token = getOrCreateToken(Address.fromString(market.id));
  marketSnapshot.totalValueLockedUSD = tokenAmountInUSD(
    market.inputTokenPriceUSD,
    token.decimals,
    market.inputTokenBalance,
    market
  );

  marketSnapshot.inputTokenBalance = market.inputTokenBalance;
  marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
  marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;
  marketSnapshot.save();
  log.info("Saving market snapshot with ID={}", [marketSnapshot.id]);
  return marketSnapshot as MarketDailySnapshot;
}

export function updateMetricsHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  // Create (or load) the days UsageMetricsDailySnapshot
  const hoursSinceEpoch = getHoursSinceEpoch(event.block.timestamp.toI32());
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);

  let usageMetricsHourlySnapshot = UsageMetricsHourlySnapshot.load(
    hoursSinceEpoch
  );
  if (!usageMetricsHourlySnapshot) {
    usageMetricsHourlySnapshot = new UsageMetricsHourlySnapshot(
      hoursSinceEpoch
    );
    usageMetricsHourlySnapshot.protocol = protocol.id;
    usageMetricsHourlySnapshot.hourlyActiveUsers = 0;
    usageMetricsHourlySnapshot.cumulativeUniqueUsers =
      protocol.cumulativeUniqueUsers;
    usageMetricsHourlySnapshot.hourlyTransactionCount = 0;
    usageMetricsHourlySnapshot.hourlyDepositCount = 0;
    usageMetricsHourlySnapshot.hourlyBorrowCount = 0;
    usageMetricsHourlySnapshot.hourlyWithdrawCount = 0;
    usageMetricsHourlySnapshot.hourlyRepayCount = 0;
    usageMetricsHourlySnapshot.hourlyLiquidateCount = 0;
  }

  const userAddress = event.transaction.from;
  let user = Account.load(userAddress.toHexString());
  if (!user) {
    user = new Account(userAddress.toHexString());
    user.save();
    usageMetricsHourlySnapshot.cumulativeUniqueUsers += 1;
  }
  let accountActive = ActiveAccount.load(
    "hourly" + "-" + userAddress.toHexString() + "-" + hoursSinceEpoch
  );
  if (!accountActive) {
    accountActive = new ActiveAccount(
      "hourly" + "-" + userAddress.toHexString() + "-" + hoursSinceEpoch
    );
    accountActive.save();
    usageMetricsHourlySnapshot.hourlyActiveUsers += 1;
  }
  usageMetricsHourlySnapshot.hourlyTransactionCount += 1;
  usageMetricsHourlySnapshot.blockNumber = event.block.number;
  usageMetricsHourlySnapshot.timestamp = event.block.timestamp;
  usageMetricsHourlySnapshot.save();
  return usageMetricsHourlySnapshot as UsageMetricsHourlySnapshot;
}

export function updateMetricsDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Create (or load) the days UsageMetricsDailySnapshot
  const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);

  let usageMetricsDailySnapshot = UsageMetricsDailySnapshot.load(
    daysSinceEpoch
  );
  if (!usageMetricsDailySnapshot) {
    usageMetricsDailySnapshot = new UsageMetricsDailySnapshot(daysSinceEpoch);
    usageMetricsDailySnapshot.protocol = protocol.id;
    usageMetricsDailySnapshot.dailyActiveUsers = 0;
    usageMetricsDailySnapshot.cumulativeUniqueUsers =
      protocol.cumulativeUniqueUsers;
    usageMetricsDailySnapshot.dailyTransactionCount = 0;
    usageMetricsDailySnapshot.dailyDepositCount = 0;
    usageMetricsDailySnapshot.dailyBorrowCount = 0;
    usageMetricsDailySnapshot.dailyWithdrawCount = 0;
    usageMetricsDailySnapshot.dailyLiquidateCount = 0;
  }

  const userAddress = event.transaction.from;
  let user = Account.load(userAddress.toHexString());
  if (!user) {
    user = new Account(userAddress.toHexString());
    user.save();
    usageMetricsDailySnapshot.cumulativeUniqueUsers += 1;
    protocol.cumulativeUniqueUsers += 1;
  }
  let accountActive = ActiveAccount.load(
    "daily" + "-" + userAddress.toHexString() + "-" + daysSinceEpoch
  );
  if (!accountActive) {
    accountActive = new ActiveAccount(
      "daily" + "-" + userAddress.toHexString() + "-" + daysSinceEpoch
    );
    accountActive.save();
    usageMetricsDailySnapshot.dailyActiveUsers += 1;
  }
  protocol.save();
  usageMetricsDailySnapshot.dailyTransactionCount += 1;
  usageMetricsDailySnapshot.blockNumber = event.block.number;
  usageMetricsDailySnapshot.timestamp = event.block.timestamp;
  usageMetricsDailySnapshot.save();
  return usageMetricsDailySnapshot as UsageMetricsDailySnapshot;
}

export function updateFinancialsDailySnapshot(
  event: ethereum.Event
): FinancialsDailySnapshot {
  // Create (or load) the days FinancialsDailySnapshot
  const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
  const previousDaysSinceEpoch = getPreviousDaysSinceEpoch(
    event.block.timestamp.toI32()
  );
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);

  let financialsDailySnapshot = FinancialsDailySnapshot.load(daysSinceEpoch);
  if (!financialsDailySnapshot) {
    financialsDailySnapshot = new FinancialsDailySnapshot(daysSinceEpoch);
    financialsDailySnapshot.protocol = protocol.id;
    financialsDailySnapshot.dailyBorrowUSD = BIGDECIMAL_ZERO;
    financialsDailySnapshot.dailyDepositUSD = BIGDECIMAL_ZERO;
    financialsDailySnapshot.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    financialsDailySnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialsDailySnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialsDailySnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialsDailySnapshot.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    financialsDailySnapshot.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    financialsDailySnapshot.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    financialsDailySnapshot.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    financialsDailySnapshot.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    financialsDailySnapshot.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialsDailySnapshot.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialsDailySnapshot.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    // Add current days to previous days for cumulative and total data
    let previousFinancialsDailySnapshot = FinancialsDailySnapshot.load(
      previousDaysSinceEpoch
    );

    if (previousFinancialsDailySnapshot) {
      financialsDailySnapshot.totalBorrowBalanceUSD = financialsDailySnapshot.totalBorrowBalanceUSD.plus(
        previousFinancialsDailySnapshot.totalBorrowBalanceUSD
      );
      financialsDailySnapshot.totalDepositBalanceUSD = financialsDailySnapshot.totalDepositBalanceUSD.plus(
        previousFinancialsDailySnapshot.totalDepositBalanceUSD
      );
      financialsDailySnapshot.cumulativeBorrowUSD = financialsDailySnapshot.cumulativeBorrowUSD.plus(
        previousFinancialsDailySnapshot.cumulativeBorrowUSD
      );
      financialsDailySnapshot.cumulativeDepositUSD = financialsDailySnapshot.cumulativeDepositUSD.plus(
        previousFinancialsDailySnapshot.cumulativeDepositUSD
      );
      financialsDailySnapshot.cumulativeLiquidateUSD = financialsDailySnapshot.cumulativeLiquidateUSD.plus(
        previousFinancialsDailySnapshot.cumulativeLiquidateUSD
      );
      financialsDailySnapshot.cumulativeProtocolSideRevenueUSD = financialsDailySnapshot.cumulativeProtocolSideRevenueUSD.plus(
        previousFinancialsDailySnapshot.cumulativeProtocolSideRevenueUSD
      );
      financialsDailySnapshot.cumulativeSupplySideRevenueUSD = financialsDailySnapshot.cumulativeSupplySideRevenueUSD.plus(
        previousFinancialsDailySnapshot.cumulativeSupplySideRevenueUSD
      );
      financialsDailySnapshot.cumulativeTotalRevenueUSD = financialsDailySnapshot.cumulativeTotalRevenueUSD.plus(
        previousFinancialsDailySnapshot.cumulativeTotalRevenueUSD
      );
    }
  }
  log.info(
    "Created (or updated) FinancialsDailySnapshot with ID={}, tx hash={}",
    [financialsDailySnapshot.id, event.transaction.hash.toHexString()]
  );
  financialsDailySnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsDailySnapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;

  financialsDailySnapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;

  financialsDailySnapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;

  financialsDailySnapshot.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.save();
  return financialsDailySnapshot as FinancialsDailySnapshot;
}

// PRICE ORACLE FUNCTIONS
// ----------------------

export function getPriceOracle(): AaveOracle {
  // priceOracle is set the address of the price oracle contract of the address provider contract, pulled from context
  const protocolId = getProtocolIdFromCtx();
  const lendingProtocol = getOrCreateProtocol(protocolId);
  const priceOracle = addresses.PRICE_ORACLE_ADDRESS.toHexString();
  return AaveOracle.bind(Address.fromString(priceOracle));
}

export function getAssetPriceInUSDC(tokenAddress: Address): BigDecimal {
  const oracle = getPriceOracle();
  // The GEIST oracle returns prices in USD, however this only works for specific tokens
  // for other tokens, this must be converted.

  let assetPrice: BigDecimal = BIGDECIMAL_ZERO;
  let tryPriceUSDC = oracle.try_getAssetPrice(addresses.TOKEN_ADDRESS_USDC);
  let priceUSDC: BigDecimal = BIGDECIMAL_ZERO;

  if (!tryPriceUSDC.reverted) {
    priceUSDC = new BigDecimal(tryPriceUSDC.value);
  } else {
    log.error(
      "Unable to get price of USDC from oracle. Setting assetPrice={}",
      [assetPrice.toString()]
    );
    return assetPrice;
  }

  if (tokenAddress == addresses.TOKEN_ADDRESS_GEIST) {
    /* 
      For the GEIST token, the price is derived from the
      ratio of FTM-GEIST reserves on SpookySwap multiplied by
      the price of WFTM from the oracle
    */
    let geistFtmLP = SpookySwapGEISTFTM.bind(addresses.GEIST_FTM_LP_ADDRESS);

    let reserves = geistFtmLP.try_getReserves();

    if (reserves.reverted) {
      log.error("Unable to get reserves for GEIST-FTM, setting assetPrice={}", [
        assetPrice.toString(),
      ]);
      return assetPrice;
    }
    let reserveFTM = reserves.value.value0;
    let reserveGEIST = reserves.value.value1;

    let priceGEISTinFTM = reserveFTM.div(reserveGEIST);
    let priceFTMinUSD = oracle.getAssetPrice(addresses.TOKEN_ADDRESS_WFTM);
    assetPrice = bigIntToBigDecimal(priceGEISTinFTM.times(priceFTMinUSD), 18);

    // log.info(
    //     "SpookySwap LP: reserveFTM={}, reserveGEIST={}, priceGEISTinFTM={}, priceFTMinUSD={}, priceGEISTinUSD={}",
    //     [
    //         reserveFTM.toString(),
    //         reserveGEIST.toString(),
    //         priceGEISTinFTM.toString(),
    //         priceFTMinUSD.toString(),
    //         assetPrice.toString()
    //     ]
    // )
  } else {
    // For other tokens get price from oracle
    // Map prices of gTokens to non-gTokens to get price from oracle
    // TODO: Maybe a dict would be a cleaner mapping
    if (tokenAddress == addresses.TOKEN_ADDRESS_gWBTC) {
      tokenAddress = addresses.TOKEN_ADDRESS_BTC;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gfUSDT) {
      tokenAddress = addresses.TOKEN_ADDRESS_fUSDT;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gUSDC) {
      tokenAddress = addresses.TOKEN_ADDRESS_USDC;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gDAI) {
      tokenAddress = addresses.TOKEN_ADDRESS_DAI;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gMIM) {
      tokenAddress = addresses.TOKEN_ADDRESS_MIM;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gLINK) {
      tokenAddress = addresses.TOKEN_ADDRESS_LINK;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gCRV) {
      tokenAddress = addresses.TOKEN_ADDRESS_CRV;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gETH) {
      tokenAddress = addresses.TOKEN_ADDRESS_ETH;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gFTM) {
      tokenAddress = addresses.TOKEN_ADDRESS_WFTM;
    }

    const tryAssetPriceInUSD = oracle.try_getAssetPrice(tokenAddress);

    if (!tryAssetPriceInUSD.reverted) {
      assetPrice = new BigDecimal(tryAssetPriceInUSD.value);
    } else {
      log.error("Unable to get USD price for token address={}", [
        tokenAddress.toHexString(),
      ]);
    }
  }

  let assetPriceInUSDC = assetPrice.div(priceUSDC);
  log.info("Price for token address={} is {} USDC", [
    tokenAddress.toHexString(),
    assetPriceInUSDC.toString(),
  ]);
  return assetPriceInUSDC.truncate(3);
}

export function tokenAmountInUSD(
  priceInUSDC: BigDecimal,
  decimals: number,
  amount: BigInt,
  market: Market
): BigDecimal {
  // This function takes in a token and the amount of the token and converts the amount of that token into USD
  // Also sets the market input/output token prices to the updated amount
  const amountInDecimals = bigIntToBigDecimal(amount, <i32>decimals);
  const amountUSD = amountInDecimals.times(priceInUSDC);
  log.info(
    "For market ID={}, token amount={}, token price={}, token amount USD={}",
    [
      market.id,
      amount.toString(),
      priceInUSDC.toString(),
      amountUSD.toString(),
      market.inputToken.length.toString(),
    ]
  );
  return amountUSD.truncate(3);
}

export function getCurrentRewardEmissionsUSD(market: Market): BigDecimal[] {
  // Taking the reward emissions denominated in the reward token, convert it to the value in USD
  const rewardEmissionsUSD = market.rewardTokenEmissionsUSD;
  const rewardTokenAddr = Address.fromString(REWARD_TOKEN_ADDRESS);
  // The DEPOSIT reward token is used as the default. Both the deposit and borrow reward token decimals are the same
  const rewardToken = getOrCreateRewardToken(
    rewardTokenAddr,
    RewardTokenType.DEPOSIT
  );
  // In the reward emissions arrays index 0 is for the deposit reward, index 1 for the borrow reward
  const rewardPriceInUSDC = getAssetPriceInUSDC(rewardTokenAddr);
  rewardEmissionsUSD[0] = tokenAmountInUSD(
    rewardPriceInUSDC,
    getOrCreateToken(rewardTokenAddr).decimals,
    market.rewardTokenEmissionsAmount[0],
    market
  );
  rewardEmissionsUSD[1] = tokenAmountInUSD(
    rewardPriceInUSDC,
    getOrCreateToken(rewardTokenAddr).decimals,
    market.rewardTokenEmissionsAmount[1],
    market
  );
  return rewardEmissionsUSD;
}

// CONTEXT FUNCTIONS
// -----------------

export function getLendingPoolFromCtx(): string {
  // Get the lending pool/market address with context
  const context = dataSource.context();
  return context.getString("lendingPool");
}

export function getProtocolIdFromCtx(): string {
  // Get the protocol id with context
  const context = dataSource.context();
  return context.getString("protocolId");
}

// MATH FUNCTIONS
// --------------

export function calculateRevenues(
  market: Market,
  financial: FinancialsDailySnapshot,
  token: Token,
  event: ethereum.Event
): void {
  // Calculate and save the fees and revenue on both market and protocol level
  // Additionally calculate the total borrow amount on market and protocol
  // Pull S and V debt tokens to get the amount currently borrowed as stable debt or variable debt

  const dataProviderContract = AaveProtocolDataProvider.bind(
    addresses.AAVE_PROTOCOL_DATA_PROVIDER
  );

  let totalStableValueLocked = BIGINT_ZERO;
  let totalVariableValueLocked = BIGINT_ZERO;
  const reserve_data = dataProviderContract.try_getReserveData(
    Address.fromString(market.id)
  );
  if (!reserve_data.reverted) {
    totalStableValueLocked = reserve_data.value.value1;
    totalVariableValueLocked = reserve_data.value.value2;
  }

  // Subtract prior market total fees protocol.totalRevenueUSD
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);

  // Multiply total Variable value Locked in USD by market.variableBorrowRate
  const varAmountUSD = tokenAmountInUSD(
    market.inputTokenPriceUSD,
    token.decimals,
    totalVariableValueLocked,
    market
  );
  const variableBorrow = getOrCreateInterestRate(
    market.id,
    "BORROWER",
    "VARIABLE"
  );
  const varFees = varAmountUSD.times(variableBorrow.rate);

  // Multiply total Stable value Locked in USD by market.stableBorrowRate
  const staAmountUSD = tokenAmountInUSD(
    market.inputTokenPriceUSD,
    token.decimals,
    totalStableValueLocked,
    market
  );
  const stableBorrow = getOrCreateInterestRate(market.id, "BORROWER", "STABLE");
  const staFees = staAmountUSD.times(stableBorrow.rate);

  const marketRevenueUSD = staFees.plus(varFees).truncate(3);
  log.info("Subtract prior market fees ({} USD) from protocol fees ({} USD)", [
    marketRevenueUSD.toString(),
    protocol.cumulativeTotalRevenueUSD.toString(),
  ]);
  // Add these values together, save to market and add protocol total
  const marketProtocolSideRevenueUSD = marketRevenueUSD
    .times(market.exchangeRate)
    .truncate(3);
  const marketSupplySideRevenueUSD = marketRevenueUSD
    .times(BIGDECIMAL_ONE.minus(market.exchangeRate))
    .truncate(3);

  protocol.cumulativeTotalRevenueUSD = marketRevenueUSD;
  protocol.cumulativeProtocolSideRevenueUSD = marketProtocolSideRevenueUSD;
  protocol.cumulativeSupplySideRevenueUSD = marketSupplySideRevenueUSD;

  financial.cumulativeProtocolSideRevenueUSD = marketProtocolSideRevenueUSD;
  financial.cumulativeSupplySideRevenueUSD = marketSupplySideRevenueUSD;
  financial.cumulativeTotalRevenueUSD = marketRevenueUSD;

  // For daily metrics subtract fees from previous days
  const previousDaysSinceEpoch = getPreviousDaysSinceEpoch(
    event.block.timestamp.toI32()
  );
  let previousFinancialsDailySnapshot = FinancialsDailySnapshot.load(
    previousDaysSinceEpoch
  );
  if (previousFinancialsDailySnapshot) {
    financial.dailyProtocolSideRevenueUSD = marketProtocolSideRevenueUSD.minus(
      previousFinancialsDailySnapshot.cumulativeProtocolSideRevenueUSD
    );
    financial.dailySupplySideRevenueUSD = marketSupplySideRevenueUSD.minus(
      previousFinancialsDailySnapshot.cumulativeSupplySideRevenueUSD
    );
    financial.dailyTotalRevenueUSD = marketRevenueUSD.minus(
      previousFinancialsDailySnapshot.cumulativeTotalRevenueUSD
    );
  }

  financial.save();
  market.save();
  protocol.save();
}

export function updateTVL(
  tx: string,
  token: Token,
  market: Market,
  protocol: LendingProtocol,
  amountInTokens: BigInt,
  amountUSD: BigDecimal,
  toSubtract: bool
): void {
  // Update the total value locked in a market and the protocol overall after transactions
  let newMarketTVL = market.inputTokenBalance;
  if (toSubtract) {
    newMarketTVL = newMarketTVL.minus(amountInTokens);
  } else {
    newMarketTVL = newMarketTVL.plus(amountInTokens);
  }
  // Subtract the PREVIOUSLY ADDED totalValueLockedUSD of the market from the protocol TVL
  // Subtracting the most recently added TVL of the market ensures that the correct
  // proportion of this market is deducted before adding the new market TVL to the protocol
  // Otherwise, the difference in asset USD/ETH price since saving would deduct the
  // incorrect proportion from the protocol TVL

  if (
    protocol.totalValueLockedUSD
      .minus(market.totalValueLockedUSD)
      .lt(BIGDECIMAL_ZERO)
  ) {
    log.info("TVL updated to {} USD, before={} USD, tx={}", [
      protocol.totalValueLockedUSD.minus(market.totalValueLockedUSD).toString(),
      protocol.totalValueLockedUSD.toString(),
      tx,
    ]);
  }
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
    market.totalValueLockedUSD
  );
  market.totalValueLockedUSD = tokenAmountInUSD(
    market.inputTokenPriceUSD,
    token.decimals,
    newMarketTVL,
    market
  );
  market.cumulativeDepositUSD = market.totalValueLockedUSD;
  market.save();
  if (
    protocol.totalValueLockedUSD.gt(BIGDECIMAL_ZERO) &&
    protocol.totalValueLockedUSD
      .plus(market.totalValueLockedUSD)
      .lt(BIGDECIMAL_ZERO)
  ) {
    log.warning("TVL going negative with tx={}", [tx]);
  }
  if (
    protocol.totalValueLockedUSD.lt(BIGDECIMAL_ZERO) &&
    protocol.totalValueLockedUSD
      .plus(market.totalValueLockedUSD)
      .gt(BIGDECIMAL_ZERO)
  ) {
    log.warning("TVL going from negative to positive  with tx={}", [tx]);
  }
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(
    market.totalValueLockedUSD
  );
  protocol.cumulativeDepositUSD = protocol.totalValueLockedUSD;
  protocol.save();
}
