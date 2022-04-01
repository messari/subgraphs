import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Factory } from "../../../generated/Factory/Factory"
import { StableSwap } from "../../../generated/Factory/StableSwap"
import { BasePool, LiquidityPool } from "../../../generated/schema";
import { getOrCreateProtocol } from "../../utils/common";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, FACTORY_ADDRESS, ZERO_ADDRESS } from "../../utils/constant";
import { getOrCreateToken } from "../../utils/token";

// Create New Base Pool
export function getOrCreateBasePool(basePoolAddress: Address): BasePool {
    let id = basePoolAddress.toHexString();
    let basePool = BasePool.load(id);
    if (basePool == null) {
      basePool = new BasePool(id);
      basePool.address = basePoolAddress
  
      basePool.save();
  
      return basePool;
    }
    return basePool;
  }

export function getOrCreatePoolFromFactory(
    coins: Address[],
    fee: BigInt,
    lp_token: Address,
    pool: Address,
    timestamp: BigInt, 
    blockNumber: BigInt
): LiquidityPool {
    let id = pool.toHexString()
    // Check if pool already exist
    let liquidityPool = LiquidityPool.load(id)
    if(liquidityPool == null && pool !== Address.fromString(ZERO_ADDRESS)) {
        liquidityPool = new LiquidityPool(id)
        // get protocol
        let protocol = getOrCreateProtocol()
        liquidityPool.protocol = protocol.id
        // Input Tokens
        let factory = Factory.bind(Address.fromString(FACTORY_ADDRESS))
        let getCoinCount = factory.try_get_n_coins(pool)
        let coinCount: BigInt = getCoinCount.reverted ? BIGINT_ZERO : getCoinCount.value
        log.info("Coin length: {}", [coins.length.toString()])
        log.info("Coin count: {}", [coinCount.toI32().toString()])
        let inputTokens: string[] = []
        let inputTokenBalances: BigInt[] = []
        for(let i = 0; i < coinCount.toI32(); ++i) {
            inputTokens.push(getOrCreateToken(coins[i]).id)
            inputTokenBalances.push(BIGINT_ZERO)
        }
        liquidityPool.inputTokens = inputTokens.map<string>(t => t)
        liquidityPool.inputTokenBalances = inputTokenBalances.map<BigInt>(tb => tb)
        liquidityPool.outputToken = getOrCreateToken(lp_token).id
        log.info("Output Token: {}", [liquidityPool.outputToken.toString()])
        liquidityPool.rewardTokens = []
        liquidityPool.totalValueLockedUSD = BIGDECIMAL_ZERO
        liquidityPool.totalVolumeUSD = BIGDECIMAL_ZERO
        liquidityPool.outputTokenSupply = BIGINT_ZERO
        liquidityPool.outputTokenPriceUSD = BIGDECIMAL_ZERO
        liquidityPool.rewardTokenEmissionsAmount = []
        liquidityPool.rewardTokenEmissionsUSD = []
        liquidityPool.createdTimestamp = timestamp
        liquidityPool.createdBlockNumber = blockNumber
        liquidityPool.name = null
        liquidityPool.symbol = null
        liquidityPool._basePool = null

        // @TODO Create LiquidityPoolFee

        liquidityPool.save()
        return liquidityPool as LiquidityPool
    }
    return liquidityPool as LiquidityPool
}