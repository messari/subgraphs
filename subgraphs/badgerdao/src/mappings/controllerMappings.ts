import * as utils from "../common/utils";
import { log } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import {
  SetVaultCall,
  SetStrategyCall,
} from "../../generated/templates/Controller/Controller";
import { getOrCreateVault } from "../common/initializers";

export function handleSetVault(call: SetVaultCall): void {
  const controllerAddress = call.to;
  const vaultAddress = call.inputs._vault;
  const lpTokenAddress = call.inputs._token;
  const strategyAddress = utils.getVaultStrategy(vaultAddress, lpTokenAddress);

  const vault = getOrCreateVault(vaultAddress, call.block);

  log.warning(
    "[SetVault] Controller: {}, Vault: {}, Strategy: {}, TxnHash: {}",
    [
      controllerAddress.toHexString(),
      vault.id,
      strategyAddress.toHexString(),
      call.transaction.hash.toHexString(),
    ]
  );
}

export function handleSetStrategy(call: SetStrategyCall): void {
  const controllerAddress = call.to;
  const lpTokenAddress = call.inputs._token;
  const strategyAddress = call.inputs._strategy;

  const vaultAddress = utils.getVaultAddressFromController(
    controllerAddress,
    lpTokenAddress
  );

  if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  const vault = getOrCreateVault(vaultAddress, call.block);
  vault._strategy = strategyAddress.toHexString();
  vault.save();

  log.warning(
    "[SetStrategy] Controller: {}, Vault: {}, Strategy: {}, TxnHash: {}",
    [
      controllerAddress.toHexString(),
      vault.id,
      strategyAddress.toHexString(),
      call.transaction.hash.toHexString(),
    ]
  );
}
