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
  reverts: boolean,
): void {
  const stringArgs = argsType.join(",");
  const signature = methodName + "(" + stringArgs + "):(" + returnType + ")";
  const mockedFunction = createMockedFunction(address, methodName, signature).withArgs(argsValue);
  if (reverts) {
    mockedFunction.reverts();
    return;
  }
  mockedFunction.returns(returnValue);
}

export function createNewPoolEvent(poolId: Bytes, poolAddress: Address, specialization: i32): PoolRegistered {
  const newPool = changetype<PoolRegistered>(newMockEvent());
  const idParam = new ethereum.EventParam("poolId", ethereum.Value.fromBytes(poolId));
  const addressParam = new ethereum.EventParam("poolAddress", ethereum.Value.fromAddress(poolAddress));
  const specializationParam = new ethereum.EventParam("specialization", ethereum.Value.fromI32(specialization));

  newPool.parameters = [idParam, addressParam, specializationParam];
  return newPool;
}

export function createTokensRegisteredEvent(
  id: Bytes,
  tokens: Array<Address>,
  managers: Array<Address>,
): TokensRegistered {
  const tokensRegistered = changetype<TokensRegistered>(newMockEvent());

  const idParam = new ethereum.EventParam("poolId", ethereum.Value.fromBytes(id));
  const tokensParam = new ethereum.EventParam("tokens", ethereum.Value.fromAddressArray(tokens));
  const managersParam = new ethereum.EventParam("assetManagers", ethereum.Value.fromAddressArray(managers));

  tokensRegistered.parameters = [idParam, tokensParam, managersParam];

  return tokensRegistered;
}

export function createNewPoolBalanceChangeEvent(
  id: Bytes,
  provider: Address,
  tokens: Array<Address>,
  amounts: Array<BigInt>,
  feeAmounts: Array<BigInt>,
): PoolBalanceChanged {
  const newPoolBalanceChangeEvent = changetype<PoolBalanceChanged>(newMockEvent());

  const idParam = new ethereum.EventParam("poolId", ethereum.Value.fromBytes(id));
  const providerParam = new ethereum.EventParam("liquidityProvider", ethereum.Value.fromAddress(provider));
  const tokensParam = new ethereum.EventParam("tokens", ethereum.Value.fromAddressArray(tokens));
  const amountsParam = new ethereum.EventParam("deltas", ethereum.Value.fromSignedBigIntArray(amounts));
  const feesParam = new ethereum.EventParam("protocolFeeAmounts", ethereum.Value.fromSignedBigIntArray(feeAmounts));

  newPoolBalanceChangeEvent.parameters = [idParam, providerParam, tokensParam, amountsParam, feesParam];
  return newPoolBalanceChangeEvent;
}

export function createNewSwapEvent(
  id: Bytes,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: BigInt,
  amountOut: BigInt,
): Swap {
  const newSwapEvent = changetype<Swap>(newMockEvent());

  const idParam = new ethereum.EventParam("poolId", ethereum.Value.fromBytes(id));
  const tokenInParam = new ethereum.EventParam("tokenIn", ethereum.Value.fromAddress(tokenIn));
  const tokenOutParam = new ethereum.EventParam("tokenOut", ethereum.Value.fromAddress(tokenOut));
  const amountInParam = new ethereum.EventParam("amountIn", ethereum.Value.fromSignedBigInt(amountIn));
  const amountOutParam = new ethereum.EventParam("amountOut", ethereum.Value.fromSignedBigInt(amountOut));

  newSwapEvent.parameters = [idParam, tokenInParam, tokenOutParam, amountInParam, amountOutParam];

  return newSwapEvent;
}
