import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, PROTOCOL_ID, SECONDS_PER_DAY, SECONDS_PER_HOUR } from "./constants";
import { createRewardTokens, getOrCreateToken } from "./tokens";
import { Vault as VaultContract } from "../../generated/Manager/Vault";
import { YieldAggregator, Vault as VaultStore, VaultHourlySnapshot, VaultDailySnapshot } from "../../generated/schema";
import { Vault as VaultTemplate } from "../../generated/templates";
import { readValue } from "./utils";

export function createVault(vaultAddress: Address, timestamp: BigInt, blocknumber: BigInt): VaultStore {
  const vault = new VaultStore(vaultAddress.toHexString());
  const vaultContract = VaultContract.bind(Address.fromString(vault.id));
  vault.protocol = PROTOCOL_ID;
  vault.name = readValue<string>(vaultContract.try_name(), "");
  vault.symbol = readValue<string>(vaultContract.try_symbol(), "");
  const inputToken = getOrCreateToken(vaultContract.underlyer());
  vault.inputToken = inputToken.id;
  vault.inputTokenBalance = BIGINT_ZERO;

  const outputToken = getOrCreateToken(Address.fromString(vault.id));
  vault.outputToken = outputToken.id;
  vault.outputTokenSupply = BIGINT_ZERO;

  vault.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  vault.pricePerShare = BIGDECIMAL_ZERO;
  vault.depositLimit = BIGINT_ZERO;

  vault.totalValueLockedUSD = BIGDECIMAL_ZERO;
  vault.createdBlockNumber = blocknumber;
  vault.createdTimestamp = timestamp;

  const rewardToken = createRewardTokens();

  vault.rewardTokens = [rewardToken.id];

  vault.fees = [];
  vault.save();

  let protocol = YieldAggregator.load(PROTOCOL_ID);
  if (protocol) {
    let vaultIds = protocol._vaultIds;
    if (vaultIds) {
      vaultIds.push(vault.id);
      protocol._vaultIds = vaultIds;
      protocol.save();
    }
  }

  VaultTemplate.create(vaultAddress);
  return vault;
}

export function getOrCreateVault(vaultAddress: Address, blockNumber: BigInt, timestamp: BigInt): VaultStore {
  // Note that the NewVault event are also emitted when endorseVault and newRelease
  // are called. So we only create it when necessary.
  let vault = VaultStore.load(vaultAddress.toHexString());
  if (!vault) {
    vault = createVault(vaultAddress, blockNumber, timestamp);
  }

  return vault;
}

export function updateVaultSnapshots(vaultAddress: Address, block: ethereum.Block): void {
  let vault = getOrCreateVault(vaultAddress, block.number, block.timestamp);

  const vaultDailySnapshots = getOrCreateVaultsDailySnapshots(vaultAddress, block);
  const vaultHourlySnapshots = getOrCreateVaultsHourlySnapshots(vaultAddress, block);

  vaultDailySnapshots.totalValueLockedUSD = vault.totalValueLockedUSD;
  vaultHourlySnapshots.totalValueLockedUSD = vault.totalValueLockedUSD;

  vaultDailySnapshots.inputTokenBalance = vault.inputTokenBalance;
  vaultHourlySnapshots.inputTokenBalance = vault.inputTokenBalance;

  vaultDailySnapshots.outputTokenSupply = vault.outputTokenSupply;
  vaultHourlySnapshots.outputTokenSupply = vault.outputTokenSupply;

  vaultDailySnapshots.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  vaultHourlySnapshots.outputTokenPriceUSD = vault.outputTokenPriceUSD;

  vaultDailySnapshots.pricePerShare = vault.pricePerShare;
  vaultHourlySnapshots.pricePerShare = vault.pricePerShare;

  vaultDailySnapshots.blockNumber = block.number;
  vaultHourlySnapshots.blockNumber = block.number;

  vaultDailySnapshots.timestamp = block.timestamp;
  vaultHourlySnapshots.timestamp = block.timestamp;

  vaultDailySnapshots.save();
  vaultHourlySnapshots.save();
}

export function getOrCreateVaultsDailySnapshots(vaultAddress: Address, block: ethereum.Block): VaultDailySnapshot {
  let id: string = vaultAddress.toHexString().concat((block.timestamp.toI64() / SECONDS_PER_DAY).toString());
  let vaultSnapshots = VaultDailySnapshot.load(id);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultDailySnapshot(id);
    vaultSnapshots.protocol = PROTOCOL_ID;
    vaultSnapshots.vault = vaultAddress.toHexString();

    vaultSnapshots.totalValueLockedUSD = BIGDECIMAL_ZERO;
    vaultSnapshots.inputTokenBalance = BIGINT_ZERO;
    vaultSnapshots.outputTokenSupply = BIGINT_ZERO;
    vaultSnapshots.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    vaultSnapshots.pricePerShare = BIGDECIMAL_ZERO;
    vaultSnapshots.stakedOutputTokenAmount = BIGINT_ZERO;
    vaultSnapshots.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    vaultSnapshots.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    vaultSnapshots.blockNumber = block.number;
    vaultSnapshots.timestamp = block.timestamp;

    vaultSnapshots.save();
  }

  return vaultSnapshots;
}

export function getOrCreateVaultsHourlySnapshots(vaultAddress: Address, block: ethereum.Block): VaultHourlySnapshot {
  let id: string = vaultAddress
    .toHexString()
    .concat((block.timestamp.toI64() / SECONDS_PER_DAY).toString())
    .concat("-")
    .concat((block.timestamp.toI64() / SECONDS_PER_HOUR).toString());
  let vaultSnapshots = VaultHourlySnapshot.load(id);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultHourlySnapshot(id);
    vaultSnapshots.protocol = PROTOCOL_ID;
    vaultSnapshots.vault = vaultAddress.toHexString();

    vaultSnapshots.totalValueLockedUSD = BIGDECIMAL_ZERO;
    vaultSnapshots.inputTokenBalance = BIGINT_ZERO;
    vaultSnapshots.outputTokenSupply = BIGINT_ZERO;
    vaultSnapshots.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    vaultSnapshots.pricePerShare = BIGDECIMAL_ZERO;
    vaultSnapshots.stakedOutputTokenAmount = BIGINT_ZERO;
    vaultSnapshots.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    vaultSnapshots.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    vaultSnapshots.blockNumber = block.number;
    vaultSnapshots.timestamp = block.timestamp;

    vaultSnapshots.save();
  }

  return vaultSnapshots;
}
