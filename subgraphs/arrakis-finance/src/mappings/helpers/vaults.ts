import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { Vault, VaultFee, _UnderlyingToken } from "../../../generated/schema";
import { ArrakisVaultV1 as VaultV1Contract } from "../../../generated/templates/ArrakisVault/ArrakisVaultV1";
import {
  BIGINT_MAX,
  BIGINT_ZERO,
  PROTOCOL_PERFORMANCE_FEE,
  VaultFeeType,
} from "../../common/constants";
import {
  getOrCreateToken,
  getOrCreateVaultDailySnapshot,
  getOrCreateVaultHourlySnapshot,
} from "../../common/getters";

// Update daily and hourly snapshots from vault entity
export function updateVaultSnapshots(
  vaultAddress: Address,
  block: ethereum.Block
): void {
  let vault = getOrCreateVault(vaultAddress, block);

  let dailySnapshot = getOrCreateVaultDailySnapshot(vaultAddress, block);
  let hourlySnapshot = getOrCreateVaultHourlySnapshot(vaultAddress, block);

  dailySnapshot.inputTokenBalance = vault.inputTokenBalance;
  dailySnapshot.outputTokenSupply = vault.outputTokenSupply!;
  dailySnapshot.totalValueLockedUSD = vault.totalValueLockedUSD;
  dailySnapshot.outputTokenPriceUSD = vault.outputTokenPriceUSD!;
  dailySnapshot.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;
  dailySnapshot.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;
  dailySnapshot.cumulativeTotalRevenueUSD = vault.cumulativeTotalRevenueUSD;
  dailySnapshot.stakedOutputTokenAmount = vault.stakedOutputTokenAmount;
  dailySnapshot.blockNumber = block.number;
  dailySnapshot.timestamp = block.timestamp;

  hourlySnapshot.inputTokenBalance = vault.inputTokenBalance;
  hourlySnapshot.outputTokenSupply = vault.outputTokenSupply!;
  hourlySnapshot.totalValueLockedUSD = vault.totalValueLockedUSD;
  hourlySnapshot.outputTokenPriceUSD = vault.outputTokenPriceUSD!;
  hourlySnapshot.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;
  hourlySnapshot.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;
  hourlySnapshot.cumulativeTotalRevenueUSD = vault.cumulativeTotalRevenueUSD;
  hourlySnapshot.stakedOutputTokenAmount = vault.stakedOutputTokenAmount;
  hourlySnapshot.blockNumber = block.number;
  hourlySnapshot.timestamp = block.timestamp;

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
    let vaultContract = VaultV1Contract.bind(vaultAddress);

    // Create relevant tokens
    getOrCreateUnderlyingToken(vaultAddress);
    getOrCreateToken(vaultAddress);

    vault = new Vault(vaultId);
    vault.protocol = "";
    vault.name = vaultContract.name();
    vault.symbol = vaultContract.symbol();
    vault.inputToken = vaultId;
    vault.outputToken = vaultId;
    vault.rewardTokens = [];
    vault.depositLimit = BIGINT_MAX;
    vault.createdTimestamp = block.timestamp;
    vault.createdBlockNumber = block.number;
    vault.totalValueLockedUSD = BigDecimal.zero();
    vault.cumulativeSupplySideRevenueUSD = BigDecimal.zero();
    vault.cumulativeProtocolSideRevenueUSD = BigDecimal.zero();
    vault.cumulativeTotalRevenueUSD = BigDecimal.zero();
    vault.inputTokenBalance = BIGINT_ZERO;
    vault.outputTokenSupply = BIGINT_ZERO;
    vault.outputTokenPriceUSD = BigDecimal.zero();
    vault.pricePerShare = null;
    vault.stakedOutputTokenAmount = BIGINT_ZERO;
    vault.rewardTokenEmissionsAmount = [];
    vault.rewardTokenEmissionsUSD = [];

    const managerFee = BigInt.fromI32(
      vaultContract.managerFeeBPS() / 100
    ).toBigDecimal();
    let vaultPerformanceFee = getOrCreateVaultFee(
      VaultFeeType.PERFORMANCE_FEE,
      vaultId
    );
    vaultPerformanceFee.feePercentage = PROTOCOL_PERFORMANCE_FEE.plus(
      managerFee
    );
    vaultPerformanceFee.save();

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
    const vaultContract = VaultV1Contract.bind(vaultAddress);

    const token0Address = vaultContract.token0();
    const token1Address = vaultContract.token1();
    const tokenBalances = vaultContract.getUnderlyingBalances();

    getOrCreateToken(token0Address);
    getOrCreateToken(token1Address);

    underlyingToken = new _UnderlyingToken(vaultId);
    underlyingToken.token0 = token0Address.toHex();
    underlyingToken.lastAmount0 = tokenBalances.value0;
    underlyingToken.token1 = token1Address.toHex();
    underlyingToken.lastAmount1 = tokenBalances.value1;
    underlyingToken.lastAmountBlockNumber = BIGINT_ZERO;
    underlyingToken.save();
  }
  return underlyingToken;
}

export function getOrCreateVaultFee(
  feeType: string,
  vaultId: string
): VaultFee {
  let vaultFeeId = feeType.concat("-").concat(vaultId);

  let vaultFee = VaultFee.load(vaultFeeId);
  if (!vaultFee) {
    vaultFee = new VaultFee(vaultFeeId);
    vaultFee.feePercentage = BigDecimal.zero();
    vaultFee.feeType = feeType;
    vaultFee.save();
  }

  return vaultFee;
}
