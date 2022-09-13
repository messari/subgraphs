import { Address, dataSource } from "@graphprotocol/graph-ts";

import { Deposit, Withdraw, _FeesEarned } from "../../../generated/schema";
import { Minted, Burned, FeesEarned } from "../../../generated/templates/ArrakisVault/ArrakisVaultV1"
import { BIGINT_ZERO, REGISTRY_ADDRESS_MAP } from "../../common/constants";
import { getDualTokenUSD } from "./pricing";
import { getOrCreateUnderlyingToken } from "./vaults";

// Create deposit entity corresponding to vault Minted events
export function createDeposit(event: Minted): void {
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
    deposit.from = event.params.receiver.toHex();
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
      event.params.amount0In,
      event.params.amount1In,
      event.block.number
    );
  
    deposit.save();
  }
  
  // Create withdraw entity corresponding to hypervisor withdraw events
  export function createWithdraw(event: Burned): void {
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
    withdrawal.to = event.transaction.from.toHex();
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
      event.params.amount0Out,
      event.params.amount1Out,
      event.block.number
    );
  
    withdrawal.save();
  }

  // Create rebalance entity corresponding to hypervisor rebalance events
export function createFeesEarned(event: FeesEarned): void {
  const vaultId = event.address.toHex();

  // { Transaction hash }-{ Log index }
  let feesEarned = new _FeesEarned(
    event.transaction.hash
      .toHex()
      .concat("-")
      .concat(event.logIndex.toString())
  );
  feesEarned.hash = event.transaction.hash.toHex();
  feesEarned.logIndex = event.logIndex.toI32();
  feesEarned.protocol = REGISTRY_ADDRESS_MAP.get(dataSource.network())!.toHex();
  feesEarned.to = event.address.toHex();
  feesEarned.from = event.transaction.from.toHex();
  feesEarned.blockNumber = event.block.number;
  feesEarned.timestamp = event.block.timestamp;
  feesEarned.fees0 = event.params.feesEarned0;
  feesEarned.fees1 = event.params.feesEarned1;
  feesEarned.vault = event.address.toHex();

  // Get underlying tokens to calculate USD value
  let underlyingToken = getOrCreateUnderlyingToken(event.address);
  feesEarned.feesUSD = getDualTokenUSD(
    Address.fromString(underlyingToken.token0),
    Address.fromString(underlyingToken.token1),
    event.params.feesEarned0,
    event.params.feesEarned1,
    event.block.number
  );

  feesEarned.save();
}