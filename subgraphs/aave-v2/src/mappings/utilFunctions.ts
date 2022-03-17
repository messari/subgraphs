import {
    Address,
    BigDecimal,
    BigInt,
    dataSource,
    ethereum
} from "@graphprotocol/graph-ts";
  
import {
    Token,
    Market,
    RewardToken,
    MarketDailySnapshot,
    LendingProtocol,
    UsageMetricsDailySnapshot,
    FinancialsDailySnapshot
} from "../../generated/schema";

import { IPriceOracleGetter } from "../../generated/templates/LendingPool/IPriceOracleGetter";
  
import { IERC20 } from "../../generated/templates/LendingPool/IERC20";
import { AToken } from "../../generated/templates/AToken/AToken";

const fromWei = new BigInt(1000000000000000000);
export const zeroAddr = "0x0000000000000000000000000000000000000000";
export const contractAddrWETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const contractAddrUSDC = "0xBcca60bB61934080951369a648Fb03DF4F96263C";

export function createMarket(
    event: ethereum.Event,
    id: string,
    inputTokens: Token[],
    outputToken: Token,
    rewardTokens: Token[]
  ): Market {
    // To prevent mistake double creation, check if a Market entity implementation has already been created with the provided lending pool address/id
    let market = Market.load(id);
    if (market === null) {
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
        market.rewardTokens = rewardTokens.map<string>((t) => t.id);
        market.inputTokenBalances = inputTokenBalances;
        market.outputTokenSupply = getOutputTokenSupply(Address.fromString(outputToken.id));
        market.outputTokenPriceUSD = getAssetPriceInUSDC(outputToken);
        market.createdBlockNumber = event.block.number;
        market.createdTimestamp = event.block.timestamp;
        market.snapshots = [];
        market.name = "";
        market.isActive = false;
        market.canBorrowFrom = false;
        market.canUseAsCollateral = false;
        market.maximumLTV = new BigDecimal(BigInt.fromI32(0));
        market.liquidationPenalty = new BigDecimal(BigInt.fromI32(0));
        market.liquidationThreshold = new BigDecimal(BigInt.fromI32(0));
        market.depositRate = new BigDecimal(BigInt.fromI32(0));
        market.stableBorrowRate = new BigDecimal(BigInt.fromI32(0));
        market.variableBorrowRate = new BigDecimal(BigInt.fromI32(0));
        market.totalValueLockedUSD = new BigDecimal(BigInt.fromI32(0));
        market.totalVolumeUSD = new BigDecimal(BigInt.fromI32(0));
        market.deposits = [];
        market.withdraws = [];
        market.borrows = [];
        market.repays = [];
        market.liquidations = [];
        market.save();
        
        protocol.markets.push(market.id);
        protocol.save();
    }
    return market as Market;
  }

export function loadMarket(): Market {
    //Function to load the lending pool and update the entity properties that should be checked each time the Market instance is called or modified
    const marketAddr = getLendingPoolFromCtx();
    const market = Market.load(marketAddr) as Market;
    if (market.outputToken) {
        const outputTokenAddr = Address.fromString(market.outputToken);
        const outputToken = initToken(outputTokenAddr);
        // By default for functions that call this function, update the market output token price in USD
        market.outputTokenSupply = getOutputTokenSupply(outputTokenAddr);
        market.outputTokenPriceUSD = getAssetPriceInUSDC(outputToken);
    }
    market.save();
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
    return asset as RewardToken;
}

export function fetchProtocolEntity(protocolId: string): LendingProtocol {
    // Load or create the Lending Protocol entity implementation
    // Protocol Id is currently 'aave-v2' rather than a UUID. Need to ask what the UUID should be, ie. a hash, just a number, mix of values etc
    let lendingProtocol = LendingProtocol.load(protocolId);
    if (!lendingProtocol) {
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
        lendingProtocol.usageMetrics = [];
        lendingProtocol.financialMetrics = [];
        lendingProtocol.markets = [];
    }    
    return lendingProtocol as LendingProtocol;
}

// SNAPSHOT FUNCTIONS

export function getMarketDailySnapshotId(event: ethereum.Event, market: Market): string {
    const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
    let id = market.id.concat("-").concat(daysSinceEpoch.toString());
    return id;
}

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
        market.snapshots.push(updateId);
        market.save();
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
    marketSnapshot.rewardTokenEmissionsAmount = marketSnapshot.rewardTokenEmissionsAmount || [];
    marketSnapshot.rewardTokenEmissionsUSD = marketSnapshot.rewardTokenEmissionsUSD || [];
    marketSnapshot.save();

    return marketSnapshot as MarketDailySnapshot;
}

export function updateMetricsDailySnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
    // Load or create the current date's UsageMetricsDailySnapshot implementation
    const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
    let metricsDailySnapshot = UsageMetricsDailySnapshot.load(daysSinceEpoch);
    if (!metricsDailySnapshot) {
        metricsDailySnapshot = new UsageMetricsDailySnapshot(daysSinceEpoch);
        const protocolId = getProtocolIdFromCtx();
        const protocol = fetchProtocolEntity(protocolId);
        metricsDailySnapshot.protocol = protocol.id;
        // Initialize zero values
        metricsDailySnapshot.activeUsers = 0;
        metricsDailySnapshot.totalUniqueUsers = 0;
        metricsDailySnapshot.dailyTransactionCount = 0;
        // Push the new day's entity implementation to the protocol array
        protocol.usageMetrics.push(metricsDailySnapshot.id);
        protocol.save();
    }
    metricsDailySnapshot.blockNumber = event.block.number;
    metricsDailySnapshot.timestamp = event.block.timestamp;
    metricsDailySnapshot.save();
    return metricsDailySnapshot as UsageMetricsDailySnapshot;
}

export function updateFinancialsDailySnapshot(event: ethereum.Event): FinancialsDailySnapshot {
    // Load or create the current date's FinancialsDailySnapshot implementation
    const daysSinceEpoch = getDaysSinceEpoch(event.block.timestamp.toI32());
    const protocolId = getProtocolIdFromCtx();
    const protocol = fetchProtocolEntity(protocolId);
    let financialsDailySnapshot = FinancialsDailySnapshot.load(daysSinceEpoch);
    if (!financialsDailySnapshot) {
        financialsDailySnapshot = new FinancialsDailySnapshot(daysSinceEpoch);
        financialsDailySnapshot.protocol = protocol.id;
        // Initialize zero values
        financialsDailySnapshot.totalValueLockedUSD = new BigDecimal(new BigInt(0));
        financialsDailySnapshot.totalVolumeUSD = new BigDecimal(new BigInt(0));
        financialsDailySnapshot.supplySideRevenueUSD = new BigDecimal(new BigInt(0));
        financialsDailySnapshot.protocolSideRevenueUSD = new BigDecimal(new BigInt(0));
        financialsDailySnapshot.feesUSD = new BigDecimal(new BigInt(0));
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
    const priceOracle = dataSource.context().getString("priceOracle");
    return IPriceOracleGetter.bind(Address.fromString(priceOracle));
}

export function getAssetPriceInUSDC(token: Token): BigDecimal {
    const tokenAddress = Address.fromString(token.id);
    // Get the oracle contract instance
    const oracle = getPriceOracle();
    // The Aave protocol oracle contracts only contain a method for getting an asset price in ETH, so USDC price must be fetched to convert asset price from Eth to USDC
    // Get the asset price in Wei and convert it to Eth
    const assetPriceInEth: BigDecimal = new BigDecimal(oracle.getAssetPrice(tokenAddress).times(fromWei));
    // Fetch USDC price in Wei and convert it to Eth
    const priceUSDCInEth: BigDecimal = new BigDecimal(oracle.getAssetPrice(Address.fromString(contractAddrUSDC)).times(fromWei));
    // Asset price in Eth/USDC priced in Eth = Asset price in in USDC
    const assetPriceInUSDC = assetPriceInEth.div(priceUSDCInEth);
    // return price per asset in USDC
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
    // This function takes in a token and the amount of the token and converts the amount of that token in USD
    const priceInUSDC = getAssetPriceInUSDC(token);
    const amountUSD = amount.times(priceInUSDC);
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

export function getDaysSinceEpoch(secondsSinceEpoch: number): string {
    return (Math.floor(secondsSinceEpoch/86400)).toString();
}