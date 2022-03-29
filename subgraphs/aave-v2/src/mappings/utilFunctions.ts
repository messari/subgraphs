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
import { BIGDECIMAL_ZERO, BIGINT_ZERO, USDC_DECIMALS } from "../common/constants";
import { bigIntToBigDecimal } from "../common/utils/numbers";

const weiPerEth = BigInt.fromI64(1000000000000000000);
export const zeroAddr = "0x0000000000000000000000000000000000000000";
export const contractAddrUSDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

export function initMarket(
    event: ethereum.Event,
    id: string,
  ): Market {
    // This function either loads or creates the Market entity from a reserve
    log.info('MARKET LOAD: ' + id,[]);
    const token = initToken(Address.fromString(id)) as Token;
    let market = Market.load(id);
    if (market === null) {
        // Get the lending pool to get the rerve data for this Market entity
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
        market.stableBorrowRate = BIGDECIMAL_ZERO;
        market.variableBorrowRate = BIGDECIMAL_ZERO;
        const tryReserve = lendingPoolContract.try_getReserveData(Address.fromString(id));
        if (!tryReserve.reverted) {
          // If a valid reserve is returned, add fields from the reserve to the market entity 
          log.info(token.name + ' TRY RESERVE ATOKEN RETURNED FROM GETRESERVEDATA ' + tryReserve.value.aTokenAddress.toHexString() + ' EQUAL ADDR.ZERO? ' + (tryReserve.value.aTokenAddress === Address.zero()).toString(), [])
          market.outputToken = tryReserve.value.aTokenAddress.toHexString();
          market.stableBorrowRate = new BigDecimal(tryReserve.value.currentStableBorrowRate);
          market.variableBorrowRate = new BigDecimal(tryReserve.value.currentVariableBorrowRate);
        } else {
          log.error('FAILED TO GET RESERVE', [''])
        }
        log.info('INITIALIZING ATOKEN FROM MARKET ' + market.outputToken, [])
        initToken(Address.fromString(market.outputToken));
        market.protocol = protocol.name;
        market.inputTokens = inputTokens.map<string>((t) => t.id);
        market.rewardTokens = [];
        market.rewardTokenEmissionsAmount = [];
        market.rewardTokenEmissionsUSD = [];
        market.inputTokenBalances = inputTokenBalances;
        market.createdBlockNumber = event.block.number;
        market.createdTimestamp = event.block.timestamp;
        market.name = token.name;
        market.isActive = false;
        market.canBorrowFrom = false;
        market.canUseAsCollateral = false;
        market.maximumLTV = BIGDECIMAL_ZERO;
        market.liquidationPenalty = BIGDECIMAL_ZERO;
        market.liquidationThreshold = BIGDECIMAL_ZERO;
        market.depositRate = BIGDECIMAL_ZERO;
        market.totalValueLockedUSD = BIGDECIMAL_ZERO;
        market.totalVolumeUSD = BIGDECIMAL_ZERO;
    }
    // Update outputToken data each time the market is loaded
    market.outputTokenSupply = getOutputTokenSupply(Address.fromString(market.outputToken));
    market.outputTokenPriceUSD = getAssetPriceInUSDC(token);
    market.save();
    log.info('market save: ' + market.createdBlockNumber.toString(), [])
    return market as Market;
}

export function getOutputTokenSupply(outputTokenAddr: Address): BigInt {
    const aTokenInstance = AToken.bind(outputTokenAddr);
    const tryTokenSupply = aTokenInstance.try_totalSupply();
    log.info('OUTPUT TOKEN ' + outputTokenAddr.toHexString(), [] );
    let outputTokenSupply = BIGINT_ZERO;
    if (!tryTokenSupply.reverted) {
        log.info('OUTTOKEN SUPPLY ' + tryTokenSupply.value.toString(), [] );
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
    log.info('proto id: ' + protocolId, [protocolId])
    if (!lendingProtocol) {
        log.info('CREATING PROTO ENTITY', [''])
        lendingProtocol = new LendingProtocol(protocolId);
        lendingProtocol.totalUniqueUsers = 0;
        lendingProtocol.subgraphVersion = '0.0.1';
        lendingProtocol.schemaVersion = '0.0.1';
        lendingProtocol.name = 'Aave-v2';
        lendingProtocol.slug = 'aave-v2';
        lendingProtocol.network = 'ETHEREUM';
        lendingProtocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
        // Are these options correct?
        lendingProtocol.type = 'LENDING';
        lendingProtocol.lendingType = 'POOLED';
        lendingProtocol.riskType = 'ISOLATED';
        // Initialize empty arrays
        lendingProtocol.save();
    }    
    return lendingProtocol as LendingProtocol;
}


export function getRewardTokenFromIncController(incentiveContAddr: Address, market: Market): string {
    log.info('GET REWARD FROM INCENTIVE CONTROLLER ' + incentiveContAddr.toHexString(), [])
    // Instantiate IncentivesController to get access to contract read methods
    const contract = IncentivesControllerContract.bind(incentiveContAddr);
    // Get the contract Reward Token's address
    const rewardTokenAddr = contract.REWARD_TOKEN().toHexString();
    loadRewardToken(Address.fromString(rewardTokenAddr), market);
    return rewardTokenAddr;
}

export function initIncentivesController(aToken: AToken, market: Market): void {
  log.info('INIT INC CONT MARKET: ' + market.id, [])
    if (!aToken.try_getIncentivesController().reverted) {
        const incContAddr = aToken.try_getIncentivesController().value;
        log.info('INCENTIVE CONTROLLER ' + incContAddr.toHexString(), [])
        IncentivesController.create(aToken.try_getIncentivesController().value);
        const rewardTokenAddr = getRewardTokenFromIncController(incContAddr, market);
        loadRewardToken(Address.fromString(rewardTokenAddr), market);
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
    
    // PERHAPS WILL NEED TO CHANGES THIS TO HANDLE MULTIPLE INPUT TOKENS
    marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
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

export function updateFinancials(
    event: ethereum.Event,
    amount: BigDecimal,
    protocolSideRevenueReceived: BigDecimal,
    feesReceived: BigDecimal
    ): FinancialsDailySnapshot {
    // Update the current date's FinancialDailySnapshot instance
    const financialsDailySnapshot = getFinancialsDailySnapshot(event);
    const protocol = fetchProtocolEntity(financialsDailySnapshot.protocol);
    financialsDailySnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
    log.info('FINANCIAL SNAPSHOT ' + financialsDailySnapshot.id + ' TRANSACTION ' + event.transaction.hash.toHexString() + ' adding amount: ' + amount.toString(), [] )
    financialsDailySnapshot.totalVolumeUSD = financialsDailySnapshot.totalVolumeUSD.plus(amount);
    financialsDailySnapshot.protocolSideRevenueUSD = financialsDailySnapshot.protocolSideRevenueUSD.plus(protocolSideRevenueReceived);
    financialsDailySnapshot.feesUSD = financialsDailySnapshot.feesUSD.plus(feesReceived);
    financialsDailySnapshot.save();
    return financialsDailySnapshot;
}

export function getFinancialsDailySnapshot(event: ethereum.Event): FinancialsDailySnapshot {
    // Load or create the current date's FinancialsDailySnapshot implementation
    const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
    const protocolId = getProtocolIdFromCtx();
    const protocol = fetchProtocolEntity(protocolId);
    let financialsDailySnapshot = FinancialsDailySnapshot.load(daysSinceEpoch);
    if (!financialsDailySnapshot) {
        financialsDailySnapshot = new FinancialsDailySnapshot(daysSinceEpoch);
        financialsDailySnapshot.protocol = protocol.id;
        financialsDailySnapshot.totalVolumeUSD = BIGDECIMAL_ZERO;
        financialsDailySnapshot.supplySideRevenueUSD = BIGDECIMAL_ZERO;
        financialsDailySnapshot.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
        financialsDailySnapshot.feesUSD = BIGDECIMAL_ZERO;
        financialsDailySnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
    }
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
    const lendingProtocol = fetchProtocolEntity('aave-v2');
    return lendingProtocol.protocolPriceOracle;
}

// MATH FUNCTIONS

export function amountInUSD(token: Token, amount: BigInt): BigDecimal {
    // This function takes in a token and the amount of the token and converts the amount of that token into USD
    const amountInDecimals = bigIntToBigDecimal(amount, token.decimals);
    log.info('AMOUNTINUSD AMOUNT IN DECIMALS: ' + amountInDecimals.toString(), [])
    const priceInUSDC = getAssetPriceInUSDC(token);
    const amountUSD = amountInDecimals.times(priceInUSDC);
    log.info(token.id + ' ' + token.name.toUpperCase() + ' AMOUNT ' + amount.toString() + ' AND PRICE??? ' + priceInUSDC.toString() + '---' + amountUSD.toString(), []);
    return amountUSD.truncate(2);
}  

export function rayDivision(a: BigInt, b: BigInt): BigInt {
    let halfB = b.div(BigInt.fromI32(2));
    let result = a.times(BigInt.fromI32(10).pow(27));
  result = result.plus(halfB);
  let division = result.div(b);
  return division;
}

export function rayMultiplication(a: BigInt, b: BigInt): BigInt {
  let result = a.times(b);
  result = result.plus((BigInt.fromI32(10).pow(27)).div(BigInt.fromI32(2)));
  let mult = result.div(BigInt.fromI32(10).pow(27));
  return mult;
}

export function getDaysSinceEpoch(secondsSinceEpoch: number): string {
    return (<i32>Math.floor(secondsSinceEpoch/86400)).toString();
}

export function exponentToBigDecimal(decimals: string, amount: string): BigDecimal {
    // Convert a token amount with decimals
    let amountArr = amount.split(".").join("").split("");
    let insertIdx = <i32>(amountArr.length - parseInt(decimals));
    if (insertIdx < 0) {
      for (insertIdx; insertIdx < 0; insertIdx ++ ) {
        amountArr.unshift("0");
      }
    }
    amountArr[insertIdx] = '.' + amountArr[insertIdx];
    return BigDecimal.fromString(amountArr.join(""))
  }