import * as constants from "../common/constants";
import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  Vault as VaultStore,
  VaultFee as VaultFeeStore,
} from "../../generated/schema";
import {
  updateFinancials,
  updateUsageMetrics,
  updateVaultSnapshots,
} from "../modules/Metrics";
import {
  DepositCall,
  Deposit1Call,
  Deposit2Call,
  WithdrawCall,
  Withdraw1Call,
  Withdraw2Call,
  Vault as VaultContract,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  StrategyAdded as StrategyAddedV1Event,
  StrategyAdded1 as StrategyAddedV2Event,
  StrategyReported as OldStrategyReportedEvent,
  StrategyReported1 as NewStrategyReportedEvent,
  UpdateManagementFee as UpdateManagementFeeEvent,
  UpdatePerformanceFee as UpdatePerformanceFeeEvent,
} from "../../generated/Registry_v1/Vault";
import { _Deposit } from "../modules/Deposit";
import { _Withdraw } from "../modules/Withdraw";
import { enumToPrefix } from "../common/strings";
import { strategyReported } from "../modules/Strategy";
import { getOrCreateStrategy, getOrCreateVault } from "../common/initializers";
import { Strategy as StrategyTemplate } from "../../generated/templates";

export function handleStrategyAdded_v1(event: StrategyAddedV1Event): void {
  const vaultAddress = event.address;
  const strategyAddress = event.params.strategy;
  const performanceFee = event.params.performanceFee;

  let vault = getOrCreateVault(vaultAddress, event.block);
  if (vault) {
    let strategy = getOrCreateStrategy(
      vaultAddress,
      strategyAddress,
      performanceFee
    );

    StrategyTemplate.create(strategyAddress);
    strategy.save();

    log.warning("[SetStrategy_v1] TxHash: {}, VaultId: {}, Strategy: {}", [
      event.transaction.hash.toHexString(),
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
    ]);
  }
}

export function handleStrategyAdded_v2(event: StrategyAddedV2Event): void {
  const vaultAddress = event.address;
  const strategyAddress = event.params.strategy;
  const performanceFee = event.params.performanceFee;

  let vault = getOrCreateVault(vaultAddress, event.block);
  if (vault) {
    let strategy = getOrCreateStrategy(
      vaultAddress,
      strategyAddress,
      performanceFee
    );

    StrategyTemplate.create(strategyAddress);
    strategy.save();

    log.warning("[SetStrategy_v2] TxHash: {}, VaultId: {}, Strategy: {}", [
      event.transaction.hash.toHexString(),
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
    ]);
  }
}

export function handleDeposit(call: DepositCall): void {
  const vaultAddress = call.to;
  const vault = getOrCreateVault(vaultAddress, call.block);

  if (vault) {
    let sharesMinted = call.outputs.value0;

    _Deposit(call.to, call.transaction, call.block, vault, sharesMinted, null);
  }
  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleDepositWithAmount(call: Deposit1Call): void {
  const vaultAddress = call.to;
  const vault = getOrCreateVault(vaultAddress, call.block);

  log.warning("[DepositWithAmount] vault: {}, shares: {}, deposit: {}", [
    vaultAddress.toHexString(),
    call.outputs.value0.toString(),
    call.inputs._amount.toString(),
  ]);

  if (vault) {
    let sharesMinted = call.outputs.value0;
    let depositAmount = call.inputs._amount;

    _Deposit(
      call.to,
      call.transaction,
      call.block,
      vault,
      sharesMinted,
      depositAmount
    );
  }
  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleDepositWithAmountAndRecipient(call: Deposit2Call): void {
  const vaultAddress = call.to;
  const vault = getOrCreateVault(vaultAddress, call.block);

  log.warning(
    "[DepositWithAmountAndRecipient] vault: {}, shares: {}, deposit: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      call.outputs.value0.toString(),
      call.inputs._amount.toString(),
      call.transaction.hash.toHexString(),
    ]
  );

  if (vault) {
    let sharesMinted = call.outputs.value0;
    let depositAmount = call.inputs._amount;

    _Deposit(
      call.to,
      call.transaction,
      call.block,
      vault,
      sharesMinted,
      depositAmount
    );
  }
  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleWithdraw(call: WithdrawCall): void {
  const vaultAddress = call.to;
  const vault = getOrCreateVault(vaultAddress, call.block);

  if (vault) {
    let vaultContract = VaultContract.bind(call.to);
    let withdrawAmount = call.outputs.value0;
    let totalAssets = vaultContract.totalAssets();
    let totalSupply = vaultContract.totalSupply();
    let sharesBurnt = totalAssets.equals(constants.BIGINT_ZERO)
      ? withdrawAmount
      : withdrawAmount.times(totalSupply).div(totalAssets);

    _Withdraw(
      call.to,
      call.transaction,
      call.block,
      vault,
      withdrawAmount,
      sharesBurnt
    );
  }
  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleWithdrawWithShares(call: Withdraw1Call): void {
  const vaultAddress = call.to;
  const vault = getOrCreateVault(vaultAddress, call.block);

  if (vault) {
    const sharesBurnt = call.inputs._shares;
    const withdrawAmount = call.outputs.value0;

    _Withdraw(
      call.to,
      call.transaction,
      call.block,
      vault,
      withdrawAmount,
      sharesBurnt
    );
  }
  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleWithdrawWithSharesAndRecipient(
  call: Withdraw2Call
): void {
  const vaultAddress = call.to;
  const vault = getOrCreateVault(vaultAddress, call.block);

  if (vault) {
    const sharesBurnt = call.inputs._shares;
    const withdrawAmount = call.outputs.value0;

    _Withdraw(
      call.to,
      call.transaction,
      call.block,
      vault,
      withdrawAmount,
      sharesBurnt
    );
  }
  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleUpdatePerformanceFee(
  event: UpdatePerformanceFeeEvent
): void {
  const vaultAddress = event.address.toHexString();
  const vault = VaultStore.load(vaultAddress);

  if (vault) {
    let performanceFeeId =
      enumToPrefix(constants.VaultFeeType.PERFORMANCE_FEE) + vaultAddress;
    const performanceFee = VaultFeeStore.load(performanceFeeId);

    if (!performanceFee) {
      return;
    }

    performanceFee.feePercentage = event.params.performanceFee
      .div(BigInt.fromI32(100))
      .toBigDecimal();
    performanceFee.save();

    log.warning("[updatePerformanceFee]\n TxHash: {}, performanceFee: {}", [
      event.transaction.hash.toHexString(),
      event.params.performanceFee.toString(),
    ]);
  }
}

export function handleUpdateManagementFee(
  event: UpdateManagementFeeEvent
): void {
  const vaultAddress = event.address.toHexString();
  const vault = VaultStore.load(vaultAddress);

  if (vault) {
    let performanceFeeId =
      enumToPrefix(constants.VaultFeeType.MANAGEMENT_FEE) + vaultAddress;
    const performanceFee = VaultFeeStore.load(performanceFeeId);

    if (!performanceFee) {
      return;
    }

    performanceFee.feePercentage = event.params.managementFee
      .div(BigInt.fromI32(100))
      .toBigDecimal();
    performanceFee.save();

    log.warning("[updateManagementFee]\n TxHash: {}, managementFee: {}", [
      event.transaction.hash.toHexString(),
      event.params.managementFee.toString(),
    ]);
  }
}

export function handleStrategyReported_v1(
  event: OldStrategyReportedEvent
): void {
  const vaultAddress = event.address;
  const strategyAddress = event.params.strategy;

  strategyReported(
    event.params.gain,
    event.params.debtAdded,
    event.params.debtPaid,
    event.params.totalDebt,
    event,
    vaultAddress,
    strategyAddress
  );
}

export function handleStrategyReported_v2(
  event: NewStrategyReportedEvent
): void {
  const vaultAddress = event.address;
  const strategyAddress = event.params.strategy;

  strategyReported(
    event.params.gain,
    event.params.debtAdded,
    constants.BIGINT_ZERO,
    event.params.totalDebt,
    event,
    vaultAddress,
    strategyAddress
  );
}

export function handleDepositEvent(event: DepositEvent): void {
  const vaultAddress = event.address;
  const vault = getOrCreateVault(vaultAddress, event.block);

  if (vault) {
    let sharesMinted = event.params.shares;

    _Deposit(
      event.address,
      event.transaction,
      event.block,
      vault,
      sharesMinted,
      event.params.amount
    );
  }
  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.params.recipient);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleWithdrawEvent(event: WithdrawEvent): void {
  const vaultAddress = event.address;
  const vault = getOrCreateVault(vaultAddress, event.block);

  if (vault) {
    const sharesBurnt = event.params.shares;
    const withdrawAmount = event.params.amount;

    _Withdraw(
      event.address,
      event.transaction,
      event.block,
      vault,
      withdrawAmount,
      sharesBurnt
    );
  }
  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(vaultAddress, event.block);
}
