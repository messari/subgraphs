import { BigInt, Address, BigDecimal } from "@graphprotocol/graph-ts";
import { VaultDailySnapshot } from "../../generated/schema";
import { initProtocol } from "./protocolInitializer";
import { ZERO_BIGDECIMAL, ZERO_BIGINT } from "../helpers/constants";
import { initVault } from "./vaultInitializer";

export function initVaultDailySnapshot(
  timestamp: BigInt,
  blockNumber: BigInt,
  contractAddress: Address,
): VaultDailySnapshot {
  const protocol = initProtocol(contractAddress)
  const daysFromStart = timestamp.toI32() / 24 / 60 / 60;
  let vaultDailySnapshotEntity = VaultDailySnapshot.load(contractAddress.toHexString().concat("-").concat(daysFromStart.toString()));

  if (vaultDailySnapshotEntity == null) {
    vaultDailySnapshotEntity = new VaultDailySnapshot(contractAddress.toHexString().concat("-").concat(daysFromStart.toString()));
    vaultDailySnapshotEntity.timestamp = timestamp;
    vaultDailySnapshotEntity.blockNumber = blockNumber;
    vaultDailySnapshotEntity.protocol = protocol.id;
    vaultDailySnapshotEntity.totalValueLockedUSD = ZERO_BIGDECIMAL;
    vaultDailySnapshotEntity.cumulativeSupplySideRevenueUSD = ZERO_BIGDECIMAL;
    vaultDailySnapshotEntity.dailySupplySideRevenueUSD = ZERO_BIGDECIMAL;
    vaultDailySnapshotEntity.cumulativeProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    vaultDailySnapshotEntity.dailyProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    vaultDailySnapshotEntity.cumulativeTotalRevenueUSD = ZERO_BIGDECIMAL;
    vaultDailySnapshotEntity.dailyTotalRevenueUSD = ZERO_BIGDECIMAL;
    vaultDailySnapshotEntity.inputTokenBalance = ZERO_BIGINT;
    vaultDailySnapshotEntity.outputTokenSupply = ZERO_BIGINT;
    vaultDailySnapshotEntity.dailyTotalRevenueUSD = ZERO_BIGDECIMAL;

    const vault = initVault(contractAddress, timestamp, blockNumber);
    vaultDailySnapshotEntity.vault = vault.id;

    const rewardTokenEmissionsAmountArr = new Array<BigInt>();
    rewardTokenEmissionsAmountArr.push(ZERO_BIGINT);
    vaultDailySnapshotEntity.rewardTokenEmissionsAmount = rewardTokenEmissionsAmountArr;

    const rewardTokenEmissionsUSDArr = new Array<BigDecimal>();
    rewardTokenEmissionsUSDArr.push(ZERO_BIGDECIMAL);
    vaultDailySnapshotEntity.rewardTokenEmissionsUSD = rewardTokenEmissionsUSDArr;

  }

  vaultDailySnapshotEntity.save();
  return vaultDailySnapshotEntity;
}