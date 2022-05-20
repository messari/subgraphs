import { BigInt } from "@graphprotocol/graph-ts";
import {
  BeefiVaultRegistryMATIC,
  OwnershipTransferred,
  VaultsRegistered,
  VaultsRetireStatusUpdated,
} from "../../generated/BeefiVaultRegistryMATIC/BeefiVaultRegistryMATIC";
import { Vault } from "../../generated/schema";
import { getVaultOrCreate } from "../utils/getters";

const maticSuffix = "-137";

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleVaultsRegistered(event: VaultsRegistered): void {
  const vaults = event.params.vaults;

  for (let i = 0; i < vaults.length; i++) {
    let vault = Vault.load(vaults[i].toHexString() + maticSuffix);

    if (!vault) {
      getVaultOrCreate(vaults[i], maticSuffix);
    }
  }
}

export function handleVaultsRetireStatusUpdated(
  event: VaultsRetireStatusUpdated
): void {}
