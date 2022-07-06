import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getOrCreateToken } from "../common/initializers";
import { Vault as VaultStore } from "../../generated/schema";
import { Vault as VaultTemplate } from "../../generated/templates";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Vault as VaultContract } from "../../generated/Registry_v1/Vault";

export function _NewVault(
  vaultAddress: Address,
  block: ethereum.Block
): void {
  const vaultAddressString = vaultAddress.toHexString();
  const vaultContract = VaultContract.bind(vaultAddress);

  const vaultVersion = utils.readValue<String>(
    vaultContract.try_apiVersion(),
    constants.VaultVersions.v0_3_0
  );

  // skipping yearn vaults with version less than 0.3.0
  if (vaultVersion.split(".")[1] == "2") {
    return
  }

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

    vault.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vault.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vault.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    
    vault.lastReport = constants.BIGINT_ZERO;
    vault.totalAssets = constants.BIGINT_ZERO;

    const managementFeeId =
      utils.enumToPrefix(constants.VaultFeeType.MANAGEMENT_FEE) +
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
      utils.enumToPrefix(constants.VaultFeeType.PERFORMANCE_FEE) +
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
}
