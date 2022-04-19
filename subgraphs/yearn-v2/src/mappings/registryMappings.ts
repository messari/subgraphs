import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  NewVault,
  NewExperimentalVault,
} from "../../generated/Registry_v1/Registry_v1";
import { Vault as VaultStore } from "../../generated/schema";
import { Vault as VaultTemplate } from "../../generated/templates";
import { Vault as VaultContract } from "../../generated/Registry_v1/Vault";

function getOrCreateVault(
  vaultAddress: Address,
  event: ethereum.Event
): VaultStore {
  let vault = VaultStore.load(vaultAddress.toHexString());

  if (!vault) {
    vault = new VaultStore(vaultAddress.toHexString());
    const vaultContract = VaultContract.bind(Address.fromString(vault.id));
    vault.protocol = constants.ETHEREUM_PROTOCOL_ID;
    vault.name = vaultContract.name();
    vault.symbol = vaultContract.symbol();
    const inputToken = utils.getOrCreateToken(vaultContract.token());
    vault.inputTokens = [inputToken.id];
    vault.inputTokenBalances = [constants.BIGINT_ZERO];
    const outputToken = utils.getOrCreateToken(Address.fromString(vault.id));
    vault.outputToken = outputToken.id;
    vault.outputTokenSupply = constants.BIGINT_ZERO;
    vault.totalVolumeUSD = constants.BIGDECIMAL_ZERO;
    vault.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    vault.createdBlockNumber = event.block.number;
    vault.createdTimestamp = event.block.timestamp;

    const managementFeeId = "management-fee-" + vaultAddress.toHexString();
    let managementFee = utils.readValue<BigInt>(
      vaultContract.try_managementFee(),
      constants.DEFAULT_MANAGEMENT_FEE
    );
    utils.createFeeType(
      managementFeeId,
      constants.VaultFeeType.MANAGEMENT_FEE,
      managementFee
    );

    const performanceFeeId = "performance-fee-" + vaultAddress.toHexString();
    let performanceFee = utils.readValue<BigInt>(
      vaultContract.try_performanceFee(),
      constants.DEFAULT_PERFORMANCE_FEE
    );
    utils.createFeeType(
      performanceFeeId,
      constants.VaultFeeType.PERFORMANCE_FEE,
      performanceFee
    );

    vault.fees = [managementFeeId, performanceFeeId];
    vault.save();

    VaultTemplate.create(vaultAddress);
  }
  return vault;
}

export function handleNewVault(event: NewVault): void {
  const vaultAddress = event.params.vault;

  let protocol = utils.getOrCreateYieldAggregator(
    constants.ETHEREUM_PROTOCOL_ID
  );
  let vaultIds = protocol._vaultIds;

  vaultIds!.push(vaultAddress.toHexString());
  protocol._vaultIds = vaultIds;
  protocol.save();

  getOrCreateVault(vaultAddress, event);
  
  log.warning("[NewVault]\n - TxHash: {}, VaultId: {}, TokenId: {}", [
    event.transaction.hash.toHexString(),
    event.params.vault.toHexString(),
    event.params.token.toHexString(),
  ]);
}

export function handleNewExperimentalVault(event: NewExperimentalVault): void {
  const vaultAddress = event.params.vault;

  let protocol = utils.getOrCreateYieldAggregator(
    constants.ETHEREUM_PROTOCOL_ID
  );
  let vaultIds = protocol._vaultIds;

  vaultIds!.push(vaultAddress.toHexString());
  protocol._vaultIds = vaultIds;
  protocol.save();

  getOrCreateVault(vaultAddress, event);
  
  log.warning("[NewExperimentalVault]\n - TxHash: {}, VaultId: {}, TokenId: {}", [
    event.transaction.hash.toHexString(),
    event.params.vault.toHexString(),
    event.params.token.toHexString(),
  ]);
}
