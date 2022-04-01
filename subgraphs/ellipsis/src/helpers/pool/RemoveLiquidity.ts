import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../../generated/Factory/ERC20";
import { Factory } from "../../../generated/Factory/Factory";
import { getCoinCount, getCoins, getOrCreateProtocol } from "../../utils/common";
import { BIGINT_ZERO, FACTORY_ADDRESS, ZERO_ADDRESS } from "../../utils/constant";
import { getOrCreateFinancials } from "../financials";
import { createPoolDailySnapshot } from "../poolDailySnapshot";
import { updateUsageMetrics } from "../updateUsageMetrics";
import { createWithdraw } from "../withdraw";
import { getOrCreatePoolFromFactory } from "./createPool";

export function removeLiquidity(
    poolAddress: Address,
    token_supply: BigInt,
    token_amounts: BigInt[],
    provider: Address,
    fees: BigInt[],
    timestamp: BigInt,
    blockNumber: BigInt,
    logIndex: BigInt,
    transactionHash: Bytes
  ): void {
    // create pool
    let protocol = getOrCreateProtocol();
    // create pool
    let factory = Factory.bind(Address.fromString(FACTORY_ADDRESS))
    // Get coins
    let coins: Address[] = getCoins(poolAddress)
    // Get lp_token
    let getLpToken = factory.try_get_lp_token(poolAddress)
    let lpToken: Address = getLpToken.reverted ? Address.fromString(ZERO_ADDRESS) : getLpToken.value
    let pool = getOrCreatePoolFromFactory(coins, BIGINT_ZERO, lpToken, poolAddress, timestamp, blockNumber)
    // update input token balances
    let coinCount = getCoinCount(poolAddress)
    let inputTokenBalances: BigInt[] = []
    for(let i = 0; i < coinCount.toI32(); ++i) {
        inputTokenBalances.push(pool.inputTokenBalances[i].minus(token_amounts[i]))
    }
    pool.inputTokenBalances = inputTokenBalances.map<BigInt>(tb => tb)
    // Update outputTokenSupply
    let oldOutputTokenSupply = pool.outputTokenSupply
    pool.outputTokenSupply = token_supply
    if(token_supply == BIGINT_ZERO) {
        let tokenContract = ERC20.bind(lpToken)
        let getSupply = tokenContract.try_totalSupply()
        let supply = getSupply.reverted ? BIGINT_ZERO : getSupply.value
        pool.outputTokenSupply = supply
    }
    
    let outputTokenAmount = oldOutputTokenSupply.minus(pool.outputTokenSupply)
    pool.save()
  

  
    // Update Withdraw
    createWithdraw(pool, protocol, outputTokenAmount, token_amounts, provider, transactionHash, logIndex, blockNumber, timestamp);
  
    // Take a PoolDailySnapshot
    createPoolDailySnapshot(poolAddress, blockNumber, timestamp, pool);
  
    // Take FinancialsDailySnapshot
    getOrCreateFinancials(protocol, timestamp, blockNumber);
  
    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(provider, protocol, timestamp, blockNumber);
  }
  