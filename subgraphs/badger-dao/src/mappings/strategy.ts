import { SetPerformanceFeeGovernanceCall, SetWithdrawalFeeCall } from "../../generated/native.bveCVX/Strategy";
import { VaultFee, _Strategy } from "../../generated/schema";
import { VaultFeeType } from "../constant";
import { enumToPrefix } from "../utils/strings";

export function handlePerformanceFee(call: SetPerformanceFeeGovernanceCall): void {
  const strategyAddress = call.to;
  const strategy = _Strategy.load(strategyAddress.toHex());

  if (strategy) {
    let vaultAddress = strategy.vault;
    let performanceFeeId = enumToPrefix(VaultFeeType.PERFORMANCE_FEE).concat(vaultAddress);

    let performanceFee = new VaultFee(performanceFeeId);
    performanceFee.feeType = VaultFeeType.PERFORMANCE_FEE;
    performanceFee.feePercentage = call.inputs._performanceFeeGovernance.toBigDecimal();
    performanceFee.save();
  }
}

export function handleWithdrawalFee(call: SetWithdrawalFeeCall): void {
  const strategyAddress = call.to;
  const strategy = _Strategy.load(strategyAddress.toHex());

  if (strategy) {
    let vaultAddress = strategy.vault;
    let withdrawFeeId = enumToPrefix(VaultFeeType.WITHDRAWAL_FEE).concat(vaultAddress);

    let withdrawFee = new VaultFee(withdrawFeeId);
    withdrawFee.feeType = VaultFeeType.WITHDRAWAL_FEE;
    withdrawFee.feePercentage = call.inputs._withdrawalFee.toBigDecimal();
    withdrawFee.save();
  }
}
