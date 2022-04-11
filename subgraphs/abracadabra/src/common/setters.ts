import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { Market, _LiquidationCache } from "../../generated/schema"
import { cauldron } from "../../generated/templates/cauldron/cauldron"
import { getOrCreateLendingProtocol, getOrCreateToken } from "./getters"
import { BIGDECIMAL_ZERO, BIGDECIMAL_ONE, BIGINT_ZERO, SECONDS_PER_YEAR, MIM } from "../common/constants";
import { bigIntToBigDecimal } from "./utils/numbers"
import { LogRemoveCollateral } from '../../generated/templates/cauldron/cauldron'


export function createMarket(marketAddress: string, blockNumber:BigInt, blockTimestamp:BigInt): void {
    let MarketEntity = new Market(marketAddress)
    let MarketContract = cauldron.bind(Address.fromString(marketAddress))
    let collateralCall = MarketContract.try_collateral()
    if (!collateralCall.reverted){
      MarketEntity.protocol = getOrCreateLendingProtocol().id
      let inputToken = getOrCreateToken(collateralCall.value)
      MarketEntity.inputTokens = [inputToken.id]
      MarketEntity.outputToken = MIM
      MarketEntity.totalValueLockedUSD = BIGDECIMAL_ZERO
      MarketEntity.totalVolumeUSD = BIGDECIMAL_ZERO
      MarketEntity.inputTokenBalances = [BIGINT_ZERO]
      MarketEntity.outputToken = getOrCreateToken(Address.fromString(MIM)).id
      MarketEntity.outputTokenSupply = BIGINT_ZERO
      MarketEntity.outputTokenPriceUSD = BIGDECIMAL_ZERO
      MarketEntity.createdTimestamp = blockTimestamp
      MarketEntity.createdBlockNumber = blockNumber
      MarketEntity.name = inputToken.name + " Market"
      MarketEntity.isActive = true
      MarketEntity.canUseAsCollateral = true
      MarketEntity.canBorrowFrom = true
      if (marketAddress.toLowerCase() == "0x551a7cff4de931f32893c928bbc3d25bf1fc5147".toLowerCase()){
        MarketEntity.maximumLTV = bigIntToBigDecimal(BigInt.fromI32(90000),5)
        MarketEntity.liquidationPenalty = bigIntToBigDecimal(BigInt.fromI32(103000),5).minus(BIGDECIMAL_ONE)
        MarketEntity.liquidationThreshold = bigIntToBigDecimal(BigInt.fromI32(75000),5) // ???
        MarketEntity.stableBorrowRate = bigIntToBigDecimal(BigInt.fromI32(253509908),18).times(SECONDS_PER_YEAR)
      }
      else if (marketAddress.toLowerCase() == "0x6Ff9061bB8f97d948942cEF376d98b51fA38B91f".toLowerCase()){
        MarketEntity.maximumLTV = bigIntToBigDecimal(BigInt.fromI32(75000),5)
        MarketEntity.liquidationPenalty = bigIntToBigDecimal(BigInt.fromI32(112500),5).minus(BIGDECIMAL_ONE)
        MarketEntity.liquidationThreshold = bigIntToBigDecimal(BigInt.fromI32(75000),5) // ???
        MarketEntity.stableBorrowRate = bigIntToBigDecimal(BigInt.fromI32(475331078),18).times(SECONDS_PER_YEAR)
      }
      else if (marketAddress.toLowerCase() == "0xffbf4892822e0d552cff317f65e1ee7b5d3d9ae6".toLowerCase()){
        MarketEntity.maximumLTV = bigIntToBigDecimal(BigInt.fromI32(75000),5)
        MarketEntity.liquidationPenalty = bigIntToBigDecimal(BigInt.fromI32(112500),5).minus(BIGDECIMAL_ONE)
        MarketEntity.liquidationThreshold = bigIntToBigDecimal(BigInt.fromI32(75000),5) // ???
        MarketEntity.stableBorrowRate = bigIntToBigDecimal(BigInt.fromI32(475331078),18).times(SECONDS_PER_YEAR)
      }
      else if (marketAddress.toLowerCase() == "0x6cbafee1fab76ca5b5e144c43b3b50d42b7c8c8f".toLowerCase()){
        MarketEntity.maximumLTV = bigIntToBigDecimal(BigInt.fromI32(100000),5)
        MarketEntity.liquidationPenalty = bigIntToBigDecimal(BigInt.fromI32(103000),5).minus(BIGDECIMAL_ONE)
        MarketEntity.liquidationThreshold = bigIntToBigDecimal(BigInt.fromI32(75000),5) // ???
        MarketEntity.stableBorrowRate = bigIntToBigDecimal(BigInt.fromI32(253509908),18).times(SECONDS_PER_YEAR)
      }
      else if (marketAddress.toLowerCase() == "0xbb02a884621fb8f5bfd263a67f58b65df5b090f3".toLowerCase()){
        MarketEntity.maximumLTV = bigIntToBigDecimal(BigInt.fromI32(75000),5)
        MarketEntity.liquidationPenalty = bigIntToBigDecimal(BigInt.fromI32(112500),5).minus(BIGDECIMAL_ONE)
        MarketEntity.liquidationThreshold = bigIntToBigDecimal(BigInt.fromI32(75000),5) // ???
        MarketEntity.stableBorrowRate = bigIntToBigDecimal(BigInt.fromI32(475331078),18).times(SECONDS_PER_YEAR)
      }
      else{
        let maximumLTVCall = MarketContract.try_COLLATERIZATION_RATE()
        let liquidationPenaltyCall = MarketContract.try_LIQUIDATION_MULTIPLIER()
        let accrueInfoCall = MarketContract.try_accrueInfo()
        if (!maximumLTVCall.reverted && !liquidationPenaltyCall.reverted && !accrueInfoCall.reverted){
          MarketEntity.maximumLTV = bigIntToBigDecimal(maximumLTVCall.value,5)
          MarketEntity.liquidationPenalty = bigIntToBigDecimal(liquidationPenaltyCall.value,5).minus(BIGDECIMAL_ONE)
          MarketEntity.liquidationThreshold = bigIntToBigDecimal(maximumLTVCall.value,5) // ???
          MarketEntity.stableBorrowRate = bigIntToBigDecimal(accrueInfoCall.value.value2,18).times(SECONDS_PER_YEAR)
        }
      }
      MarketEntity.depositRate = BIGDECIMAL_ZERO
      MarketEntity.variableBorrowRate = BIGDECIMAL_ZERO // ???
    }
    MarketEntity.save()
  }


export function createCachedLiquidation(event: LogRemoveCollateral): void {
    let liquidation = new _LiquidationCache(event.transaction.hash.toHexString() + "_" + event.transactionLogIndex.toString() + "_Liquidation")
    liquidation.amountCollateral = event.params.share
    liquidation.save()
}