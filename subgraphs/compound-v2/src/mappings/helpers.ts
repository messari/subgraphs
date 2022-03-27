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
    NULL_ADDRESS,
    CCOMP_ADDRESS,
    COMP_ADDRESS,
    CETH_ADDRESS
 } from "../common/addresses"

import {
    USDC_DECIMALS,
    ZERO_BD,
    ZERO_BI,
    REWARD_TOKEN_TYPE,
    ETH_NAME,
    ETH_SYMBOL,
    ETH_DECIMALS
} from "../common/constants"

import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts"
import { PriceOracle2 } from "../types/Comptroller/PriceOracle2"
import { PriceOracle1 } from "../types/Comptroller/PriceOracle1"
import { CToken } from "../types/Comptroller/cToken"
import { ERC20 } from "../types/Comptroller/ERC20"
import { ERC20SymbolBytes } from "../types/Comptroller/ERC20SymbolBytes"
import { ERC20NameBytes } from "../types/Comptroller/ERC20NameBytes"

// TODO: helper for converting uni time to day

// creates a new lending market and returns it
export function createMarket(
    marketAddress: string, 
    protocol: string,
    blockNumber: BigInt,
    timestamp: BigInt
): Market {
    let market = new Market(marketAddress)
    let cTokenContract = CToken.bind(Address.fromString(marketAddress))
    let underlyingAddress: string
    let underlying = cTokenContract.try_underlying()
    if (underlying.reverted) {
        underlyingAddress = NULL_ADDRESS.toHexString()
    } else {
        underlyingAddress = underlying.value.toHexString()
    }
    

    // create cToken/erc20 Tokens
    createMarketTokens(
        marketAddress, 
        underlyingAddress,
        cTokenContract
    )

    // populate market vars
    market.protocol = protocol

    // add tokens
    let inputTokens = new Array<string>()
    inputTokens.push(underlyingAddress)
    market.inputTokens = inputTokens
    market.outputToken = marketAddress
    let rewardTokens = new Array<string>()
    rewardTokens.push(COMP_ADDRESS.toHexString())
    market.rewardTokens = rewardTokens

    // populate quantitative data
    market.totalValueLockedUSD = ZERO_BD
    market.totalVolumeUSD = ZERO_BD
    let inputTokenBalances = new Array<BigInt>()
    inputTokenBalances.push(ZERO_BI)
    market.inputTokenBalances = inputTokenBalances
    market.outputTokenSupply = ZERO_BI
    market.outputTokenPriceUSD = ZERO_BD
    market.createdTimestamp = timestamp
    market.createdBlockNumber = blockNumber
    
    // lending-specific data
    let inputToken = Token.load(underlyingAddress)
    market.name = inputToken!.name
    market.isActive = true
    market.canUseAsCollateral = false // until Collateral is taken out
    market.canBorrowFrom = false // until Borrowed from
    
    // calculations data
    // TODO: figure out and do calcs
    market.maximumLTV = ZERO_BD
    market.liquidationThreshold = ZERO_BD
    market.liquidationPenalty = ZERO_BD
    market.depositRate = ZERO_BD
    market.stableBorrowRate = ZERO_BD
    market.variableBorrowRate = ZERO_BD

    return market
}

// creates both tokens for a market pool token/cToken
export function createMarketTokens(
    marketAddress: string,
    underlyingAddress: string,
    cTokenContract: CToken
): void {
    
    // create underlying token
    if (marketAddress == CCOMP_ADDRESS.toHexString()) {
        // create RewardToken COMP
        let rewardToken = new RewardToken(underlyingAddress)
        rewardToken.name =  getAssetName(Address.fromString(underlyingAddress))
        rewardToken.symbol = getAssetSymbol(Address.fromString(underlyingAddress))
        rewardToken.decimals = getAssetDecimals(Address.fromString(underlyingAddress))
        rewardToken.type = REWARD_TOKEN_TYPE
        rewardToken.save()

    } else if (marketAddress == CETH_ADDRESS.toHexString()) {
        // ETH has a unique makeup
        let ethToken = new Token(NULL_ADDRESS.toHexString())
        ethToken.name = ETH_NAME
        ethToken.symbol = ETH_SYMBOL
        ethToken.decimals = ETH_DECIMALS
        ethToken.save()

    } else {
        // create ERC20 Token normally
        let token = new Token(underlyingAddress)

        token.name = getAssetName(Address.fromString(underlyingAddress))
        token.symbol = getAssetSymbol(Address.fromString(underlyingAddress))
        token.decimals = getAssetDecimals(Address.fromString(underlyingAddress))
        token.save()

    }

    // create pool token (ie, cToken)
    let cToken = new Token(marketAddress)
    cToken.name = cTokenContract.name()
    cToken.symbol = cTokenContract.symbol()
    cToken.decimals = cTokenContract.decimals()
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
    let protocol = LendingProtocol.load(COMPTROLLER_ADDRESS.toHexString())!
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
    let protocol = LendingProtocol.load(COMPTROLLER_ADDRESS.toHexString())!  
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



  // Functions designed to try...catch erc20 name/symbol/decimals to prevent errors
  export function getAssetName(address: Address): string {
    let contract = ERC20.bind(address);
    let nameCall = contract.try_name();
    if (!nameCall.reverted) {
      return nameCall.value;
    }
  
    let bytesContract = ERC20NameBytes.bind(address);
    let nameBytesCall = bytesContract.try_name();
    if (!nameBytesCall.reverted) {
      return nameBytesCall.value.toString();
    }
  
    log.error('name() call (string or bytes) reverted for {}', [address.toHex()]);
    return 'UNKNOWN';
  }
  
  export function getAssetSymbol(address: Address): string {
    let contract = ERC20.bind(address);
    let symbolCall = contract.try_symbol();
    if (!symbolCall.reverted) {
      return symbolCall.value;
    }
  
    let bytesContract = ERC20SymbolBytes.bind(address);
    let symbolBytesCall = bytesContract.try_symbol();
    if (!symbolBytesCall.reverted) {
      return symbolBytesCall.value.toString();
    }
  
    log.error('symbol() call (string or bytes) reverted for {}', [address.toHex()]);
    return 'UNKNOWN';
  }
  
  export function getAssetDecimals(address: Address): i32 {
    let contract = ERC20.bind(address);
    let decimalsCall = contract.try_decimals();
    if (!decimalsCall.reverted) {
      return decimalsCall.value;
    }
  
    log.error('decimals() call reverted for {}', [address.toHex()]);
    return -1;
  }
  