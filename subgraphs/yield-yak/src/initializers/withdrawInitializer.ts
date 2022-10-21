import { Withdraw } from "../../generated/schema";
import { Withdraw as WithdrawEvent } from "../../generated/YakStrategyV2/YakStrategyV2";

export function initWithdraw(event: WithdrawEvent): Withdraw {
  const contractAddress = event.address;
  const transactionHash = event.transaction.hash;
  const logIndex = event.logIndex;

  let withdraw = Withdraw.load(transactionHash.toHexString().concat("-").concat(logIndex.toHexString()));
  if (withdraw == null) {
    withdraw = new Withdraw(transactionHash.toHexString().concat("-").concat(logIndex.toHexString()));
  }
  
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.to = contractAddress.toHexString();
  withdraw.from = event.transaction.from.toHexString();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.amount = event.params.amount;

  return withdraw;
}