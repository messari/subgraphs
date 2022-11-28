import { Address, BigInt, dataSource } from "@graphprotocol/graph-ts";

import {
  createBridgeTransferEvent,
  updateProtocolTVL,
  updatePoolMetrics,
  updateRevenue,
  updateUsageMetrics,
  updateVolume,
  createLiquidityDepositEvent,
  createLiquidityWithdrawEvent,
} from "./helpers";
import {
  getOrCreateCrosschainToken,
  getOrCreatePool,
  getOrCreatePoolRoute,
  getOrCreateToken,
} from "../common/getters";
import { EventType } from "../common/constants";
import { NetworkConfigs } from "../../configurations/configure";

import { LogAnySwapIn, LogAnySwapOut } from "../../generated/RouterV6/Router";
import {
  DepositCall,
  Deposit1Call,
  Deposit2Call,
  WithdrawCall,
  Withdraw1Call,
  Withdraw2Call,
  DepositVaultCall,
  WithdrawVaultCall,
} from "../../generated/RouterV6/anyTOKEN";

export function handleSwapOut(event: LogAnySwapOut): void {
  const poolAddress = event.params.token.toHexString();

  const pool = getOrCreatePool(poolAddress, event);
  const token = getOrCreateToken(
    Address.fromString(pool.id),
    event.block.number
  );
  const crosschainToken = getOrCreateCrosschainToken(
    NetworkConfigs.getCrosschainTokenAddress(
      token,
      event.params.toChainID.toString()
    ),
    event.params.toChainID,
    Address.fromString(token.id),
    event.block.number
  );
  const poolRoute = getOrCreatePoolRoute(
    pool.id,
    Address.fromString(token.id),
    event.params.fromChainID,
    Address.fromString(crosschainToken.address),
    event.params.toChainID,
    event
  );

  updatePoolMetrics(pool.id, poolRoute.id, token, crosschainToken, event);

  updateVolume(
    pool.id,
    event.params.amount,
    true,
    token,
    event.params.fromChainID,
    Address.fromString(crosschainToken.address),
    event.params.toChainID,
    event
  );

  updateRevenue(
    pool.id,
    NetworkConfigs.getBridgeFeeUSD(
      event.params.amount,
      token,
      event.params.toChainID.toString()
    ),
    event
  );

  updateUsageMetrics(
    EventType.TRANSFER,
    event.params.toChainID,
    event.block,
    event.transaction
  );

  updateProtocolTVL(event);

  createBridgeTransferEvent(
    pool.id,
    Address.fromString(token.id),
    event.params.fromChainID,
    Address.fromString(crosschainToken.address),
    event.params.toChainID,
    poolRoute.id,
    true,
    event.params.from,
    event.params.to,
    event.transaction.hash,
    event.params.amount,
    event
  );
}

export function handleSwapIn(event: LogAnySwapIn): void {
  const poolAddress = event.params.token.toHexString();

  const pool = getOrCreatePool(poolAddress, event);
  const token = getOrCreateToken(
    Address.fromString(pool.id),
    event.block.number
  );
  const crosschainToken = getOrCreateCrosschainToken(
    NetworkConfigs.getCrosschainTokenAddress(
      token,
      event.params.fromChainID.toString()
    ),
    event.params.fromChainID,
    Address.fromString(token.id),
    event.block.number
  );
  const poolRoute = getOrCreatePoolRoute(
    pool.id,
    Address.fromString(token.id),
    event.params.toChainID,
    Address.fromString(crosschainToken.address),
    event.params.fromChainID,
    event
  );

  updatePoolMetrics(pool.id, poolRoute.id, token, crosschainToken, event);

  updateVolume(
    pool.id,
    event.params.amount,
    false,
    token,
    event.params.toChainID,
    Address.fromString(crosschainToken.address),
    event.params.fromChainID,
    event
  );

  updateUsageMetrics(
    EventType.TRANSFER,
    event.params.fromChainID,
    event.block,
    event.transaction
  );

  updateProtocolTVL(event);

  createBridgeTransferEvent(
    pool.id,
    Address.fromString(token.id),
    event.params.toChainID,
    Address.fromString(crosschainToken.address),
    event.params.fromChainID,
    poolRoute.id,
    false,
    event.transaction.from, // LogAnySwapIn does not have from address in params
    event.params.to,
    event.params.txhash,
    event.params.amount,
    event
  );
}

export function handleDeposit(call: DepositCall): void {
  const context = dataSource.context();
  const poolAddress = context.getString("poolAddress");
  const chainID = BigInt.fromString(context.getString("chainID"));

  updateUsageMetrics(EventType.DEPOSIT, chainID, call.block, call.transaction);

  createLiquidityDepositEvent(
    poolAddress,
    poolAddress,
    chainID,
    call.from,
    call.inputs.to,
    call.inputs.amount,
    call
  );
}

export function handleDeposit1(call: Deposit1Call): void {
  const context = dataSource.context();
  const poolAddress = context.getString("poolAddress");
  const chainID = BigInt.fromString(context.getString("chainID"));

  updateUsageMetrics(EventType.DEPOSIT, chainID, call.block, call.transaction);

  createLiquidityDepositEvent(
    poolAddress,
    poolAddress,
    chainID,
    call.from,
    call.from,
    call.inputs.amount,
    call
  );
}

export function handleDeposit2(call: Deposit2Call): void {
  const context = dataSource.context();
  const poolAddress = context.getString("poolAddress");
  const chainID = BigInt.fromString(context.getString("chainID"));

  updateUsageMetrics(EventType.DEPOSIT, chainID, call.block, call.transaction);

  createLiquidityDepositEvent(
    poolAddress,
    poolAddress,
    chainID,
    call.from,
    call.from,
    call.outputs.value0,
    call
  );
}

export function handleDepositVault(call: DepositVaultCall): void {
  const context = dataSource.context();
  const poolAddress = context.getString("poolAddress");
  const chainID = BigInt.fromString(context.getString("chainID"));

  updateUsageMetrics(EventType.DEPOSIT, chainID, call.block, call.transaction);

  createLiquidityDepositEvent(
    poolAddress,
    poolAddress,
    chainID,
    call.from,
    call.inputs.to,
    call.inputs.amount,
    call
  );
}

export function handleWithdraw(call: WithdrawCall): void {
  const context = dataSource.context();
  const poolAddress = context.getString("poolAddress");
  const chainID = BigInt.fromString(context.getString("chainID"));

  updateUsageMetrics(EventType.WITHDRAW, chainID, call.block, call.transaction);

  createLiquidityWithdrawEvent(
    poolAddress,
    poolAddress,
    chainID,
    call.from,
    call.inputs.to,
    call.inputs.amount,
    call
  );
}

export function handleWithdraw1(call: Withdraw1Call): void {
  const context = dataSource.context();
  const poolAddress = context.getString("poolAddress");
  const chainID = BigInt.fromString(context.getString("chainID"));

  updateUsageMetrics(EventType.WITHDRAW, chainID, call.block, call.transaction);

  createLiquidityWithdrawEvent(
    poolAddress,
    poolAddress,
    chainID,
    call.from,
    call.from,
    call.inputs.amount,
    call
  );
}

export function handleWithdraw2(call: Withdraw2Call): void {
  const context = dataSource.context();
  const poolAddress = context.getString("poolAddress");
  const chainID = BigInt.fromString(context.getString("chainID"));

  updateUsageMetrics(EventType.WITHDRAW, chainID, call.block, call.transaction);

  createLiquidityWithdrawEvent(
    poolAddress,
    poolAddress,
    chainID,
    call.from,
    call.from,
    call.outputs.value0,
    call
  );
}

export function handleWithdrawVault(call: WithdrawVaultCall): void {
  const context = dataSource.context();
  const poolAddress = context.getString("poolAddress");
  const chainID = BigInt.fromString(context.getString("chainID"));

  updateUsageMetrics(EventType.WITHDRAW, chainID, call.block, call.transaction);

  createLiquidityWithdrawEvent(
    poolAddress,
    poolAddress,
    chainID,
    call.inputs.from,
    call.inputs.to,
    call.inputs.amount,
    call
  );
}
