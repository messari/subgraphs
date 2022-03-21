import {
    Address,
    BigInt,
    BigDecimal,
    log
} from '@graphprotocol/graph-ts'

import { GeistToken as TokenContract } from "../../generated/GeistToken/GeistToken"

import { 
    Token as TokenEntity, 
    RewardToken as RewardTokenEntity, 
    UsageMetricsDailySnapshot as UsageMetricsDailySnapshotEntity, 
    UniqueUsers as UniqueUsersEntity,
    FinancialsDailySnapshot as FinancialsDailySnapshotEntity,
} from "../../generated/schema"

import { 
    ZERO_BD,
    SECONDS_PER_DAY
} from "../common/constants";

import {
    TOKEN_NAME_GEIST, 
    TOKEN_DECIMALS_GEIST, 
    REWARD_TOKEN_NAME, 
    REWARD_TOKEN_DECIMALS, 
    REWARD_TOKEN_SYMBOL,
} from "../common/addresses"

import { 
    PRICE_ORACLE,
    TOKEN_ADDRESS_GEIST,
    TOKEN_ADDRESS_gFTM,
    TOKEN_ADDRESS_gCRV,
    TOKEN_ADDRESS_gDAI,
    TOKEN_ADDRESS_gETH,
    TOKEN_ADDRESS_gMIM,
    TOKEN_ADDRESS_gLINK,
    TOKEN_ADDRESS_gUSDC,
    TOKEN_ADDRESS_gWBTC,
    TOKEN_ADDRESS_gfUSDT,
    TOKEN_ADDRESS_DAI,
    TOKEN_ADDRESS_WFTM,
    TOKEN_ADDRESS_CRV,
    TOKEN_ADDRESS_ETH,
    TOKEN_ADDRESS_MIM,
    TOKEN_ADDRESS_LINK,
    TOKEN_ADDRESS_USDC,
    TOKEN_ADDRESS_BTC,
    TOKEN_ADDRESS_fUSDT,
    GEIST_FTM_LP_ADDRESS
} from "../common/addresses"


import { 
    AaveOracle,
    OwnershipTransferred
} from "../../generated/AaveOracle/AaveOracle"

import { 
    SpookySwapGEISTFTM,
    Transfer
} from "../../generated/SpookySwapGEISTFTM/SpookySwapGEISTFTM"


export function initializeToken(address: Address): TokenEntity {
    let token = TokenEntity.load(address.toHexString());

    if (token) {
        return token;
    }

    token = new TokenEntity(address.toHexString());

    // Replace GeistToken contract with default ERC20?
    let tokenContract = TokenContract.bind(address);

    token.id = address.toHexString();
    token.decimals = tokenContract.try_decimals().reverted ? 
                     TOKEN_DECIMALS_GEIST: tokenContract.try_decimals().value.toI32();
    token.name = tokenContract.try_name().reverted ? 
                 TOKEN_NAME_GEIST: tokenContract.try_name().value.toString();
    token.symbol = tokenContract.try_name().reverted ? 
                   TOKEN_NAME_GEIST: tokenContract.try_name().value.toString();
    token.save();
    return token;
}

export function initializeRewardToken(address: Address, rewardType: string): RewardTokenEntity {
    let rewardToken = RewardTokenEntity.load(address.toHexString());
       
    if (rewardToken) {
        return rewardToken;
    }

    rewardToken = new RewardTokenEntity(address.toHexString());

    let tokenContract = TokenContract.bind(address);
    rewardToken.id = address.toHexString();
    rewardToken.decimals = tokenContract.try_decimals().reverted ? 
                           REWARD_TOKEN_DECIMALS: tokenContract.try_decimals().value.toI32();
    rewardToken.name = tokenContract.try_name().reverted ? 
                       REWARD_TOKEN_NAME: tokenContract.try_name().value.toString();
    rewardToken.symbol = tokenContract.try_symbol().reverted ? 
                         REWARD_TOKEN_SYMBOL: tokenContract.try_symbol().value.toString();
    rewardToken.type = rewardType;
    rewardToken.save();
    return rewardToken;
}

export function getUsageMetrics(
    block_number: BigInt, 
    timestamp: BigInt, 
    from: Address
    ): UsageMetricsDailySnapshotEntity {
    // Number of days since Unix epoch
    // Note: This is an unsafe cast to int, this should be handled better, 
    // perhaps some additional rounding logic
    let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
  
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
    usageMetrics.protocol = TOKEN_NAME_GEIST;
    usageMetrics.dailyTransactionCount += 1
    usageMetrics.blockNumber = block_number;
    usageMetrics.timestamp = timestamp;
  
    userExists.save();

    return usageMetrics;
  }

  export function getTokenAmountUSD(tokenAddress: Address, tokenAmount: BigInt): BigDecimal {
    let tokenPrice = getTokenPrice(tokenAddress);
    let tokenAmountUSDBD = tokenPrice.times(tokenAmount).toBigDecimal();
    return tokenAmountUSDBD
  }

  export function getFinancialSnapshot(
      timestamp: BigInt,
      tokenAmount: BigInt,
      tokenAddress: Address,
      isValueLocked: bool,
      isIncreasingValueLocked: bool,
      isSupplySideRevenue: bool,
      isProtocolSideRevenue: bool
  ): FinancialsDailySnapshotEntity {

    let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;

    // Refresh id daily, historical snapshots can be accessed by using the id
    let financialsDailySnapshot = FinancialsDailySnapshotEntity.load(id.toString())
  
    // Initialize all daily snapshot values
    if (!financialsDailySnapshot) {
      financialsDailySnapshot =  new FinancialsDailySnapshotEntity(id.toString());
      financialsDailySnapshot.id = id.toString();
      financialsDailySnapshot.totalValueLockedUSD = ZERO_BD;
      financialsDailySnapshot.totalVolumeUSD = ZERO_BD;
      financialsDailySnapshot.supplySideRevenueUSD = ZERO_BD;
      financialsDailySnapshot.protocolSideRevenueUSD = ZERO_BD;
      financialsDailySnapshot.feesUSD = ZERO_BD;
    }

    let tokenAmountUSD = getTokenAmountUSD(tokenAddress, tokenAmount)

    // Add value locked for operations like depositing
    if (isValueLocked && isIncreasingValueLocked) {
        financialsDailySnapshot.totalValueLockedUSD.plus(tokenAmountUSD);
    }
    // Subtract value locked for operations like withdrawing
    else if (isValueLocked && !isIncreasingValueLocked) {
        financialsDailySnapshot.totalValueLockedUSD.minus(tokenAmountUSD);
    }
    // Add protocol revenue for fees
    if (isProtocolSideRevenue) {
        financialsDailySnapshot.protocolSideRevenueUSD.plus(tokenAmountUSD);
    }
    // Add supply side revenue for rewards
    if (isSupplySideRevenue) {
        financialsDailySnapshot.supplySideRevenueUSD.plus(tokenAmountUSD);
    }
    financialsDailySnapshot.totalVolumeUSD.plus(tokenAmountUSD);
    financialsDailySnapshot.timestamp = timestamp;

    return financialsDailySnapshot;
  }

  export function getTokenPrice(tokenAddress: Address) : BigInt {
    /* 
        The price oracle only supports a limited number of tokens
        So map the gTokens to the underlying asset for price
        eg. gUSDC -> USDC, gDAI -> DAI etc.
    */

    log.warning('Getting price for {}', [tokenAddress.toHexString()])

    let priceOracle = AaveOracle.bind(PRICE_ORACLE);

    if ((tokenAddress == TOKEN_ADDRESS_gfUSDT) || (tokenAddress == TOKEN_ADDRESS_fUSDT)) {
        return priceOracle.getAssetPrice(TOKEN_ADDRESS_fUSDT);
    }
    else if ((tokenAddress == TOKEN_ADDRESS_gUSDC) || (tokenAddress == TOKEN_ADDRESS_USDC)) {
        return priceOracle.getAssetPrice(TOKEN_ADDRESS_USDC);
    }
    else if ((tokenAddress == TOKEN_ADDRESS_gDAI) || (tokenAddress == TOKEN_ADDRESS_DAI)) {
        return priceOracle.getAssetPrice(TOKEN_ADDRESS_DAI);
    }
    else if ((tokenAddress == TOKEN_ADDRESS_gMIM) || (tokenAddress == TOKEN_ADDRESS_MIM)) {    
        return priceOracle.getAssetPrice(TOKEN_ADDRESS_MIM);
    }
    else if (tokenAddress == TOKEN_ADDRESS_GEIST) {
        /* 
            For the GEIST token, the price is derived from the
            ratio of FTM-GEIST reserves on Spookyswap multiplied by
            the price of WFTM from the oracle
        */
        let geistFtmLP = SpookySwapGEISTFTM.bind(GEIST_FTM_LP_ADDRESS);

        let reserveFTM = geistFtmLP.getReserves().value0;
        let reserveGEIST = geistFtmLP.getReserves().value1;

        let priceGEISTinFTM = reserveFTM.div(reserveGEIST);

        let priceFTMinUSD = priceOracle.getAssetPrice(TOKEN_ADDRESS_WFTM);        
        return priceGEISTinFTM.times(priceFTMinUSD)
    }
    else if ((tokenAddress == TOKEN_ADDRESS_gWBTC) || (tokenAddress == TOKEN_ADDRESS_BTC)) {
        return priceOracle.getAssetPrice(TOKEN_ADDRESS_BTC);
    }
    else if ((tokenAddress == TOKEN_ADDRESS_gLINK) || (tokenAddress == TOKEN_ADDRESS_LINK)) {
        return priceOracle.getAssetPrice(TOKEN_ADDRESS_LINK);
    }
    else if ((tokenAddress == TOKEN_ADDRESS_gCRV) || (tokenAddress == TOKEN_ADDRESS_CRV)) {
        return priceOracle.getAssetPrice(TOKEN_ADDRESS_CRV);
    }
    else if ((tokenAddress == TOKEN_ADDRESS_gETH) || (tokenAddress == TOKEN_ADDRESS_ETH)) {
        return priceOracle.getAssetPrice(TOKEN_ADDRESS_ETH);
    }
    else if ((tokenAddress == TOKEN_ADDRESS_gFTM) || (tokenAddress == TOKEN_ADDRESS_WFTM)) {
        return priceOracle.getAssetPrice(TOKEN_ADDRESS_WFTM);
    }
    else {
        return BigInt.fromI32(0);
    }
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
    // Placeholder
}

export function handleTransfer(event: Transfer): void {
    // Placeholder
}
