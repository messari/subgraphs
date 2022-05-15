import { Address, BigDecimal, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { Vault, VaultFee } from "../../generated/schema";
import { Hypervisor as HypervisorContract } from "../../generated/templates/Hypervisor/Hypervisor";
import {
  BIGINT_ZERO,
  PROTOCOL_PERFORMANCE_FEE,
  REGISTRY_ADDRESS,
  VaultFeeType,
} from "../common/constants";
import { getOrCreateToken } from "../common/getters";

export function getOrCreateVault(vaultAddress: Address, block: ethereum.Block): Vault {
  let vaultId = vaultAddress.toHexString();
  let vault = Vault.load(vaultId);
  if (!vault) {
    let hypeContract = HypervisorContract.bind(vaultAddress);

    // Create relevant tokens
    let outputToken = getOrCreateToken(vaultAddress);

    vault = new Vault(vaultId);
    vault.protocol = REGISTRY_ADDRESS.mustGet(dataSource.network());
    vault.name = hypeContract.name();
    vault.symbol = hypeContract.symbol();
    vault.inputToken = "";
    vault.outputToken = outputToken.id;
    // vault.rewardTokens = [];
    vault.depositLimit = BIGINT_ZERO;
    vault.createdTimestamp = block.timestamp;
    vault.createdBlockNumber = block.number;
    vault.totalValueLockedUSD = BigDecimal.zero();
    vault.inputTokenBalance = BIGINT_ZERO;
    vault.outputTokenSupply = hypeContract.totalSupply();
    vault.outputTokenPriceUSD = BigDecimal.zero();
    vault.pricePerShare = BigDecimal.zero();
    // vault.stakedOutputTokenAmount = BIGINT_ZERO;
    // vault.rewardTokenEmissionsAmount = [];
    // vault.rewardTokenEmissionsUSD = [];

    let vaultPerformanceFee = createVaultFee(
      VaultFeeType.PERFORMANCE_FEE,
      PROTOCOL_PERFORMANCE_FEE,
      vaultId
    );
    vault.fees = [vaultPerformanceFee.id];
    vault.save();
  }
  return vault;
}

export function createVaultFee(
  feeType: string,
  feePercentage: BigDecimal,
  vaultAddress: string
): VaultFee {
  let vaultFee = new VaultFee(feeType + "-" + vaultAddress);
  vaultFee.feePercentage = feePercentage;
  vaultFee.feeType = feeType;
  vaultFee.save();

  return vaultFee;
}
