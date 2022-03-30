import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../../generated/Factory/ERC20";
import { Factory } from "../../../generated/Factory/Factory";
import { getCoinCount, getCoins, getOrCreateProtocol } from "../../utils/common";
import { BIGINT_ZERO, FACTORY_ADDRESS, ZERO_ADDRESS } from "../../utils/constant";
import { createDeposit } from "../deposit";
import { getOrCreateFinancials } from "../financials";
import { createPoolDailySnapshot } from "../poolDailySnapshot";
import { updateUsageMetrics } from "../updateUsageMetrics";
import { getOrCreatePoolFromFactory } from "./createPool";

export function addLiquidity(
    event: ethereum.Event,
    poolAddress: Address,
    token_supply: BigInt,
    token_amounts: BigInt[],
    provider: Address,
    fees: BigInt[]
  ): void {
      let protocol = getOrCreateProtocol();

    // create pool
    let factory = Factory.bind(Address.fromString(FACTORY_ADDRESS))
    // Get coins
    let coins: Address[] = getCoins(poolAddress)
    // Get lp_token
    let getLpToken = factory.try_get_lp_token(poolAddress)
    let lpToken: Address = getLpToken.reverted ? Address.fromString(ZERO_ADDRESS) : getLpToken.value
    let pool = getOrCreatePoolFromFactory(event, coins, BIGINT_ZERO, lpToken, poolAddress)
    // update input token balances
    let coinCount = getCoinCount(poolAddress)
    for(let i = 0; i < coinCount.toI32(); ++i) {
        pool.inputTokenBalances[i] = pool.inputTokenBalances[i].plus(token_amounts[i])
    }
    // Update outputTokenSupply
    let oldOutputTokenSupply = pool.outputTokenSupply
    pool.outputTokenSupply = token_supply
    if(token_supply == BIGINT_ZERO) {
        let tokenContract = ERC20.bind(lpToken)
        let getSupply = tokenContract.try_totalSupply()
        let supply = getSupply.reverted ? BIGINT_ZERO : getSupply.value
        pool.outputTokenSupply = supply
    }
    
    let outputTokenAmount = pool.outputTokenSupply.minus(oldOutputTokenSupply)
    pool.save()

    // Update Deposit
    createDeposit(event, pool, protocol, outputTokenAmount, token_amounts, provider);
  
    // Take a PoolDailySnapshot
    createPoolDailySnapshot(event, pool);
  
    // Take FinancialsDailySnapshot
    getOrCreateFinancials(event, protocol);
  
    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(event, provider, protocol);
  }