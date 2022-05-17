import {
  Address,
  BigDecimal,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";
import { Vault, VaultFee, _UnderlyingToken } from "../../../generated/schema";
import { Hypervisor as HypervisorContract } from "../../../generated/templates/Hypervisor/Hypervisor";
import {
  BIGINT_ZERO,
  PROTOCOL_PERFORMANCE_FEE,
  REGISTRY_ADDRESS,
  VaultFeeType,
} from "../../common/constants";
import { getOrCreateToken } from "../../common/getters";

export function getOrCreateVault(
  vaultAddress: Address,
  block: ethereum.Block
): Vault {
  let vaultId = vaultAddress.toHex();
  let vault = Vault.load(vaultId);
  if (!vault) {
    let hypeContract = HypervisorContract.bind(vaultAddress);

    // Create relevant tokens
    getOrCreateUnderlyingToken(vaultAddress)
    getOrCreateToken(vaultAddress);

    vault = new Vault(vaultId);
    vault.protocol = REGISTRY_ADDRESS.mustGet(dataSource.network());
    vault.name = hypeContract.name();
    vault.symbol = hypeContract.symbol();
    vault.inputToken = vaultId;
    vault.outputToken = vaultId;
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

export function getOrCreateUnderlyingToken(vaultAddress: Address): _UnderlyingToken {
  const vaultId = vaultAddress.toHex()
  let underlyingToken = _UnderlyingToken.load(vaultId)
  if (!underlyingToken) {

    const hypeContract = HypervisorContract.bind(vaultAddress);

    const token0Address = hypeContract.token0()
    const token1Address = hypeContract.token1()
    const totalAmounts = hypeContract.getTotalAmounts()

    getOrCreateToken(token0Address)
    getOrCreateToken(token1Address)

    underlyingToken = new _UnderlyingToken(vaultId)
    underlyingToken.token0 = token0Address.toHex()
    underlyingToken.lastAmount0 = totalAmounts.value0
    underlyingToken.token1 = token1Address.toHex()
    underlyingToken.lastAmount1 = totalAmounts.value1
    underlyingToken.lastAmountBlockNumber = BIGINT_ZERO
    underlyingToken.save()
  }
  return underlyingToken
}

export function createVaultFee(
  feeType: string,
  feePercentage: BigDecimal,
  vaultId: string
): VaultFee {
  let vaultFee = new VaultFee(feeType.concat("-").concat(vaultId));
  vaultFee.feePercentage = feePercentage;
  vaultFee.feeType = feeType;
  vaultFee.save();

  return vaultFee;
}
