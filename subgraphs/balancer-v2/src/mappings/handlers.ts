import {PoolRegistered, TokensRegistered} from "../../generated/Vault/Vault";
import {getOrCreatePool, getOrCreateToken} from "../common/getters";

export function handlePoolRegister(event: PoolRegistered): void {
  getOrCreatePool(event.params.poolId.toString(), event.params.poolAddress)
}

export function handleTokensRegister(event: TokensRegistered): void {
  let pool = getOrCreatePool(event.params.poolId.toString())
  pool.inputTokens = event.params.tokens.map(t => (getOrCreateToken(t)).id)
  pool.save()
}