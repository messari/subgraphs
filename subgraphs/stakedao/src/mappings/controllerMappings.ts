import * as utils from "../common/utils";
import * as constants from "../common/constants";
import {
  SetVaultCall,
  SetStrategyCall,
  RevokeStrategyCall,
} from "../../generated/Controller/EthereumController";

import { getOrCreateStrategy } from "../modules/Strategy";
import { Vault as VaultStore } from "../../generated/schema";
import { Address, log, store } from "@graphprotocol/graph-ts";
import { Vault as VaultTemplate } from "../../generated/templates";
import { Vault as VaultContract } from "../../generated/templates/Vault/Vault";
import { EthereumController as ControllerContract } from "../../generated/Controller/EthereumController";

export function handleSetVault(call: SetVaultCall): void {
  const controllerAddress = call.to;
  const vaultAddress = call.inputs._vault;
  const inputTokenAddress = call.inputs._token;

  const vault = new VaultStore(vaultAddress.toHexString());
  const vaultContract = VaultContract.bind(vaultAddress);

  vault.name = vaultContract.name();
  vault.symbol = vaultContract.symbol();
  vault.protocol = constants.ETHEREUM_PROTOCOL_ID;

  const inputToken = utils.getOrCreateToken(inputTokenAddress);
  vault.inputTokens = [inputToken.id];
  vault.inputTokenBalances = [constants.BIGINT_ZERO];

  const outputToken = utils.getOrCreateToken(vaultAddress);
  vault.outputToken = outputToken.id;
  vault.outputTokenSupply = constants.BIGINT_ZERO;

  vault.totalVolumeUSD = constants.BIGDECIMAL_ZERO;
  vault.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

  vault.rewardTokenEmissionsAmount = [constants.BIGINT_ZERO];
  vault.rewardTokenEmissionsUSD = [constants.BIGDECIMAL_ZERO];

  vault.createdBlockNumber = call.block.number;
  vault.createdTimestamp = call.block.timestamp;

  VaultTemplate.create(vaultAddress);
  vault.save();

  const strategyAddress = getOrCreateStrategy(
    controllerAddress,
    vaultAddress,
    inputTokenAddress
  );

  let protocol = utils.getOrCreateYieldAggregator(constants.ETHEREUM_PROTOCOL_ID);
  protocol._vaultIds.push(vaultAddress.toHexString());
  protocol.save();

  log.warning("[SetVault]\n - TxHash: {}, VaultId: {}, StrategyId: {}", [
    call.transaction.hash.toHexString(),
    call.inputs._vault.toHexString(),
    strategyAddress,
  ]);
}

export function handleSetStrategy(call: SetStrategyCall): void {
  const controllerAddress = call.to;
  const inputTokenAddress = call.inputs._token;
  const newStrategyAddress = call.inputs._strategy;

  let controller = ControllerContract.bind(controllerAddress);
  const vaultAddress = utils.readValue<Address>(
    controller.try_vaults(inputTokenAddress),
    constants.ZERO_ADDRESS
  );

  const vault = VaultStore.load(vaultAddress.toHexString());

  if (vault) {
    getOrCreateStrategy(
      controllerAddress,
      vaultAddress,
      inputTokenAddress,
      newStrategyAddress
    );

    log.warning("[SetStrategy]\n TxHash: {}, VaultId: {}, Strategy: {}", [
      call.transaction.hash.toHexString(),
      vaultAddress.toHexString(),
      newStrategyAddress.toHexString(),
    ]);
  }
}

export function handleRevokeStrategy(call: RevokeStrategyCall): void {
  store.remove("_Strategy", call.inputs._strategy.toHexString());

  log.warning("[RevokeStrategy]\n TxHash: {}, StrategyId: {}", [
    call.transaction.hash.toHexString(),
    call.inputs._strategy.toHexString(),
  ]);
}
