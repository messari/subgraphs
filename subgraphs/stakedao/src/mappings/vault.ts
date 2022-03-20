import * as constants from "../common/constants";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  SetVaultCall,
} from "../../generated/Controller/EthereumController";

import { Vault as VaultTemplate } from "../../generated/templates";
import { getOrCreateToken, bigIntToPercentage } from "../common/utils";
import {
  Vault,
  VaultFee,
  YieldAggregator,
} from "../../generated/schema";
import { Vault as VaultContract } from "../../generated/templates/Vault/Vault";


export function handleSetVault(call: SetVaultCall): void {
  let vault = Vault.load(call.inputs._vault.toHexString());

  if (!vault) {
    vault = new Vault(call.inputs._vault.toHexString());
    const vaultContract = VaultContract.bind(Address.fromString(vault.id));
    vault.name = vaultContract.name();
    vault.symbol = vaultContract.symbol();
    vault.protocol = constants.ETHEREUM_PROTOCOL_ID;

    const inputToken = getOrCreateToken(call.inputs._token);
    vault.inputTokens = [inputToken.id];
    vault.inputTokenBalances = [constants.BIGDECIMAL_ZERO];

    const outputToken = getOrCreateToken(call.inputs._vault);
    vault.outputToken = outputToken.id;
    vault.outputTokenSupply = constants.BIGDECIMAL_ZERO;

    vault.totalVolumeUSD = constants.BIGDECIMAL_ZERO;
    vault.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

    vault.createdBlockNumber = call.block.number;
    vault.createdTimestamp = call.block.timestamp;

    const withdrawalFeeId = "withdrawal-fee-" + vault.id
    let withdrawalFee = new VaultFee(withdrawalFeeId)
    withdrawalFee.feeType = constants.VaultFeeType.WITHDRAWAL_FEE
    withdrawalFee.feePercentage = bigIntToPercentage(BigInt.fromI32(50))
    withdrawalFee.save()

    const performanceFeeId = "performance-fee-" + vault.id
    let performanceFee = new VaultFee(performanceFeeId)
    performanceFee.feeType = constants.VaultFeeType.PERFORMANCE_FEE
    performanceFee.feePercentage = bigIntToPercentage(BigInt.fromI32(1500))
    performanceFee.save()

    vault.fees = [withdrawalFeeId, performanceFeeId]
    vault.save();

    let protocol = YieldAggregator.load(constants.ETHEREUM_PROTOCOL_ID)
    if (protocol) {
      protocol.vaults.push(vault.id)
      protocol.save()
    }

    VaultTemplate.create(call.inputs._vault);
  }
}