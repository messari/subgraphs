import {
  updateFinancials,
  updateUsageMetrics,
  updateVaultSnapshots,
} from "../modules/Metrics";
import {
  StrategyAdded,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
} from "../../generated/templates/Strategy/Vault";
import * as utils from "../common/utils";
import { Deposit } from "../modules/Deposit";
import { Withdraw } from "../modules/Withdraw";
import { DataSourceContext } from "@graphprotocol/graph-ts";
import { Strategy as StrategyTemplate } from "../../generated/templates";

export function handleDeposit(event: DepositEvent): void {
  const vaultAddress = event.address;
  const sharesMinted = event.params.sharesMinted;
  const depositAmount = event.params.depositAmount;
  const strategyAddress = event.params.strategyAddress;

  Deposit(
    vaultAddress,
    strategyAddress,
    depositAmount,
    sharesMinted,
    event.transaction,
    event.block
  );

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleWithdraw(event: WithdrawEvent): void {
  const vaultAddress = event.address;
  const sharesBurnt = event.params.sharesBurnt;
  const withdrawAmount = event.params.withdrawAmount;
  const strategyAddress = event.params.strategyAddress;

  Withdraw(
    vaultAddress,
    strategyAddress,
    withdrawAmount,
    sharesBurnt,
    event.transaction,
    event.block
  );

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleStrategyAdded(event: StrategyAdded): void {
  const vaultAddress = event.address;
  const strategyAddress = event.params.strategyAddress;
  const underlyingStrategy = utils.getUnderlyingStrategy(strategyAddress);

  let context = new DataSourceContext();
  context.setString("vaultAddress", vaultAddress.toHexString());

  StrategyTemplate.createWithContext(underlyingStrategy, context);
}
