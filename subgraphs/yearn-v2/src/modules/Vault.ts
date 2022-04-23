import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { enumToPrefix } from "../common/strings";
import { getOrCreateToken } from "../common/initializers";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Vault as VaultStore } from "../../generated/schema";
import { Vault as VaultTemplate } from "../../generated/templates";
import { Vault as VaultContract } from "../../generated/Registry_v1/Vault";

export function _NewVault(
  vaultAddress: Address,
  block: ethereum.Block
): VaultStore {
  const vaultAddressString = vaultAddress.toHexString();
  const vaultContract = VaultContract.bind(vaultAddress);

  let vault = VaultStore.load(vaultAddressString);

  if (!vault) {
    vault = new VaultStore(vaultAddressString);

    vault.name = utils.readValue<string>(vaultContract.try_name(), "");
    vault.symbol = utils.readValue<string>(vaultContract.try_symbol(), "");
    vault.protocol = constants.ETHEREUM_PROTOCOL_ID;
    vault.depositLimit = utils.readValue<BigInt>(
      vaultContract.try_depositLimit(),
      constants.BIGINT_ZERO
    );
    
    const inputToken = getOrCreateToken(vaultContract.token());
    vault.inputToken = inputToken.id;
    vault.inputTokenBalance = constants.BIGINT_ZERO;
    
    const outputToken = getOrCreateToken(vaultAddress);
    vault.outputToken = outputToken.id;
    vault.outputTokenSupply = constants.BIGINT_ZERO;

    vault.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
    vault.pricePerShare = constants.BIGDECIMAL_ZERO;
    
    vault.createdBlockNumber = block.number;
    vault.createdTimestamp = block.timestamp;

    vault.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    vault.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

    const managementFeeId =
      enumToPrefix(constants.VaultFeeType.MANAGEMENT_FEE) +
      vaultAddress.toHexString();
    let managementFee = utils.readValue<BigInt>(
      vaultContract.try_managementFee(),
      constants.DEFAULT_MANAGEMENT_FEE
    );
    utils.createFeeType(
      managementFeeId,
      constants.VaultFeeType.MANAGEMENT_FEE,
      managementFee
    );

    const performanceFeeId =
      enumToPrefix(constants.VaultFeeType.PERFORMANCE_FEE) +
      vaultAddress.toHexString();
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
