import { Address, BigInt, BigDecimal, bigInt } from '@graphprotocol/graph-ts'

  
import { DexStrategyV4 } from "../../generated/x0aBD79f5144a70bFA3E3Aeed183f9e1A4d80A34F/DexStrategyV4"
import { YakRouter, YakRouter__findBestPathResultValue0Struct } from "../../generated/x0aBD79f5144a70bFA3E3Aeed183f9e1A4d80A34F/YakRouter"

import { convertBINumToDesiredDecimals } from "./utils/converters"
import { ZERO_BIGDECIMAL, DEFUALT_AMOUNT } from "./utils/constants";
  

export function priceInUSD(tokenAddress: Address, amount: BigInt): BigDecimal {
    let usdcAddress: Address = Address.fromString("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E");
    let avaxAddress: Address = Address.fromString("0x0000000000000000000000000000000000000000");
    let tokenPriceInUSDWithDecimal: BigDecimal;
    if (tokenAddress == avaxAddress) {
      tokenAddress = Address.fromString("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7");
    }
    let yakRouterAddress: Address = Address.fromString("0xC4729E56b831d74bBc18797e0e17A295fA77488c");
    let yakRouter = YakRouter.bind(yakRouterAddress);
    if (yakRouter.try_findBestPath(amount,tokenAddress,usdcAddress,BigInt.fromString("2")).reverted) {
      tokenPriceInUSDWithDecimal = ZERO_BIGDECIMAL;
    }
    else {
      let tokenPriceInUSDStructure: YakRouter__findBestPathResultValue0Struct = yakRouter.findBestPath(amount,tokenAddress,usdcAddress,bigInt.fromString("2"));
      if (tokenPriceInUSDStructure.amounts.length) {
        tokenPriceInUSDWithDecimal = convertBINumToDesiredDecimals(tokenPriceInUSDStructure.amounts[2], 6);
      } else {
        tokenPriceInUSDWithDecimal = ZERO_BIGDECIMAL;
      }
    }
    return tokenPriceInUSDWithDecimal;
  }


export function calculateOutputTokenPriceInUSD(contractAddress: Address): BigDecimal {
    let dexStrategyV4Contract = DexStrategyV4.bind(contractAddress);
    let OutputTokenPriceInUSD: BigDecimal;
    if (dexStrategyV4Contract.try_depositToken().reverted || dexStrategyV4Contract.try_getSharesForDepositTokens(DEFUALT_AMOUNT).reverted) {
      OutputTokenPriceInUSD = ZERO_BIGDECIMAL;
      return OutputTokenPriceInUSD;
    } else {
      let depositTokenPrice: BigDecimal = priceInUSD(dexStrategyV4Contract.depositToken(),DEFUALT_AMOUNT);
      let getSharesForDepositToken: BigInt = dexStrategyV4Contract.getSharesForDepositTokens(DEFUALT_AMOUNT);
      let getSharesForDepositTokenInDecimal: BigDecimal = convertBINumToDesiredDecimals(getSharesForDepositToken, 18);
      if (getSharesForDepositTokenInDecimal != ZERO_BIGDECIMAL) {
        OutputTokenPriceInUSD = depositTokenPrice.div(getSharesForDepositTokenInDecimal);
      } else {
        OutputTokenPriceInUSD = ZERO_BIGDECIMAL;
      }
    }
    return OutputTokenPriceInUSD;
  }