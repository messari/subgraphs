import { BigInt, Address, BigDecimal } from "@graphprotocol/graph-ts";
import { VaultHourlySnapshot } from "../../generated/schema";
import { initVault } from "./vaultInitializer";
import { initProtocol } from "./protocolInitializer";
import { ZERO_BIGDECIMAL, ZERO_BIGINT } from "../helpers/constants";

export function initVaultHourlySnapshot(
  timestamp: BigInt,
  blockNumber: BigInt,
  contractAddress: Address,
): VaultHourlySnapshot {
  const protocol = initProtocol(contractAddress)
  const daysFromStart = timestamp.toI32() / 24 / 60 / 60
  const hourInDay = (timestamp.toI32() - daysFromStart * 24 * 60 * 60) / 60 / 60;
  let vaultHourlySnapshotEntity = VaultHourlySnapshot.load(contractAddress.toHexString().concat("-").concat(daysFromStart.toString()).concat("-").concat(hourInDay.toString()));

  if (vaultHourlySnapshotEntity == null) {
    vaultHourlySnapshotEntity = new VaultHourlySnapshot(contractAddress.toHexString().concat("-").concat(daysFromStart.toString()).concat("-").concat(hourInDay.toString()));
    vaultHourlySnapshotEntity.timestamp = timestamp;
    vaultHourlySnapshotEntity.blockNumber = blockNumber;
    vaultHourlySnapshotEntity.protocol = protocol.id;

    const vault = initVault(contractAddress, timestamp, blockNumber);
    vaultHourlySnapshotEntity.vault = vault.id;

    vaultHourlySnapshotEntity.hourlySupplySideRevenueUSD = ZERO_BIGDECIMAL;
    vaultHourlySnapshotEntity.hourlyProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    vaultHourlySnapshotEntity.hourlyTotalRevenueUSD = ZERO_BIGDECIMAL;
    vaultHourlySnapshotEntity.totalValueLockedUSD = ZERO_BIGDECIMAL;
    vaultHourlySnapshotEntity.cumulativeSupplySideRevenueUSD = ZERO_BIGDECIMAL;
    vaultHourlySnapshotEntity.cumulativeProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    vaultHourlySnapshotEntity.cumulativeTotalRevenueUSD = ZERO_BIGDECIMAL;
    vaultHourlySnapshotEntity.inputTokenBalance = ZERO_BIGINT;
    vaultHourlySnapshotEntity.outputTokenSupply = ZERO_BIGINT;

    const rewardTokenEmissionsAmountArr = new Array<BigInt>();
    rewardTokenEmissionsAmountArr.push(ZERO_BIGINT);
    vaultHourlySnapshotEntity.rewardTokenEmissionsAmount = rewardTokenEmissionsAmountArr;

    const rewardTokenEmissionsUSDArr = new Array<BigDecimal>();
    rewardTokenEmissionsUSDArr.push(ZERO_BIGDECIMAL);
    vaultHourlySnapshotEntity.rewardTokenEmissionsUSD = rewardTokenEmissionsUSDArr;

  }

  vaultHourlySnapshotEntity.save();
  return vaultHourlySnapshotEntity;
}