import { getDaysSinceEpoch, getHoursSinceEpoch } from "./time";
import { ethereum } from "@graphprotocol/graph-ts";
import {
  Vault,
  VaultDailySnapshot,
  VaultHourlySnapshot,
} from "../../generated/schema";
import { BIGDECIMAL_ZERO } from "../prices/common/constants";
import {
  getOrCreateFinancials,
  getOrCreateVaultDailySnapshot,
  getOrCreateVaultHourlySnapshot,
  getOrCreateYieldAggregator,
  getVaultDailyId,
} from "./getters";
import { updateProtocolTVL } from "../mappings/protocol";

export function updateVaultSnapshots(
  event: ethereum.Event,
  vault: Vault
): void {
  const vaultDailySnapshot = getOrCreateVaultDailySnapshot(vault.id, event);
  vaultDailySnapshot.totalValueLockedUSD = vault.totalValueLockedUSD;
  vaultDailySnapshot.inputTokenBalance = vault.inputTokenBalance;
  vaultDailySnapshot.outputTokenSupply = vault.outputTokenSupply;
  vaultDailySnapshot.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  vaultDailySnapshot.pricePerShare = vault.pricePerShare;
  vaultDailySnapshot.save();

  const vaultHourlySnapshot = getOrCreateVaultHourlySnapshot(vault.id, event);
  vaultHourlySnapshot.totalValueLockedUSD = vault.totalValueLockedUSD;
  vaultHourlySnapshot.inputTokenBalance = vault.inputTokenBalance;
  vaultHourlySnapshot.outputTokenSupply = vault.outputTokenSupply;
  vaultHourlySnapshot.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  vaultHourlySnapshot.pricePerShare = vault.pricePerShare;
  vaultHourlySnapshot.save();
}
