import * as utils from "../common/utils";
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
  Withdraw3Call,
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
import { strategyReported } from "../modules/Strategy";
import { Strategy as StrategyTemplate } from "../../generated/templates";
import { getOrCreateStrategy, getOrCreateVault } from "../common/initializers";

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
  let vaultAddress = call.transaction.to!;
  let vault = VaultStore.load(vaultAddress.toHexString());

  if (!vault) {
    vaultAddress = call.to;
    vault = VaultStore.load(vaultAddress.toHexString());
  }

  if (vault) {
    const sharesMinted = call.outputs.value0;

    _Deposit(
      vaultAddress,
      call.transaction,
      call.block,
      vault,
      sharesMinted,
      constants.MAX_UINT256
    );
  }
  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleDepositWithAmount(call: Deposit1Call): void {
  let vaultAddress = call.transaction.to!;
  let vault = VaultStore.load(vaultAddress.toHexString());

  if (!vault) {
    vaultAddress = call.to;
    vault = VaultStore.load(vaultAddress.toHexString());
  }

  if (vault) {
    const sharesMinted = call.outputs.value0;
    const depositAmount = call.inputs._amount;

    call.transaction
    _Deposit(
      vaultAddress,
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
  let vaultAddress = call.transaction.to!;
  let vault = VaultStore.load(vaultAddress.toHexString());

  if (!vault) {
    vaultAddress = call.to;
    vault = VaultStore.load(vaultAddress.toHexString());
  }

  if (vault) {
    const sharesMinted = call.outputs.value0;
    const depositAmount = call.inputs._amount;

    _Deposit(
      vaultAddress,
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
  let vaultAddress = call.transaction.to!;
  let vault = VaultStore.load(vaultAddress.toHexString());

  if (!vault) {
    vaultAddress = call.to;
    vault = VaultStore.load(vaultAddress.toHexString());
  }

  if (vault) {
    let withdrawAmount = call.outputs.value0;

    _Withdraw(
      vaultAddress,
      call.transaction,
      call.block,
      vault,
      withdrawAmount,
      constants.MAX_UINT256
    );
  }
  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleWithdrawWithShares(call: Withdraw1Call): void {
  let vaultAddress = call.transaction.to!;
  let vault = VaultStore.load(vaultAddress.toHexString());

  if (!vault) {
    vaultAddress = call.to;
    vault = VaultStore.load(vaultAddress.toHexString());
  }

  if (vault) {
    const sharesBurnt = call.inputs._shares;
    const withdrawAmount = call.outputs.value0;

    _Withdraw(
      vaultAddress,
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
  let vaultAddress = call.transaction.to!;
  let vault = VaultStore.load(vaultAddress.toHexString());

  if (!vault) {
    vaultAddress = call.to;
    vault = VaultStore.load(vaultAddress.toHexString());
  }

  if (vault) {
    const sharesBurnt = call.inputs._shares;
    const withdrawAmount = call.outputs.value0;

    _Withdraw(
      vaultAddress,
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

export function handleWithdrawWithSharesAndRecipientAndLoss(
  call: Withdraw3Call
): void {
  let vaultAddress = call.transaction.to!;
  let vault = VaultStore.load(vaultAddress.toHexString());

  if (!vault) {
    vaultAddress = call.to;
    vault = VaultStore.load(vaultAddress.toHexString());
  }

  if (vault) {
    const sharesBurnt = call.inputs.maxShares;
    const withdrawAmount = call.outputs.value0;

    _Withdraw(
      vaultAddress,
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
      utils.enumToPrefix(constants.VaultFeeType.PERFORMANCE_FEE) + vaultAddress;
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
      utils.enumToPrefix(constants.VaultFeeType.MANAGEMENT_FEE) + vaultAddress;
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
  event: NewStrategyReportedEvent
): void {
  const vaultAddress = event.address;
  const strategyAddress = event.params.strategy;

  strategyReported(
    event.params.gain,
    constants.BIGINT_ZERO,
    event.params.debtAdded,
    event.params.totalDebt,
    event,
    vaultAddress,
    strategyAddress
  );

  updateFinancials(event.block);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleStrategyReported_v2(
  event: OldStrategyReportedEvent
): void {
  const vaultAddress = event.address;
  const strategyAddress = event.params.strategy;

  strategyReported(
    event.params.gain,
    event.params.debtPaid,
    event.params.debtAdded,
    event.params.totalDebt,
    event,
    vaultAddress,
    strategyAddress
  );

  updateFinancials(event.block);
  updateVaultSnapshots(vaultAddress, event.block);
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
