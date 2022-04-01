import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
  log
} from "@graphprotocol/graph-ts";

import {
  AaveIncentivesController as IncentivesControllerContract,
} from "../../generated/templates/IncentivesController/AaveIncentivesController";

import { StableDebtToken as SToken } from "../../generated/templates/LendingPool/StableDebtToken";
import { VariableDebtToken as VToken } from "../../generated/templates/LendingPool/VariableDebtToken";

import {
  Token,
  Market,
  RewardToken,
  MarketDailySnapshot,
  LendingProtocol,
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  UserAddr
} from "../../generated/schema";

import { IPriceOracleGetter } from "../../generated/templates/LendingPool/IPriceOracleGetter";
import { IERC20 } from "../../generated/templates/LendingPool/IERC20";
import { AToken } from "../../generated/templates/AToken/AToken";
import { LendingPool } from "../../generated/templates/LendingPool/LendingPool";
import { IncentivesController } from "../../generated/templates";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ZERO_ADDRESS
} from "../common/constants";
import { bigIntToBigDecimal } from "../common/utils/numbers";

const weiPerEth = BigInt.fromI64(1000000000000000000);
export const zeroAddr = "0x0000000000000000000000000000000000000000";
export const contractAddrUSDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

export function initMarket(
  blockNumber: BigInt,
  timestamp: BigInt,
  id: string,
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
    const inputTokens: Token[] = [token];
    // Populate fields with data that has been passed to the function
    // Other data fields are initialized as 0/[]/false
    const inputTokenBalances: BigInt[] = [];
    for (let i = 0; i < inputTokens.length; i++) {
      inputTokenBalances.push(BIGINT_ZERO);
    }
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
    market.inputTokens = inputTokens.map<string>((t) => t.id);
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
      log.info('INIT MARKET BORROW RATES STABLE RATES' + market.stableBorrowRate.toString() + ' res ' + tryReserve.value.currentStableBorrowRate.toString() + ' VAR RATES ' + market.variableBorrowRate.toString() + ' res ' + tryReserve.value.currentVariableBorrowRate.toString(), [])
    } else {
      log.error('FAILED TO GET RESERVE', [''])
    }
  }
  // Update outputToken data each time the market is loaded
  market.outputTokenSupply = BIGINT_ZERO;
  market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  market.save();
  log.info('market save: ' + market.createdBlockNumber.toString(), [])
  return market as Market;
}

export function getOutputTokenSupply(outputTokenAddr: Address): BigInt {
  const aTokenInstance = AToken.bind(outputTokenAddr);
  const tryTokenSupply = aTokenInstance.try_totalSupply();
  log.info('OUTPUT TOKEN ' + outputTokenAddr.toHexString(), []);
  let outputTokenSupply = BIGINT_ZERO;
  if (!tryTokenSupply.reverted) {
    log.info('OUTTOKEN SUPPLY ' + tryTokenSupply.value.toString(), []);
    outputTokenSupply = tryTokenSupply.value;
  } else {
    log.info('OUTPUT TOKEN SUPPLY CALL REVERTED FOR TOKEN ' + outputTokenAddr.toHexString(), [])
  }
  return outputTokenSupply;
}

export function initToken(assetAddr: Address): Token {
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

// HOW WOULD ONE GET THE TOKEN TYPE(DEPOSIT/BORROW)? SEE aToken.ts
export function loadRewardToken(assetAddr: Address, market: Market): RewardToken {
  // See initToken() function above
  let asset = RewardToken.load(assetAddr.toHex());
  if (asset === null) {
    asset = new RewardToken(assetAddr.toHex());
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
    asset.type = "DEPOSIT"
    asset.save();
  }
  // Add the reward token to the market
  let rewardTokens = market.rewardTokens;
  if (rewardTokens === null) {
    rewardTokens = [asset.id]
  } else if (!rewardTokens.includes(asset.id)) {
    rewardTokens.push(asset.id);
  }

  market.rewardTokens = rewardTokens;
  market.save();
  initToken(assetAddr);
  return asset as RewardToken;
}

export function fetchProtocolEntity(protocolId: string): LendingProtocol {
  // Load or create the Lending Protocol entity implementation
  // Protocol Id is currently 'aave-v2' rather than a UUID. Need to ask what the UUID should be, ie. a hash, just a number, mix of values etc
  let lendingProtocol = LendingProtocol.load(protocolId);
  log.info('proto id: ' + protocolId, [])
  if (!lendingProtocol) {
    lendingProtocol = new LendingProtocol(protocolId);
    lendingProtocol.totalUniqueUsers = 0;
    lendingProtocol.subgraphVersion = '0.0.1';
    lendingProtocol.schemaVersion = '0.0.1';
    lendingProtocol.name = 'Aave-v2';
    lendingProtocol.slug = 'aave-v2';
    lendingProtocol.network = 'ETHEREUM';
    lendingProtocol.totalFeesUSD = BIGDECIMAL_ZERO;
    lendingProtocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    lendingProtocol.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
    lendingProtocol.supplySideRevenueUSD = BIGDECIMAL_ZERO;

    // !!! Are these options correct?
    lendingProtocol.type = 'LENDING';
    lendingProtocol.lendingType = 'POOLED';
    lendingProtocol.riskType = 'ISOLATED';
    // Initialize empty arrays
    lendingProtocol.save();
  }
  return lendingProtocol as LendingProtocol;
}


export function getRewardTokenFromIncController(incentiveContAddr: Address, market: Market): RewardToken {
  log.info('GET REWARD FROM INCENTIVE CONTROLLER ' + incentiveContAddr.toHexString(), [])
  // Instantiate IncentivesController to get access to contract read methods
  const contract = IncentivesControllerContract.bind(incentiveContAddr);
  // Get the contract Reward Token's address
  if (!contract.try_REWARD_TOKEN().reverted) {
    log.info('REWARD TOKEN ON MARKET ' + market.id + ' is ' + contract.try_REWARD_TOKEN().value.toHexString(), [])
    return loadRewardToken(contract.try_REWARD_TOKEN().value, market);
  } else {
    log.info('MARKET ' + market.id + ' REVERTED REWARD TOKEN', []);
    return loadRewardToken(Address.fromString(ZERO_ADDRESS), market);
  }
}

export function initIncentivesController(aToken: AToken, market: Market): void {
  // This function attempts to pull the incentives controller from the aToken/output token
  log.info('INIT INC CONT MARKET: ' + market.id, [])
  if (!aToken.try_getIncentivesController().reverted) {
    const incContAddr = aToken.try_getIncentivesController().value;
    log.info('INCENTIVE CONTROLLER ' + incContAddr.toHexString(), [])
    IncentivesController.create(aToken.try_getIncentivesController().value);
    getRewardTokenFromIncController(incContAddr, market);
  } else {
    log.info('FAILED TO GET INCENTIVE CONTROLLER ' + aToken._address.toHexString() + ' ' + market.id, [])
  }
}

// SNAPSHOT FUNCTIONS

export function getMarketDailySnapshotId(event: ethereum.Event, market: Market): string {
  const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
  let id = market.id.concat("-").concat(daysSinceEpoch);
  return id;
}

// For the lack of closure support, the recommendation is to loop into a global variable
let rewardEmissionsAmounts: BigInt[] = [];
let rewardEmissionsAmountsUSD: BigDecimal[] = [];
export function loadMarketDailySnapshot(
  event: ethereum.Event,
  market: Market,
): MarketDailySnapshot {
  // Create a snapshot of market data throughout the day. One snapshot per market per day.
  // Attempt to load Snapshot entity implementation based on days since epoch in id. 
  // Snapshot is created at the start of a new day and updated after transactions change certain market data.
  const updateId = getMarketDailySnapshotId(event, market);
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  let marketSnapshot = MarketDailySnapshot.load(updateId);
  if (marketSnapshot === null) {
    // Data needed upon Snapshot initialization
    marketSnapshot = new MarketDailySnapshot(updateId);
    marketSnapshot.market = market.id;
    marketSnapshot.protocol = protocol.id;
    let rewardTokenList: string[] = []
    if (market.rewardTokens) {
      rewardTokenList = market.rewardTokens as string[];
      rewardEmissionsAmounts = [];
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
  marketSnapshot.totalValueLockedUSD = amountInUSD(token, market.totalValueLocked);
  marketSnapshot.totalVolumeUSD = market.totalVolumeUSD;
  marketSnapshot.inputTokenBalances = market.inputTokenBalances;
  // Either pass in or call getAssetPriceInUSDC() on the input token from here to get input token price in USD
  marketSnapshot.inputTokenPricesUSD = [getAssetPriceInUSDC(initToken(Address.fromString(market.inputTokens[0])))];
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;
  marketSnapshot.depositRate = market.depositRate;
  marketSnapshot.stableBorrowRate = market.stableBorrowRate;
  marketSnapshot.variableBorrowRate = market.variableBorrowRate;
  marketSnapshot.save();

  return marketSnapshot as MarketDailySnapshot;
}

export function updateMetricsDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Load or create the current date's UsageMetricsDailySnapshot implementation
  const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  let metricsDailySnapshot = UsageMetricsDailySnapshot.load(daysSinceEpoch);
  if (!metricsDailySnapshot) {
    metricsDailySnapshot = new UsageMetricsDailySnapshot(daysSinceEpoch);
    metricsDailySnapshot.protocol = protocol.id;
    // Initialize zero values
    metricsDailySnapshot.activeUsers = 0;
    // NEED SIMILIAR GET MOST RECENT SNAPSHOT FUNCTION TO GET TOTAL CUMULATIVE USERS
    metricsDailySnapshot.totalUniqueUsers = protocol.totalUniqueUsers;
    metricsDailySnapshot.dailyTransactionCount = 0;
  } else {
    log.info('LOADED METRIC SNAPSHOT ' + metricsDailySnapshot.id, [])
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
  if (user.mostRecentVisit.notEqual(BigInt.fromString(daysSinceEpoch)) || userCreated) {
    user.mostRecentVisit = BigInt.fromString(daysSinceEpoch);
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

export function updateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
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
  financialsDailySnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  log.info('FINANCIAL SNAPSHOT ' + financialsDailySnapshot.id + ' TRANSACTION ' + event.transaction.hash.toHexString(), []);
  financialsDailySnapshot.protocolSideRevenueUSD = protocol.protocolSideRevenueUSD;
  financialsDailySnapshot.supplySideRevenueUSD = protocol.supplySideRevenueUSD;
  financialsDailySnapshot.feesUSD = protocol.totalFeesUSD;
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;
  financialsDailySnapshot.save();
  return financialsDailySnapshot as FinancialsDailySnapshot;
}

// PRICE/ORACLE FUNCTIONS

export function getPriceOracle(): IPriceOracleGetter {
  // priceOracle is set the address of the price oracle contract of the address provider contract, pulled from context
  const priceOracle = getOracleAddressFromProtocol();
  return IPriceOracleGetter.bind(Address.fromString(priceOracle));
}

export function getAssetPriceInUSDC(token: Token): BigDecimal {
  log.info('getAssetPriceInUSDC ' + token.name + '---' + token.id, []);
  const tokenAddress = Address.fromString(token.id);
  // Get the oracle contract instance
  const oracle = getPriceOracle();
  // The Aave protocol oracle contracts only contain a method for getting an asset price in ETH, so USDC price must be fetched to convert asset price from Eth to USDC
  // Get the asset price in Wei and convert it to Eth
  let assetPriceInUSDC: BigDecimal = BIGDECIMAL_ZERO;
  let tryAssetPriceInEth = oracle.try_getAssetPrice(tokenAddress);
  // Fetch USDC price in Wei and convert it to Eth
  let tryPriceUSDCInEth = oracle.try_getAssetPrice(Address.fromString(contractAddrUSDC));
  if (!tryAssetPriceInEth.reverted && !tryPriceUSDCInEth.reverted) {
    const assetPriceInEth = tryAssetPriceInEth.value;
    const priceUSDCInEth = tryPriceUSDCInEth.value;
    assetPriceInUSDC = (new BigDecimal(assetPriceInEth).div(new BigDecimal(priceUSDCInEth)));
  } else {
    log.info('REVERTED GETTING USDC PRICE: ASSET? ' + token.name, []);
  }
  // Asset price in Eth/USDC priced in Eth = Asset price in in USDC
  // return price per asset in USDC
  return assetPriceInUSDC;
}

// CONTEXT FUNCTIONS

export function getLendingPoolFromCtx(): string {
  // Get the lending pool/market address with context
  let context = dataSource.context();
  return context.getString("lendingPool");
}

export function getProtocolIdFromCtx(): string {
  // Get the protocol id with context
  let context = dataSource.context();
  return context.getString("protocolId");
}

export function getOracleAddressFromProtocol(): string {
  // Get the price oracle address
  const protocolId = getProtocolIdFromCtx();
  const lendingProtocol = fetchProtocolEntity(protocolId);
  return lendingProtocol.protocolPriceOracle;
}

// MATH FUNCTIONS

export function calculateRevenues(market: Market, token: Token): void {
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
  //Subtract prior market total fees protocol.feesUSD
  const protocolId = getProtocolIdFromCtx();
  const protocol = fetchProtocolEntity(protocolId);
  log.info('SUBTRACTING MARKET FROM PROTOCOL TOTAL FEES ' + protocol.totalFeesUSD.toString() + ' - ' + market.totalFeesUSD.toString(), [])
  
  // Get the protocol revenues/fees subtracting the market values before calculation
  const protoMinusMarketProtoRevenue = protocol.protocolSideRevenueUSD.minus(market.protocolSideRevenueUSD);
  const protoMinusMarketSupplyRevenue = protocol.supplySideRevenueUSD.minus(market.supplySideRevenueUSD);
  const protoMinusMarketFees = protocol.totalFeesUSD.minus(market.totalFeesUSD);
  // Multiply total Variable value Locked in USD by market.variableBorrowRate
  const varAmountUSD = amountInUSD(token, market.totalVariableValueLocked);
  const varFees = varAmountUSD.times(market.variableBorrowRate);
  // Multiply total Stable value Locked in USD by market.variableStableRate
  const staAmountUSD = amountInUSD(token, market.totalStableValueLocked);
  const staFees = staAmountUSD.times(market.stableBorrowRate);

  // Add these values together, save to market and add protocol total
  market.totalFeesUSD = staFees.plus(varFees).truncate(2);
  protocol.totalFeesUSD = protoMinusMarketFees.plus(market.totalFeesUSD);
  market.protocolSideRevenueUSD = market.totalFeesUSD.times(bigIntToBigDecimal(market.reserveFactor, 2)).truncate(2);
  protocol.protocolSideRevenueUSD = protoMinusMarketProtoRevenue.plus(market.protocolSideRevenueUSD);
  market.supplySideRevenueUSD = market.totalFeesUSD.times(BIGDECIMAL_ONE.minus(bigIntToBigDecimal(market.reserveFactor, 2))).truncate(2);
  protocol.supplySideRevenueUSD = protoMinusMarketSupplyRevenue.plus(market.supplySideRevenueUSD);

  market.save();
  protocol.save();
}

export function updateTVL(token: Token, market: Market, protocol: LendingProtocol, amountInTokens: BigInt, toSubtract: bool): void {
  // Update the total value locked in a market and the protocol overall after transactions
  log.info('ENTERED UPDATETVL', [])
  // 
  // const priorMarketTVL = amountInUSD(token, market.totalValueLocked);
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
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(market.totalValueLockedUSD);
  market.totalValueLockedUSD = amountInUSD(token, newMarketTVL);
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(market.totalValueLockedUSD);
  protocol.save();
  market.save();
}

export function amountInUSD(token: Token, amount: BigInt): BigDecimal {
  // This function takes in a token and the amount of the token and converts the amount of that token into USD
  const amountInDecimals = bigIntToBigDecimal(amount, token.decimals);
  log.info('AMOUNTINUSD AMOUNT IN DECIMALS: ' + amountInDecimals.toString(), [])
  const priceInUSDC = getAssetPriceInUSDC(token);
  const amountUSD = amountInDecimals.times(priceInUSDC);
  log.info(token.id + ' ' + token.name.toUpperCase() + ' AMOUNT ' + amount.toString() + ' AND PRICE??? ' + priceInUSDC.toString() + '---' + amountUSD.toString(), []);
  return amountUSD.truncate(2);
}

// Ray is 27 decimal Wad is 18 decimal

export function rayToWad(a: BigInt): BigInt {
  let halfRatio = BigInt.fromI32(10).pow(9).div(BigInt.fromI32(2));
  return halfRatio.plus(a).div(BigInt.fromI32(10).pow(9));
}

export function wadToRay(a: BigInt): BigInt {
  let result = a.times(BigInt.fromI32(10).pow(9));
  return result;
}

export function getDaysSinceEpoch(secondsSinceEpoch: number): string {
  return (<i32>Math.floor(secondsSinceEpoch / 86400)).toString();
}

export function exponentToBigDecimal(decimals: string, amount: string): BigDecimal {
  // Convert a token amount with decimals
  let amountArr = amount.split(".").join("").split("");
  let insertIdx = <i32>(amountArr.length - parseInt(decimals));
  if (insertIdx < 0) {
    for (insertIdx; insertIdx < 0; insertIdx++) {
      amountArr.unshift("0");
    }
  }
  amountArr[insertIdx] = '.' + amountArr[insertIdx];
  return BigDecimal.fromString(amountArr.join(""))
}