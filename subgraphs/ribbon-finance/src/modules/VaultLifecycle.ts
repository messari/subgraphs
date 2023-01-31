import {
  getOrCreateToken,
  getOrCreateVault,
} from "../common/initalizers";
import { Vault } from "../../generated/schema";
import { Address, ethereum, log } from "@graphprotocol/graph-ts";

export function rollToNextOption(
  vaultAddress: Address,
  block: ethereum.Block
): void {

  const vaultStore = Vault.load(vaultAddress.toHexString());
  if (!vaultStore) return;
  const vault = getOrCreateVault(vaultAddress, block);
  const outputToken = getOrCreateToken(vaultAddress, block, vaultAddress, true);
  vault.outputToken = outputToken.id;
  vault.save()
    log.warning("[RollToNextOption] vaultAddress {} outputToken {}", [vaultAddress.toHexString(),outputToken.id]);
  
}
