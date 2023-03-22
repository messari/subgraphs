import { Address, dataSource } from "@graphprotocol/graph-ts";

import { Deposit, Withdraw } from "../../../generated/schema";
import {
  Minted,
  Burned,
} from "../../../generated/templates/ArrakisVault/ArrakisVaultV1";
import { BIGINT_ZERO, REGISTRY_ADDRESS_MAP } from "../../common/constants";
import { getDualTokenUSD } from "./pricing";
import { getOrCreateVault } from "./vaults";

// Create deposit entity corresponding to vault Minted events
export function createDeposit(event: Minted): void {
  const vaultId = event.address.toHex();
  const vault = getOrCreateVault(event.address, event.block);

  // { Transaction hash }-{ Log index }
  const deposit = new Deposit(
    event.transaction.hash.toHex().concat("-").concat(event.logIndex.toString())
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
  deposit.amountUSD = getDualTokenUSD(
    Address.fromString(vault._token0),
    Address.fromString(vault._token1),
    event.params.amount0In,
    event.params.amount1In,
    event.block
  );

  deposit.save();
}

// Create withdraw entity corresponding to hypervisor withdraw events
export function createWithdraw(event: Burned): void {
  const vaultId = event.address.toHex();
  const vault = getOrCreateVault(event.address, event.block);

  // { Transaction hash }-{ Log index }
  const withdrawal = new Withdraw(
    event.transaction.hash.toHex().concat("-").concat(event.logIndex.toString())
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
  withdrawal.amountUSD = getDualTokenUSD(
    Address.fromString(vault._token0),
    Address.fromString(vault._token1),
    event.params.amount0Out,
    event.params.amount1Out,
    event.block
  );

  withdrawal.save();
}
