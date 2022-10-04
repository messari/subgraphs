import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { ethereum } from "@graphprotocol/graph-ts/chain/ethereum";
import { Vault, VaultFee } from "../../generated/schema";
import {
  BeefyStrategy,
  Deposit,
  StratHarvest,
  StratHarvest1,
  StratHarvest2,
  Withdraw,
} from "../../generated/Standard/BeefyStrategy";
import { BeefyVault } from "../../generated/Standard/BeefyVault";
import {
  getFees,
  getOrCreateToken,
  getOrCreateVault,
  getOrCreateVaultDailySnapshot,
} from "../utils/getters";
import { createDeposit } from "./deposit";
import { createWithdraw } from "./withdraw";
import {
  updateVaultDailySnapshot,
  updateVaultHourlySnapshot,
} from "../utils/snapshots";
import {
  BIGDECIMAL_ZERO,
  BIGINT_TEN,
  BIGINT_ZERO,
} from "../prices/common/constants";
import {
  updateProtocolRevenue,
  updateProtocolRevenueFromWithdraw,
  updateProtocolUsage,
} from "./protocol";
import { ERC20 } from "../../generated/Standard/ERC20";
import { BIGDECIMAL_HUNDRED, exponentToBigDecimal } from "../utils/constants";

// This function updates the vault's metrics from contract calls
// This includes:
//   totalValueLockedUSD
//   totalBorrowBalanceUSD
//
// Then it will update any snapshots with the latest metrics
export function updateVaultAndSnapshots(
  vault: Vault,
  block: ethereum.Block
): void {
  const vaultContract = BeefyVault.bind(Address.fromString(vault.id));
  let call = vaultContract.try_balance();
  if (call.reverted) {
    vault.inputTokenBalance = BIGINT_ZERO;
  } else {
    vault.inputTokenBalance = call.value;
  }
  call = vaultContract.try_totalSupply();
  if (call.reverted) {
    vault.outputTokenSupply = BIGINT_ZERO;
  } else {
    vault.outputTokenSupply = call.value;
  }
  call = vaultContract.try_getPricePerFullShare();
  if (call.reverted) {
    vault.pricePerShare = BIGINT_ZERO;
  } else {
    vault.pricePerShare = call.value.div(
      BigInt.fromI32(vaultContract.decimals())
    );
  }
  const wantCall = vaultContract.try_want();
  if (wantCall.reverted) {
    vault.totalValueLockedUSD = BIGDECIMAL_ZERO;
  } else {
    const inputToken = getOrCreateToken(wantCall.value, block);
    vault.totalValueLockedUSD = inputToken.lastPriceUSD
      .times(vault.inputTokenBalance.toBigDecimal())
      .div(BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal());
  }
  const outputSupply = vault.outputTokenSupply;
  if (outputSupply && outputSupply != BIGINT_ZERO)
    vault.outputTokenPriceUSD = vault.totalValueLockedUSD.div(
      outputSupply.toBigDecimal()
    );
  vault.save();
  updateVaultHourlySnapshot(block, vault);
  updateVaultDailySnapshot(block, vault);
}

<<<<<<< HEAD
export function getFees(
  vaultId: string,
  strategyContract: BeefyStrategy
): string[] {
  const fees: string[] = [];
  let call = strategyContract.try_STRATEGIST_FEE();
  if (!call.reverted) {
    const strategistFee = new VaultFee("STRATEGIST_FEE-" + vaultId);
    strategistFee.feePercentage = call.value.divDecimal(BIGDECIMAL_HUNDRED);
    strategistFee.feeType = "STRATEGIST_FEE";
    strategistFee.save();
    fees.push(strategistFee.id);
  }

  call = strategyContract.try_withdrawalFee();
  if (!call.reverted) {
    const withdrawalFee = new VaultFee("WITHDRAWAL_FEE-" + vaultId);
    withdrawalFee.feePercentage = call.value.divDecimal(BIGDECIMAL_HUNDRED);
    withdrawalFee.feeType = "WITHDRAWAL_FEE";
    withdrawalFee.save();
    fees.push(withdrawalFee.id);
  }

  call = strategyContract.try_callFee();
  if (!call.reverted) {
    const callFee = new VaultFee("MANAGEMENT_FEE-" + vaultId);
    callFee.feePercentage = call.value.divDecimal(BIGDECIMAL_HUNDRED);
    callFee.feeType = "MANAGEMENT_FEE";
    callFee.save();
    fees.push(callFee.id);
  }

  call = strategyContract.try_beefyFee();
  if (!call.reverted) {
    const beefyFee = new VaultFee("PERFORMANCE_FEE-" + vaultId);
    beefyFee.feePercentage = call.value.divDecimal(BIGDECIMAL_HUNDRED);
    beefyFee.feeType = "PERFORMANCE_FEE";
    beefyFee.save();
    fees.push(beefyFee.id);
  }
  return fees;
}

=======
>>>>>>> 2525f756 (update fees / refactor code)
export function handleDeposit(event: Deposit): void {
  const vault = getOrCreateVault(event.address, event);
  if (!vault) {
    return;
  }

  const depositedAmount = event.params.tvl.minus(vault.inputTokenBalance);
  createDeposit(event, depositedAmount, vault.id);

  updateVaultAndSnapshots(vault, event.block);
  updateProtocolUsage(event, true, false);
}

export function handleWithdraw(event: Withdraw): void {
  const vault = getOrCreateVault(event.address, event);
  if (!vault) {
    return;
  }

  const withdrawnAmount = event.params.tvl.minus(vault.inputTokenBalance);
  createWithdraw(event, withdrawnAmount, vault.id);
  updateVaultAndSnapshots(vault, event.block);
  updateProtocolRevenueFromWithdraw(event, vault, withdrawnAmount);
}

// StratHarvest (includes tvl in params)
export function handleStratHarvestWithAmount(event: StratHarvest): void {
  updateRevenueFromHarvest(event, event.address);

  const vault = getOrCreateVault(event.address, event);
  if (!vault) {
    log.warning("[handleStratHarvestWithAmount] Vault not found: {}", [
      event.address.toHexString(),
    ]);
    return;
  }
  updateVaultAndSnapshots(vault, event.block);
}

// StratHarvest1 (just messge sender)
export function handleStratHarvest(event: StratHarvest1): void {
  updateRevenueFromHarvest(event, event.address);

  const vault = getOrCreateVault(event.address, event);
  if (!vault) {
    log.warning("[handleStratHarvest] Vault not found: {}", [
      event.address.toHexString(),
    ]);
    return;
  }
  updateVaultAndSnapshots(vault, event.block);
}

// StratHarvest2 (harvester and timestamp)
export function handleStratHarvestWithTimestamp(event: StratHarvest2): void {
  updateRevenueFromHarvest(event, event.address);

  const vault = getOrCreateVault(event.address, event);
  if (!vault) {
    log.warning("[handleStratHarvestWithTimestamp] Vault not found: {}", [
      event.address.toHexString(),
    ]);
    return;
  }
  updateVaultAndSnapshots(vault, event.block);
}

/////////////////
//// Helpers ////
/////////////////

// This helper function carries out the transformations of the Harvest event
// The harvest event is emitted from a Strategy Contract
// This event occurs when rebalancing / auto compounding occurs
// Fees are also generated from this event. This function will calculate:
//     protocolSideRevenue
//     supplySideRevenue
//     totalRevenue
function updateRevenueFromHarvest(
  event: ethereum.Event,
  strategyAddress: Address
): void {
  const vault = getOrCreateVault(strategyAddress, event);
  if (!vault) {
    log.warning("Vault not found for strategy {}", [
      strategyAddress.toHexString(),
    ]);
    return;
  }
  const strategyContract = BeefyStrategy.bind(strategyAddress);
  if (vault._strategyOutputToken) {
    const strategyOutputTokenContract = ERC20.bind(
      Address.fromString(vault._strategyOutputToken)
    );

    const tryBalance =
      strategyOutputTokenContract.try_balanceOf(strategyAddress);
    if (tryBalance.reverted) {
      log.warning(
        "Failed to get balance of strategy output token in strategy contract: {}",
        [strategyAddress.toHexString()]
      );
      return;
    }

    // Optional 1- Check for _strategyOutputToken Balance to be > 0 in the Strategy Contract
    if (tryBalance.value.le(BIGINT_ZERO)) {
      log.warning(
        "No revenue to calculate because strategy output token balance is 0: {}",
        [strategyAddress.toHexString()]
      );
      return;
    }
  }

  // 2- Check that the native token balance of the Strategy Contract is > 0
  const nativeTokenContract = ERC20.bind(
    Address.fromString(vault._nativeToken)
  );
  const tryNativeTokenBalance =
    nativeTokenContract.try_balanceOf(strategyAddress);
  if (tryNativeTokenBalance.reverted) {
    log.warning(
      "Failed to get balance of native token in strategy contract: {}",
      [strategyAddress.toHexString()]
    );
    return;
  }

  if (tryNativeTokenBalance.value.gt(BIGINT_ZERO)) {
    // at this point we charge the performance fee on this
    // whatever is left over after the performance fee is supplySideRevenue
    const nativeToken = getOrCreateToken(
      Address.fromString(vault._nativeToken),
      event.block
    ); // update price

    vault.fees = getFees(vault.id, strategyContract);
    vault.save();

    // fees are generally 4.5% performance fee
    const perfFee = VaultFee.load(vault.fees[0]);
    if (!perfFee) {
      log.warning("No perf fee found for vault {}", [vault.id]);
      return;
    }
    const performanceFeeNormalized =
      perfFee.feePercentage.div(BIGDECIMAL_HUNDRED);

    const performanceFeeDelta = tryNativeTokenBalance.value
      .toBigDecimal()
      .div(exponentToBigDecimal(nativeToken.decimals))
      .times(performanceFeeNormalized);
    const protocolSideRevenueDelta = performanceFeeDelta.times(
      nativeToken.lastPriceUSD!
    );
    const supplySideRevenueDelta = tryNativeTokenBalance.value
      .toBigDecimal()
      .div(exponentToBigDecimal(nativeToken.decimals))
      .minus(performanceFeeDelta)
      .times(nativeToken.lastPriceUSD!);
    const totalRevenueDelta = protocolSideRevenueDelta.plus(
      supplySideRevenueDelta
    );

    updateProtocolRevenue(
      protocolSideRevenueDelta,
      supplySideRevenueDelta,
      totalRevenueDelta,
      event
    );

    // update vault.dailyTotalRevenueUSD
    const vaultDailySnapshot = getOrCreateVaultDailySnapshot(vault.id, event);
    vaultDailySnapshot.dailyTotalRevenueUSD =
      vaultDailySnapshot.dailyTotalRevenueUSD.plus(totalRevenueDelta);
    vaultDailySnapshot.save();
  }
}
