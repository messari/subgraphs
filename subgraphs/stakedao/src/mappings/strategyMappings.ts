import {
  Strategy as StrategyStore,
  Vault as VaultStore,
  VaultFee,
} from "../../generated/schema";
import {
  Harvested as HarvestedEvent,
  SetPerformanceFeeCall,
  SetWithdrawalFeeCall,
} from "../../generated/templates/Strategy/Strategy";

import { BigInt, log } from "@graphprotocol/graph-ts";


export function handleHarvested(event: HarvestedEvent): void {
  const strategyAddress = event.address;
  const strategy = StrategyStore.load(strategyAddress.toHexString());

  if (strategy) {
    const vaultAddress = strategy.vaultAddress;
    const vault = VaultStore.load(vaultAddress.toHexString());

    // load performance fee and get the fees percentage
    const vaultFee = VaultFee.load(vault!.fees[1]);
    let performanceFee = BigInt.fromString(vaultFee!.feePercentage.toString());

    let origionalBalance = vault!.inputTokenBalances[0];

    let wantEarned = event.params.wantEarned
      .times(BigInt.fromI32(100).minus(performanceFee))
      .div(BigInt.fromI32(100));

    vault!.inputTokenBalances = [
      vault!.inputTokenBalances[0].plus(wantEarned.toBigDecimal()),
    ];

    vault!.save();

    log.warning(
      "[handleHarvested]\n TxHash: {}, wantEarned: {}, origionalBalance: {}",
      [
        event.address.toHexString(),
        wantEarned.toString(),
        origionalBalance.toString(),
      ]
    );
  }
}

export function handleSetPerformanceFee(call: SetPerformanceFeeCall): void {
  const strategyAddress = call.to;
  const strategy = StrategyStore.load(strategyAddress.toHexString());

  if (strategy) {
    const vaultAddress = strategy.vaultAddress;

    let performanceFeeId = "performance-fee-" + vaultAddress.toHexString();
    const performanceFee = VaultFee.load(performanceFeeId);

    performanceFee!.feePercentage = call.inputs._performanceFee
      .div(BigInt.fromI32(100))
      .toBigDecimal();

    performanceFee!.save()
    
    log.warning(
      "[setPerformanceFee]\n TxHash: {}, newPerformanceFee: {}",
      [
        call.transaction.hash.toHexString(),
        call.inputs._performanceFee.toString(),
      ]
    );
  }
}

export function handleSetWithdrawalFee(call: SetWithdrawalFeeCall): void {
  const strategyAddress = call.to;
  const strategy = StrategyStore.load(strategyAddress.toHexString());

  if (strategy) {
    const vaultAddress = strategy.vaultAddress;

    let withdrawalFeeId = "withdrawal-fee-" + vaultAddress.toHexString();
    const withdrawalFee = VaultFee.load(withdrawalFeeId);

    withdrawalFee!.feePercentage = call.inputs._withdrawalFee
      .div(BigInt.fromI32(100))
      .toBigDecimal();

    withdrawalFee!.save()

    log.warning(
      "[setWithdrawalFee]\n TxHash: {}, newPerformanceFee: {}",
      [
        call.transaction.hash.toHexString(),
        call.inputs._withdrawalFee.toString(),
      ]
    );
  }
}
