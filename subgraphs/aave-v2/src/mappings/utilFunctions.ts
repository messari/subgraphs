import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
  log
} from '@graphprotocol/graph-ts';

import {
  Token,
  Market,
  RewardToken,
  MarketDailySnapshot,
  LendingProtocol,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  UserAddr
} from '../../generated/schema';

import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_TWO,
  BIGINT_ZERO,
  SECONDS_PER_DAY,
  ZERO_ADDRESS
} from '../common/constants';

import { AaveIncentivesController as IncentivesControllerContract } from '../../generated/templates/IncentivesController/AaveIncentivesController';

import { StableDebtToken as SToken } from '../../generated/templates/LendingPool/StableDebtToken';

import { VariableDebtToken as VToken } from '../../generated/templates/LendingPool/VariableDebtToken';

import { IPriceOracleGetter } from '../../generated/templates/LendingPool/IPriceOracleGetter';

import { IERC20 } from '../../generated/templates/LendingPool/IERC20';

import { AToken } from '../../generated/templates/AToken/AToken';

import { LendingPool } from '../../generated/templates/LendingPool/LendingPool';

import { IncentivesController } from '../../generated/templates';

import { bigIntToBigDecimal } from '../common/utils/numbers';

export const contractAddrUSDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

export function initMarket (
  blockNumber: BigInt,
  timestamp: BigInt,
  id: string
): Market {
  // This function either loads or creates the Market entity from a reserve
  log.info('MARKET LOAD: ' + id, []);
  const token = initToken(Address.fromString(id)) as Token;
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
    const protocol = fetchProtocolEntity(protocolId);
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
    market.totalFeesUSD = BIGDECIMAL_ZERO;
    market.totalValueLocked = BIGINT_ZERO;
    market.totalVolumeUSD = BIGDECIMAL_ZERO;
    const tryReserve = lendingPoolContract.try_getReserveData(Address.fromString(id));
    if (!tryReserve.reverted) {
      // If a valid reserve is returned, add fields from the reserve to the market entity
      // Rates are saved as a decimal (ie the borrow rate of 5% is saved as 0.05)
      market.stableBorrowRate = bigIntToBigDecimal(rayToWad(tryReserve.value.currentStableBorrowRate));
      market.variableBorrowRate = bigIntToBigDecimal(rayToWad(tryReserve.value.currentVariableBorrowRate));
    } else {
      log.error('FAILED TO GET RESERVE', []);
    }
  }
  // Update outputToken data each time the market is loaded
  market.outputTokenSupply = BIGINT_ZERO;
  market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  // There is no need to execute the below code until block 12251569 when incentive controller was deployed
  if (blockNumber.gt(new BigInt(12251569))) {
    let rewardTokens = market.rewardTokens;
    if (rewardTokens === null) rewardTokens = [];
    if (rewardTokens.length === 0) {
      // If the reward tokens have not been initialized on the market, attempt to pull them from the incentive controller
      const rewardTokenAddr = getRewardTokenAddress(market);
      if (rewardTokenAddr) {
        const depositRewardToken = loadRewardToken(rewardTokenAddr, market, "DEPOSIT");
        const borrowRewardToken = loadRewardToken(rewardTokenAddr, market, "BORROW");
        market.rewardTokens = [depositRewardToken.id, borrowRewardToken.id];
        market.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
        market.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];        
      }
    }
    // Get reward emissions
    market.rewardTokenEmissionsAmount = getCurrentRewardEmissions(market);
    market.rewardTokenEmissionsUSD = getCurrentRewardEmissionsUSD(market);
  }
  market.save();
  return market as Market;
}

export function getCurrentRewardEmissions (market: Market): BigInt[] {
  const rewardEmissions = [BIGINT_ZERO, BIGINT_ZERO];
  // Attempt to get the incentives controller contract
  const incentivesController = initIncentivesController(market);
  if (!incentivesController) {
    log.info('Failed to get current reward emissions, no incentive controller', [])
    return rewardEmissions;
  }
  // From the incentives controller contract, get pull the "assets" values from the market aToken, sToken, and vToken
  const incentivesControllerContract = IncentivesControllerContract.bind(incentivesController);
  log.info('CHECKING INC CONT REW EMS ASSET VALS ' + market.outputToken + ' ' + incentivesControllerContract.assets(Address.fromString(market.outputToken)).value0.toString() + ' ' + incentivesControllerContract.assets(Address.fromString(market.outputToken)).value1.toString() + ' ' + incentivesControllerContract.assets(Address.fromString(market.outputToken)).value2.toString(), [])
  const assetDataSupply = incentivesControllerContract.assets(Address.fromString(market.outputToken)).value0;
  const assetDataBorrowStable = incentivesControllerContract.assets(Address.fromString(market.sToken)).value0;
  const assetDataBorrowVariable = incentivesControllerContract.assets(Address.fromString(market.sToken)).value0;
  // Get the emissions per day for the aToken rewards
  rewardEmissions[0] = emissionsPerDay(assetDataSupply);
  // Get the emissions per second for both the sToken and vToken rewards, average them and get the daily emissions
  rewardEmissions[1] = emissionsPerDay((assetDataBorrowStable.plus(assetDataBorrowVariable)).div(BIGINT_TWO));
  return rewardEmissions;
}

export function getOutputTokenSupply (outputTokenAddr: Address): BigInt {
  const aTokenInstance = AToken.bind(outputTokenAddr);
  const tryTokenSupply = aTokenInstance.try_totalSupply();
  log.info('OUTPUT TOKEN ' + outputTokenAddr.toHexString(), []);
  let outputTokenSupply = BIGINT_ZERO;
  if (!tryTokenSupply.reverted) {
    outputTokenSupply = tryTokenSupply.value;
  } else {
    log.info('OUTPUT TOKEN SUPPLY CALL REVERTED FOR TOKEN ' + outputTokenAddr.toHexString(), []);
  }
  return outputTokenSupply;
}

export function initToken (assetAddr: Address): Token {
  // The token id is set as the asset address
  let asset = Token.load(assetAddr.toHex());
  if (asset === null) {
    // Create a new Token implementation
    asset = new Token(assetAddr.toHex());
    // Instantiate the Token with the IERC20 interface in order to access contract read methods
    const tokenInstance = IERC20.bind(assetAddr);
    const tryName = tokenInstance.try_name();
    if (!tryName.reverted) {
      asset.name = tryName.value;
    }
    const trySymbol = tokenInstance.try_symbol();
    if (!trySymbol.reverted) {
      asset.symbol = trySymbol.value;
    }
    const tryDecimals = tokenInstance.try_decimals();
    if (!tryDecimals.reverted) {
      asset.decimals = tryDecimals.value;
    }
    asset.save();
  }
  return asset as Token;
}

export function loadRewardToken (assetAddr: Address, market: Market, type: string): RewardToken {
  // See initToken() function above
  let asset = RewardToken.load(type + '-' + assetAddr.toHex());
  if (asset === null) {
    asset = new RewardToken(type + '-' + assetAddr.toHex());
    const tokenInstance = IERC20.bind(assetAddr);
    const tryName = tokenInstance.try_name();
    if (!tryName.reverted) {
      asset.name = tryName.value;
    }
    const trySymbol = tokenInstance.try_symbol();
    if (!trySymbol.reverted) {
      asset.symbol = trySymbol.value;
    }
    const tryDecimals = tokenInstance.try_decimals();
    if (!tryDecimals.reverted) {
      asset.decimals = tryDecimals.value;
    }
    asset.type = type;
    asset.save();
  }

  initToken(assetAddr);
  return asset as RewardToken;
}

export function fetchProtocolEntity (protocolId: string): LendingProtocol {
  // Load or create the Lending Protocol entity implementation
  // Protocol Id is currently 'aave-v2' rather than a UUID. Need to ask what the UUID should be, ie. a hash, just a number, mix of values etc
  let lendingProtocol = LendingProtocol.load(protocolId);
  log.info('proto id: ' + protocolId, []);
  if (!lendingProtocol) {
    lendingProtocol = new LendingProtocol(protocolId);
    lendingProtocol.totalUniqueUsers = 0;
    lendingProtocol.subgraphVersion = '1.0.0';
    lendingProtocol.schemaVersion = '1.0.0';
    lendingProtocol.name = 'Aave-v2';
    lendingProtocol.slug = 'aave-v2';
    lendingProtocol.network = 'ETHEREUM';
    lendingProtocol.totalFeesUSD = BIGDECIMAL_ZERO;
    lendingProtocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    lendingProtocol.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.protocolPriceOracle = ZERO_ADDRESS;
    lendingProtocol.type = 'LENDING';
    lendingProtocol.lendingType = 'POOLED';
    lendingProtocol.riskType = 'ISOLATED';
    lendingProtocol.save();
  }
  return lendingProtocol as LendingProtocol;
}

export function getRewardTokenAddress (market: Market): Address | null {
  const incentiveContAddr = initIncentivesController(market);
  if (!incentiveContAddr) {
    log.info('FAIL MARKET ' + market.id + ' COULD NOT GET INC CONT NOR REWARD TOKENS', [])
    return null;
  }
  // Instantiate IncentivesController to get access to contract read methods
  log.info('GET REWARD FROM INCENTIVE CONTROLLER ' + incentiveContAddr.toHexString() + ' market? ' + market.id, []);
  const contract = IncentivesControllerContract.bind(incentiveContAddr);
  // Attempt to get the contract Reward Token's address
  if (!contract.try_REWARD_TOKEN().reverted) {
    log.info('REWARD TOKEN ON MARKET ' + market.id + ' is ' + contract.try_REWARD_TOKEN().value.toHexString(), []);
    return contract.try_REWARD_TOKEN().value;
  } else {
    log.info('FAIL MARKET ' + market.id + ' REVERTED REWARD TOKEN', []);
    return null;
  }
}

export function initIncentivesController (market: Market): Address | null {
  // This function attempts to pull the incentives controller from the aToken/output token
  log.info('INIT INC CONT MARKET: ' + market.id + ' aTOken: ' + market.outputToken, []);
  const aToken = AToken.bind(Address.fromString(market.outputToken));
  if (!aToken.try_getIncentivesController().reverted) {
    const incContAddr = aToken.try_getIncentivesController().value;
    log.info('INCENTIVE CONTROLLER SUCCESS ' + incContAddr.toHexString(), []);
    // IncentivesController.create(aToken.try_getIncentivesController().value);
    return incContAddr;
  } else {
    log.info('FAILED TO GET INCENTIVE CONTROLLER ' + aToken._address.toHexString() + ' ' + market.id, []);
    return null;
  }
}

// SNAPSHOT FUNCTIONS

export function getMarketDailyId (event: ethereum.Event, market: Market): string {
  const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
  const id = market.id.concat('-').concat(daysSinceEpoch);
  return id;
}

// For the lack of closure support, the recommendation is to loop into a global variable
let rewardEmissionsAmounts: BigInt[] = [];
let rewardEmissionsAmountsUSD: BigDecimal[] = [];
export function getMarketDailySnapshot (
  event: ethereum.Event,
  market: Market
): MarketDailySnapshot {
  // Create a snapshot of market data throughout the day. One snapshot per market per day.
  // Attempt to load Snapshot entity implementation based on days since epoch in id.
  // Snapshot is created at the start of a new day and updated after transactions change certain market data.
  const snapId = getMarketDailyId(event, market);
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  let marketSnapshot = MarketDailySnapshot.load(snapId);
  if (marketSnapshot === null) {
    // Data needed upon Snapshot initialization
    marketSnapshot = new MarketDailySnapshot(snapId);
    marketSnapshot.market = market.id;
    marketSnapshot.protocol = protocol.id;
    let rewardTokenList: string[] = []
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

  const token = initToken(Address.fromString(market.id));
  marketSnapshot.totalValueLockedUSD = amountInUSD(token.id, token.decimals, market.totalValueLocked);
  marketSnapshot.totalVolumeUSD = market.totalVolumeUSD;
  marketSnapshot.inputTokenBalances = market.inputTokenBalances;
  marketSnapshot.inputTokenPricesUSD = getTokenPricesList(market.inputTokens);
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;
  marketSnapshot.depositRate = market.depositRate;
  marketSnapshot.stableBorrowRate = market.stableBorrowRate;
  marketSnapshot.variableBorrowRate = market.variableBorrowRate;
  marketSnapshot.save();
  log.info('Save market snap ', []);
  return marketSnapshot as MarketDailySnapshot;
}

export function updateMetricsDailySnapshot (event: ethereum.Event): UsageMetricsDailySnapshot {
  // Load or create the current date's UsageMetricsDailySnapshot implementation
  const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
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
  } else {
    log.info('LOADED METRIC SNAPSHOT ' + metricsDailySnapshot.id, []);
  }

  const userAddr = event.transaction.from;
  let user = UserAddr.load(userAddr.toHexString());
  let userCreated = false;
  if (!user) {
    user = new UserAddr(userAddr.toHexString());
    metricsDailySnapshot.totalUniqueUsers += 1;
    protocol.totalUniqueUsers += 1;
    userCreated = true;
  }

  const intDaysFromEpoch = BigInt.fromString(daysSinceEpoch);
  if (user.mostRecentVisit.notEqual(intDaysFromEpoch) || userCreated) {
    user.mostRecentVisit = intDaysFromEpoch;
    metricsDailySnapshot.activeUsers += 1;
  }
  protocol.save();
  user.save();
  metricsDailySnapshot.dailyTransactionCount += 1;
  metricsDailySnapshot.blockNumber = event.block.number;
  metricsDailySnapshot.timestamp = event.block.timestamp;
  metricsDailySnapshot.save();
  return metricsDailySnapshot as UsageMetricsDailySnapshot;
}

export function updateFinancials (event: ethereum.Event): FinancialsDailySnapshot {
  // Load or create the current date's FinancialsDailySnapshot implementation
  const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  let financialsDailySnapshot = FinancialsDailySnapshot.load(daysSinceEpoch);
  if (!financialsDailySnapshot) {
    financialsDailySnapshot = new FinancialsDailySnapshot(daysSinceEpoch);
    financialsDailySnapshot.protocol = protocol.id;
    financialsDailySnapshot.totalVolumeUSD = BIGDECIMAL_ZERO;
  }
  log.info('FINANCIAL SNAPSHOT ' + financialsDailySnapshot.id + ' TRANSACTION ' + event.transaction.hash.toHexString(), []);
  financialsDailySnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsDailySnapshot.protocolSideRevenueUSD = protocol.protocolSideRevenueUSD;
  financialsDailySnapshot.supplySideRevenueUSD = protocol.supplySideRevenueUSD;
  financialsDailySnapshot.feesUSD = protocol.totalFeesUSD;
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.save();
  return financialsDailySnapshot as FinancialsDailySnapshot;
}

// PRICE/ORACLE FUNCTIONS

export function getPriceOracle (): IPriceOracleGetter {
  // priceOracle is set the address of the price oracle contract of the address provider contract, pulled from context
  const protocolId = getProtocolIdFromCtx();
  const lendingProtocol = fetchProtocolEntity(protocolId);
  const priceOracle = lendingProtocol.protocolPriceOracle;
  log.info('GET PRICE ORACLE ' + priceOracle, [])
  return IPriceOracleGetter.bind(Address.fromString(priceOracle));
}

export function getAssetPriceInUSDC (tokenAddress: Address): BigDecimal {
  log.info('getAssetPriceInUSDC ' + tokenAddress.toHexString(), []);
  const oracle = getPriceOracle();
  // The Aave protocol oracle contracts only contain a method for getting an asset price in ETH, so USDC price must be fetched to convert asset price from Eth to USDC
  // Get the asset price in Wei and convert it to Eth
  let assetPriceInUSDC: BigDecimal = BIGDECIMAL_ZERO;
  const tryAssetPriceInEth = oracle.try_getAssetPrice(tokenAddress);
  // Fetch USDC price in Wei and convert it to Eth
  const tryPriceUSDCInEth = oracle.try_getAssetPrice(Address.fromString(contractAddrUSDC));
  if (!tryAssetPriceInEth.reverted && !tryPriceUSDCInEth.reverted) {
    const assetPriceInEth = tryAssetPriceInEth.value;
    const priceUSDCInEth = tryPriceUSDCInEth.value;
    assetPriceInUSDC = (new BigDecimal(assetPriceInEth).div(new BigDecimal(priceUSDCInEth)));
  } else {
    log.info('REVERTED GETTING USDC PRICE: ASSET? ' + tokenAddress.toHexString(), []);
  }
  // Asset price in Eth/USDC priced in Eth = Asset price in in USDC
  // return price per asset in USDC
  return assetPriceInUSDC;
}

export function amountInUSD (asset: string, decimals: number, amount: BigInt): BigDecimal {
  // This function takes in a token and the amount of the token and converts the amount of that token into USD
  const amountInDecimals = bigIntToBigDecimal(amount, <i32>decimals);
  const priceInUSDC = getAssetPriceInUSDC(Address.fromString(asset));
  const amountUSD = amountInDecimals.times(priceInUSDC);
  log.info(asset + ' TOKEN AMOUNT ' + amount.toString() + ' TIMES PRICE IN USD ' + priceInUSDC.toString() + ' === ' + amountUSD.toString(), []);
  return amountUSD.truncate(3);
}

let tokensList: string[] = [];
let tokenPrices: BigDecimal[] = [];
export function getTokenPricesList (tokens: string[]): BigDecimal[] {
  // Provided a array of token addresses (as strings) fetch USDC prices of all tokens and return as an array
  tokensList = tokens;
  tokenPrices = [];
  for (let i = 0; i < tokensList.length; i++) {
    const currentTokenAddr = Address.fromString(tokensList[i]);
    const currentTokenPriceUSDC = getAssetPriceInUSDC(currentTokenAddr);
    tokenPrices.push(currentTokenPriceUSDC);
    log.info('TOKENS LIST ' + i.toString() + ' USD: ' + currentTokenPriceUSDC.toString(), []);
  }
  return tokenPrices;
}

export function getCurrentRewardEmissionsUSD (market: Market): BigDecimal[] {
  // Taking the reward emissions denominated in the reward token, convert it to the value in USD
  const rewardEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  const rewardTokenAddr = getRewardTokenAddress(market);
  if (!rewardTokenAddr) return rewardEmissionsUSD;
  // The DEPOSIT reward token is used as the default. Both the deposit and borrow reward token decimals are the same
  const rewardToken = loadRewardToken(rewardTokenAddr, market, "DEPOSIT");
  // In the reward emissions arrays index 0 is for the deposit reward, index 1 for the borrow reward
  rewardEmissionsUSD[0] = amountInUSD(rewardTokenAddr.toHexString(), rewardToken.decimals, market.rewardTokenEmissionsAmount[0]);
  rewardEmissionsUSD[1] = amountInUSD(rewardTokenAddr.toHexString(), rewardToken.decimals, market.rewardTokenEmissionsAmount[1]);
  return rewardEmissionsUSD;
}

// CONTEXT FUNCTIONS

export function getLendingPoolFromCtx (): string {
  // Get the lending pool/market address with context
  const context = dataSource.context();
  return context.getString('lendingPool');
}

export function getProtocolIdFromCtx (): string {
  // Get the protocol id with context
  const context = dataSource.context();
  return context.getString('protocolId');
}

// MATH FUNCTIONS

export function calculateRevenues (market: Market, token: Token): void {
  // Calculate and save the fees and revenue on both market and protocol level
  // Pull S and V debt tokens to get the amount currently borrowed as stable debt or variable debt
  const STokenContract = SToken.bind(Address.fromString(market.sToken));
  const VTokenContract = VToken.bind(Address.fromString(market.vToken));

  const s = STokenContract.try_totalSupply();
  const v = VTokenContract.try_totalSupply();

  if (!v.reverted && !s.reverted) {
    log.info('IN REPAY FOR MARKET ' + market.id + ' S AND V SUPPLIES ' + s.value.toString() + ' ' + market.totalStableValueLocked.toString() + ' ' + v.value.toString() + ' ' + market.totalVariableValueLocked.toString(), []);
    market.totalVariableValueLocked = v.value;
    market.totalStableValueLocked = s.value;
  } else {
    log.info('IN REPAY FOR MARKET ' + market.id + ' S AND V REVERTED ' + s.reverted.toString() + ' ' + v.reverted.toString(), []);
  }
  // Subtract prior market total fees protocol.feesUSD
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  log.info('SUBTRACTING MARKET FROM PROTOCOL TOTAL FEES ' + protocol.totalFeesUSD.toString() + ' - ' + market.totalFeesUSD.toString(), [])

  // Get the protocol revenues/fees subtracting the market values before calculation
  const protoMinusMarketProtoRevenue = protocol.protocolSideRevenueUSD.minus(market.protocolSideRevenueUSD);
  const protoMinusMarketSupplyRevenue = protocol.supplySideRevenueUSD.minus(market.supplySideRevenueUSD);
  const protoMinusMarketFees = protocol.totalFeesUSD.minus(market.totalFeesUSD);
  // Multiply total Variable value Locked in USD by market.variableBorrowRate
  const varAmountUSD = amountInUSD(token.id, token.decimals, market.totalVariableValueLocked);
  const varFees = varAmountUSD.times(market.variableBorrowRate);
  // Multiply total Stable value Locked in USD by market.variableStableRate
  const staAmountUSD = amountInUSD(token.id, token.decimals, market.totalStableValueLocked);
  const staFees = staAmountUSD.times(market.stableBorrowRate);

  // Add these values together, save to market and add protocol total
  market.totalFeesUSD = staFees.plus(varFees).truncate(3);
  protocol.totalFeesUSD = protoMinusMarketFees.plus(market.totalFeesUSD);
  market.protocolSideRevenueUSD = market.totalFeesUSD.times(bigIntToBigDecimal(market.reserveFactor, 4)).truncate(3);
  protocol.protocolSideRevenueUSD = protoMinusMarketProtoRevenue.plus(market.protocolSideRevenueUSD);
  market.supplySideRevenueUSD = market.totalFeesUSD.times(BIGDECIMAL_ONE.minus(bigIntToBigDecimal(market.reserveFactor, 4))).truncate(3);
  protocol.supplySideRevenueUSD = protoMinusMarketSupplyRevenue.plus(market.supplySideRevenueUSD);

  market.save();
  protocol.save();
}

export function updateTVL (token: Token, market: Market, protocol: LendingProtocol, amountInTokens: BigInt, toSubtract: bool): void {
  // Update the total value locked in a market and the protocol overall after transactions
  let newMarketTVL = market.totalValueLocked;
  if (toSubtract) {
    newMarketTVL = market.totalValueLocked.minus(amountInTokens);
  } else {
    newMarketTVL = market.totalValueLocked.plus(amountInTokens);
  }
  // Subtract the PREVIOUSLY ADDED totalValueLockedUSD of the market from the protocol TVL
  // Subtracting the most recently added TVL of the market ensures that the correct
  // proportion of this market is deducted before adding the new market TVL to the protocol
  // Otherwise, the difference in asset USD/ETH price  since saving would deduct the incorrect proportion from the protocol TVL
  log.info(market.id + ' market.totalValueLocked = ' + market.totalValueLocked.toString() + ' newMarketTVL = ' + newMarketTVL.toString() + ' amountInTokens = ' + amountInTokens.toString() + ' toSub ' + toSubtract.toString(), []);
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(market.totalValueLockedUSD);
  market.totalValueLocked = newMarketTVL;
  market.totalValueLockedUSD = amountInUSD(token.id, token.decimals, newMarketTVL);
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(market.totalValueLockedUSD);
  protocol.save();
  market.save();
}

export function emissionsPerDay(rewardRatePerSecond: BigInt): BigInt {
  // Take the reward rate per second, divide out the decimals and get the emissions per day
  return (rewardRatePerSecond.div(new BigInt(10).pow(18))).times(new BigInt(SECONDS_PER_DAY));
}

export function getDaysSinceEpoch (secondsSinceEpoch: number): string {
  return (<i32>Math.floor(secondsSinceEpoch / SECONDS_PER_DAY)).toString();
}

// Ray is 27 decimal Wad is 18 decimal

export function rayToWad (a: BigInt): BigInt {
  const halfRatio = BigInt.fromI32(10).pow(9).div(BigInt.fromI32(2));
  return halfRatio.plus(a).div(BigInt.fromI32(10).pow(9));
}

export function wadToRay (a: BigInt): BigInt {
  const result = a.times(BigInt.fromI32(10).pow(9));
  return result;
}
