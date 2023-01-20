import {
  getOrCreateToken,
  getOrCreateVault,
} from "../common/initalizers";
import * as utils from "../common/utils";
import { Vault } from "../../generated/schema";
import * as constants from "../common/constants";
import { Address, ethereum, log } from "@graphprotocol/graph-ts";
import { RibbonThetaVaultWithSwap as VaultContract } from "../../generated/ETHCallV2/RibbonThetaVaultWithSwap";

export function rollToNextOption(
  vaultAddress: Address,
  block: ethereum.Block
): void {

  const vaultStore = Vault.load(vaultAddress.toHexString());
  if (!vaultStore) return;
  const vault = getOrCreateVault(vaultAddress, block);
  const vaultContract = VaultContract.bind(vaultAddress);
  const currentOption = utils.readValue(
    vaultContract.try_currentOption(),
    constants.NULL.TYPE_ADDRESS
    );
    const outputToken = getOrCreateToken(currentOption, block, vaultAddress, true);
  vault.outputToken = outputToken.id;
  vault.save()
    log.warning("[RollToNextOption] vaultAddress {} outputToken {}", [vaultAddress.toHexString(),outputToken.id]);
  
}
