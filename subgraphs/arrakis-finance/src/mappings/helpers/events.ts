import { Address, dataSource } from "@graphprotocol/graph-ts";

import { Deposit, Withdraw } from "../../../generated/schema";
import { BIGINT_ZERO } from "../../common/constants";
import { getOrCreateUnderlyingToken } from "./vault";

// Create deposit entity corresponding to hypervisor deposit events
export function createDeposit(event: DepositEvent): void {
    const vaultId = event.address.toHex();
  
    // { Transaction hash }-{ Log index }
    let deposit = new Deposit(
      event.transaction.hash
        .toHex()
        .concat("-")
        .concat(event.logIndex.toString())
    );
    deposit.hash = event.transaction.hash.toHex();
    deposit.logIndex = event.logIndex.toI32();
    deposit.protocol = REGISTRY_ADDRESS_MAP.get(dataSource.network())!.toHex();
    deposit.to = vaultId;
    deposit.from = event.params.sender.toHex();
    deposit.blockNumber = event.block.number;
    deposit.timestamp = event.block.timestamp;
    deposit.asset = vaultId;
    deposit.amount = BIGINT_ZERO;
    deposit.vault = event.address.toHex();
  
    // Get underlying tokens to calculate USD value
    let underlyingToken = getOrCreateUnderlyingToken(event.address);
    deposit.amountUSD = getDualTokenUSD(
      Address.fromString(underlyingToken.token0),
      Address.fromString(underlyingToken.token1),
      event.params.amount0,
      event.params.amount1,
      event.block.number
    );
  
    deposit.save();
  }
  
  // Create withdraw entity corresponding to hypervisor withdraw events
  export function createWithdraw(event: WithdrawEvent): void {
    const vaultId = event.address.toHex();
  
    // { Transaction hash }-{ Log index }
    let withdrawal = new Withdraw(
      event.transaction.hash
        .toHex()
        .concat("-")
        .concat(event.logIndex.toString())
    );
    withdrawal.hash = event.transaction.hash.toHex();
    withdrawal.logIndex = event.logIndex.toI32();
    withdrawal.protocol = REGISTRY_ADDRESS_MAP.get(dataSource.network())!.toHex();
    withdrawal.to = event.params.to.toHex();
    withdrawal.from = vaultId;
    withdrawal.blockNumber = event.block.number;
    withdrawal.timestamp = event.block.timestamp;
    withdrawal.asset = vaultId;
    withdrawal.amount = BIGINT_ZERO;
    withdrawal.vault = event.address.toHex();
  
    // Get underlying tokens to calculate USD value
    let underlyingToken = getOrCreateUnderlyingToken(event.address);
    withdrawal.amountUSD = getDualTokenUSD(
      Address.fromString(underlyingToken.token0),
      Address.fromString(underlyingToken.token1),
      event.params.amount0,
      event.params.amount1,
      event.block.number
    );
  
    withdrawal.save();
  }