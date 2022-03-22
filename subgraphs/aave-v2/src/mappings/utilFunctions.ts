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

const weiPerEth = BigInt.fromI64(1000000000000000000);
export const zeroAddr = "0x0000000000000000000000000000000000000000";
export const contractAddrWETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const contractAddrUSDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
export const priceOracle = "0xa50ba011c48153de246e5192c8f9258a2ba79ca9";

export function createMarket(
    event: ethereum.Event,
    id: string,
    inputTokens: Token[],
    outputToken: Token,
    reserveStableRate: BigDecimal,
    reserveVariableRate: BigDecimal
  ): Market {
    // To prevent mistake double creation, check if a Market entity implementation has already been created with the provided lending pool address/id
    log.info('MARKET LOAD: ' + id,[])
    let market = Market.load(id);
    if (market === null) {
        log.info('MARKETCREATION: ' + id, [])
        // If the market entity has not been created yet, create the instance
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
        market.outputToken = outputToken.id;
        market.rewardTokens = [];
        market.inputTokenBalances = inputTokenBalances;
        market.outputTokenSupply = getOutputTokenSupply(Address.fromString(outputToken.id));
        market.outputTokenPriceUSD = getAssetPriceInUSDC(inputTokens[0]);
        market.createdBlockNumber = event.block.number;
        market.createdTimestamp = event.block.timestamp;
        market.name = "";
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
        market.save();

        log.info('market save: ' + market.createdBlockNumber.toString(), [market.createdBlockNumber.toString()])
    }
    return market as Market;
  }

export function loadMarket(marketAddr: string): Market {
    //Function to load the lending pool and update the entity properties that should be checked each time the Market instance is called or modified
    log.info('LOADMARKET() MarketAddr From Context in utilFunctions.ts ' + marketAddr + '-----TEST:'  , [marketAddr])
    const market = Market.load(marketAddr);
    if (!market) {
        log.info('market has NOT been created ' + marketAddr, [marketAddr]);
    } else {
        log.info('market has been created ' + marketAddr, [marketAddr])
    }
    // let outputTokenAddrStr: string = "";
    // if (market.outputToken) {
    //     outputTokenAddrStr = market.outputToken as string;
    // }
    // if (outputTokenAddrStr) {
    //     const outputTokenAddr = Address.fromString(outputTokenAddrStr);
    //     const outputToken = initToken(outputTokenAddr);
    //     market.outputTokenSupply = getOutputTokenSupply(outputTokenAddr);
    //     market.outputTokenPriceUSD = getAssetPriceInUSDC(outputToken);
    //     market.save();
    // }
    // By default for functions that call this function, update the market output token price in USD
    return market;
}

export function getOutputTokenSupply(outputTokenAddr: Address): BigDecimal {
    const aTokenInstance = AToken.bind(outputTokenAddr);
    const outputTokenSupply = new BigDecimal(aTokenInstance.scaledTotalSupply());
    return outputTokenSupply;
}

export function initToken(assetAddr: Address): Token {
    // In the schema Token and RewardToken entities, the id is said to be " Smart contract address of the market ". 
    // How would this work if there are multiple tokens that make up part of a market? ie a token being an input token and the corresponding aToken being the output token
    // For now, the token id is set as the asset address

    // Check if a token entity implementation has already been created with the provided asset address
    let asset = Token.load(assetAddr.toHex());
    if (asset === null) {
      // Create a new Token implementation
      asset = new Token(assetAddr.toHex());
      // Instantiate the Token with the IERC20 interface in order to access contract read methods
      const tokenInstance = IERC20.bind(assetAddr);
      asset.name = tokenInstance.name();
      asset.symbol = tokenInstance.symbol();
      asset.decimals = tokenInstance.decimals();
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
      asset.name = tokenInstance.name();
      asset.symbol = tokenInstance.symbol();
      asset.decimals = tokenInstance.decimals();
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
        }
        if (rewardTokenList) {
            rewardEmissionsAmounts = [];
            rewardTokenList.forEach((x, i) => {
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
    marketSnapshot.inputTokenBalances = market.inputTokenBalances[0];
    // Either pass in or call getAssetPriceInUSDC() on the input token from here to get input token price in USD
    marketSnapshot.inputTokenPricesUSD = [];
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

function getMostRecentMetricSnapshot(daysSinceEpoch: number): UsageMetricsDailySnapshot | null {
    let mostRecentSnapshot: UsageMetricsDailySnapshot | null = null;
    for (let i = 0; i < 30; ++i) {
        mostRecentSnapshot = UsageMetricsDailySnapshot.load((daysSinceEpoch - i).toString()) as UsageMetricsDailySnapshot;
        if (mostRecentSnapshot) {
            break;
        }
    }
    if (!mostRecentSnapshot) {
        return null;
    }
    return mostRecentSnapshot;
}


export function updateMetricsDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
    // Load or create the current date's UsageMetricsDailySnapshot implementation
    const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
    let metricsDailySnapshot = UsageMetricsDailySnapshot.load(daysSinceEpoch.toString());
    if (!metricsDailySnapshot) {
        metricsDailySnapshot = new UsageMetricsDailySnapshot(daysSinceEpoch.toString());
        const protocolId = getProtocolIdFromCtx();
        const protocol = fetchProtocolEntity(protocolId);
        metricsDailySnapshot.protocol = protocol.id;
        // Initialize zero values
        metricsDailySnapshot.activeUsers = 0;
        // NEED SIMILIAR GET MOST RECENT SNAPSHOT FUNCTION TO GET TOTAL CUMULATIVE USERS
        const recentSnapshot = getMostRecentMetricSnapshot(daysSinceEpoch);
        if (!recentSnapshot) {
            // Initialize zero values
            metricsDailySnapshot.totalUniqueUsers = 0;
        } else {
            metricsDailySnapshot.totalUniqueUsers = metricsDailySnapshot.totalUniqueUsers;
        }
        metricsDailySnapshot.dailyTransactionCount = 0;
        // Push the new day's entity implementation to the protocol array
        protocol.usageMetrics.push(metricsDailySnapshot.id);
        protocol.save();
    }

    const userAddr = event.transaction.from;
    let user = UserAddr.load(userAddr.toHexString());
    if (!user) {
        user = new UserAddr(userAddr.toHexString());
        metricsDailySnapshot.totalUniqueUsers += 1;
    }
    if (user.mostRecentVisit !== new BigInt(daysSinceEpoch as i32)) {
        user.mostRecentVisit = new BigInt(daysSinceEpoch as i32);
        metricsDailySnapshot.activeUsers += 1;
    }
    user.save();
    metricsDailySnapshot.blockNumber = event.block.number;
    metricsDailySnapshot.timestamp = event.block.timestamp;
    metricsDailySnapshot.save();
    return metricsDailySnapshot as UsageMetricsDailySnapshot;
}

function getMostRecentFinancialSnapshot(daysSinceEpoch: number): FinancialsDailySnapshot | null {
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


// This function needs to be updated once pulling financial data from oracles
// Function will be revised later to either calculate data to update within this function, or have it passed in as arguments from call location
export function updateFinancials(
    event: ethereum.Event,
    increaseTVL: bool,
    amount: BigDecimal,
    protocolSideRevenueReceived: BigDecimal,
    feesReceived: BigDecimal
    ): FinancialsDailySnapshot {
    // Update the current date's FinancialDailySnapshot instance
    const financialsDailySnapshot = getFinancialsDailySnapshot(event);
    // NEED TO CALCULATE THESE AND PASS THEM AS ARGS TO THIS FUNCTION
    // STILL NEED TO FIGURE OUT HOW SOME OF THESE ARE CALCULATED/PULLED, SEE NOTES
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
        log.info('Could not fetch asset price of ' + token.name + '-' + token.id, [token.id])
        return new BigDecimal(new BigInt(0));
    }
    return assetPriceInUSDC;
}

// CONTEXT FUNCTIONS

export function getLendingPoolFromCtx(): string {
    // Get the lending pool/market address with context
    // Need to verify that context is available here, not just the lendingPoolConfigurator.ts script
    let context = dataSource.context();
    return context.getString("lendingPool");
}

export function getProtocolIdFromCtx(): string {
    // Get the protocol id with context
    // Need to verify that context is available here, not just the lendingPoolConfigurator.ts script
    let context = dataSource.context();
    return context.getString("protocolId");
}

// MATH FUNCTIONS

export function amountInUSD(token: Token, amount: BigDecimal): BigDecimal {
    // This function takes in a token and the amount of the token and converts the amount of that token into USD
    log.info('HERE IN amountInUSD', [])
    const priceInUSDC = getAssetPriceInUSDC(token);
    const amountUSD = amount.times(priceInUSDC);
    log.info('AMOUNT AND PRICE??? ' + priceInUSDC.toString() + '---' + amountUSD.toString(), [])
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