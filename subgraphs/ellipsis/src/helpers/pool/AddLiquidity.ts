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
    let pool = getOrCreatePoolFromFactory(coins, BIGINT_ZERO, lpToken, poolAddress, event.block.timestamp, event.block.number)
    // update input token balances
    let coinCount = getCoinCount(poolAddress)
    let inputTokenBalances: BigInt[] = []
    for(let i = 0; i < coinCount.toI32(); ++i) {
        inputTokenBalances.push(pool.inputTokenBalances[i].plus(token_amounts[i]))
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
    
    let outputTokenAmount = pool.outputTokenSupply.minus(oldOutputTokenSupply)
    pool.save()

    // Update Deposit
    createDeposit(event, pool, protocol, outputTokenAmount, token_amounts, provider);
  
    // Take a PoolDailySnapshot
    createPoolDailySnapshot(event.address, event.block.number, event.block.timestamp, pool);
  
    // Take FinancialsDailySnapshot
    getOrCreateFinancials(protocol, event.block.timestamp, event.block.number);
  
    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(provider, protocol, event.block.timestamp, event.block.number);
  }