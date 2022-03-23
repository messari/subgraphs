import * as constants from "../common/constants";
import {
  RevokeStrategyCall,
  SetStrategyCall,
  SetVaultCall,
} from "../../generated/Controller/EthereumController";

import { getOrCreateToken } from "../common/utils";
import { Address, log } from "@graphprotocol/graph-ts";
import { getOrCreateStrategy } from "../modules/Strategy";
import { Vault as VaultTemplate } from "../../generated/templates";
import { Vault as VaultStore, YieldAggregator } from "../../generated/schema";
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

  const inputToken = getOrCreateToken(inputTokenAddress);
  vault.inputTokens = [inputToken.id];
  vault.inputTokenBalances = [constants.BIGDECIMAL_ZERO];

  const outputToken = getOrCreateToken(vaultAddress);
  vault.outputToken = outputToken.id;
  vault.outputTokenSupply = constants.BIGDECIMAL_ZERO;

  vault.totalVolumeUSD = constants.BIGDECIMAL_ZERO;
  vault.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

  vault.createdBlockNumber = call.block.number;
  vault.createdTimestamp = call.block.timestamp;

  VaultTemplate.create(vaultAddress);
  vault.save();

  const strategyAddress = getOrCreateStrategy(
    controllerAddress,
    vaultAddress,
    inputTokenAddress
  );

  let protocol = YieldAggregator.load(constants.ETHEREUM_PROTOCOL_ID);
  if (protocol) {
    protocol.vaults.push(vaultAddress.toHexString());
    protocol.save();
  }

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
  let try_vaultAddress = controller.try_vaults(inputTokenAddress);

  const vaultAddress = try_vaultAddress.reverted
    ? constants.ZERO_ADDRESS
    : try_vaultAddress.value.toHex();

  const vault = VaultStore.load(vaultAddress);

  if (vault) {
    getOrCreateStrategy(
      controllerAddress,
      Address.fromString(vaultAddress),
      inputTokenAddress,
      newStrategyAddress
    );

    log.warning("[SetStrategy]\n TxHash: {}, VaultId: {}, Strategy: {}", [
      call.transaction.hash.toHexString(),
      vaultAddress,
      newStrategyAddress.toHexString(),
    ]);
  }
}

export function handleRevokeStrategy(call: RevokeStrategyCall): void {}
