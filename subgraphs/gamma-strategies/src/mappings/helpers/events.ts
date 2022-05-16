import { BigDecimal, dataSource } from "@graphprotocol/graph-ts";
import { Deposit, Withdraw } from "../../../generated/schema";
import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
} from "../../../generated/templates/Hypervisor/Hypervisor";
import { BIGINT_ZERO, REGISTRY_ADDRESS } from "../../common/constants";

export function createDeposit(event: DepositEvent): void {
  const vaultId = event.address.toHex();

  let deposit = new Deposit(
    event.transaction.hash
      .toHex()
      .concat("-")
      .concat(event.logIndex.toString())
  );
  deposit.hash = event.transaction.hash.toHex();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = REGISTRY_ADDRESS.mustGet(dataSource.network());
  deposit.to = vaultId;
  deposit.from = event.params.sender.toHex();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.asset = vaultId;
  deposit.amount = BIGINT_ZERO;
  deposit.amountUSD = BigDecimal.zero();
  deposit.vault = event.params.to.toHex();
  deposit.save();
}

// Generate the withdraw entity
export function createWithdraw(event: WithdrawEvent): void {
  const vaultId = event.address.toHex();

  let withdrawal = new Withdraw(
    event.transaction.hash
      .toHex()
      .concat("-")
      .concat(event.logIndex.toString())
  );
  withdrawal.hash = event.transaction.hash.toHex();
  withdrawal.logIndex = event.logIndex.toI32();
  withdrawal.protocol = REGISTRY_ADDRESS.mustGet(dataSource.network());
  withdrawal.to = event.params.to.toHex();
  withdrawal.from = vaultId;
  withdrawal.blockNumber = event.block.number;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.asset = vaultId;
  withdrawal.amount = BIGINT_ZERO;
  withdrawal.amountUSD = BigDecimal.zero();
  withdrawal.vault = event.params.to.toHex();
  withdrawal.save();
}
