import { Address, BigDecimal, BigInt, dataSource, ethereum, log } from "@graphprotocol/graph-ts";

import {
  Token,
  Market,
  RewardToken,
  MarketDailySnapshot,
  LendingProtocol,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  Account,
  DailyActiveAccount,
} from "../../generated/schema";

import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_TWO,
  BIGINT_ZERO,
  ZERO_ADDRESS,
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
  PRICE_ORACLE_ADDRESS,
  INCENTIVE_CONTROLLER_ADDRESS,
  USDC_TOKEN_ADDRESS,
} from "../common/constants";

import { AaveIncentivesController as IncentivesControllerContract } from "../../generated/templates/LendingPoolAddressesProvider/AaveIncentivesController";

import { StableDebtToken as SToken } from "../../generated/templates/LendingPool/StableDebtToken";

import { VariableDebtToken as VToken } from "../../generated/templates/LendingPool/VariableDebtToken";

import { IPriceOracleGetter } from "../../generated/templates/LendingPool/IPriceOracleGetter";

import { getOrCreateToken } from "../common/getters";

import { AToken } from "../../generated/templates/AToken/AToken";

import { LendingPool } from "../../generated/templates/LendingPool/LendingPool";

import { bigIntToBigDecimal, rayToWad } from "../common/utils/numbers";

import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "../common/tokens";

import { emissionsPerDay } from "../common/rewards";

import { getDaysSinceEpoch } from "../common/utils/datetime";

export function initMarket(blockNumber: BigInt, timestamp: BigInt, id: string): Market {
  // This function either loads or creates the Market entity from a reserve
  log.info("MARKET LOAD: " + id, []);
  const token = getOrCreateToken(Address.fromString(id)) as Token;
  let market = Market.load(id);
  if (market === null) {
    // Get the lending pool to get the reserve data for this Market entity
    const lendingPool = getLendingPoolFromCtx();
    const lendingPoolContract = LendingPool.bind(Address.fromString(lendingPool));
    // The input token, which would be the token instantiated from the id/address input
    const inputTokens = [token.id];
    // Populate fields with data that has been passed to the function
    // Other data fields are initialized as 0/[]/false
    const inputTokenBalances = [BIGINT_ZERO];
    const protocolId = getProtocolIdFromCtx();
    const protocol = getOrCreateProtocol(protocolId);
    // Initialize market fields as zero
    market = new Market(id);
    market.name = token.name;
    market.protocol = protocol.name;
    market.stableBorrowRate = BIGDECIMAL_ZERO;
    market.variableBorrowRate = BIGDECIMAL_ZERO;
    market.totalStableValueLocked = BIGINT_ZERO;
    market.totalVariableValueLocked = BIGINT_ZERO;
    market.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    market.reserveFactor = BIGINT_ZERO;
    market.outputToken = ZERO_ADDRESS;
    market.inputTokens = inputTokens;
    market.inputTokenBalances = inputTokenBalances;
    market.sToken = ZERO_ADDRESS;
    market.vToken = ZERO_ADDRESS;
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
    market.depositRate = BIGDECIMAL_ZERO;
    market.totalRevenueUSD = BIGDECIMAL_ZERO;
    market.totalVolumeUSD = BIGDECIMAL_ZERO;
    market.outputTokenSupply = BIGINT_ZERO;
    const tryReserve = lendingPoolContract.try_getReserveData(Address.fromString(id));
    if (!tryReserve.reverted) {
      // If a valid reserve is returned, add fields from the reserve to the market entity
      // Rates are saved as a decimal (ie the borrow rate of 5% is saved as 0.05)
      market.stableBorrowRate = bigIntToBigDecimal(rayToWad(tryReserve.value.currentStableBorrowRate));
      market.variableBorrowRate = bigIntToBigDecimal(rayToWad(tryReserve.value.currentVariableBorrowRate));
    } else {
      log.error("FAILED TO GET RESERVE", []);
    }
  }
  // No need to execute the below code until block 12317479 when incentive controller was deployed and started calculating rewards
  if (blockNumber.gt(BigInt.fromString("12317479"))) {
    let rewardTokens = market.rewardTokens;
    if (rewardTokens === null) rewardTokens = [];
    if (rewardTokens.length === 0) {
      // If the reward tokens have not been initialized on the market, attempt to pull them from the incentive controller
      const rewardTokenFromIncController = Address.fromString(REWARD_TOKEN_ADDRESS);
      const depositRewardToken = loadRewardToken(rewardTokenFromIncController, RewardTokenType.DEPOSIT);
      const borrowRewardToken = loadRewardToken(rewardTokenFromIncController, RewardTokenType.BORROW);
      market.rewardTokens = [depositRewardToken.id, borrowRewardToken.id];
      market.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
      market.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    }
    // Get reward emissions
    market.rewardTokenEmissionsAmount = getCurrentRewardEmissions(market);
    market.rewardTokenEmissionsUSD = getCurrentRewardEmissionsUSD(market);
  }
  const currentPriceUSD = getAssetPriceInUSDC(Address.fromString(market.id));
  market.outputTokenPriceUSD = currentPriceUSD;
  market.inputTokenPricesUSD = [currentPriceUSD];
  market.save();
  return market as Market;
}

export function getCurrentRewardEmissions(market: Market): BigInt[] {
  let depositRewardEmissions = market.rewardTokenEmissionsAmount[0];
  let borrowRewardEmissions = market.rewardTokenEmissionsAmount[1];
  // Attempt to get the incentives controller contract
  const incentivesController = initIncentivesController(market);
  // From the incentives controller contract, get pull the 'assets' values from the market aToken, sToken, and vToken
  const incentivesControllerContract = IncentivesControllerContract.bind(incentivesController);
  if (!incentivesControllerContract.try_assets(Address.fromString(market.outputToken)).reverted) {
    log.info(
      "REWARD EMISSIONS " +
        market.outputToken +
        " " +
        incentivesControllerContract.assets(Address.fromString(market.outputToken)).value0.toString(),
      [],
    );
    const assetDataSupply = incentivesControllerContract.try_assets(Address.fromString(market.outputToken)).value
      .value0;
    const assetDataBorrowStable = incentivesControllerContract.try_assets(Address.fromString(market.sToken)).value
      .value0;
    const assetDataBorrowVariable = incentivesControllerContract.try_assets(Address.fromString(market.vToken)).value
      .value0;
    // Get the emissions per day for the aToken rewards for deposits
    if (!assetDataSupply.equals(BIGINT_ZERO)) {
      depositRewardEmissions = emissionsPerDay(assetDataSupply);
    } else {
      depositRewardEmissions = BIGINT_ZERO;
    }
    // Get the emissions per second for both the sToken and vToken rewards, average them and get the daily emissions for borrows
    const borrowRewardsAvgRate = assetDataBorrowStable.plus(assetDataBorrowVariable).div(BIGINT_TWO);
    log.info(
      "BORROW AVG RATE: " +
        assetDataBorrowStable.toString() +
        " + " +
        assetDataBorrowVariable.toString() +
        " = " +
        assetDataBorrowStable.plus(assetDataBorrowVariable).toString() +
        " /2 = " +
        borrowRewardsAvgRate.toString(),
      [],
    );
    if (!borrowRewardsAvgRate.equals(BIGINT_ZERO)) {
      borrowRewardEmissions = emissionsPerDay(borrowRewardsAvgRate);
    } else {
      borrowRewardEmissions = BIGINT_ZERO;
    }
  } else {
    log.info("COULD NOT GET REWARD EMISSIONS FROM INC CONT ON MARKET: " + market.id, []);
    // The array returned with current emissions
  }
  return [depositRewardEmissions, borrowRewardEmissions];
}

export function updateOutputTokenSupply(event: ethereum.Event): void {
  const outputTokenAddr = event.address;
  const aTokenInstance = AToken.bind(outputTokenAddr);
  const tryTokenSupply = aTokenInstance.try_totalSupply();
  if (!tryTokenSupply.reverted) {
    const aToken = getOrCreateToken(outputTokenAddr);
    log.info(
      "OUTPUT TOKEN SUPPLY FETCHED " + outputTokenAddr.toHexString() + " " + tryTokenSupply.value.toString(),
      [],
    );
    let marketId = "";
    if (aToken.underlyingAsset !== "") {
      marketId = aToken.underlyingAsset;
    } else {
      marketId = aTokenInstance.UNDERLYING_ASSET_ADDRESS().toHexString();
    }
    const market = Market.load(marketId);
    if (!market) {
      return;
    }
    market.outputTokenSupply = tryTokenSupply.value;
    market.save();

    // This funcion only gets called from mint/burn events which only happen following deposits and withdraws which update the market snapshot
    // Calling the getMarketDailySnapshot function seems to cause some sort of overflow error, so only the outputTokenSupply field needs to be set
    const snapId = getMarketDailyId(event, market);
    const snap = MarketDailySnapshot.load(snapId);
    if (!snap) {
      return;
    }
    snap.outputTokenSupply = market.outputTokenSupply;
    snap.save();
  } else {
    log.info("OUTPUT TOKEN SUPPLY CALL REVERTED FOR TOKEN " + outputTokenAddr.toHexString(), []);
  }
}

export function loadRewardToken(assetAddr: Address, type: string): RewardToken {
  let asset = RewardToken.load(type + "-" + assetAddr.toHex());
  if (asset === null) {
    asset = new RewardToken(type + "-" + assetAddr.toHex());
    asset.symbol = fetchTokenSymbol(assetAddr);
    asset.name = fetchTokenName(assetAddr);
    asset.decimals = fetchTokenDecimals(assetAddr);
    asset.type = type;
    asset.save();
  }
  getOrCreateToken(assetAddr);
  log.info("EXITING REWARD TOKEN LOAD " + asset.decimals.toString() + " " + asset.name + " " + asset.id, []);
  return asset as RewardToken;
}

export function getOrCreateProtocol(protocolId: string): LendingProtocol {
  // Load or create the Lending Protocol entity implementation
  let lendingProtocol = LendingProtocol.load(protocolId);
  log.info("PROTOCOL ID: " + protocolId, []);
  if (!lendingProtocol) {
    lendingProtocol = new LendingProtocol(protocolId);
    lendingProtocol.totalUniqueUsers = 0;
    lendingProtocol.network = SchemaNetwork.ETHEREUM;
    lendingProtocol.type = ProtocolType.LENDING;
    lendingProtocol.subgraphVersion = SUBGRAPH_VERSION;
    lendingProtocol.schemaVersion = SCHEMA_VERSION;
    lendingProtocol.name = PROTOCOL_NAME;
    lendingProtocol.slug = PROTOCOL_SLUG;
    lendingProtocol.totalRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    lendingProtocol.totalDepositUSD = BIGDECIMAL_ZERO;
    lendingProtocol.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.protocolPriceOracle = PRICE_ORACLE_ADDRESS;
    lendingProtocol.lendingType = LENDING_TYPE;
    lendingProtocol.riskType = RISK_TYPE;
    lendingProtocol.save();
  }
  return lendingProtocol as LendingProtocol;
}

export function initIncentivesController(market: Market): Address {
  // This function attempts to pull the incentives controller from the aToken/output token
  log.info("INIT INCENTIVE CONT FROM MARKET: " + market.id + " aToken: " + market.outputToken, []);
  const aToken = AToken.bind(Address.fromString(market.outputToken));
  if (!aToken.try_getIncentivesController().reverted) {
    const incContAddr = aToken.try_getIncentivesController().value;
    log.info("INCENTIVE CONTROLLER SUCCESS " + incContAddr.toHexString(), []);
    return incContAddr;
  } else {
    log.info("FAILED TO GET INCENTIVE CONTROLLER " + aToken._address.toHexString() + " " + market.id, []);
    return Address.fromString(INCENTIVE_CONTROLLER_ADDRESS);
  }
}

// SNAPSHOT FUNCTIONS

export function getMarketDailyId(event: ethereum.Event, market: Market): string {
  const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
  const id = market.id.concat("-").concat(daysSinceEpoch);
  return id;
}

// For the lack of closure support, the recommendation is to loop into a global variable
let rewardEmissionsAmounts: BigInt[] = [];
let rewardEmissionsAmountsUSD: BigDecimal[] = [];
export function getMarketDailySnapshot(event: ethereum.Event, market: Market): MarketDailySnapshot {
  // Create a snapshot of market data throughout the day. One snapshot per market per day.
  // Attempt to load Snapshot entity implementation based on days since epoch in id.
  // Snapshot is created at the start of a new day and updated after transactions change certain market data.
  const snapId = getMarketDailyId(event, market);
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);
  let marketSnapshot = MarketDailySnapshot.load(snapId);
  if (marketSnapshot === null) {
    // Data needed upon Snapshot initialization
    marketSnapshot = new MarketDailySnapshot(snapId);
    marketSnapshot.market = market.id;
    marketSnapshot.protocol = protocol.id;
    let rewardTokenList: string[] = [];
    if (market.rewardTokens) {
      rewardTokenList = market.rewardTokens as string[];
      rewardEmissionsAmounts = [];
      rewardEmissionsAmountsUSD = [];
      rewardTokenList.forEach(() => {
        // For each reward token, create a zero value to initialize the amount of reward emissions for that day
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
  // Data potentially updated whether the snapshot instance is new or loaded
  // The following fields are pulled from the current Market Entity Implementation's data.
  // As this function is called AFTER a transaction is completed, each snapshot's data will vary from the previous snapshot

  const token = getOrCreateToken(Address.fromString(market.id));
  // The inputTokenBalances[0] is used as the total value locked denominated in tokens. The first index in the input token array will always be the reserve token
  marketSnapshot.totalValueLockedUSD = amountInUSD(
    market.inputTokenPricesUSD[0],
    token.decimals,
    market.inputTokenBalances[0],
    market,
  );
  marketSnapshot.totalVolumeUSD = market.totalVolumeUSD;
  marketSnapshot.inputTokenBalances = market.inputTokenBalances;
  marketSnapshot.inputTokenPricesUSD = market.inputTokenPricesUSD;
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketSnapshot.totalBorrowUSD = market.totalBorrowUSD;
  marketSnapshot.totalDepositUSD = market.totalDepositUSD;
  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;
  marketSnapshot.depositRate = market.depositRate;
  marketSnapshot.stableBorrowRate = market.stableBorrowRate;
  marketSnapshot.variableBorrowRate = market.variableBorrowRate;
  marketSnapshot.save();
  log.info("Save market snap ", []);
  return marketSnapshot as MarketDailySnapshot;
}

export function updateMetricsDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Load or create the current date's UsageMetricsDailySnapshot implementation
  const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);
  let metricsDailySnapshot = UsageMetricsDailySnapshot.load(daysSinceEpoch);
  if (!metricsDailySnapshot) {
    metricsDailySnapshot = new UsageMetricsDailySnapshot(daysSinceEpoch);
    metricsDailySnapshot.protocol = protocol.id;
    // Initialize zero values
    // Active users are unique users active on the day
    metricsDailySnapshot.activeUsers = 0;
    // Total unique users is the total unique users who have ever used the protocol, on the snapshot this grabs the number on a particular day
    metricsDailySnapshot.totalUniqueUsers = protocol.totalUniqueUsers;
    metricsDailySnapshot.dailyTransactionCount = 0;
  }

  const userAddr = event.transaction.from;
  let user = Account.load(userAddr.toHexString());
  if (!user) {
    user = new Account(userAddr.toHexString());
    user.save();
    metricsDailySnapshot.totalUniqueUsers += 1;
    protocol.totalUniqueUsers += 1;
  }
  let accountActive = DailyActiveAccount.load(daysSinceEpoch + "-" + userAddr.toHexString());
  if (!accountActive) {
    accountActive = new DailyActiveAccount(daysSinceEpoch + "-" + userAddr.toHexString());
    accountActive.save();
    metricsDailySnapshot.activeUsers += 1;
  }
  protocol.save();
  metricsDailySnapshot.dailyTransactionCount += 1;
  metricsDailySnapshot.blockNumber = event.block.number;
  metricsDailySnapshot.timestamp = event.block.timestamp;
  metricsDailySnapshot.save();
  return metricsDailySnapshot as UsageMetricsDailySnapshot;
}

export function updateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
  // Load or create the current date's FinancialsDailySnapshot implementation
  const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);
  let financialsDailySnapshot = FinancialsDailySnapshot.load(daysSinceEpoch);
  if (!financialsDailySnapshot) {
    financialsDailySnapshot = new FinancialsDailySnapshot(daysSinceEpoch);
    financialsDailySnapshot.protocol = protocol.id;
    financialsDailySnapshot.totalVolumeUSD = BIGDECIMAL_ZERO;
  }
  log.info(
    "FINANCIAL SNAPSHOT " + financialsDailySnapshot.id + " TRANSACTION " + event.transaction.hash.toHexString(),
    [],
  );
  financialsDailySnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsDailySnapshot.totalDepositUSD = protocol.totalDepositUSD;
  financialsDailySnapshot.protocolSideRevenueUSD = protocol.protocolSideRevenueUSD;
  financialsDailySnapshot.supplySideRevenueUSD = protocol.supplySideRevenueUSD;
  financialsDailySnapshot.totalRevenueUSD = protocol.totalRevenueUSD;
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.save();
  return financialsDailySnapshot as FinancialsDailySnapshot;
}

// PRICE/ORACLE FUNCTIONS

export function getPriceOracle(): IPriceOracleGetter {
  // priceOracle is set the address of the price oracle contract of the address provider contract, pulled from context
  const protocolId = getProtocolIdFromCtx();
  const lendingProtocol = getOrCreateProtocol(protocolId);
  const priceOracle = lendingProtocol.protocolPriceOracle;
  return IPriceOracleGetter.bind(Address.fromString(priceOracle));
}

export function getAssetPriceInUSDC(tokenAddress: Address): BigDecimal {
  log.info("getAssetPriceInUSDC " + tokenAddress.toHexString(), []);
  const oracle = getPriceOracle();
  // The Aave protocol oracle contracts only contain a method for getting an asset price in ETH, so USDC price must be fetched to convert asset price from Eth to USDC
  // Get the asset price in Wei and convert it to Eth
  let assetPriceInUSDC: BigDecimal = BIGDECIMAL_ZERO;
  const tryAssetPriceInEth = oracle.try_getAssetPrice(tokenAddress);
  // Fetch USDC price in Wei and convert it to Eth
  const tryPriceUSDCInEth = oracle.try_getAssetPrice(Address.fromString(USDC_TOKEN_ADDRESS));
  if (!tryAssetPriceInEth.reverted && !tryPriceUSDCInEth.reverted) {
    const assetPriceInEth = tryAssetPriceInEth.value;
    const priceUSDCInEth = tryPriceUSDCInEth.value;
    assetPriceInUSDC = new BigDecimal(assetPriceInEth).div(new BigDecimal(priceUSDCInEth));
  } else {
    log.info("REVERTED GETTING USDC PRICE: ASSET? " + tokenAddress.toHexString(), []);
  }
  // Asset price in Eth/USDC priced in Eth = Asset price in in USDC
  // return price per asset in USDC
  return assetPriceInUSDC.truncate(3);
}

export function amountInUSD(priceInUSDC: BigDecimal, decimals: number, amount: BigInt, market: Market): BigDecimal {
  // This function takes in a token and the amount of the token and converts the amount of that token into USD
  // Also sets the market input/output token prices to the updated amount
  const amountInDecimals = bigIntToBigDecimal(amount, <i32>decimals);
  const amountUSD = amountInDecimals.times(priceInUSDC);
  log.info(
    market.id +
      " TOKEN AMOUNT " +
      amount.toString() +
      " TIMES PRICE IN USD " +
      priceInUSDC.toString() +
      " === " +
      amountUSD.toString() +
      " " +
      market.inputTokens.length.toString(),
    [],
  );
  return amountUSD.truncate(3);
}

export function getCurrentRewardEmissionsUSD(market: Market): BigDecimal[] {
  // Taking the reward emissions denominated in the reward token, convert it to the value in USD
  const rewardEmissionsUSD = market.rewardTokenEmissionsUSD;
  const rewardTokenAddr = Address.fromString(REWARD_TOKEN_ADDRESS);
  // The DEPOSIT reward token is used as the default. Both the deposit and borrow reward token decimals are the same
  const rewardToken = loadRewardToken(rewardTokenAddr, RewardTokenType.DEPOSIT);
  // In the reward emissions arrays index 0 is for the deposit reward, index 1 for the borrow reward
  const rewardPriceInUSDC = getAssetPriceInUSDC(rewardTokenAddr);
  rewardEmissionsUSD[0] = amountInUSD(
    rewardPriceInUSDC,
    rewardToken.decimals,
    market.rewardTokenEmissionsAmount[0],
    market,
  );
  rewardEmissionsUSD[1] = amountInUSD(
    rewardPriceInUSDC,
    rewardToken.decimals,
    market.rewardTokenEmissionsAmount[1],
    market,
  );
  return rewardEmissionsUSD;
}

// CONTEXT FUNCTIONS

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

export function calculateRevenues(market: Market, token: Token): void {
  // Calculate and save the fees and revenue on both market and protocol level
  // Additionally calculate the total borrow amount on market and protocol
  // Pull S and V debt tokens to get the amount currently borrowed as stable debt or variable debt
  const STokenContract = SToken.bind(Address.fromString(market.sToken));
  const VTokenContract = VToken.bind(Address.fromString(market.vToken));
  const stableTokenSupply = STokenContract.try_totalSupply();
  const variableTokenSupply = VTokenContract.try_totalSupply();

  if (!variableTokenSupply.reverted && !stableTokenSupply.reverted) {
    log.info(
      "IN REPAY FOR MARKET " +
        market.id +
        " STABLE OR VARIABLE TOKEN SUPPLIES " +
        stableTokenSupply.value.toString() +
        " " +
        market.totalStableValueLocked.toString() +
        " " +
        variableTokenSupply.value.toString() +
        " " +
        market.totalVariableValueLocked.toString(),
      [],
    );
    market.totalVariableValueLocked = variableTokenSupply.value;
    market.totalStableValueLocked = stableTokenSupply.value;
  } else {
    log.info(
      "IN REPAY FOR MARKET " +
        market.id +
        " COULD NOT GET STABLE OR VARIABLE TOKEN SUPPLIES " +
        stableTokenSupply.reverted.toString() +
        " " +
        variableTokenSupply.reverted.toString(),
      [],
    );
  }
  // Subtract prior market total fees protocol.totalRevenueUSD
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);
  log.info(
    "SUBTRACTING MARKET FROM PROTOCOL TOTAL FEES " +
      protocol.totalRevenueUSD.toString() +
      " - " +
      market.totalRevenueUSD.toString(),
    [],
  );

  // Get the protocol revenues/fees subtracting the market values before calculation
  const protoMinusMarketProtoRevenue = protocol.protocolSideRevenueUSD.minus(market.protocolSideRevenueUSD);
  const protoMinusMarketSupplyRevenue = protocol.supplySideRevenueUSD.minus(market.supplySideRevenueUSD);
  const protoMinusMarketFees = protocol.totalRevenueUSD.minus(market.totalRevenueUSD);
  // Multiply total Variable value Locked in USD by market.variableBorrowRate
  const varAmountUSD = amountInUSD(
    market.inputTokenPricesUSD[0],
    token.decimals,
    market.totalVariableValueLocked,
    market,
  );
  const varFees = varAmountUSD.times(market.variableBorrowRate);
  // Multiply total Stable value Locked in USD by market.variableStableRate
  const staAmountUSD = amountInUSD(
    market.inputTokenPricesUSD[0],
    token.decimals,
    market.totalStableValueLocked,
    market,
  );
  const staFees = staAmountUSD.times(market.stableBorrowRate);

  // Add these values together, save to market and add protocol total
  market.totalRevenueUSD = staFees.plus(varFees).truncate(3);
  protocol.totalRevenueUSD = protoMinusMarketFees.plus(market.totalRevenueUSD);
  market.protocolSideRevenueUSD = market.totalRevenueUSD.times(bigIntToBigDecimal(market.reserveFactor, 4)).truncate(3);
  protocol.protocolSideRevenueUSD = protoMinusMarketProtoRevenue.plus(market.protocolSideRevenueUSD);
  market.supplySideRevenueUSD = market.totalRevenueUSD
    .times(BIGDECIMAL_ONE.minus(bigIntToBigDecimal(market.reserveFactor, 4)))
    .truncate(3);
  protocol.supplySideRevenueUSD = protoMinusMarketSupplyRevenue.plus(market.supplySideRevenueUSD);

  // CALCULATE totalBorrowUSD FIELDS ON MARKET AND PROTOCOL ENTITIES
  // The sum in USD of s and v tokens on market is totalBorrowUSD
  // Subtract the previously saved amount of the market TotalBorrowUSD value from the protocol totalBorrowUSD
  // This gets the amount in USD out in borrows on the protocol not including this market
  const tempProtocolBorrowTotal = protocol.totalBorrowUSD.minus(market.totalBorrowUSD);
  // Sum the amount in USD of the stable borrows and variable borrows currently in use
  market.totalBorrowUSD = staAmountUSD.plus(varAmountUSD);
  // Add this markets new amount out in borrows to the protocol value
  protocol.totalBorrowUSD = tempProtocolBorrowTotal.plus(market.totalBorrowUSD);

  market.save();
  protocol.save();
}

export function updateTVL(
  tx: string,
  token: Token,
  market: Market,
  protocol: LendingProtocol,
  amountInTokens: BigInt,
  toSubtract: bool,
): void {
  // Update the total value locked in a market and the protocol overall after transactions
  let newMarketTVL = market.inputTokenBalances[0];
  if (toSubtract) {
    newMarketTVL = newMarketTVL.minus(amountInTokens);
  } else {
    newMarketTVL = newMarketTVL.plus(amountInTokens);
  }
  // Subtract the PREVIOUSLY ADDED totalValueLockedUSD of the market from the protocol TVL
  // Subtracting the most recently added TVL of the market ensures that the correct
  // proportion of this market is deducted before adding the new market TVL to the protocol
  // Otherwise, the difference in asset USD/ETH price  since saving would deduct the incorrect proportion from the protocol TVL

  if (protocol.totalValueLockedUSD.minus(market.totalValueLockedUSD).lt(BIGDECIMAL_ZERO)) {
    log.warning(
      "WARNING: TVL TO BE SET TO " +
        protocol.totalValueLockedUSD.minus(market.totalValueLockedUSD).toString() +
        " BEFORE " +
        protocol.totalValueLockedUSD.toString() +
        " TRANSACTION " +
        tx,
      [],
    );
  }
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(market.totalValueLockedUSD);
  market.totalValueLockedUSD = amountInUSD(market.inputTokenPricesUSD[0], token.decimals, newMarketTVL, market);
  market.totalDepositUSD = market.totalValueLockedUSD;
  market.save();
  if (
    protocol.totalValueLockedUSD.gt(BIGDECIMAL_ZERO) &&
    protocol.totalValueLockedUSD.plus(market.totalValueLockedUSD).lt(BIGDECIMAL_ZERO)
  ) {
    log.warning(
      "TVL ABOUT TO ENTER NEGATIVES - TRANSACTION: " +
        tx +
        " CHECK FOR FLASHLOAN OR OTHER EVENT FOR TEMPORARY DISRUPTION.",
      [],
    );
  }
  if (
    protocol.totalValueLockedUSD.lt(BIGDECIMAL_ZERO) &&
    protocol.totalValueLockedUSD.plus(market.totalValueLockedUSD).gt(BIGDECIMAL_ZERO)
  ) {
    log.warning("TVL WAS NEGATIVE, NOW POSITIVE - TRANSACTION: " + tx + " CHECK FOR REPAYMENT", []);
  }
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(market.totalValueLockedUSD);
  protocol.totalDepositUSD = protocol.totalValueLockedUSD;
  protocol.save();
}
