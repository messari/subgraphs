import { BigInt, Address, log, BigDecimal } from "@graphprotocol/graph-ts";

import {
  Deposit,
  Withdraw,
  Borrow,
  Repay,
  ReserveDataUpdated,
  LiquidationCall,
  ReserveUsedAsCollateralEnabled,
  ReserveUsedAsCollateralDisabled,
} from "../../generated/templates/LendingPool/LendingPool";

import {
  Deposit as DepositEntity,
  Withdraw as WithdrawEntity,
  Borrow as BorrowEntity,
  Repay as RepayEntity,
  Liquidate as LiquidateEntity,
  Market,
} from "../../generated/schema";

import {
  getOrCreateProtocol,
  getProtocolIdFromCtx,
  initializeMarket,
  tokenAmountInUSD,
  updateFinancialsDailySnapshot,
  getMarketDailySnapshot,
  updateMetricsDailySnapshot,
  updateTVL,
  calculateRevenues,
  updateMetricsHourlySnapshot,
  getOrCreateInterestRate,
} from "./helpers";

import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../common/constants";

import { bigIntToBigDecimal, rayToWad } from "../common/utils/numbers";

import { getOrCreateToken } from "../common/getters";

export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  // Update deposit borrow rates when the market reserve data is updated
  const token = getOrCreateToken(event.params.reserve);
  const market = initializeMarket(
    event.block.number,
    event.block.timestamp,
    event.params.reserve.toHexString()
  ) as Market;
  log.info("Creating market with ID={}", [market.id]);

  // The rates provided in params are in ray format (27 dec). Convert to decimal format
  log.info(
    "Updating reserve data. New Liquidity rate={}, Variable borrow rate={}, Stable borrow rate={}",
    [
      event.params.liquidityRate.toString(),
      event.params.variableBorrowRate.toString(),
      event.params.stableBorrowRate.toString(),
    ]
  );
  let variableDepositRate = getOrCreateInterestRate(
    market.id,
    "LENDER",
    "VARIABLE"
  );
  variableDepositRate.rate = bigIntToBigDecimal(event.params.liquidityRate);
  variableDepositRate.save();

  let stableBorrowRate = getOrCreateInterestRate(
    market.id,
    "BORROWER",
    "STABLE"
  );
  stableBorrowRate.rate = bigIntToBigDecimal(
    rayToWad(event.params.stableBorrowRate)
  );
  stableBorrowRate.save();

  let variableBorrowRate = getOrCreateInterestRate(
    market.id,
    "BORROWER",
    "VARIABLE"
  );
  variableBorrowRate.rate = bigIntToBigDecimal(
    rayToWad(event.params.variableBorrowRate)
  );
  variableBorrowRate.save();

  market.rates = [
    stableBorrowRate.id,
    variableBorrowRate.id,
    variableDepositRate.id,
  ];

  log.info(
    "Updated market ID={} reserve data: token decimals={}, deposit rate={}, variable borrow rate={}, stable borrow rate={}",
    [
      market.id,
      token.decimals.toString(),
      variableDepositRate.rate.toString(),
      variableBorrowRate.rate.toString(),
      stableBorrowRate.rate.toString(),
    ]
  );
  market.save();
}

// BORROW/WITHDRAW/REPAY ACTIONS
// -----------------------------

export function handleDeposit(event: Deposit): void {
  log.info("Deposit event. tx hash={}, reserve={}, amount={}", [
    event.transaction.hash.toHexString(),
    event.params.reserve.toHexString(),
    event.params.amount.toString(),
  ]);
  // Deposit event to a lending pool triggers this handler
  const hash = event.transaction.hash.toHexString();
  const marketAddress = event.params.reserve.toHexString();
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);
  // Initialize the reserve token
  const token = getOrCreateToken(event.params.reserve);
  // Instantiate the deposit entity with the specified string construction as id
  const deposit = new DepositEntity(hash + "-" + event.logIndex.toHexString());
  deposit.to = marketAddress;
  deposit.market = marketAddress;
  deposit.from = event.transaction.from.toHexString();
  deposit.hash = hash;
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = protocol.id;
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;
  // The reserve param is the asset contract address
  deposit.asset = event.params.reserve.toHexString();
  deposit.amount = event.params.amount;

  let market = initializeMarket(
    event.block.number,
    event.block.timestamp,
    marketAddress
  ) as Market;
  const amountUSD = tokenAmountInUSD(
    market.inputTokenPriceUSD,
    token.decimals,
    event.params.amount,
    market
  );
  deposit.amountUSD = amountUSD;
  market.inputTokenBalance = market.inputTokenBalance.plus(deposit.amount);

  // Update total value locked on the market level
  updateTVL(hash, token, market, protocol, deposit.amount, amountUSD, false);
  market.save();

  // Update snapshots
  getMarketDailySnapshot(event, market);
  let dailyMetrics = updateMetricsDailySnapshot(event);
  dailyMetrics.dailyDepositCount += 1;
  dailyMetrics.save();

  let hourlyMetrics = updateMetricsHourlySnapshot(event);
  hourlyMetrics.hourlyDepositCount += 1;
  hourlyMetrics.save();

  let financial = updateFinancialsDailySnapshot(event);
  financial.save();
  deposit.save();
}

export function handleWithdraw(event: Withdraw): void {
  // Withdraw event from a lending pool to a user triggers this handler
  log.info("Withdrawing reserve={}, amount={}, tx hash={}", [
    event.params.reserve.toHexString(),
    event.params.amount.toString(),
    event.transaction.hash.toHexString(),
  ]);
  const hash = event.transaction.hash.toHexString();
  const marketAddr = event.params.reserve.toHexString();
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);
  const token = getOrCreateToken(event.params.reserve);
  const withdraw = new WithdrawEntity(
    hash + "-" + event.logIndex.toHexString()
  );

  // The tokens are sent to the address listed as the 'to' param field of the event
  // NOT 'to' property of event.transaction which marketAddr is set to
  withdraw.to = event.transaction.from.toHexString();
  withdraw.market = marketAddr;
  withdraw.from = marketAddr;
  withdraw.hash = hash;
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.asset = event.params.reserve.toHexString();
  withdraw.protocol = protocol.id || protocolId;
  withdraw.timestamp = event.block.timestamp;
  withdraw.blockNumber = event.block.number;
  withdraw.amount = event.params.amount;

  let market = initializeMarket(
    event.block.number,
    event.block.timestamp,
    marketAddr
  ) as Market;
  const amountUSD = tokenAmountInUSD(
    market.inputTokenPriceUSD,
    token.decimals,
    event.params.amount,
    market
  );
  withdraw.amountUSD = amountUSD;
  market.inputTokenBalance = market.inputTokenBalance.minus(withdraw.amount);

  // Update total value locked on the market level
  updateTVL(hash, token, market, protocol, withdraw.amount, amountUSD, true);
  market.save();

  // Update snapshots
  getMarketDailySnapshot(event, market);
  let dailyMetrics = updateMetricsDailySnapshot(event);
  dailyMetrics.dailyWithdrawCount += 1;
  dailyMetrics.save();

  let hourlyMetrics = updateMetricsHourlySnapshot(event);
  hourlyMetrics.hourlyWithdrawCount += 1;
  hourlyMetrics.save();

  let financial = updateFinancialsDailySnapshot(event);
  financial.save();
  withdraw.save();
}

export function handleBorrow(event: Borrow): void {
  // Borrow event from a lending pool to a user triggers this handler
  // Stable: 1, Variable: 2
  log.info("Borrowing reserve={}, amount={}, tx hash={}", [
    event.params.reserve.toHexString(),
    event.params.amount.toString(),
    event.transaction.hash.toHexString(),
  ]);
  // Depending on borrow mode, add to stable/variable tvl and trigger total fee calculation
  const hash = event.transaction.hash.toHexString();
  const marketAddr = event.params.reserve.toHexString();
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);
  const token = getOrCreateToken(event.params.reserve);
  const borrow = new BorrowEntity(hash + "-" + event.logIndex.toHexString());
  borrow.to = event.transaction.from.toHexString();
  borrow.market = marketAddr;
  borrow.from = marketAddr;
  borrow.hash = hash;
  borrow.logIndex = event.logIndex.toI32();
  borrow.asset = event.params.reserve.toHexString();
  borrow.protocol = protocol.id || protocolId;
  borrow.timestamp = event.block.timestamp;
  borrow.blockNumber = event.block.number;
  borrow.amount = event.params.amount;

  let market = initializeMarket(
    event.block.number,
    event.block.timestamp,
    marketAddr
  ) as Market;
  const amountUSD = tokenAmountInUSD(
    market.inputTokenPriceUSD,
    token.decimals,
    event.params.amount,
    market
  );
  borrow.amountUSD = amountUSD;
  market.inputTokenBalance = market.inputTokenBalance.minus(borrow.amount);

  // Update total value locked on the market level
  updateTVL(hash, token, market, protocol, borrow.amount, amountUSD, true);
  market.save();

  // Calculate the revenues and fees as a result of the borrow
  calculateRevenues(market, token);

  // Update snapshots
  getMarketDailySnapshot(event, market);
  let dailyMetrics = updateMetricsDailySnapshot(event);
  dailyMetrics.dailyBorrowCount += 1;
  dailyMetrics.save();

  let hourlyMetrics = updateMetricsHourlySnapshot(event);
  hourlyMetrics.hourlyBorrowCount += 1;
  hourlyMetrics.save();

  let financial = updateFinancialsDailySnapshot(event);
  financial.save();
  borrow.save();
}

export function handleRepay(event: Repay): void {
  // Repay event from a user who is paying back into a pool that they borrowed from
  log.info("Repaying reserve={}, amount={}, tx hash={}", [
    event.params.reserve.toHexString(),
    event.params.amount.toString(),
    event.transaction.hash.toHexString(),
  ]);
  const hash = event.transaction.hash.toHexString();
  const marketAddr = event.params.reserve.toHexString();
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);
  const token = getOrCreateToken(event.params.reserve);
  const repay = new RepayEntity(hash + "-" + event.logIndex.toHexString());
  repay.to = marketAddr;
  repay.market = marketAddr;
  repay.from = event.transaction.from.toHexString();
  repay.hash = hash;
  repay.logIndex = event.logIndex.toI32();
  repay.asset = event.params.reserve.toHexString();
  repay.protocol = protocol.id || protocolId;
  repay.timestamp = event.block.timestamp;
  repay.blockNumber = event.block.number;
  repay.amount = event.params.amount;

  let market = initializeMarket(
    event.block.number,
    event.block.timestamp,
    marketAddr
  ) as Market;
  const amountUSD = tokenAmountInUSD(
    market.inputTokenPriceUSD,
    token.decimals,
    event.params.amount,
    market
  );
  repay.amountUSD = amountUSD;

  market.inputTokenBalance = market.inputTokenBalance.plus(repay.amount);

  // Update total value locked on the market level
  updateTVL(hash, token, market, protocol, repay.amount, amountUSD, false);
  market.save();

  calculateRevenues(market, token);

  // Update snapshots
  getMarketDailySnapshot(event, market);
  let dailyMetrics = updateMetricsDailySnapshot(event);
  dailyMetrics.dailyRepayCount += 1;
  dailyMetrics.save();

  let hourlyMetrics = updateMetricsHourlySnapshot(event);
  hourlyMetrics.hourlyRepayCount += 1;
  hourlyMetrics.save();

  let financial = updateFinancialsDailySnapshot(event);
  financial.save();
  repay.save();
}

export function handleLiquidationCall(event: LiquidationCall): void {
  // Liquidate event where a users collateral assets are sold to reduce the ratio to borrowed assets
  const hash = event.transaction.hash.toHexString();
  const marketAddr = event.params.collateralAsset.toHexString();
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateProtocol(protocolId);
  const token = getOrCreateToken(event.params.collateralAsset);
  const liquidate = new LiquidateEntity(
    hash + "-" + event.logIndex.toHexString()
  );
  // liquidate.to is set to the market address
  liquidate.to = marketAddr;
  liquidate.market = marketAddr;
  liquidate.from = event.params.liquidator.toHexString();
  liquidate.hash = hash;
  liquidate.logIndex = event.logIndex.toI32();
  liquidate.asset = event.params.collateralAsset.toHexString();
  liquidate.protocol = protocol.id || protocolId;
  liquidate.timestamp = event.block.timestamp;
  liquidate.blockNumber = event.block.number;
  liquidate.amount = event.params.liquidatedCollateralAmount;

  let market = initializeMarket(
    event.block.number,
    event.block.timestamp,
    marketAddr
  ) as Market;
  const amountUSD = tokenAmountInUSD(
    market.inputTokenPriceUSD,
    token.decimals,
    event.params.liquidatedCollateralAmount,
    market
  );
  liquidate.amountUSD = amountUSD;

  market.inputTokenBalance = market.inputTokenBalance.plus(liquidate.amount);

  // Update total value locked on the market level
  updateTVL(hash, token, market, protocol, liquidate.amount, amountUSD, false);
  calculateRevenues(market, token);
  market.save();

  // Update snapshots
  getMarketDailySnapshot(event, market);
  let dailyMetrics = updateMetricsDailySnapshot(event);
  dailyMetrics.dailyLiquidateCount += 1;
  dailyMetrics.save();

  let hourlyMetrics = updateMetricsHourlySnapshot(event);
  hourlyMetrics.hourlyLiquidateCount += 1;
  hourlyMetrics.save();

  let financial = updateFinancialsDailySnapshot(event);
  financial.save();

  if (market.liquidationPenalty.gt(BIGDECIMAL_ZERO)) {
    log.info("Liquidation hash={}, amount={} USD, liquidation penalty={}", [
      hash,
      amountUSD.toString(),
      market.liquidationPenalty.toString(),
    ]);
    liquidate.profitUSD = amountUSD
      .times(market.liquidationPenalty)
      .div(BigDecimal.fromString("100"));
  } else {
    liquidate.profitUSD = BIGDECIMAL_ZERO;
  }
  liquidate.save();
}

export function handleReserveUsedAsCollateralEnabled(
  event: ReserveUsedAsCollateralEnabled
): void {
  // This Event handler enables a reserve/market to be used as collateral
  const marketAddr = event.params.reserve.toHexString();
  const market = initializeMarket(
    event.block.number,
    event.block.timestamp,
    marketAddr
  ) as Market;
  market.canUseAsCollateral = true;
  market.save();
}

export function handleReserveUsedAsCollateralDisabled(
  event: ReserveUsedAsCollateralDisabled
): void {
  // This Event handler disables a reserve/market being used as collateral
  const marketAddr = event.params.reserve.toHexString();
  const market = initializeMarket(
    event.block.number,
    event.block.timestamp,
    marketAddr
  ) as Market;
  market.canUseAsCollateral = false;
  market.save();
}
