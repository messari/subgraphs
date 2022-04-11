import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as";
import { PoolBalanceChanged, PoolRegistered, TokensRegistered } from "../generated/Vault/Vault";
import { Swap } from "../generated/schema";

export function createNewPool(
  id: string,
  address: Address
) {
  let newPool = changetype<PoolRegistered>(newMockEvent())
  newPool.parameters = []

  let idParam = new ethereum.EventParam("id", ethereum.Value.fromString(id))
  let addressParam = new ethereum.EventParam("address", ethereum.Value.fromAddress(address))

  newPool.parameters = [
    idParam,
    addressParam
  ]
  return newPool
}

export function createTokensRegistered(
  id: string,
  tokens: Array<Address>,
  managers: Array<Address>
) {
  let tokensRegistered = changetype<TokensRegistered>(newMockEvent())

  let idParam = new ethereum.EventParam("id", ethereum.Value.fromString(id))
  let tokensParam = new ethereum.EventParam("tokens", ethereum.Value.fromAddressArray(tokens))
  let managersParam = new ethereum.EventParam("assetManagers", ethereum.Value.fromAddressArray(managers))

  tokensRegistered.parameters = [
    idParam,
    tokensParam,
    managersParam
  ]

  return tokensRegistered
}

export function createNewPoolBalanceChange(
  id: string,
  provider: Address,
  tokens: Array<Address>,
  amounts: Array<BigInt>,
  feeAmounts: Array<BigInt>
) {
  let newPoolBalanceChangeEvent = changetype<PoolBalanceChanged>(newMockEvent())

  let idParam = new ethereum.EventParam("id", ethereum.Value.fromString(id))
  let providerParam = new ethereum.EventParam("liquidityProvider", ethereum.Value.fromAddress(provider))
  let tokensParam = new ethereum.EventParam("tokens", ethereum.Value.fromAddressArray(tokens))
  let amountsParam = new ethereum.EventParam("deltas", ethereum.Value.fromSignedBigIntArray(amounts))
  let feesParam = new ethereum.EventParam("protocolFeeAmounts", ethereum.Value.fromSignedBigIntArray(feeAmounts))

  newPoolBalanceChangeEvent.parameters = [
    idParam,
    providerParam,
    tokensParam,
    amountsParam,
    feesParam
  ]
  return newPoolBalanceChangeEvent
}

export function createNewSwap(
  id: string,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: BigInt,
  amountOut: BigInt
) {
  let newSwapEvent = changetype<Swap>(newMockEvent())

  let idParam = new ethereum.EventParam("id", ethereum.Value.fromString(id))
  let tokenInParam = new ethereum.EventParam("tokenIn", ethereum.Value.fromAddress(tokenIn))
  let tokenOutParam = new ethereum.EventParam("tokenOut", ethereum.Value.fromAddress(tokenOut))
  let amountInParam = new ethereum.EventParam("deltas", ethereum.Value.fromSignedBigInt(amountIn))
  let amountOutParam = new ethereum.EventParam("protocolFeeAmounts", ethereum.Value.fromSignedBigInt(amountOut))

  newSwapEvent.parameters = [
    idParam,
    tokenInParam,
    tokenOutParam,
    amountInParam,
    amountOutParam
  ]

  return newSwapEvent
}