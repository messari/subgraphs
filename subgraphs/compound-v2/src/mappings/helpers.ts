// helper functions for ./mappings.ts

import { 
    Token,
    LendingProtocol,
    Market,
    RewardToken
} from "../types/schema"

import { 
    COMPTROLLER_ADDRESS,
    PRICE_ORACLE1_ADDRESS,
    USDC_ADDRESS,
    MARKETS,
    MarketMapping,
    CTOKEN_LIST,
    ADDRESS_ZERO,
    CCOMP_ADDRESS,
    COMP_ADDRESS
 } from "../common/addresses"

import {
    NETWORK_ETHEREUM,
    PROTOCOL_NAME,
    PROTOCOL_SLUG,
    USDC_DECIMALS,
    PROTOCOL_VERSION,
    PROTOCOL_RISK_TYPE,
    COMPOUND_DECIMALS,
    ZERO_BD,
    ZERO_BI,
    REWARD_TOKEN_TYPE,
    PROTOCOL_TYPE,
    LENDING_TYPE
} from "../common/constants"

import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { PriceOracle2 } from "../types/Comptroller/PriceOracle2"
import { PriceOracle1 } from "../types/Comptroller/PriceOracle1"

// TODO: helper for converting uni time to days

// grab Market from MARKETS by cToken
export function getMarketMapping(cToken: string): MarketMapping {
    for (let index = 0; index < CTOKEN_LIST.length; index++) {
        if (CTOKEN_LIST[index].toHexString() == cToken) {
            return MARKETS[index]
        }
    }
    return new MarketMapping(
        "Error in getMarketMapping()",
        "",
        ADDRESS_ZERO,
        "Error in getMarketMapping()",
        "",
        -1,
        -1,
        -1
    )
}

// create a LendingProtocol based off params
export function createLendingProtocol(): LendingProtocol {
    let lendingProtocol = new LendingProtocol(COMPTROLLER_ADDRESS.toHexString())
    lendingProtocol.name = PROTOCOL_NAME
    lendingProtocol.slug = PROTOCOL_SLUG
    lendingProtocol.version = PROTOCOL_VERSION
    lendingProtocol.network = NETWORK_ETHEREUM
    lendingProtocol.type = PROTOCOL_TYPE
    lendingProtocol.lendingType = LENDING_TYPE
    lendingProtocol.riskType = PROTOCOL_RISK_TYPE

    // create empty lists that will be populated each day
    // No need to set these as empty. just add to them
    // lendingProtocol.usageMetrics = []
    // lendingProtocol.financialMetrics = []
    // lendingProtocol.markets = []

    return lendingProtocol
}

// creates a new lending market and returns it
export function createMarket(marketAddress: string): Market {
    let market = new Market(marketAddress)
    let marketMapping = getMarketMapping(marketAddress)

    // create Tokens for asset token and cToken/cEther
    if (Token.load(marketAddress) == null) {
        createMarketTokens(marketAddress)
    }
    
    // create reward token if non existant
    if (RewardToken.load(COMP_ADDRESS.toHexString()) == null) {
        createMarketTokens(CCOMP_ADDRESS.toHexString())
    }


    // populate market vars
    market.protocol = COMPTROLLER_ADDRESS.toHexString()
    market.inputTokens = [marketMapping.underlyingAddress.toHexString()]
    market.outputToken = marketAddress
    market.rewardTokens = [COMP_ADDRESS.toHexString()]
    market.totalValueLockedUSD = ZERO_BD
    market.totalVolumeUSD = ZERO_BD
    market.inputTokenBalances = [ZERO_BI]
    market.outputTokenSupply = ZERO_BI
    market.outputTokenPriceUSD = ZERO_BD
    market.createdTimestamp = BigInt.fromI32(marketMapping.timestamp as i32)
    market.createdBlockNumber = BigInt.fromI32(marketMapping.block as i32)
    market.name = marketMapping.underlyingName
    market.isActive = true
    market.canUseAsCollateral = false // will change to true when used as collateral in a liquidation
    market.canBorrowFrom = false // will update when used in Borrow
    market.maximumLTV = ZERO_BD
    market.liquidationThreshold = ZERO_BD
    market.liquidationPenalty = ZERO_BD
    market.depositRate = ZERO_BD
    market.stableBorrowRate = ZERO_BD
    market.variableBorrowRate = ZERO_BD

    return market
}

// creates both tokens for a market pool token/cToken
export function createMarketTokens(marketAddress: string): void {
    let marketMapping = getMarketMapping(marketAddress)

    // create underlying Token
    if (marketAddress == CCOMP_ADDRESS.toHexString()) {
        // create RewardToken out of COMP
        let rewardToken = new RewardToken(marketMapping.underlyingAddress.toHexString())
        rewardToken.name = marketMapping.underlyingName
        rewardToken.symbol = marketMapping.underlyingSymbol
        rewardToken.decimals = marketMapping.underlyingDecimals as i32
        rewardToken.type = REWARD_TOKEN_TYPE
        rewardToken.save()
    } else {
        let underlyingToken = new Token(marketMapping.underlyingAddress.toHexString())
        underlyingToken.name = marketMapping.underlyingName
        underlyingToken.symbol = marketMapping.underlyingSymbol
        underlyingToken.decimals = marketMapping.underlyingDecimals as i32
        underlyingToken.save()
    }

    // create pool token (ie, cToken)
    let cToken = new Token(marketAddress)
    cToken.name = marketMapping.name
    cToken.symbol = marketMapping.symbol
    cToken.decimals = COMPOUND_DECIMALS
    cToken.save()
}

// get usd price of cerc20 tokens (NOT eth)
// TODO: broken for eth -i think it is decimals
// TODO: erc20 token decimals messed up i think
export function getTokenPrice(
    blockNumber: i32,
    eventAddress: Address,
    marketAddress: Address,
    assetDecimals: i32
): BigDecimal {
    let protocol = LendingProtocol.load(COMPTROLLER_ADDRESS.toHexString())
    if (protocol == null) {
        protocol = createLendingProtocol()
    }
    let oracle2Address = changetype<Address>(protocol._priceOracle)
    let underlyingPrice: BigDecimal
    let mantissaFactorBD = exponentToBigDecimal(18)

    /**
     * Note: The first Price oracle was only used for the first ~100 blocks:
     *    https://etherscan.io/address/0x02557a5E05DeFeFFD4cAe6D83eA3d173B272c904
     * 
     * PriceOracle2 is used starting aroun block 7715908 and we need the cToken
     * address. This returns the value without factoring in decimals and wei.
     * 
     * So the number is divided by (ethDecimals - tokenDecimals) and again by mantissa
     * USDC = 10 ^ ((18 - 6) + 18) = 10 ^ 30
     * 
     */
    if (blockNumber > 7715908) {
        // calculate using PriceOracle2
        let mantissaDecimalFactor = 18 - assetDecimals + 18
        let bdFactor = exponentToBigDecimal(mantissaDecimalFactor)
        let priceOracle2 = PriceOracle2.bind(oracle2Address)
        underlyingPrice = priceOracle2
            .getUnderlyingPrice(eventAddress)
            .toBigDecimal()
            .div(bdFactor)
    } else {
        // calculate using PriceOracle1
        let priceOracle1 = PriceOracle1.bind(PRICE_ORACLE1_ADDRESS)
        underlyingPrice = priceOracle1
            .getPrice(marketAddress)
            .toBigDecimal()
            .div(mantissaFactorBD)
    }

    return underlyingPrice
}


// TODO: combine function above into one
// get usdc price of cETH
export function getcETHPrice(blockNumber: i32): BigDecimal {
    let protocol = LendingProtocol.load(COMPTROLLER_ADDRESS.toHexString())
    if (protocol == null) {
        protocol = createLendingProtocol()
    }    
    // TODO: fix this: https://discord.com/channels/438038660412342282/438070183794573313/937998440045117440
    let oracle2Address = changetype<Address>(protocol._priceOracle)
    let usdcPrice: BigDecimal
    let mantissaFactorBD = exponentToBigDecimal(18)


    // see getTokenPrice() for explanation
    if (blockNumber > 7715908) {
        let priceOracle2 = PriceOracle2.bind(oracle2Address)
        let mantissaDecimalFactorUSDC = 18 - USDC_DECIMALS + 18
        let bdFactorUSDC = exponentToBigDecimal(mantissaDecimalFactorUSDC)
        usdcPrice = priceOracle2
            .getUnderlyingPrice(USDC_ADDRESS)
            .toBigDecimal()
            .div(bdFactorUSDC)
    } else {
        let priceOracle1 = PriceOracle1.bind(PRICE_ORACLE1_ADDRESS)
        usdcPrice = priceOracle1
            .getPrice(USDC_ADDRESS)
            .toBigDecimal()
            .div(mantissaFactorBD)
    }
    return usdcPrice
}


// turn exponent into a BigDecimal number
export function exponentToBigDecimal(decimals: i32): BigDecimal {
    let bigDecimal = BigDecimal.fromString('1')
    for (let i = 0; i < decimals; i++) {
      bigDecimal = bigDecimal.times(BigDecimal.fromString('10'))
    }
    return bigDecimal
  }
