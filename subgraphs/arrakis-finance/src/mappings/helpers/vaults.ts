import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { Vault, VaultFee } from "../../../generated/schema";
import { ArrakisVaultV1 as VaultV1Contract } from "../../../generated/templates/ArrakisVault/ArrakisVaultV1";
import { UniswapV3Pool as PoolContract } from "../../../generated/templates/ArrakisVault/UniswapV3Pool";
import {
  BIGDECIMAL_ZERO,
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
  vault: Vault,
  block: ethereum.Block
): void {
  const dailySnapshot = getOrCreateVaultDailySnapshot(
    Address.fromString(vault.id),
    block
  );
  const hourlySnapshot = getOrCreateVaultHourlySnapshot(
    Address.fromString(vault.id),
    block
  );

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
  dailySnapshot.rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount;
  dailySnapshot.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD;
  dailySnapshot._token0 = vault._token0;
  dailySnapshot._token1 = vault._token1;
  dailySnapshot._token0Amount = vault._token0Amount;
  dailySnapshot._token1Amount = vault._token1Amount;
  dailySnapshot._token0AmountUSD = vault._token0AmountUSD;
  dailySnapshot._token1AmountUSD = vault._token1AmountUSD;

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
  hourlySnapshot.rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount;
  hourlySnapshot.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD;
  hourlySnapshot.blockNumber = block.number;
  hourlySnapshot.timestamp = block.timestamp;

  dailySnapshot.save();
  hourlySnapshot.save();
}

export function getOrCreateVault(
  vaultAddress: Address,
  block: ethereum.Block
): Vault {
  const vaultId = vaultAddress.toHex();
  let vault = Vault.load(vaultId);
  if (!vault) {
    const vaultContract = VaultV1Contract.bind(vaultAddress);
    const poolAddress = vaultContract.pool();
    const poolContract = PoolContract.bind(poolAddress);
    const poolFeePercentage = poolContract.fee() / 10000.0;

    // Create relevant tokens
    getOrCreateToken(vaultAddress);

    vault = new Vault(vaultId);
    vault.protocol = "";
    vault.name = vaultContract
      .name()
      .concat("-")
      .concat(poolFeePercentage.toString())
      .concat("%");
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
    vault._token0 = "";
    vault._token1 = "";
    vault._token0Amount = BIGINT_ZERO;
    vault._token1Amount = BIGINT_ZERO;
    vault._token0AmountUSD = BIGDECIMAL_ZERO;
    vault._token1AmountUSD = BIGDECIMAL_ZERO;

    const managerFee = BigInt.fromI32(
      vaultContract.managerFeeBPS() / 100
    ).toBigDecimal();
    const vaultPerformanceFee = getOrCreateVaultFee(
      VaultFeeType.PERFORMANCE_FEE,
      vaultId
    );
    vaultPerformanceFee.feePercentage =
      PROTOCOL_PERFORMANCE_FEE.plus(managerFee);
    vaultPerformanceFee.save();

    vault.fees = [vaultPerformanceFee.id];
    vault.save();
  }
  return vault;
}

export function getOrCreateVaultFee(
  feeType: string,
  vaultId: string
): VaultFee {
  const vaultFeeId = feeType.concat("-").concat(vaultId);

  let vaultFee = VaultFee.load(vaultFeeId);
  if (!vaultFee) {
    vaultFee = new VaultFee(vaultFeeId);
    vaultFee.feePercentage = BigDecimal.zero();
    vaultFee.feeType = feeType;
    vaultFee.save();
  }

  return vaultFee;
}

export function getUnderlyingTokenBalances(
  vaultAddress: Address,
  event: ethereum.Event
): BigInt[] | null {
  const vaultContract = VaultV1Contract.bind(vaultAddress);
  const underlyingBalancesResult = vaultContract.try_getUnderlyingBalances();
  if (underlyingBalancesResult.reverted) {
    log.error(
      "[getUnderlyingTokenBalances]vault {} getUnderlyingBalances() call reverted tx {}-{}",
      [
        vaultAddress.toHexString(),
        event.transaction.hash.toHexString(),
        event.transactionLogIndex.toString(),
      ]
    );
    return null;
  }
  const result = [
    underlyingBalancesResult.value.getAmount0Current(),
    underlyingBalancesResult.value.getAmount1Current(),
  ];
  return result;
}
