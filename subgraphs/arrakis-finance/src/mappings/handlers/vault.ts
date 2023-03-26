import { BigInt } from "@graphprotocol/graph-ts";
import { PoolCreated } from "../../../generated/ArrakisFactory/ArrakisFactoryV1";
import { ArrakisVault as ArrakisVaultTemplate } from "../../../generated/templates";
import {
  Burned,
  FeesEarned,
  Minted,
  Rebalance,
  UpdateManagerParams,
} from "../../../generated/templates/ArrakisVault/ArrakisVaultV1";
import {
  PROTOCOL_PERFORMANCE_FEE,
  UsageType,
  VaultFeeType,
} from "../../common/constants";
import {
  getOrCreateToken,
  getOrCreateYieldAggregator,
} from "../../common/getters";
import { createDeposit, createWithdraw } from "../helpers/events";
import { updateRevenue, updateTvl } from "../helpers/financials";
import { updateUsageMetrics } from "../helpers/usageMetrics";
import {
  getOrCreateVault,
  getOrCreateVaultFee,
  updateVaultSnapshots,
} from "../helpers/vaults";

import { ArrakisVaultV1 } from "../../../generated/templates/ArrakisVault/ArrakisVaultV1";

export function handlePoolCreated(event: PoolCreated): void {
  const protocol = getOrCreateYieldAggregator(event.address);
  protocol.totalPoolCount += 1;
  const vaultIDs = protocol._vaultIDs ? protocol._vaultIDs! : [];
  vaultIDs.push(event.params.pool.toHexString());
  protocol._vaultIDs = vaultIDs;
  protocol.save();

  // Create Vault
  const vault = getOrCreateVault(event.params.pool, event.block);
  vault.protocol = event.address.toHex();

  const vaultContract = ArrakisVaultV1.bind(event.params.pool);
  const token0Address = vaultContract.token0();
  const token1Address = vaultContract.token1();
  const token0 = getOrCreateToken(token0Address);
  const token1 = getOrCreateToken(token1Address);
  vault._token0 = token0.id;
  vault._token1 = token1.id;

  vault.save();

  ArrakisVaultTemplate.create(event.params.pool);
}

export function handleMinted(event: Minted): void {
  // Create deposit event
  createDeposit(event);

  // Update vault token supply
  const vault = getOrCreateVault(event.address, event.block);
  // update underlying token balances is done by updateVaultTokenValue inside updateTvl
  // we update all vaults for each vault event, so the underlying token balances are updated
  // more frequently at some cost of the indexing speed

  vault.inputTokenBalance = vault.inputTokenBalance.plus(
    event.params.mintAmount
  );
  vault.outputTokenSupply = vault.outputTokenSupply!.plus(
    event.params.mintAmount
  );

  vault.save();

  updateUsageMetrics(event.params.receiver, UsageType.DEPOSIT, event); // minted shares are attributed to receiver
  updateTvl(event);
  updateVaultSnapshots(vault, event.block);
}

export function handleBurned(event: Burned): void {
  // Create withdraw event
  createWithdraw(event);

  // Update vault token supply
  const vault = getOrCreateVault(event.address, event.block);
  // update underlying token balances is done by updateVaultTokenValue inside updateTvl
  // we update all vaults for each vault event, so the underlying token balances are updated
  // more frequently at some cost of the indexing speed
  vault.inputTokenBalance = vault.inputTokenBalance.minus(
    event.params.burnAmount
  );
  vault.outputTokenSupply = vault.outputTokenSupply!.minus(
    event.params.burnAmount
  );
  vault.save();

  updateUsageMetrics(event.transaction.from, UsageType.WITHDRAW, event); // Burned shares are attributed to msg.sender
  updateTvl(event);
  updateVaultSnapshots(vault, event.block);
}

export function handleRebalance(event: Rebalance): void {
  const vault = getOrCreateVault(event.address, event.block);
  // update underlying token balances is done by updateVaultTokenValue inside updateTvl
  // we update all vaults for each vault event, so the underlying token balances are updated
  // more frequently at some cost of the indexing speed
  updateTvl(event);
  updateVaultSnapshots(vault, event.block);
}

export function handleFeesEarned(event: FeesEarned): void {
  const vault = getOrCreateVault(event.address, event.block);
  updateRevenue(event);
  updateTvl(event);
  updateVaultSnapshots(vault, event.block);
}

export function handleUpdateManagerParams(event: UpdateManagerParams): void {
  const vaultPerformanceFee = getOrCreateVaultFee(
    VaultFeeType.PERFORMANCE_FEE,
    event.address.toHex()
  );
  const managerFee = BigInt.fromI32(
    event.params.managerFeeBPS / 100
  ).toBigDecimal();
  vaultPerformanceFee.feePercentage = PROTOCOL_PERFORMANCE_FEE.plus(managerFee);
  vaultPerformanceFee.save();
}
