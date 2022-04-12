import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { createMockedFunction, newMockEvent } from "matchstick-as";
import { PoolBalanceChanged, PoolRegistered, TokensRegistered, Swap } from "../generated/Vault/Vault";

export function mockMethod(
    address: Address,
    methodName: string,
    argsType: string[],
    argsValue: ethereum.Value[],
    returnType: string,
    returnValue: ethereum.Value[],
    reverts: boolean
): void {
  const stringArgs = argsType.join(',')
  const signature = methodName + '(' + stringArgs + '):(' + returnType + ')'
  let mockedFunction = createMockedFunction(address, methodName, signature).withArgs(argsValue)
  if (reverts) {
    mockedFunction.reverts()
    return
  }
  mockedFunction.returns(returnValue)
}

export function createNewPoolEvent(
  poolId: Bytes,
  poolAddress: Address,
  specialization: i32
): PoolRegistered {
  let newPool = changetype<PoolRegistered>(newMockEvent())
  newPool.parameters = []

  let idParam = new ethereum.EventParam("poolId", ethereum.Value.fromBytes(poolId))
  let addressParam = new ethereum.EventParam("poolAddress", ethereum.Value.fromAddress(poolAddress))
  let specializationParam = new ethereum.EventParam("specialization", ethereum.Value.fromI32(specialization))

  newPool.parameters.push(idParam)
  newPool.parameters.push(addressParam)
  newPool.parameters.push(specializationParam)



  return newPool
}

export function createTokensRegisteredEvent(
  id: Bytes,
  tokens: Array<Address>,
  managers: Array<Address>
): TokensRegistered {
  let tokensRegistered = changetype<TokensRegistered>(newMockEvent())

  let idParam = new ethereum.EventParam("poolId", ethereum.Value.fromBytes(id))
  let tokensParam = new ethereum.EventParam("tokens", ethereum.Value.fromAddressArray(tokens))
  let managersParam = new ethereum.EventParam("assetManagers", ethereum.Value.fromAddressArray(managers))

  tokensRegistered.parameters = [
    idParam,
    tokensParam,
    managersParam
  ]

  return tokensRegistered
}

export function createNewPoolBalanceChangeEvent(
  id: Bytes,
  provider: Address,
  tokens: Array<Address>,
  amounts: Array<BigInt>,
  feeAmounts: Array<BigInt>
): PoolBalanceChanged {
  let newPoolBalanceChangeEvent = changetype<PoolBalanceChanged>(newMockEvent())

  let idParam = new ethereum.EventParam("poolId", ethereum.Value.fromBytes(id))
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

export function createNewSwapEvent(
  id: Bytes,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: BigInt,
  amountOut: BigInt
): Swap {
  let newSwapEvent = changetype<Swap>(newMockEvent())

  let idParam = new ethereum.EventParam("poolId", ethereum.Value.fromBytes(id))
  let tokenInParam = new ethereum.EventParam("tokenIn", ethereum.Value.fromAddress(tokenIn))
  let tokenOutParam = new ethereum.EventParam("tokenOut", ethereum.Value.fromAddress(tokenOut))
  let amountInParam = new ethereum.EventParam("amountIn", ethereum.Value.fromSignedBigInt(amountIn))
  let amountOutParam = new ethereum.EventParam("amountOut", ethereum.Value.fromSignedBigInt(amountOut))

  newSwapEvent.parameters = [
    idParam,
    tokenInParam,
    tokenOutParam,
    amountInParam,
    amountOutParam
  ]

  return newSwapEvent
}
