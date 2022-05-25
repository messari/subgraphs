import {
  Address,
  BigDecimal,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";
import { Vault, VaultFee, _UnderlyingToken } from "../../../generated/schema";
import { Hypervisor as HypervisorContract } from "../../../generated/templates/Hypervisor/Hypervisor";
import {
  BIGINT_MAX,
  BIGINT_ONE,
  BIGINT_ZERO,
  PROTOCOL_PERFORMANCE_FEE,
  REGISTRY_ADDRESS_MAP,
  VaultFeeType,
} from "../../common/constants";
import {
  getOrCreateToken,
  getOrCreateVaultDailySnapshot,
  getOrCreateVaultHourlySnapshot,
} from "../../common/getters";

// Update daily and hourly snapshots from vault entity
export function updateVaultSnapshots(event: ethereum.Event): void {
  let vault = getOrCreateVault(event.address, event.block);

  let dailySnapshot = getOrCreateVaultDailySnapshot(event);
  let hourlySnapshot = getOrCreateVaultHourlySnapshot(event);

  dailySnapshot.inputTokenBalance = vault.inputTokenBalance;
  dailySnapshot.outputTokenSupply = vault.outputTokenSupply!;
  dailySnapshot.totalValueLockedUSD = vault.totalValueLockedUSD;
  dailySnapshot.outputTokenPriceUSD = vault.outputTokenPriceUSD!;
  dailySnapshot.blockNumber = event.block.number;
  dailySnapshot.timestamp = event.block.timestamp;

  hourlySnapshot.inputTokenBalance = vault.inputTokenBalance;
  hourlySnapshot.outputTokenSupply = vault.outputTokenSupply!;
  hourlySnapshot.totalValueLockedUSD = vault.totalValueLockedUSD;
  hourlySnapshot.outputTokenPriceUSD = vault.outputTokenPriceUSD!;
  hourlySnapshot.blockNumber = event.block.number;
  hourlySnapshot.timestamp = event.block.timestamp;

  dailySnapshot.save();
  hourlySnapshot.save();
}

export function getOrCreateVault(
  vaultAddress: Address,
  block: ethereum.Block
): Vault {
  let vaultId = vaultAddress.toHex();
  let vault = Vault.load(vaultId);
  if (!vault) {
    let hypeContract = HypervisorContract.bind(vaultAddress);

    // Create relevant tokens
    getOrCreateUnderlyingToken(vaultAddress);
    getOrCreateToken(vaultAddress);

    vault = new Vault(vaultId);
    vault.protocol = REGISTRY_ADDRESS_MAP.get(dataSource.network())!.toHex();
    vault.name = hypeContract.name();
    vault.symbol = hypeContract.symbol();
    vault.inputToken = vaultId;
    vault.outputToken = vaultId;
    vault.rewardTokens = null;
    vault.depositLimit = BIGINT_MAX.minus(BIGINT_ONE);
    vault.createdTimestamp = block.timestamp;
    vault.createdBlockNumber = block.number;
    vault.totalValueLockedUSD = BigDecimal.zero();
    vault.inputTokenBalance = BIGINT_ZERO;
    vault.outputTokenSupply = BIGINT_ZERO;
    vault.outputTokenPriceUSD = BigDecimal.zero();
    vault.pricePerShare = null;
    vault.stakedOutputTokenAmount = null;
    vault.rewardTokenEmissionsAmount = null;
    vault.rewardTokenEmissionsUSD = null;

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

export function getOrCreateUnderlyingToken(
  vaultAddress: Address
): _UnderlyingToken {
  const vaultId = vaultAddress.toHex();
  let underlyingToken = _UnderlyingToken.load(vaultId);
  if (!underlyingToken) {
    const hypeContract = HypervisorContract.bind(vaultAddress);

    const token0Address = hypeContract.token0();
    const token1Address = hypeContract.token1();
    const totalAmounts = hypeContract.getTotalAmounts();

    getOrCreateToken(token0Address);
    getOrCreateToken(token1Address);

    underlyingToken = new _UnderlyingToken(vaultId);
    underlyingToken.token0 = token0Address.toHex();
    underlyingToken.lastAmount0 = totalAmounts.value0;
    underlyingToken.token1 = token1Address.toHex();
    underlyingToken.lastAmount1 = totalAmounts.value1;
    underlyingToken.lastAmountBlockNumber = BIGINT_ZERO;
    underlyingToken.save();
  }
  return underlyingToken;
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
