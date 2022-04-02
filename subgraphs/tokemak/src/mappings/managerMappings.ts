import { BigInt, Address, BigDecimal, log, ethereum } from "@graphprotocol/graph-ts";
import { PoolRegistered } from "../../generated/Manager/Manager";
import { Vault as VaultTemplate } from "../../generated/templates";
import { createRewardTokens} from "../common/tokens";
import {
  CURRENT_VAULTS,
} from "../common/constants";
import { getOrCreateProtocol } from "../common/protocol";
import { getOrCreateVault } from "../common/vaults";
import { Vault as VaultStore } from "../../generated/schema";

export function handlePoolRegistered(event: PoolRegistered): void {
  getOrCreateProtocol();
  createRewardTokens();

  const vault = getOrCreateVault(event.params.pool,event.block.number, event.block.timestamp);
  vault.createdBlockNumber = event.block.number;
  vault.createdTimestamp = event.block.timestamp;
  vault.save();

  // Register Current Vault if not already registered
  registerCurrentVaults(event);
}

/* 
    Automatically Registering All the Current vaults because 
    the vaults are registered later in the Manager Contract
    after they are deployed, hence it causes error in the
    subgraph
*/
export function registerCurrentVaults(event: ethereum.Event): void {
  for (let i = 0; i < CURRENT_VAULTS.length; i++) {
    const vaultAddress = Address.fromString(CURRENT_VAULTS[i])
    let vault = VaultStore.load(vaultAddress.toHexString());
    if(!vault){
      VaultTemplate.create(vaultAddress);
    }
  }
}