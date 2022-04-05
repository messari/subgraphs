import {PoolRegistered, TokensRegistered} from "../../generated/Vault/Vault";
import {createPool, getOrCreateToken} from "../common/getters";
import {LiquidityPool} from "../../generated/schema";

export function handlePoolRegister(event: PoolRegistered): void {
  createPool(event.params.poolId.toHexString(), event.params.poolAddress, event.block)
}

export function handleTokensRegister(event: TokensRegistered): void {
  let tokens: string[] = []
  for (let i=0; i<event.params.tokens.length; i++) {
     let token = getOrCreateToken(event.params.tokens[i])
     tokens.push(token.id)
  }
  let pool = LiquidityPool.load(event.params.poolId.toHexString())
  if (pool == null) {
    return
  }
  pool.inputTokens = tokens
  pool.save()
}