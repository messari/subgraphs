import { Deposit } from "../../generated/schema";
import { Deposit as DepositEvent } from "../../generated/YakStrategyV2/YakStrategyV2";

export function initDeposit(event: DepositEvent): Deposit {
    const transactionHash = event.transaction.hash;
    const logIndex = event.logIndex;
    
    let deposit = Deposit.load(transactionHash.toHexString().concat("-").concat(logIndex.toHexString()));
  
    if (deposit == null) {
      deposit = new Deposit(transactionHash.toHexString().concat("-").concat(logIndex.toHexString()));
    }
  
    deposit.hash = event.transaction.hash.toHexString();
    deposit.logIndex = event.logIndex.toI32();
    deposit.to = event.address.toHexString();
    deposit.from = event.transaction.from.toHexString();
    deposit.blockNumber = event.block.number;
    deposit.timestamp = event.block.timestamp;
    deposit.amount = event.params.amount;

    return deposit;
}