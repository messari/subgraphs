import {
  VaultFee,
  Vault as VaultStore,
  _Strategy as StrategyStore,
} from "../../generated/schema";
import * as utils from "../common/utils";
import { log } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import {
  SetWithdrawalFeeCall,
  SetPerformanceFeeCall,
  Harvested as HarvestedEvent,
} from "../../generated/templates/Strategy/Strategy";
import { _StrategyHarvested } from "../modules/Strategy";

export function handleSetPerformanceFee(call: SetPerformanceFeeCall): void {
  const strategyAddress = call.to;
  const strategy = StrategyStore.load(strategyAddress.toHexString());

  if (strategy) {
    const vaultAddress = strategy.vaultAddress;

    const performanceFeeId = utils.prefixID(
      constants.VaultFeeType.PERFORMANCE_FEE,
      vaultAddress.toHexString()
    );
    const performanceFee = VaultFee.load(performanceFeeId);

    performanceFee!.feePercentage = call.inputs._performanceFee
      .toBigDecimal()
      .div(constants.BIGDECIMAL_HUNDRED);

    performanceFee!.save();

    log.warning("[setPerformanceFee] TxHash: {}, PerformanceFee: {}", [
      call.transaction.hash.toHexString(),
      call.inputs._performanceFee.toString(),
    ]);
  }
}

export function handleSetWithdrawalFee(call: SetWithdrawalFeeCall): void {
  const strategyAddress = call.to;
  const strategy = StrategyStore.load(strategyAddress.toHexString());

  if (strategy) {
    const vaultAddress = strategy.vaultAddress;

    const withdrawalFeeId = utils.prefixID(
      constants.VaultFeeType.WITHDRAWAL_FEE,
      vaultAddress.toHexString()
    );
    const withdrawalFee = VaultFee.load(withdrawalFeeId);

    withdrawalFee!.feePercentage = call.inputs._withdrawalFee
      .toBigDecimal()
      .div(constants.BIGDECIMAL_HUNDRED);

    withdrawalFee!.save();

    log.warning("[setWithdrawalFee] TxHash: {}, withdrawalFee: {}", [
      call.transaction.hash.toHexString(),
      call.inputs._withdrawalFee.toString(),
    ]);
  }
}

export function handleHarvested(event: HarvestedEvent): void {
  const strategyAddress = event.address;
  const wantEarned = event.params.wantEarned;

  const strategy = StrategyStore.load(strategyAddress.toHexString());
  if (!strategy) return;

  const vaultAddress = strategy!.vaultAddress;
  const vault = VaultStore.load(vaultAddress.toHexString());

  if (vault) {
    _StrategyHarvested(
      strategyAddress,
      vault,
      wantEarned,
      event.block,
      event.transaction
    );
  }
}
