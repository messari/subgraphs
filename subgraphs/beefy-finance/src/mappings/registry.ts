import { BigInt } from "@graphprotocol/graph-ts";
import {
  BeefiVaultRegistryMATIC,
  OwnershipTransferred,
  VaultsRegistered,
  VaultsRetireStatusUpdated,
} from "../../generated/BeefiVaultRegistryMATIC/BeefiVaultRegistryMATIC";
import { Vault } from "../../generated/schema";
import { createVault } from "./vault";

const maticSuffix = "-137";

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleVaultsRegistered(event: VaultsRegistered): void {
  const vaults = event.params.vaults;

  for (let i = 0; i < vaults.length; i++) {
    let vault = Vault.load(vaults[i].toHexString() + maticSuffix);

    if (!vault) {
      createVault(vaults[i].toHexString(), event.block);
    }
  }
}

export function handleVaultsRetireStatusUpdated(
  event: VaultsRetireStatusUpdated
): void {}
