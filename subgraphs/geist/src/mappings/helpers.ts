import {
    Address,
    BigInt,
    BigDecimal,
    log,
} from '@graphprotocol/graph-ts'

import { 
    GeistToken as TokenContract,
  } from "../../generated/templates/LendingPool/GeistToken"

import {
    LendingPool
} from "../../generated/templates/LendingPool/LendingPool"

import { 
    Market as MarketEntity,
    Token as TokenEntity, 
    RewardToken as RewardTokenEntity, 
    LendingProtocol as LendingProtocolEntity,
    UsageMetricsDailySnapshot as UsageMetricsDailySnapshotEntity, 
    UniqueUsers as UniqueUsersEntity,
    FinancialsDailySnapshot as FinancialsDailySnapshotEntity,
} from "../../generated/schema"

import { 
    AaveOracle,
    OwnershipTransferred
} from "../../generated/templates/MultiFeeDistribution/AaveOracle"

import { 
    SpookySwapGEISTFTM,
    Transfer
} from "../../generated/templates/MultiFeeDistribution/SpookySwapGEISTFTM"

import { 
    convertBigIntToBigDecimal,
    bigIntToPercentage,
    getDaysSinceUnixEpoch,
    convertRayToWad
} from "../common/utils"

import * as constants from "../common/constants"
import * as addresses from "../common/addresses"


export function getOrInitializeToken(address: Address): TokenEntity {
    let token = TokenEntity.load(address.toHexString());

    if (token) {
        return token;
    }

    token = new TokenEntity(address.toHexString());

    // Replace GeistToken contract with default ERC20?
    let tokenContract = TokenContract.bind(address);

    token.id = address.toHexString();
    token.decimals = tokenContract.try_decimals().reverted ? 
                     addresses.TOKEN_DECIMALS_GEIST: tokenContract.try_decimals().value.toI32();
    token.name = tokenContract.try_name().reverted ? 
                 addresses.TOKEN_NAME_GEIST: tokenContract.try_name().value.toString();
    token.symbol = tokenContract.try_name().reverted ? 
                   addresses.TOKEN_NAME_GEIST: tokenContract.try_name().value.toString();
    token.save();
    return token;
}

export function getOrInitializeRewardToken(address: Address, rewardType: string): RewardTokenEntity {
    let rewardToken = RewardTokenEntity.load(address.toHexString());
       
    if (rewardToken) {
        return rewardToken;
    }

    rewardToken = new RewardTokenEntity(address.toHexString());

    let tokenContract = TokenContract.bind(address);
    rewardToken.id = address.toHexString();
    rewardToken.decimals = tokenContract.try_decimals().reverted ? 
                           addresses.REWARD_TOKEN_DECIMALS: tokenContract.try_decimals().value.toI32();
    rewardToken.name = tokenContract.try_name().reverted ? 
                       addresses.REWARD_TOKEN_NAME: tokenContract.try_name().value.toString();
    rewardToken.symbol = tokenContract.try_symbol().reverted ? 
                         addresses.REWARD_TOKEN_SYMBOL: tokenContract.try_symbol().value.toString();
    rewardToken.type = rewardType;
    rewardToken.save();
    return rewardToken;
}

export function getLendingProtocol(id: string): LendingProtocolEntity {
    let protocol = LendingProtocolEntity.load(id)
    if (!protocol) {
      protocol = new LendingProtocolEntity(id)
      protocol.name = "Geist Finance"
      protocol.slug = "geist-finance"
      protocol.network = constants.NETWORK_FANTOM
      protocol.type = constants.PROTOCOL_TYPE_LENDING
      protocol.lendingType = constants.LENDING_TYPE_POOLED
      protocol.riskType = constants.RISK_TYPE_GLOBAL
      protocol.version = "1.0.0"
    }
    return protocol
  }
  
export function updateOrInitializeUsageMetrics(
    block_number: BigInt, 
    timestamp: BigInt, 
    from: Address
    ): UsageMetricsDailySnapshotEntity {
    // Number of days since Unix epoch
    // Note: This is an unsafe cast to int, this should be handled better, 
    // perhaps some additional rounding logic
    let id: i64 = getDaysSinceUnixEpoch(timestamp);
  
    // Check if the id (i.e. the day) exists in the store
    let usageMetrics = UsageMetricsDailySnapshotEntity.load(id.toString());
  
    // If the id does not exist, create it and reset values
    if (!usageMetrics) {
      usageMetrics = new UsageMetricsDailySnapshotEntity(id.toString());
      usageMetrics.id = id.toString();
      usageMetrics.activeUsers = 0;
      usageMetrics.totalUniqueUsers = 0;
      usageMetrics.dailyTransactionCount = 0;
    }
  
    // Combine the id and the user address to generate a unique user id for the day
    let userId: string = id.toString() + from.toHexString()
    let userExists = UniqueUsersEntity.load(userId);
  
    // If the user id does not already exist in the store, add to unique users
    if (!userExists) {
      userExists = new UniqueUsersEntity(userId);
      userExists.id = userId;

      usageMetrics.activeUsers += 1;
      usageMetrics.totalUniqueUsers += 1;
    }
  
    // The protocol is defined in the schema as type Protocol!
    // But doesnt this create a circular dependency?
    // Protocol depends on usageMetrics, and usageMetrics depends on Protocol
    usageMetrics.protocol = constants.PROTOCOL_ID;
    usageMetrics.dailyTransactionCount += 1
    usageMetrics.blockNumber = block_number;
    usageMetrics.timestamp = timestamp;
  
    userExists.save();

    log.warning(
        "Adding to UsageMetricsDailySnapshot with ID={}. activeUsers={}, totalUniqueUsers={}, dailyTransactionCount={}", 
        [
            usageMetrics.id,
            usageMetrics.activeUsers.toString(),
            usageMetrics.totalUniqueUsers.toString(),
            usageMetrics.dailyTransactionCount.toString(),
        ]
    );

    return usageMetrics;
  }

  export function getTokenAmountUSD(tokenAddress: Address, tokenAmount: BigInt, fee: bool = false): BigDecimal {
    /* 
        Get the price of the token from the oracle as a BigInt with 18 decimals. 
        Convert token price to BigDecimal using 18 decimals.
        Convert token amount to BigDecimal using the contract decimals.
        Multiply them, then truncate to 2 decimals places to get price in USD.

        eg. for a gETH transaction
        tokenPrice = 3007540000000000000000
        tokenAmount = 3361871152102563403
        tokenAmountUSD = (token_price / 1e18) * (token_amount / 1e18) = 10110.961964794544
        tokenAmountUSD.truncate(2) = 10110.96
    */
    let tokenPrice = getTokenPrice(tokenAddress);
    let tokenContract = TokenContract.bind(tokenAddress)
    let tokenAmountBD = convertBigIntToBigDecimal(tokenAmount, tokenContract.decimals());
    let tokenPriceBD = convertBigIntToBigDecimal(tokenPrice, BigInt.fromI32(18));
    let tokenAmountUSD = tokenAmountBD.times(tokenPriceBD).truncate(2);
    if (fee) {
        log.warning(
            "{} {} (${}) fee transferred", 
            [tokenAmountBD.truncate(2).toString(), tokenContract.symbol(), tokenAmountUSD.toString()]);    
    }
    else {
        log.warning(
            "{} {} (${}) transferred", 
            [tokenAmountBD.truncate(2).toString(), tokenContract.symbol(), tokenAmountUSD.toString()]);
    }
    return tokenAmountUSD
  }

  export function updateOrInitializeFinancialSnapshot(
      timestamp: BigInt,
      tokenAmountUSD: BigDecimal,
      transactionFee: BigInt,
      rate: BigInt,
      interactionType: string,
  ): FinancialsDailySnapshotEntity {

    let id: i64 = getDaysSinceUnixEpoch(timestamp);

    // Refresh id daily, historical snapshots can be accessed by using the id
    let financialsDailySnapshot = FinancialsDailySnapshotEntity.load(id.toString())
  
    // Initialize all daily snapshot values
    if (!financialsDailySnapshot) {
      log.warning("Initializing financialsDailySnapshot with ID={}", [id.toString()]);
      financialsDailySnapshot =  new FinancialsDailySnapshotEntity(id.toString());
      financialsDailySnapshot.id = id.toString();
      financialsDailySnapshot.totalValueLockedUSD = constants.ZERO_BD;
      financialsDailySnapshot.totalVolumeUSD = constants.ZERO_BD;
      financialsDailySnapshot.supplySideRevenueUSD = constants.ZERO_BD;
      financialsDailySnapshot.protocolSideRevenueUSD = constants.ZERO_BD;
      financialsDailySnapshot.feesUSD = constants.ZERO_BD;
    }

    if (interactionType == constants.DEPOSIT_INTERACTION) {
        // Add value locked for operations like depositing
        financialsDailySnapshot.totalValueLockedUSD = financialsDailySnapshot.totalValueLockedUSD.plus(
            tokenAmountUSD);
    }
    else if (interactionType == constants.BORROW_INTERACTION) {
        // Add value locked for operations like borrow (temporary for testing)
        financialsDailySnapshot.totalValueLockedUSD = financialsDailySnapshot.totalValueLockedUSD.plus(
            tokenAmountUSD);
        let protocolSideRevenueUSD = bigIntToPercentage(rate).times(tokenAmountUSD);
        financialsDailySnapshot.protocolSideRevenueUSD = financialsDailySnapshot.protocolSideRevenueUSD.plus(
            protocolSideRevenueUSD);
    }
    else if (interactionType == constants.WITHDRAW_INTERACTION) {
        // Subtract value locked for operations like withdrawing
        financialsDailySnapshot.totalValueLockedUSD = financialsDailySnapshot.totalValueLockedUSD.minus(
            tokenAmountUSD);
    }
    else if (interactionType == constants.REWARD_INTERACTION) {
        // Add supply revenue for rewards
        financialsDailySnapshot.supplySideRevenueUSD = financialsDailySnapshot.supplySideRevenueUSD.plus(
            tokenAmountUSD);
    }
    else if (interactionType == constants.REPAY_INTERACTION) {
        // Add supply revenue for rewards
        financialsDailySnapshot.totalValueLockedUSD = financialsDailySnapshot.totalValueLockedUSD.minus(
            tokenAmountUSD);
    }
    else if (interactionType == constants.STAKE_INTERACTION) {
        financialsDailySnapshot.totalValueLockedUSD = financialsDailySnapshot.totalValueLockedUSD.plus(
            tokenAmountUSD);
    }
    else if (interactionType == constants.UNSTAKE_INTERACTION) {
        financialsDailySnapshot.totalValueLockedUSD = financialsDailySnapshot.totalValueLockedUSD.minus(
            tokenAmountUSD);
    }
    else if (interactionType == constants.LIQUIDATION_INTERACTION) {
        financialsDailySnapshot.totalValueLockedUSD = financialsDailySnapshot.totalValueLockedUSD.minus(
            tokenAmountUSD);
    }
    else {
        log.error("Invalid interaction type {}", [interactionType])
    }

    // Volume is counted for all interactions
    financialsDailySnapshot.totalVolumeUSD = financialsDailySnapshot.totalVolumeUSD.plus(tokenAmountUSD)
    financialsDailySnapshot.feesUSD = financialsDailySnapshot.feesUSD.plus(
        getTokenAmountUSD(addresses.TOKEN_ADDRESS_WFTM, transactionFee, true))
    financialsDailySnapshot.timestamp = timestamp;

    log.warning(
        "Adding to FinancialsDailySnapshot with ID={}. InteractionType={} (${}). totalValueLockedUSD={}, " + 
        "totalVolumeUSD={}, supplySideRevenueUSD={}, protocolSideRevenueUSD={}, feesUSD={}", 
        [
            financialsDailySnapshot.id, 
            interactionType,
            tokenAmountUSD.toString(),
            financialsDailySnapshot.totalValueLockedUSD.toString(), 
            financialsDailySnapshot.totalVolumeUSD.toString(), 
            financialsDailySnapshot.supplySideRevenueUSD.toString(),
            financialsDailySnapshot.protocolSideRevenueUSD.toString(),
            financialsDailySnapshot.feesUSD.toString()
        ]
    )

    return financialsDailySnapshot;
  }

  export function getTokenPrice(tokenAddress: Address) : BigInt {
    /* 
        The price oracle only supports a limited number of tokens
        So map the gTokens to the underlying asset for price
        eg. gUSDC -> USDC, gDAI -> DAI etc.
    */

    let priceOracle = AaveOracle.bind(addresses.PRICE_ORACLE);

    if ((tokenAddress == addresses.TOKEN_ADDRESS_gfUSDT) || (tokenAddress == addresses.TOKEN_ADDRESS_fUSDT)) {
        return priceOracle.getAssetPrice(addresses.TOKEN_ADDRESS_fUSDT);
    }
    else if ((tokenAddress == addresses.TOKEN_ADDRESS_gUSDC) || (tokenAddress == addresses.TOKEN_ADDRESS_USDC)) {
        return priceOracle.getAssetPrice(addresses.TOKEN_ADDRESS_USDC);
    }
    else if ((tokenAddress == addresses.TOKEN_ADDRESS_gDAI) || (tokenAddress == addresses.TOKEN_ADDRESS_DAI)) {
        return priceOracle.getAssetPrice(addresses.TOKEN_ADDRESS_DAI);
    }
    else if ((tokenAddress == addresses.TOKEN_ADDRESS_gMIM) || (tokenAddress == addresses.TOKEN_ADDRESS_MIM)) {    
        return priceOracle.getAssetPrice(addresses.TOKEN_ADDRESS_MIM);
    }
    else if (tokenAddress == addresses.TOKEN_ADDRESS_GEIST) {
        /* 
            For the GEIST token, the price is derived from the
            ratio of FTM-GEIST reserves on SpookySwap multiplied by
            the price of WFTM from the oracle
        */
        let geistFtmLP = SpookySwapGEISTFTM.bind(addresses.GEIST_FTM_LP_ADDRESS);

        let reserves = geistFtmLP.try_getReserves();
        
        if (reserves.reverted) {
            log.error("Unable to get reserves for GEIST-FTM", [])
            return BigInt.fromI32(0)
        }
        let reserveFTM = reserves.value.value0;
        let reserveGEIST = reserves.value.value1;

        let priceGEISTinFTM = reserveFTM.div(reserveGEIST);
        let priceFTMinUSD = priceOracle.getAssetPrice(addresses.TOKEN_ADDRESS_WFTM);
        let priceGEISTinUSD = priceGEISTinFTM.times(priceFTMinUSD)
        log.warning(
            "SpookySwap LP: reserveFTM={}, reserveGEIST={}, priceGEISTinFTM={}, priceFTMinUSD={}, priceGEISTinUSD={}", 
            [
                reserveFTM.toString(), 
                reserveGEIST.toString(),
                priceGEISTinFTM.toString(),
                priceFTMinUSD.toString(),
                priceGEISTinUSD.toString()
            ]
        )
        return priceGEISTinUSD
    }
    else if ((tokenAddress == addresses.TOKEN_ADDRESS_gWBTC) || (tokenAddress == addresses.TOKEN_ADDRESS_BTC)) {
        return priceOracle.getAssetPrice(addresses.TOKEN_ADDRESS_BTC);
    }
    else if ((tokenAddress == addresses.TOKEN_ADDRESS_gLINK) || (tokenAddress == addresses.TOKEN_ADDRESS_LINK)) {
        return priceOracle.getAssetPrice(addresses.TOKEN_ADDRESS_LINK);
    }
    else if ((tokenAddress == addresses.TOKEN_ADDRESS_gCRV) || (tokenAddress == addresses.TOKEN_ADDRESS_CRV)) {
        return priceOracle.getAssetPrice(addresses.TOKEN_ADDRESS_CRV);
    }
    else if ((tokenAddress == addresses.TOKEN_ADDRESS_gETH) || (tokenAddress == addresses.TOKEN_ADDRESS_ETH)) {
        return priceOracle.getAssetPrice(addresses.TOKEN_ADDRESS_ETH);
    }
    else if ((tokenAddress == addresses.TOKEN_ADDRESS_gFTM) || (tokenAddress == addresses.TOKEN_ADDRESS_WFTM)) {
        return priceOracle.getAssetPrice(addresses.TOKEN_ADDRESS_WFTM);
    }
    else {
        log.error("Invalid token address {}, cannot get price from oracle", [tokenAddress.toHexString()])
        return BigInt.fromI32(0);
    }
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
    // Placeholder
}

export function handleTransfer(event: Transfer): void {
    // Placeholder
}

export function getOrInitializeMarket(
    id: string, protocolName: string, blockNumber: BigInt, timestamp: BigInt): MarketEntity {
    /* Create a new Market and initialize its arguments */
    let market = MarketEntity.load(id);

    if (!market) {
        market = new MarketEntity(id);

        let lendingPoolContract = LendingPool.bind(Address.fromString(id));
        let token = getOrInitializeToken(Address.fromString(id));
        let inputTokens: string[] = [token.id];

        let rewardToken = getOrInitializeRewardToken(Address.fromString(id), constants.REWARD_TYPE_DEPOSIT);
        let rewardTokens: string[] = [rewardToken.id];

        let rewardTokenEmissionsAmount: BigInt[] = [];
        let rewardTokenEmissionsUSD: BigDecimal[] = [];

        let inputTokenBalances: BigInt[] = [];
        for (let i = 0; i < inputTokens.length; i++) {
            inputTokenBalances.push(constants.ZERO_BI);
        };

        market.protocol = protocolName;
        market.inputTokens = inputTokens;
        market.outputToken = constants.ZERO_ADDRESS.toHexString();
        market.rewardTokens = rewardTokens;
        market.totalValueLockedUSD = constants.ZERO_BD;
        market.totalVolumeUSD = constants.ZERO_BD;
        market.inputTokenBalances = inputTokenBalances;
        market.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
        market.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
        market.createdTimestamp = timestamp;
        market.createdBlockNumber = blockNumber;
        market.outputTokenSupply = constants.ZERO_BI;
        market.outputTokenPriceUSD = constants.ZERO_BD;

        market.name = token.name;
        market.isActive = false;
        market.canUseAsCollateral = false;
        market.canBorrowFrom = false;
        market.maximumLTV = constants.ZERO_BD;
        market.liquidationThreshold = constants.ZERO_BD;
        market.liquidationPenalty = constants.ZERO_BD;
        market.depositRate = constants.ZERO_BD;
        market.stableBorrowRate = constants.ZERO_BD;
        market.variableBorrowRate = constants.ZERO_BD;

        let reserves = lendingPoolContract.try_getReserveData(Address.fromString(id));
        if (reserves.reverted) {
            log.error("Unable to set market stableBorrowRate and variableBorrowRate, setting to zero", []);
            market.stableBorrowRate = constants.ZERO_BD;
            market.variableBorrowRate = constants.ZERO_BD;
        }
        else {
            market.stableBorrowRate = convertBigIntToBigDecimal(
                convertRayToWad(reserves.value.currentStableBorrowRate));
            market.variableBorrowRate = convertBigIntToBigDecimal(
                convertRayToWad(reserves.value.currentVariableBorrowRate));
        }

        log.warning(
            "Created MarketEntity with ID={}. protocol={}, totalValueLockedUSD={}, totalVolumeUSD={}, \
            inputTokenBalances={}, outputTokenSupply={}, canUseAsCollateral={}, canBorrowFrom={}, maximumLTV={}", 
            [
                id,
                market.protocol,
                market.totalValueLockedUSD.toString(),
                market.totalVolumeUSD.toString(),
                market.inputTokenBalances.toString(),
                market.outputTokenSupply.toString(),
                market.canUseAsCollateral.toString(),
                market.canBorrowFrom.toString(),
                market.maximumLTV.toString(),

            ]
        )
    }

    market.save();
    return market;
}
