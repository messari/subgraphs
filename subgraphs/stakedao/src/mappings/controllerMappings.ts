import * as utils from "../common/utils";
import * as constants from "../common/constants";
import {
  SetVaultCall,
  SetStrategyCall,
} from "../../generated/Controller/EthereumController";
import { getOrCreateVault } from "../common/initializers";
import { log, DataSourceContext } from "@graphprotocol/graph-ts";
import { Strategy as StrategyTemplate } from "../../generated/templates";

export function handleSetVault(call: SetVaultCall): void {
  const controllerAddress = call.to;
  const vaultAddress = call.inputs._vault;
  const inputTokenAddress = call.inputs._token;

  if (vaultAddress.equals(constants.OBSCELETE_FRAX_VAULT_ADDRESS)) return;

  const vault = getOrCreateVault(vaultAddress, call.block);
  const strategyAddress = utils.getStrategyFromController(
    controllerAddress,
    inputTokenAddress
  );

  if (strategyAddress.notEqual(constants.NULL.TYPE_ADDRESS)) {
    vault.fees = utils.getVaultFees(vaultAddress, strategyAddress).stringIds();
    vault._strategy = strategyAddress.toHexString();
    vault.save();

    const context = new DataSourceContext();
    context.setString("vaultAddress", vaultAddress.toHexString());

    StrategyTemplate.createWithContext(strategyAddress, context);
  }

  log.warning("[SetVault] - VaultId: {}, StrategyId: {}, TxHash: {}", [
    vault.id,
    strategyAddress.toHexString(),
    call.transaction.hash.toHexString(),
  ]);
}

export function handleSetStrategy(call: SetStrategyCall): void {
  const controllerAddress = call.to;
  const inputTokenAddress = call.inputs._token;
  const strategyAddress = call.inputs._strategy;
  const vaultAddress = utils.getVaultFromController(
    controllerAddress,
    inputTokenAddress
  );

  if (
    vaultAddress.equals(constants.NULL.TYPE_ADDRESS) ||
    vaultAddress.equals(constants.OBSCELETE_FRAX_VAULT_ADDRESS)
  )
    return;

  const context = new DataSourceContext();
  context.setString("vaultAddress", vaultAddress.toHexString());
  StrategyTemplate.createWithContext(strategyAddress, context);

  const vault = getOrCreateVault(vaultAddress, call.block);

  vault.fees = utils.getVaultFees(vaultAddress, strategyAddress).stringIds();
  vault._strategy = strategyAddress.toHexString();
  vault.save();

  log.warning("[SetStrategy] VaultId: {}, Strategy: {}, TxHash: {}", [
    vaultAddress.toHexString(),
    strategyAddress.toHexString(),
    call.transaction.hash.toHexString(),
  ]);
}
