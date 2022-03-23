import {
    Address,
    BigDecimal,
    BigInt,
    dataSource,
    ethereum,
    log
} from "@graphprotocol/graph-ts";
  
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

const weiPerEth = BigInt.fromI64(1000000000000000000);
export const zeroAddr = "0x0000000000000000000000000000000000000000";
export const contractAddrWETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const contractAddrUSDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

export function initMarket(
    blockNumber: BigInt,
    timestamp: BigInt,
    id: string,
  ): Market {
    // This function either loads or creates the Market entity from a reserve
    log.info('MARKET LOAD: ' + id,[]);
    const token = initToken(Address.fromString(id)) as Token;
    let market = Market.load(id);
    if (market === null) {
        log.info('MARKET CREATION FROM RESERVE ' + id, [])
        // Get the lending pool to get the rerve data for this Market entity
        const lendingPool = getLendingPoolFromCtx();
        const lendingPoolContract = LendingPool.bind(Address.fromString(lendingPool));
        const tryReserve = lendingPoolContract.try_getReserveData(Address.fromString(id));

        // Initialize market fields as zero
        let reserveStableRate = new BigDecimal(BigInt.fromI32(0));
        let reserveVariableRate = new BigDecimal(BigInt.fromI32(0));
        let aTokenAddr = Address.fromString(zeroAddr);
        if (!tryReserve.reverted) {
          // If a valid reserve is returned, add fields from the reserve to the market entity 
          aTokenAddr = tryReserve.value.aTokenAddress;
          reserveStableRate = new BigDecimal(tryReserve.value.currentStableBorrowRate);
          reserveVariableRate = new BigDecimal(tryReserve.value.currentVariableBorrowRate);
        } else {
          log.error('FAILED TO GET RESERVE', [''])
        }
        const aToken = initToken(aTokenAddr);
        // The input token, which would be the token instantiated from the id/address input
        const inputTokens: Token[] = [token];
        // Populate fields with data that has been passed to the function
        // Other data fields are initialized as 0/[]/false
        const inputTokenBalances: BigDecimal[] = [];
        for (let i = 0; i < inputTokens.length; i++) {
            inputTokenBalances.push(new BigDecimal(new BigInt(0)));
        }
        const protocolId = getProtocolIdFromCtx();
        const protocol = fetchProtocolEntity(protocolId);
        market = new Market(id);
        market.protocol = protocol.name;
        market.inputTokens = inputTokens.map<string>((t) => t.id);
        market.outputToken = aToken.id;
        market.rewardTokens = [];
        market.inputTokenBalances = inputTokenBalances;
        market.createdBlockNumber = blockNumber;
        market.createdTimestamp = timestamp;
        market.name = token.name;
        market.isActive = false;
        market.canBorrowFrom = false;
        market.canUseAsCollateral = false;
        market.maximumLTV = new BigDecimal(BigInt.fromI32(0));
        market.liquidationPenalty = new BigDecimal(BigInt.fromI32(0));
        market.liquidationThreshold = new BigDecimal(BigInt.fromI32(0));
        market.depositRate = new BigDecimal(BigInt.fromI32(0));
        market.stableBorrowRate = reserveStableRate;
        market.variableBorrowRate = reserveVariableRate;
        market.totalValueLockedUSD = new BigDecimal(BigInt.fromI32(0));
        market.totalVolumeUSD = new BigDecimal(BigInt.fromI32(0));
        
    }
    // Update outputToken data each time the market is loaded
    market.outputTokenSupply = getOutputTokenSupply(Address.fromString(market.outputToken));
    market.outputTokenPriceUSD = getAssetPriceInUSDC(token);
    market.save();
    log.info('market save: ' + market.createdBlockNumber.toString(), [])
    return market as Market;
  }

export function getOutputTokenSupply(outputTokenAddr: Address): BigDecimal {
    const aTokenInstance = AToken.bind(outputTokenAddr);
    const tryTokenSupply = aTokenInstance.try_scaledTotalSupply();
    log.info('OUTPUT TOKEN ' + aTokenInstance._name + ' ' + outputTokenAddr.toHexString(), [] );
    let outputTokenSupply = new BigDecimal(new BigInt(0));
    if (!tryTokenSupply.reverted) {
        log.info('OUTTOKEN SUPPLY ' + aTokenInstance._name + ' ' + tryTokenSupply.value.toString(), [] );
        outputTokenSupply = new BigDecimal(tryTokenSupply.value);
    } else {
        log.info('OUTPUT TOKEN SUPPLY CALL REVERTED FOR TOKEN ' + aTokenInstance._name + ' ' + aTokenInstance._address.toHexString(), [])
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
export function initRewardToken(assetAddr: Address, market: Market): RewardToken {
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
        // Should these values be hardcoded?
        lendingProtocol.name = 'Aave-v2';
        lendingProtocol.slug = 'aave-v2';
        lendingProtocol.network = 'ETHEREUM';
        // Are these options correct?
        lendingProtocol.type = 'LENDING';
        lendingProtocol.lendingType = 'POOLED';
        lendingProtocol.riskType = 'ISOLATED';
        // Initialize empty arrays
        lendingProtocol.save();
    }    
    return lendingProtocol as LendingProtocol;
}

// SNAPSHOT FUNCTIONS

export function getMarketDailySnapshotId(event: ethereum.Event, market: Market): string {
    const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
    let id = market.id.concat("-").concat(daysSinceEpoch.toString());
    return id;
}

// For the lack of closure support, the recommendation is to loop into a global variable
let rewardEmissionsAmounts: BigDecimal[] = [];
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
              rewardEmissionsAmounts.push(new BigDecimal(new BigInt(0)));
            });
            marketSnapshot.rewardTokenEmissionsAmount = rewardEmissionsAmounts;
            marketSnapshot.rewardTokenEmissionsUSD = rewardEmissionsAmounts;
        } else {
            marketSnapshot.rewardTokenEmissionsAmount = [];
            marketSnapshot.rewardTokenEmissionsUSD = [];
        }
    }
    // Data potentially updated whether the snapshot instance is new or loaded
    // The following fields are pulled from the current Market Entity Implementation's data.
    // As this function is called AFTER a transaction is completed, each snapshot's data will vary from the previous snapshot
    
    // PERHAPS WILL NEED TO CHANGES THIS TO HANDLE MULTIPLE INPUT TOKENS
    marketSnapshot.inputTokenBalances = market.inputTokenBalances[0];
    // Either pass in or call getAssetPriceInUSDC() on the input token from here to get input token price in USD
    marketSnapshot.inputTokenPricesUSD = [getAssetPriceInUSDC(initToken(Address.fromString(market.inputTokens[0])))];
    marketSnapshot.outputTokenSupply = market.outputTokenSupply;
    marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketSnapshot.blockNumber = event.block.number;
    marketSnapshot.timestamp = event.block.timestamp;
    marketSnapshot.depositRate = market.depositRate;
    marketSnapshot.stableBorrowRate = market.stableBorrowRate;
    marketSnapshot.variableBorrowRate = market.variableBorrowRate;
    marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
    marketSnapshot.save();

    return marketSnapshot as MarketDailySnapshot;
}

export function updateMetricsDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
      // Load or create the current date's UsageMetricsDailySnapshot implementation
      const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
      const protocolId = getProtocolIdFromCtx();
      const protocol = fetchProtocolEntity(protocolId);
      let metricsDailySnapshot = UsageMetricsDailySnapshot.load(daysSinceEpoch.toString());
      if (!metricsDailySnapshot) {
          metricsDailySnapshot = new UsageMetricsDailySnapshot(daysSinceEpoch.toString());
          metricsDailySnapshot.protocol = protocol.id;
          // Initialize zero values
          metricsDailySnapshot.activeUsers = 0;
          // NEED SIMILIAR GET MOST RECENT SNAPSHOT FUNCTION TO GET TOTAL CUMULATIVE USERS
          metricsDailySnapshot.totalUniqueUsers = protocol.totalUniqueUsers;
          metricsDailySnapshot.dailyTransactionCount = 0;
          // Push the new day's entity implementation to the protocol array
          protocol.usageMetrics.push(metricsDailySnapshot.id);
      }
        
      const userAddr = event.transaction.from;
      let user = UserAddr.load(userAddr.toHexString());
      if (!user) {
          user = new UserAddr(userAddr.toHexString());
          metricsDailySnapshot.totalUniqueUsers += 1;
          protocol.totalUniqueUsers += 1;
      }
      if (user.mostRecentVisit !== new BigInt(daysSinceEpoch as i32)) {
          user.mostRecentVisit = new BigInt(daysSinceEpoch as i32);
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

function getMostRecentFinancialSnapshot(daysSinceEpoch: number): FinancialsDailySnapshot | null {
    // This function gets the most recent Financial snapshot in order to initialize certain fields that are cummulative
    let mostRecentSnapshot: FinancialsDailySnapshot | null = null;
    for (let i = 0; i < 30; ++i) {
        mostRecentSnapshot = FinancialsDailySnapshot.load((daysSinceEpoch - i).toString()) as FinancialsDailySnapshot;
        if (mostRecentSnapshot) {
            break;
        }
    }
    if (!mostRecentSnapshot) {
        return null;
    }
    return mostRecentSnapshot;
}

export function updateFinancials(
    event: ethereum.Event,
    increaseTVL: bool,
    amount: BigDecimal,
    protocolSideRevenueReceived: BigDecimal,
    feesReceived: BigDecimal
    ): FinancialsDailySnapshot {
    // Update the current date's FinancialDailySnapshot instance
    const financialsDailySnapshot = getFinancialsDailySnapshot(event);
    if (increaseTVL) {
      financialsDailySnapshot.totalValueLockedUSD.plus(amount);
    } else {
      financialsDailySnapshot.totalValueLockedUSD.minus(amount);
    }
    financialsDailySnapshot.totalVolumeUSD.plus(amount);
    financialsDailySnapshot.protocolSideRevenueUSD.plus(protocolSideRevenueReceived);
    financialsDailySnapshot.feesUSD.plus(feesReceived);
    financialsDailySnapshot.save();
    return financialsDailySnapshot;
}

export function getFinancialsDailySnapshot(event: ethereum.Event): FinancialsDailySnapshot {
    // Load or create the current date's FinancialsDailySnapshot implementation
    const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
    const protocolId = getProtocolIdFromCtx();
    const protocol = fetchProtocolEntity(protocolId);
    let financialsDailySnapshot = FinancialsDailySnapshot.load(daysSinceEpoch.toString());
    if (!financialsDailySnapshot) {
        financialsDailySnapshot = new FinancialsDailySnapshot(daysSinceEpoch.toString());
        financialsDailySnapshot.protocol = protocol.id;
        financialsDailySnapshot.totalVolumeUSD = new BigDecimal(new BigInt(0));
        financialsDailySnapshot.supplySideRevenueUSD = new BigDecimal(new BigInt(0));
        financialsDailySnapshot.protocolSideRevenueUSD = new BigDecimal(new BigInt(0));
        financialsDailySnapshot.feesUSD = new BigDecimal(new BigInt(0));
        const recentSnapshot = getMostRecentFinancialSnapshot(daysSinceEpoch);
        if (!recentSnapshot) {
            // Initialize zero values
            financialsDailySnapshot.totalValueLockedUSD = new BigDecimal(new BigInt(0));
        } else {
            financialsDailySnapshot.totalValueLockedUSD = recentSnapshot.totalValueLockedUSD;
        }
        // Push the new day's entity implementation to the protocol array
        protocol.financialMetrics.push(financialsDailySnapshot.id);
        protocol.save();
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
    log.info('getAssetPriceInUSDC ' + token.name + '---' + token.id, [''])
    const tokenAddress = Address.fromString(token.id);
    // Get the oracle contract instance
    const oracle = getPriceOracle();
    log.info('oracle address? in getAssetPriceInUSDC() ' + oracle._address.toHexString(), [''])
    // The Aave protocol oracle contracts only contain a method for getting an asset price in ETH, so USDC price must be fetched to convert asset price from Eth to USDC
    // Get the asset price in Wei and convert it to Eth
    let assetPriceInUSDC: BigDecimal | null = null;
    let tryAssetPriceInEth = oracle.try_getAssetPrice(tokenAddress);
    // Fetch USDC price in Wei and convert it to Eth
    let tryPriceUSDCInEth = oracle.try_getAssetPrice(Address.fromString(contractAddrUSDC));
    if (!tryAssetPriceInEth.reverted && !tryPriceUSDCInEth.reverted) {
        const assetPriceInEth = tryAssetPriceInEth.value;
        const priceUSDCInEth = tryPriceUSDCInEth.value;
        assetPriceInUSDC = new BigDecimal((assetPriceInEth).div(priceUSDCInEth));
        log.info('Asset price of ' + token.name + '-' + token.id + ' = ' + assetPriceInEth.toString() + ' = ' + priceUSDCInEth.toString(), [token.id])

    } else {
        log.info('REVERTED: ASSET? ' + tryAssetPriceInEth.reverted.toString() + ' USDC? ' + tryPriceUSDCInEth.reverted.toString(), ['']);
    }
    // Asset price in Eth/USDC priced in Eth = Asset price in in USDC
    // return price per asset in USDC
    if (!assetPriceInUSDC) {
        log.info('Could not fetch asset price of ' + token.name + '-' + token.id, [token.id]);
        return new BigDecimal(new BigInt(0));
    }
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

export function amountInUSD(token: Token, amount: BigDecimal): BigDecimal {
    // This function takes in a token and the amount of the token and converts the amount of that token into USD
    log.info('HERE IN amountInUSD', []);
    const priceInUSDC = getAssetPriceInUSDC(token);
    const amountUSD = amount.times(priceInUSDC);
    log.info('AMOUNT AND PRICE??? ' + priceInUSDC.toString() + '---' + amountUSD.toString(), []);
    return amountUSD;
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

export function getDaysSinceEpoch(secondsSinceEpoch: number): number {
    return (Math.floor(secondsSinceEpoch/86400));
}