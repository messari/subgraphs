import {
  updateFactoryRewards,
  updateControllerRewards,
  updateStakedOutputTokenAmount,
} from "../modules/Rewards";
import {
  Deposit,
  Withdraw,
} from "../../generated/templates/LiquidityGauge/Gauge";
import { Address, dataSource } from "@graphprotocol/graph-ts";

export function handleDeposit(event: Deposit): void {
  let gaugeAddress = event.address;

  const context = dataSource.context();
  let poolAddress = Address.fromString(context.getString("poolAddress"));

  updateStakedOutputTokenAmount(poolAddress, gaugeAddress, event.block);
  updateControllerRewards(poolAddress, gaugeAddress, event.block);
  updateFactoryRewards(poolAddress, gaugeAddress, event.block);
}

export function handleWithdraw(event: Withdraw): void {
  let gaugeAddress = event.address;

  const context = dataSource.context();
  let poolAddress = Address.fromString(context.getString("poolAddress"));

  updateStakedOutputTokenAmount(poolAddress, gaugeAddress, event.block);
  updateControllerRewards(poolAddress, gaugeAddress, event.block);
  updateFactoryRewards(poolAddress, gaugeAddress, event.block);
}
