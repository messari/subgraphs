import { _NewVault } from "../modules/Vault";
import { log } from "@graphprotocol/graph-ts";
import {
  NewVault,
  NewExperimentalVault,
} from "../../generated/Registry_v1/Registry_v1";
import * as constants from "../common/constants";
import { getOrCreateYieldAggregator } from "../common/initializers";

export function handleNewVault(event: NewVault): void {
  const vaultAddress = event.params.vault;

  let protocol = getOrCreateYieldAggregator(constants.ETHEREUM_PROTOCOL_ID);
  let vaultIds = protocol._vaultIds;

  vaultIds!.push(vaultAddress.toHexString());
  protocol._vaultIds = vaultIds;
  protocol.save();

  _NewVault(vaultAddress, event.block);

  log.warning("[NewVault]\n - TxHash: {}, VaultId: {}, TokenId: {}", [
    event.transaction.hash.toHexString(),
    event.params.vault.toHexString(),
    event.params.token.toHexString(),
  ]);
}

export function handleNewExperimentalVault(event: NewExperimentalVault): void {
  const vaultAddress = event.params.vault;

  let protocol = getOrCreateYieldAggregator(constants.ETHEREUM_PROTOCOL_ID);
  let vaultIds = protocol._vaultIds;

  vaultIds!.push(vaultAddress.toHexString());
  protocol._vaultIds = vaultIds;
  protocol.save();

  _NewVault(vaultAddress, event.block);

  log.warning(
    "[NewExperimentalVault]\n - TxHash: {}, VaultId: {}, TokenId: {}",
    [
      event.transaction.hash.toHexString(),
      event.params.vault.toHexString(),
      event.params.token.toHexString(),
    ]
  );
}
