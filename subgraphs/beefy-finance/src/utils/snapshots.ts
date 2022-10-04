import { getDaysSinceEpoch, getHoursSinceEpoch } from "./time";
import { ethereum } from "@graphprotocol/graph-ts";
import {
  Vault,
  VaultDailySnapshot,
  VaultHourlySnapshot,
} from "../../generated/schema";
import { BIGDECIMAL_ZERO } from "../prices/common/constants";
import { getOrCreateVaultDailySnapshot } from "./getters";

export function updateVaultDailySnapshot(
  block: ethereum.Block,
  vault: Vault
): VaultDailySnapshot {
  const id = getVaultDailyId(block, vault.id);
  let vaultDailySnapshot = getOrCreateVaultDailySnapshot(vault.id);
  vaultDailySnapshot.inputTokenBalance = vault.inputTokenBalance;
  if (vault.outputTokenSupply) {
    vaultDailySnapshot.outputTokenSupply = vault.outputTokenSupply;
  }
  if (vault.pricePerShare) {
    vaultDailySnapshot.pricePerShare = vault.pricePerShare;
  }
  vaultDailySnapshot.totalValueLockedUSD = vault.totalValueLockedUSD;
  vaultDailySnapshot.outputTokenPriceUSD = vault.outputTokenPriceUSD;

  vaultDailySnapshot.blockNumber = block.number;
  vaultDailySnapshot.timestamp = block.timestamp;
  vaultDailySnapshot.save();
  return vaultDailySnapshot;
}

export function updateVaultHourlySnapshot(
  block: ethereum.Block,
  vault: Vault
): VaultHourlySnapshot {
  const id = getVaultHourlyId(block, vault.id);
  let vaultHourlySnapshot = VaultHourlySnapshot.load(id);
  if (vaultHourlySnapshot == null) {
    vaultHourlySnapshot = new VaultHourlySnapshot(id);
    vaultHourlySnapshot.protocol = vault.protocol;
    vaultHourlySnapshot.vault = vault.id;
  }
  vaultHourlySnapshot.totalValueLockedUSD = vault.totalValueLockedUSD;
  vaultHourlySnapshot.inputTokenBalance = vault.inputTokenBalance;
  if (vault.outputTokenSupply) {
    vaultHourlySnapshot.outputTokenSupply = vault.outputTokenSupply;
  }
  if (vault.pricePerShare) {
    vaultHourlySnapshot.pricePerShare = vault.pricePerShare;
  }
  vaultHourlySnapshot.blockNumber = block.number;
  vaultHourlySnapshot.timestamp = block.timestamp;
  vaultHourlySnapshot.save();
  return vaultHourlySnapshot;
}
