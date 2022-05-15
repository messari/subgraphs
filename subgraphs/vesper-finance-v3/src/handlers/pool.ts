import { log, dataSource, BigDecimal } from "@graphprotocol/graph-ts";
import {
  PoolV3,
  TransferCall,
  DepositCall,
  WithdrawCall,
  UpdatePoolRewardsCall,
} from "../../generated/vaUSDC_prod_RL4/PoolV3";
import {
  hasStrategy,
  calculateRevenue,
  getDecimalDivisor,
  getShareToTokenRateV3,
} from "../peer";
import { ZERO_ADDRESS } from "../constant";

import {
  getOrCreateVault,
  getOrCreateTransfer,
  getOrCreateWithdraw,
  getOrCreateDeposit,
  updateVaultRewardEmission,
} from "../entities";
import { updateAllSnapshots } from "../snapshots";
import { Erc20Token } from "../../generated/vaUSDC_prod_RL4/Erc20Token";

// See handleWithdrawFee for explanation.
export function handleWithdrawV3(call: WithdrawCall): void {
  getOrCreateVault(
    dataSource.address(),
    call.block.number,
    call.block.timestamp
  );
  let poolAddress = dataSource.address();
  let poolAddressHex = poolAddress.toHexString();
  let poolV3 = PoolV3.bind(poolAddress);
  const strategies_call = poolV3.try_getStrategies();

  if (strategies_call.reverted) {
    log.error('Pool : {} getStrategies failed', [poolAddressHex]);
    return;
  }

  if (
    call.to.equals(ZERO_ADDRESS) ||
    hasStrategy(poolV3.getStrategies(), call.to)
  ) {
    let toHex = call.to.toHexString();
    log.info(
      "Withdraw Event for pool V3 {} was made by {} - it is not interest fees.",
      [poolAddressHex, toHex]
    );
    return;
  }

  updateVaultRewardEmission(dataSource.address());
  getOrCreateWithdraw(call, dataSource.address());
  updateAllSnapshots(call, dataSource.address());
}

export function handleTransferV3(call: TransferCall): void {
  let poolAddress = dataSource.address();
  let poolAddressHex = poolAddress.toHexString();
  log.info("Entered handleTransferV3 in tx={}, pool={}", [
    call.transaction.hash.toHex(),
    poolAddressHex,
  ]);
  let poolV3 = PoolV3.bind(poolAddress);
  const strategies_call = poolV3.try_getStrategies();

  if (strategies_call.reverted) {
    log.error('Pool : {} getStrategies failed', [poolAddressHex]);
    return;
  }
  
  if (
    call.from.equals(ZERO_ADDRESS) ||
    hasStrategy(poolV3.getStrategies(), call.from)
  ) {
    let toHex = call.from.toHexString();
    log.info(
      "Transfer Event for pool V3 {} was made by {} - it is not interest fees.",
      [poolAddressHex, toHex]
    );
    return;
  }

  updateVaultRewardEmission(dataSource.address());
  getOrCreateVault(
    dataSource.address(),
    call.block.number,
    call.block.timestamp
  );
  getOrCreateTransfer(call, dataSource.address());

  const token = Erc20Token.bind(poolV3.token());
  const revenue = calculateRevenue(
    call.inputs.amount.toBigDecimal().div(getDecimalDivisor(token.decimals())),
    getShareToTokenRateV3(poolV3),
    poolV3.token()
  );
  log.info(
    "Fees distribution for pool{}: ProtocolRevenue={}, supplySideRevenue={}",
    [
      poolAddressHex,
      revenue.protocolRevenueUsd.toString(),
      revenue.supplySideRevenueUsd.toString(),
    ]
  );

  updateAllSnapshots(
    call,
    dataSource.address(),
    revenue.protocolRevenueUsd,
    revenue.supplySideRevenueUsd
  );
}

export function handleDepositV3(call: DepositCall): void {
  let poolAddress = dataSource.address();
  let poolAddressHex = poolAddress.toHexString();
  log.info("Entered handleTransferV3 in tx={}, pool={}", [
    call.transaction.hash.toHex(),
    poolAddressHex,
  ]);
  let poolV3 = PoolV3.bind(poolAddress);
  const strategies_call = poolV3.try_getStrategies();

  if (strategies_call.reverted) {
    log.error('Pool : {} getStrategies failed', [poolAddressHex]);
    return;
  }
  
  if (
    call.from.equals(ZERO_ADDRESS) ||
    hasStrategy(poolV3.getStrategies(), call.from)
  ) {
    let toHex = call.from.toHexString();
    log.info(
      "Deposit Event for pool V3 {} was made by {} - it is not interest fees.",
      [poolAddressHex, toHex]
    );
    return;
  }

  updateVaultRewardEmission(dataSource.address());
  getOrCreateVault(
    dataSource.address(),
    call.block.number,
    call.block.timestamp
  );
  getOrCreateDeposit(call, dataSource.address());

  const token = Erc20Token.bind(poolV3.token());
  const revenue = calculateRevenue(
    call.inputs._amount.toBigDecimal().div(getDecimalDivisor(token.decimals())),
    BigDecimal.fromString("1"),
    poolV3.token()
  );
  log.info(
    "Fees distribution for pool{}: ProtocolRevenue={}, supplySideRevenue={}",
    [
      poolAddressHex,
      revenue.protocolRevenueUsd.toString(),
      revenue.supplySideRevenueUsd.toString(),
    ]
  );

  updateAllSnapshots(
    call,
    dataSource.address(),
    revenue.protocolRevenueUsd,
    revenue.supplySideRevenueUsd
  );
}

