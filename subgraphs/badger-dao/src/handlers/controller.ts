import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { BadgerController, SetStrategyCall, SetVaultCall } from "../../generated/badger-wbtc/BadgerController";
import { BadgerSett } from "../../generated/badger-wbtc/BadgerSett";
import { Vault } from "../../generated/schema";
import { SettVault } from "../../generated/templates";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, NULL_ADDRESS } from "../constant";
import { getOrCreateProtocol } from "../entities/Protocol";
import { getOrCreateStrategy } from "../entities/Strategy";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateVault } from "../entities/Vault";
import { readValue } from "../utils/contracts";

export function handleSetVault(call: SetVaultCall): void {
  const controllerAddress = call.to;
  const vaultAddress = call.inputs._vault;
  const inputTokenAddress = call.inputs._token;

  const vault = getOrCreateVault(vaultAddress, call.block);
  const vaultContract = BadgerSett.bind(vaultAddress);

  let protocol = getOrCreateProtocol();
  vault.name = readValue<string>(vaultContract.try_name(), "");
  vault.symbol = readValue<string>(vaultContract.try_symbol(), "");
  vault.protocol = protocol.id;

  vault.depositLimit = readValue<BigInt>(vaultContract.try_max(), BIGINT_ZERO);

  const inputToken = getOrCreateToken(inputTokenAddress);
  vault.inputTokens = [inputToken.id];
  vault.inputTokenBalances = [BIGINT_ZERO];

  const outputToken = getOrCreateToken(vaultAddress);
  vault.outputToken = outputToken.id;
  vault.outputTokenSupply = BIGINT_ZERO;

  vault.totalVolumeUSD = BIGDECIMAL_ZERO;
  vault.totalValueLockedUSD = BIGDECIMAL_ZERO;

  vault.rewardTokenEmissionsAmount = [BIGINT_ZERO];
  vault.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

  vault.save();
  SettVault.create(vaultAddress);

  const strategyAddress = getOrCreateStrategy(controllerAddress, vaultAddress, inputTokenAddress);

  log.warning("[BADGER] vault found : vault {}, strategy {}", [vaultAddress.toHex(), strategyAddress.toHex()]);
}

export function handleSetStrategy(call: SetStrategyCall): void {
  const controllerAddress = call.to;
  const inputTokenAddress = call.inputs._token;
  const newStrategyAddress = call.inputs._strategy;

  let controller = BadgerController.bind(controllerAddress);
  const vaultAddress = readValue<Address>(controller.try_vaults(inputTokenAddress), NULL_ADDRESS);

  let vault = Vault.load(vaultAddress.toHex());
  if (vault) {
    getOrCreateStrategy(controllerAddress, vaultAddress, inputTokenAddress, newStrategyAddress);
  }

  log.warning("[BADGER] new strategy found : vault {}, strategy {}", [vaultAddress.toHex(), newStrategyAddress.toHex()]);
}
