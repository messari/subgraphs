import {
    BigInt,
  Address,
  BigDecimal,
  store,
  DataSourceContext,
  ethereum,
  dataSource,
} from "@graphprotocol/graph-ts";

import {
  StableSwap,
  AddLiquidity,
  RemoveLiquidity,
  RemoveLiquidityImbalance,
  RemoveLiquidityOne,
  TokenExchange,
  TokenExchangeUnderlying,
} from "../../generated/MainRegistry/StableSwap";

import { LiquidityPool, Deposit, PoolDailySnapshot} from "../../generated/schema";
import { Registry } from "../../generated/MainRegistry/Registry";
import { ERC20 } from "../../generated/MainRegistry/ERC20";
import { getOrCreatePool, updatePool } from "../utils/pool";
import { getOrCreateToken } from "../utils/tokens";
import { REGISTRY_ADDRESS } from "../utils/constant";
import { getOrCreateProtocol } from "./registry";

export function handleAddLiquidity(event: AddLiquidity) : void {
    let fees = event.params.fees
    let invariant = event.params.invariant
    let provider = event.params.provider
    let token_amount = event.params.token_amounts
    let token_supply = event.params.token_supply

    let protocol = getOrCreateProtocol()
    let registryContract = Registry.bind(Address.fromString(protocol.id));
    let poolContract = StableSwap.bind(event.address);

    // Check if pool exist
    let pool = LiquidityPool.load(event.address.toHexString())

    // If liquidity pool exist, update the pool 
    if(pool != null) {

        // Update pool entity balances and totalSupply of LP tokens
        let oldTotalSupply = pool.outputTokenSupply;
        let newPoolBalances: BigDecimal[] = [];
        for(let i = 0; i < pool.inputTokens.length; i++){
            let ib = BigInt.fromI32(i);
            let balance = poolContract.try_balances(ib);
            if(!balance.reverted) {
                newPoolBalances.push(new BigDecimal(balance.value))
            }
        }

        // If token supply in event is 0, then check directly from contract
        let currentTokenSupply = new BigDecimal(token_supply);
        if (currentTokenSupply == new BigDecimal(BigInt.fromI32(0))) {
            let lpToken = registryContract.try_get_lp_token(Address.fromString(pool.id));
            if(!lpToken.reverted) {
                let contract = ERC20.bind(lpToken.value);
                let supply = contract.try_totalSupply();
                if (!supply.reverted) {
                    currentTokenSupply = new BigDecimal(supply.value);
                }
            }
        }

        pool = updatePool(event, pool, newPoolBalances, currentTokenSupply);
    }
    
    // Update Deposit 

    // Take a PoolDailySnapshot

    // Take FinancialsDailySnapshot

    // Take UsageMetricsDailySnapshot
}

export function handleRemoveLiquidity(event: RemoveLiquidity) : void {
    let fees = event.params.fees
    let provider = event.params.provider
    let token_amount = event.params.token_amounts
    let token_supply = event.params.token_supply

    // Check if pool exist
    

    // If liquidity pool exist, update the pool 
    
    // Update Withdraw 

    // Take a PoolDailySnapshot

    // Take FinancialsDailySnapshot

    // Take UsageMetricsDailySnapshot
}

export function handleRemoveLiquidityImbalance(event: RemoveLiquidityImbalance) : void {
    let fees = event.params.fees
    let provider = event.params.provider
    let token_amount = event.params.token_amounts
    let token_supply = event.params.token_supply


}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne) : void {
    let coin_amount = event.params.coin_amount
    let provider = event.params.provider
    let token_amount = event.params.token_amount
}

export function handleTokenExchange(event: TokenExchange) : void {
    let bought_id = event.params.bought_id
    let buyer = event.params.buyer
    let sold_id = event.params.sold_id
    let token_bought = event.params.tokens_bought
    let token_sold = event.params.tokens_sold
}

export function handleTokenExchangeUnderlying(event: TokenExchangeUnderlying) : void {
    let bought_id = event.params.bought_id
    let buyer = event.params.buyer
    let sold_id = event.params.sold_id
    let token_bought = event.params.tokens_bought
    let token_sold = event.params.tokens_sold
}

function createPoolDailySnapshot(pool: LiquidityPool): void {

}