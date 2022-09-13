import * as utils from "../common/utils";
import { log } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import {
  SetVaultCall,
  SetStrategyCall,
  RevokeStrategyCall,
} from "../../generated/templates/Controller/Controller";
import { getOrCreateVault } from "../common/initializers";

export function handleSetVault(call: SetVaultCall): void {
  const controllerAddress = call.to;
  const vaultAddress = call.inputs._vault;
  const wantTokenAddress = call.inputs._token;

  const strategyAddress = utils.getStrategyAddressFromController(
    controllerAddress,
    wantTokenAddress
  );

  const vault = getOrCreateVault(vaultAddress, call.block);
  utils.checkStrategyAdded(vaultAddress, call.block);

  vault._strategy = strategyAddress.toHexString();
  vault.save();

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
  const strategyAddress = call.inputs._strategy;
  const wantTokenAddress = call.inputs._token;

  const vaultAddress = utils.getVaultAddressFromController(
    controllerAddress,
    wantTokenAddress
  );

  if (vaultAddress.notEqual(constants.NULL.TYPE_ADDRESS)) {
    const vault = getOrCreateVault(vaultAddress, call.block);

    vault._strategy = strategyAddress.toHexString();
    vault.save();
    
    utils.checkStrategyAdded(vaultAddress, call.block);

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
}

export function handleRevokeStrategy(call: RevokeStrategyCall): void {
  const controllerAddress = call.to;
  const wantTokenAddress = call.inputs._token;

  const vaultAddress = utils.getVaultAddressFromController(
    controllerAddress,
    wantTokenAddress
  );

  const vault = getOrCreateVault(vaultAddress, call.block);
  vault._strategy = constants.NULL.TYPE_STRING;
  vault.save();

  log.warning("[RevokeStrategy] Controller: {}, Vault: {}, TxnHash: {}", [
    controllerAddress.toHexString(),
    vault.id,
    call.transaction.hash.toHexString(),
  ]);
}
