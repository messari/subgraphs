import { Address, BigInt } from "@graphprotocol/graph-ts";
import { ethereum } from "@graphprotocol/graph-ts/chain/ethereum";
import { Vault } from "../../generated/schema";
import {
  BeefyStrategy,
  ChargedFees,
  Deposit,
  StratHarvest,
  Withdraw,
} from "../../generated/Standard/BeefyStrategy";
import { BeefyVault } from "../../generated/Standard/BeefyVault";
import { getOrCreateToken, getOrCreateVault } from "../utils/getters";
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
  updateProtocolRevenueFromChargedFees,
  updateProtocolRevenueFromHarvest,
  updateProtocolRevenueFromWithdraw,
  updateProtocolUsage,
} from "./protocol";

export function updateVaultAndSnapshots(
  vault: Vault,
  block: ethereum.Block
): void {
  const vaultContract = BeefyVault.bind(
    Address.fromString(vault.id.split("x")[1])
  );
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

export function handleStratHarvestWithAmount(event: StratHarvest): void {
  const vault = getOrCreateVault(event.address, event);
  if (!vault) {
    return;
  }

  updateVaultAndSnapshots(vault, event.block);
  updateProtocolRevenueFromHarvest(event, event.params.wantHarvested, vault);
}

export function handleStratHarvest(event: StratHarvest): void {
  const vault = getOrCreateVault(event.address, event);
  if (!vault) {
    return;
  }

  const strategyContract = BeefyStrategy.bind(event.address);
  const balance = strategyContract.try_balanceOf();
  if (!balance.reverted) {
    const amountHarvested = balance.value.minus(vault.inputTokenBalance);
    updateVaultAndSnapshots(vault, event.block);
    updateProtocolRevenueFromHarvest(event, amountHarvested, vault);
  } else {
    updateVaultAndSnapshots(vault, event.block);
  }
}

export function handleChargedFees(event: ChargedFees): void {
  const vault = getOrCreateVault(event.address, event);
  if (!vault) {
    return;
  }

  updateVaultAndSnapshots(vault, event.block);
  updateProtocolRevenueFromChargedFees(event, vault); //si rompe qua!
}
