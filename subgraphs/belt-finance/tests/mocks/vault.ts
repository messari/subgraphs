import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { createMockedFunction, newMockEvent } from "matchstick-as";
import { Deposit as DepositEvent, Withdraw as WithdrawEvent } from "../../generated/beltBTC/Vault";

export function createDepositEvent(
  vaultAddress: string,
  strategy: string,
  inputTokenAddress: string,
  deposit: BigInt,
  shares: BigInt,
): DepositEvent {
  let mockEvent = newMockEvent();
  let depositEvent = new DepositEvent(
    Address.fromString(vaultAddress),
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
  );

  let tokenAddress = new ethereum.EventParam(
    "tokenAddress",
    ethereum.Value.fromAddress(Address.fromString(inputTokenAddress)),
  );
  let depositAmount = new ethereum.EventParam("depositAmount", ethereum.Value.fromUnsignedBigInt(deposit));
  let sharesMinted = new ethereum.EventParam("sharesMinted", ethereum.Value.fromUnsignedBigInt(shares));
  let strategyAddress = new ethereum.EventParam(
    "tokenAddress",
    ethereum.Value.fromAddress(Address.fromString(strategy)),
  );

  depositEvent.parameters = new Array();
  depositEvent.parameters.push(tokenAddress);
  depositEvent.parameters.push(depositAmount);
  depositEvent.parameters.push(sharesMinted);
  depositEvent.parameters.push(strategyAddress);

  return depositEvent;
}

export function createWithdrawEvent(
  vaultAddress: string,
  strategy: string,
  inputTokenAddress: string,
  withdraw: BigInt,
  shares: BigInt,
): WithdrawEvent {
  let mockEvent = newMockEvent();
  let withdrawEvent = new WithdrawEvent(
    Address.fromString(vaultAddress),
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
  );

  let tokenAddress = new ethereum.EventParam(
    "tokenAddress",
    ethereum.Value.fromAddress(Address.fromString(inputTokenAddress)),
  );
  let depositAmount = new ethereum.EventParam("withdrawAmount", ethereum.Value.fromUnsignedBigInt(withdraw));
  let sharesMinted = new ethereum.EventParam("sharesBurnt", ethereum.Value.fromUnsignedBigInt(shares));
  let strategyAddress = new ethereum.EventParam(
    "tokenAddress",
    ethereum.Value.fromAddress(Address.fromString(strategy)),
  );

  withdrawEvent.parameters = new Array();
  withdrawEvent.parameters.push(tokenAddress);
  withdrawEvent.parameters.push(depositAmount);
  withdrawEvent.parameters.push(sharesMinted);
  withdrawEvent.parameters.push(strategyAddress);

  return withdrawEvent;
}

export function mockVaultFeeFunction(address: string, numerator: BigInt, denominator: BigInt): void {
  createMockedFunction(Address.fromString(address), "entranceFeeNumer", "entranceFeeNumer():(uint256)").returns([
    ethereum.Value.fromUnsignedBigInt(numerator),
  ]);

  createMockedFunction(Address.fromString(address), "entranceFeeDenom", "entranceFeeDenom():(uint256)").returns([
    ethereum.Value.fromUnsignedBigInt(denominator),
  ]);
}

export function mockVaultInputBalance(address: string, inputTokenBalance: BigInt): void {
  createMockedFunction(
    Address.fromString(address),
    "calcPoolValueInToken",
    "calcPoolValueInToken():(uint256)",
  ).returns([ethereum.Value.fromUnsignedBigInt(inputTokenBalance)]);
}

export function mockVaultSupply(address: string, outputTokenBalance: BigInt): void {
  createMockedFunction(
    Address.fromString(address),
    "totalSupply",
    "totalSupply():(uint256)",
  ).returns([ethereum.Value.fromUnsignedBigInt(outputTokenBalance)]);
}

export function mockVaultSharePrice(address: string, ratio: BigInt): void {
  createMockedFunction(
    Address.fromString(address),
    "getPricePerFullShare",
    "getPricePerFullShare():(uint256)",
  ).returns([ethereum.Value.fromUnsignedBigInt(ratio)]);
}
