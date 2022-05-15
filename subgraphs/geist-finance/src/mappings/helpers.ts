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
  PROTOCOL_METHODOLOGY_VERSION
} from "../common/constants";

import * as addresses from "../common/addresses";

import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
} from "../common/tokens";

import { emissionsPerDay } from "../common/rewards";

import { getDaysSinceEpoch } from "../common/utils/datetime";

import { getOrCreateToken } from "../common/getters";

import { bigIntToBigDecimal, rayToWad } from "../common/utils/numbers";

import { GToken } from "../../generated/templates/GToken/GToken";

import { LendingPool } from "../../generated/templates/LendingPool/LendingPool";

import { SpookySwapGEISTFTM } from "../../generated/templates/LendingPool/SpookySwapGEISTFTM";

import { AaveOracle } from "../../generated/templates/LendingPool/AaveOracle";

import { AaveProtocolDataProvider } from "../../generated/templates/LendingPool/AaveProtocolDataProvider";

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
    market.outputToken = addresses.ZERO_ADDRESS.toHexString();
    market.inputTokens = inputTokens;
    market.inputTokenBalances = inputTokenBalances;
    market.sToken = addresses.ZERO_ADDRESS.toHexString();
    market.vToken = addresses.ZERO_ADDRESS.toHexString();
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
    const tryReserve = lendingPoolContract.try_getReserveData(
      Address.fromString(id)
    );
    if (!tryReserve.reverted) {
      // If a valid reserve is returned, add fields from the reserve to the market entity
      // Rates are saved as a decimal (ie the borrow rate of 5% is saved as 0.05)
      market.stableBorrowRate = bigIntToBigDecimal(
        rayToWad(tryReserve.value.currentStableBorrowRate)
      );
      market.variableBorrowRate = bigIntToBigDecimal(
        rayToWad(tryReserve.value.currentVariableBorrowRate)
      );
    } else {
      log.error("Failed to get market ID={} reserve data", [market.id]);
    }
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
  market.inputTokenPricesUSD = [currentPriceUSD];
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

    let marketId = "";
    if (gToken.underlyingAsset !== "") {
      marketId = gToken.underlyingAsset;
    } else {
      marketId = gTokenInstance.UNDERLYING_ASSET_ADDRESS().toHexString();
    }
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
    rewardToken.symbol = fetchTokenSymbol(assetAddr);
    rewardToken.name = fetchTokenName(assetAddr);
    rewardToken.decimals = fetchTokenDecimals(assetAddr);
    rewardToken.type = type;
    rewardToken.save();
  }
  getOrCreateToken(assetAddr);
  log.info(
    "Created (or loaded) reward token with ID={}, name={}, decimals={}",
    [rewardToken.id, rewardToken.name, rewardToken.decimals.toString()]
  );
  return rewardToken as RewardToken;
}

export function getOrCreateProtocol(protocolId: string): LendingProtocol {
  // Create (or load) the Lending protocol entity
  let lendingProtocol = LendingProtocol.load(protocolId);

  if (!lendingProtocol) {
    lendingProtocol = new LendingProtocol(protocolId);
    lendingProtocol.totalUniqueUsers = 0;
    lendingProtocol.network = SchemaNetwork.FANTOM;
    lendingProtocol.type = ProtocolType.LENDING;
    lendingProtocol.subgraphVersion = SUBGRAPH_VERSION;
    lendingProtocol.schemaVersion = SCHEMA_VERSION;
    lendingProtocol.name = PROTOCOL_NAME;
    lendingProtocol.slug = PROTOCOL_SLUG;
    lendingProtocol.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
    lendingProtocol.totalRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    lendingProtocol.totalVolumeUSD = BIGDECIMAL_ZERO;
    lendingProtocol.totalDepositUSD = BIGDECIMAL_ZERO;
    lendingProtocol.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.protocolPriceOracle = addresses.PRICE_ORACLE_ADDRESS.toHexString();
    lendingProtocol.lendingType = LENDING_TYPE;
    lendingProtocol.riskType = RISK_TYPE;
    lendingProtocol.save();
  }
  log.info("Created (or loaded) lending protocol with ID={}", [
    lendingProtocol.id,
  ]);

  return lendingProtocol as LendingProtocol;
}

export function initializeIncentivesController(market: Market): Address {
  // Initialize the incentives controller for a specific gToken
  log.info(
    "Initializing incentives controller for market with ID={}, gToken={}",
    [market.id, market.outputToken]
  );

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
    market.inputTokenPricesUSD[0],
    token.decimals,
    market.inputTokenBalances[0],
    market
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
  log.info("Saving market snapshot with ID={}", [marketSnapshot.id]);
  return marketSnapshot as MarketDailySnapshot;
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
    usageMetricsDailySnapshot.activeUsers = 0;
    usageMetricsDailySnapshot.totalUniqueUsers = protocol.totalUniqueUsers;
    usageMetricsDailySnapshot.dailyTransactionCount = 0;
  }

  const userAddress = event.transaction.from;
  let user = Account.load(userAddress.toHexString());
  if (!user) {
    user = new Account(userAddress.toHexString());
    user.save();
    usageMetricsDailySnapshot.totalUniqueUsers += 1;
    protocol.totalUniqueUsers += 1;
  }
  let accountActive = ActiveAccount.load(
    daysSinceEpoch + "-" + userAddress.toHexString()
  );
  if (!accountActive) {
    accountActive = new ActiveAccount(
      daysSinceEpoch + "-" + userAddress.toHexString()
    );
    accountActive.save();
    usageMetricsDailySnapshot.activeUsers += 1;
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
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);

  let financialsDailySnapshot = FinancialsDailySnapshot.load(daysSinceEpoch);
  if (!financialsDailySnapshot) {
    financialsDailySnapshot = new FinancialsDailySnapshot(daysSinceEpoch);
    financialsDailySnapshot.protocol = protocol.id;
  }
  log.info(
    "Created (or updated) FinancialsDailySnapshot with ID={}, tx hash={}",
    [financialsDailySnapshot.id, event.transaction.hash.toHexString()]
  );
  financialsDailySnapshot.totalVolumeUSD = protocol.totalVolumeUSD;
  financialsDailySnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsDailySnapshot.totalDepositUSD = protocol.totalDepositUSD;
  financialsDailySnapshot.protocolSideRevenueUSD =
    protocol.protocolSideRevenueUSD;
  financialsDailySnapshot.supplySideRevenueUSD = protocol.supplySideRevenueUSD;
  financialsDailySnapshot.totalRevenueUSD = protocol.totalRevenueUSD;
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
  const priceOracle = lendingProtocol.protocolPriceOracle;
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
      market.inputTokens.length.toString(),
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
    rewardToken.decimals,
    market.rewardTokenEmissionsAmount[0],
    market
  );
  rewardEmissionsUSD[1] = tokenAmountInUSD(
    rewardPriceInUSDC,
    rewardToken.decimals,
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

export function calculateRevenues(market: Market, token: Token): void {
  // Calculate and save the fees and revenue on both market and protocol level
  // Additionally calculate the total borrow amount on market and protocol
  // Pull S and V debt tokens to get the amount currently borrowed as stable debt or variable debt

  const dataProviderContract = AaveProtocolDataProvider.bind(
    addresses.AAVE_PROTOCOL_DATA_PROVIDER
  );

  const reserve_data = dataProviderContract.try_getReserveData(
    Address.fromString(market.id)
  );

  if (!reserve_data.reverted) {
    market.totalStableValueLocked = reserve_data.value.value1;
    market.totalVariableValueLocked = reserve_data.value.value2;
  }

  // Subtract prior market total fees protocol.totalRevenueUSD
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);
  log.info("Subtract prior market fees ({} USD) from protocol fees ({} USD)", [
    market.totalRevenueUSD.toString(),
    protocol.totalRevenueUSD.toString(),
  ]);

  // Get the protocol revenues/fees subtracting the market values before calculation
  const protoMinusMarketProtoRevenue = protocol.protocolSideRevenueUSD.minus(
    market.protocolSideRevenueUSD
  );
  const protoMinusMarketSupplyRevenue = protocol.supplySideRevenueUSD.minus(
    market.supplySideRevenueUSD
  );
  const protoMinusMarketFees = protocol.totalRevenueUSD.minus(
    market.totalRevenueUSD
  );
  // Multiply total Variable value Locked in USD by market.variableBorrowRate
  const varAmountUSD = tokenAmountInUSD(
    market.inputTokenPricesUSD[0],
    token.decimals,
    market.totalVariableValueLocked,
    market
  );
  const varFees = varAmountUSD.times(market.variableBorrowRate);
  // Multiply total Stable value Locked in USD by market.variableStableRate
  const staAmountUSD = tokenAmountInUSD(
    market.inputTokenPricesUSD[0],
    token.decimals,
    market.totalStableValueLocked,
    market
  );
  const staFees = staAmountUSD.times(market.stableBorrowRate);

  // Add these values together, save to market and add protocol total
  market.totalRevenueUSD = staFees.plus(varFees).truncate(3);
  protocol.totalRevenueUSD = protoMinusMarketFees.plus(market.totalRevenueUSD);
  market.protocolSideRevenueUSD = market.totalRevenueUSD
    .times(bigIntToBigDecimal(market.reserveFactor, 4))
    .truncate(3);
  protocol.protocolSideRevenueUSD = protoMinusMarketProtoRevenue.plus(
    market.protocolSideRevenueUSD
  );
  market.supplySideRevenueUSD = market.totalRevenueUSD
    .times(BIGDECIMAL_ONE.minus(bigIntToBigDecimal(market.reserveFactor, 4)))
    .truncate(3);
  protocol.supplySideRevenueUSD = protoMinusMarketSupplyRevenue.plus(
    market.supplySideRevenueUSD
  );

  // CALCULATE totalBorrowUSD FIELDS ON MARKET AND PROTOCOL ENTITIES
  // The sum in USD of s and v tokens on market is totalBorrowUSD
  // Subtract the previously saved amount of the market TotalBorrowUSD value from the protocol totalBorrowUSD
  // This gets the amount in USD out in borrows on the protocol not including this market
  const tempProtocolBorrowTotal = protocol.totalBorrowUSD.minus(
    market.totalBorrowUSD
  );
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
  amountUSD: BigDecimal,
  toSubtract: bool
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
    market.inputTokenPricesUSD[0],
    token.decimals,
    newMarketTVL,
    market
  );
  market.totalDepositUSD = market.totalValueLockedUSD;
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
  protocol.totalDepositUSD = protocol.totalValueLockedUSD;
  protocol.totalVolumeUSD = amountUSD;
  protocol.save();
}
