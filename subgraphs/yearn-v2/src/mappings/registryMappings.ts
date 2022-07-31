import * as utils from "../common/utils";
import {
  NewVault,
  NewExperimentalVault,
} from "../../generated/Registry_v1/Registry_v1";
import { log } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import { getOrCreateVault } from "../common/initializers";
import { Vault as VaultContract } from "../../generated/Registry_v1/Vault";

export function handleNewVault(event: NewVault): void {
  const vaultAddress = event.params.vault;
  const tokenAddress = event.params.token;

  const vaultContract = VaultContract.bind(vaultAddress);
  const vaultVersion = utils.readValue<String>(
    vaultContract.try_apiVersion(),
    constants.VaultVersions.v0_3_0
  );

  // skipping yearn vaults with version less than 0.3.0
  if (vaultVersion.split(".")[1] == "2") {
    return;
  }

  const vault = getOrCreateVault(vaultAddress, event.block);

  log.warning("[NewVault] - VaultId: {}, TokenId: {}, TxHash: {}", [
    vault.id,
    tokenAddress.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}

export function handleNewExperimentalVault(event: NewExperimentalVault): void {
  const vaultAddress = event.params.vault;
  const tokenAddress = event.params.token;

  const vaultContract = VaultContract.bind(vaultAddress);
  const vaultVersion = utils.readValue<String>(
    vaultContract.try_apiVersion(),
    constants.VaultVersions.v0_3_0
  );

  // skipping yearn vaults with version less than 0.3.0
  if (vaultVersion.split(".")[1] == "2") {
    return;
  }

  const vault = getOrCreateVault(vaultAddress, event.block);

  log.warning("[NewExperimentalVault] - VaultId: {}, TokenId: {}, TxHash: {}", [
    vault.id,
    tokenAddress.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}
