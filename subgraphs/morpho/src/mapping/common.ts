import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  Repay,
  Borrow,
  Market,
  Account,
  Deposit,
  Withdraw,
  Liquidate,
  _ActiveAccount,
  LendingProtocol,
} from "../../generated/schema";
import {
  EventType,
  PositionSide,
  exponentToBigInt,
  InterestRateSide,
  InterestRateType,
  BIGDECIMAL_HUNDRED,
  ReserveUpdateParams,
  exponentToBigDecimal,
} from "../constants";
import {
  getEventId,
  addPosition,
  createAccount,
  snapshotUsage,
  updateP2PRates,
  updateSnapshots,
  subtractPosition,
  createInterestRate,
  updateProtocolPosition,
  updateRevenueSnapshots,
  updateProtocolValues,
} from "../helpers";
import { IMaths } from "../utils/maths/mathsInterface";
import { getMarket, getOrInitToken } from "../utils/initializers";

export class MorphoPositions {
  constructor(
    public readonly morphoSupplyOnPool: BigDecimal,
    public readonly morphoBorrowOnPool: BigDecimal,
    public readonly morphoSupplyP2P: BigDecimal,
    public readonly morphoBorrowP2P: BigDecimal,
    public readonly morphoSupplyOnPool_BI: BigInt,
    public readonly morphoBorrowOnPool_BI: BigInt,
    public readonly morphoSupplyP2P_BI: BigInt,
    public readonly morphoBorrowP2P_BI: BigInt
  ) {}
}

export function _handleSupplied(
  event: ethereum.Event,
  protocol: LendingProtocol,
  market: Market,
  accountID: Address,
  amount: BigInt,
  balanceOnPool: BigInt,
  balanceInP2P: BigInt
): void {
  const inputToken = getOrInitToken(market.inputToken);

  const deposit = new Deposit(
    getEventId(event.transaction.hash, event.logIndex)
  );

  // create account
  let account = Account.load(accountID);
  if (!account) {
    account = createAccount(accountID);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  account.depositCount += 1;
  account.save();

  // update position
  const position = addPosition(
    protocol,
    market,
    account,
    PositionSide.COLLATERAL,
    EventType.DEPOSIT,
    event
  );

  const virtualP2P = balanceInP2P
    .times(market._p2pSupplyIndex!)
    .div(market._lastPoolSupplyIndex!);

  market._virtualScaledSupply = market
    ._virtualScaledSupply!.minus(position._virtualP2P!)
    .plus(virtualP2P);

  market._scaledSupplyOnPool = market
    ._scaledSupplyOnPool!.minus(position._balanceOnPool!)
    .plus(balanceOnPool);
  market._scaledSupplyInP2P = market
    ._scaledSupplyInP2P!.minus(position._balanceInP2P!)
    .plus(balanceInP2P);

  position._balanceOnPool = balanceOnPool;
  position._balanceInP2P = balanceInP2P;
  position._virtualP2P = virtualP2P;

  const totalSupplyOnPool = balanceOnPool
    .times(market._lastPoolSupplyIndex!)
    .div(exponentToBigInt(market._indexesOffset));
  const totalSupplyInP2P = balanceInP2P
    .times(market._p2pSupplyIndex!)
    .div(exponentToBigInt(market._indexesOffset));

  position.balance = totalSupplyOnPool.plus(totalSupplyInP2P);
  position.save();

  deposit.position = position.id;
  deposit.nonce = event.transaction.nonce;
  deposit.account = account.id;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.market = market.id;
  deposit.hash = event.transaction.hash;
  deposit.logIndex = event.logIndex.toI32();
  deposit.asset = inputToken.id;
  deposit.amount = amount;
  deposit.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals))
    .times(market.inputTokenPriceUSD);
  deposit.gasPrice = event.transaction.gasPrice;
  deposit.gasLimit = event.transaction.gasLimit;
  deposit.save();

  // update metrics
  protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(
    deposit.amountUSD
  );
  protocol.depositCount += 1;
  protocol.save();
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(
    deposit.amountUSD
  );
  market.depositCount += 1;
  market.save();

  // update usage metrics
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    accountID.toHexString(),
    EventType.DEPOSIT,
    true
  );

  updateProtocolPosition(protocol, market);

  // update market daily / hourly snapshots / financialSnapshots
  updateSnapshots(
    protocol,
    market,
    deposit.amountUSD,
    deposit.amount,
    EventType.DEPOSIT,
    event.block
  );
  updateProtocolValues(protocol.id);
}

export function _handleWithdrawn(
  event: ethereum.Event,
  protocol: LendingProtocol,
  market: Market,
  accountID: Address,
  amount: BigInt,
  balanceOnPool: BigInt,
  balanceInP2P: BigInt
): void {
  const inputToken = getOrInitToken(market.inputToken);

  // create withdraw entity
  const withdraw = new Withdraw(
    getEventId(event.transaction.hash, event.logIndex)
  );

  // get account
  let account = Account.load(accountID);
  if (!account) {
    account = createAccount(accountID);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  account.withdrawCount += 1;
  account.save();

  const totalSupplyOnPool = balanceOnPool
    .times(market._lastPoolSupplyIndex!)
    .div(exponentToBigInt(market._indexesOffset));
  const totalSupplyInP2P = balanceInP2P
    .times(market._p2pSupplyIndex!)
    .div(exponentToBigInt(market._indexesOffset));
  const balance = totalSupplyOnPool.plus(totalSupplyInP2P);

  const position = subtractPosition(
    protocol,
    market,
    account,
    balance,
    PositionSide.COLLATERAL,
    EventType.WITHDRAW,
    event
  );

  if (position === null) {
    log.critical(
      "[handleWithdraw] Position not found for account: {} in transaction: {}",
      [accountID.toHexString(), event.transaction.hash.toHexString()]
    );
    return;
  }

  const virtualP2P = balanceInP2P
    .times(market._p2pSupplyIndex!)
    .div(market._lastPoolSupplyIndex!);

  market._scaledSupplyOnPool = market
    ._scaledSupplyOnPool!.minus(position._balanceOnPool!)
    .plus(balanceOnPool);
  market._scaledSupplyInP2P = market
    ._scaledSupplyInP2P!.minus(position._balanceInP2P!)
    .plus(balanceInP2P);
  market._virtualScaledSupply = market
    ._virtualScaledSupply!.minus(position._virtualP2P!)
    .plus(virtualP2P);

  position._balanceOnPool = balanceOnPool;
  position._balanceInP2P = balanceInP2P;
  position._virtualP2P = virtualP2P;
  position.save();

  withdraw.position = position.id;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.account = account.id;
  withdraw.market = market.id;
  withdraw.hash = event.transaction.hash;
  withdraw.nonce = event.transaction.nonce;
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.asset = inputToken.id;
  withdraw.amount = amount;
  withdraw.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals))
    .times(market.inputTokenPriceUSD);
  withdraw.gasPrice = event.transaction.gasPrice;
  withdraw.gasLimit = event.transaction.gasLimit;
  withdraw.save();

  protocol.withdrawCount += 1;
  protocol.save();
  market.withdrawCount += 1;
  market.save();

  // update usage metrics
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    withdraw.account.toHexString(),
    EventType.WITHDRAW,
    true
  );

  updateProtocolPosition(protocol, market);

  // update market daily / hourly snapshots / financialSnapshots
  updateSnapshots(
    protocol,
    market,
    withdraw.amountUSD,
    withdraw.amount,
    EventType.WITHDRAW,
    event.block
  );
  updateProtocolValues(protocol.id);
}

export function _handleLiquidated(
  event: ethereum.Event,
  protocol: LendingProtocol,
  collateralAddress: Address,
  debtAddress: Address,
  liquidator: Address,
  liquidated: Address,
  amountSeized: BigInt,
  amountRepaid: BigInt
): void {
  // collateral market
  const market = getMarket(collateralAddress);
  const inputToken = getOrInitToken(market.inputToken);

  // create liquidate entity
  const liquidate = new Liquidate(
    getEventId(event.transaction.hash, event.logIndex)
  );

  // update liquidators account
  let liquidatorAccount = Account.load(liquidator);
  if (!liquidatorAccount) {
    liquidatorAccount = createAccount(liquidator);
    liquidatorAccount.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  liquidatorAccount.liquidateCount += 1;
  liquidatorAccount.save();
  const liquidatorActorID = "liquidator"
    .concat("-")
    .concat(liquidatorAccount.id.toHexString());
  let liquidatorActor = _ActiveAccount.load(liquidatorActorID);
  if (!liquidatorActor) {
    liquidatorActor = new _ActiveAccount(liquidatorActorID);
    liquidatorActor.save();

    protocol.cumulativeUniqueLiquidators += 1;
    protocol.save();
  }

  // get borrower account
  let account = Account.load(liquidated);
  if (!account) {
    account = createAccount(liquidated);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  account.liquidationCount += 1;
  account.save();
  const liquidateeActorID = "liquidatee"
    .concat("-")
    .concat(account.id.toHexString());
  let liquidateeActor = _ActiveAccount.load(liquidateeActorID);
  if (!liquidateeActor) {
    liquidateeActor = new _ActiveAccount(liquidateeActorID);
    liquidateeActor.save();

    protocol.cumulativeUniqueLiquidatees += 1;
    protocol.save();
  }

  const repayTokenMarket = getMarket(debtAddress);
  const debtAsset = getOrInitToken(repayTokenMarket.inputToken);
  // repaid position was updated in the repay event earlier

  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.positions = [];
  liquidate.liquidator = liquidator;
  liquidate.liquidatee = liquidated;
  liquidate.market = market.id;
  liquidate.hash = event.transaction.hash;
  liquidate.nonce = event.transaction.nonce;
  liquidate.logIndex = event.logIndex.toI32();
  liquidate.asset = repayTokenMarket.inputToken;
  liquidate.amount = amountSeized;
  liquidate.amountUSD = amountSeized
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals))
    .times(market.inputTokenPriceUSD);
  liquidate.profitUSD = liquidate.amountUSD.minus(
    amountRepaid
      .toBigDecimal()
      .div(exponentToBigDecimal(debtAsset.decimals))
      .times(repayTokenMarket.inputTokenPriceUSD)
  );
  liquidate.save();

  protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(
    liquidate.amountUSD
  );
  protocol.liquidationCount += 1;
  protocol.save();
  market.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD.plus(
    liquidate.amountUSD
  );
  market.liquidationCount += 1;
  market.save();

  // update usage metrics
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    liquidate.liquidatee.toHexString(),
    EventType.LIQUIDATEE,
    true // only count this liquidate as new tx
  );
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    liquidate.liquidator.toHexString(),
    EventType.LIQUIDATOR, // updates dailyActiveLiquidators
    false
  );

  // update market daily / hourly snapshots / financialSnapshots
  updateSnapshots(
    protocol,
    market,
    liquidate.amountUSD,
    liquidate.amount,
    EventType.LIQUIDATOR,
    event.block
  );
}

export function _handleBorrowed(
  event: ethereum.Event,
  protocol: LendingProtocol,
  market: Market,
  accountID: Address,
  amount: BigInt,
  onPool: BigInt,
  inP2P: BigInt
): void {
  const inputToken = getOrInitToken(market.inputToken);

  // create borrow entity
  const borrow = new Borrow(getEventId(event.transaction.hash, event.logIndex));

  // create account
  let account = Account.load(accountID);
  if (!account) {
    account = createAccount(accountID);
    account.save();
    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  if (account.borrowCount === 0) {
    protocol.cumulativeUniqueBorrowers += 1;
  }
  account.borrowCount += 1;
  account.save();

  // update position
  const position = addPosition(
    protocol,
    market,
    account,
    PositionSide.BORROWER,
    EventType.BORROW,
    event
  );

  const virtualP2P = inP2P
    .times(market._p2pBorrowIndex!)
    .div(market._lastPoolBorrowIndex!);

  market._scaledBorrowOnPool = market
    ._scaledBorrowOnPool!.minus(position._balanceOnPool!)
    .plus(onPool);

  market._scaledBorrowInP2P = market
    ._scaledBorrowInP2P!.minus(position._balanceInP2P!)
    .plus(inP2P);

  market._virtualScaledBorrow = market
    ._virtualScaledBorrow!.minus(position._virtualP2P!)
    .plus(virtualP2P);

  position._balanceOnPool = onPool;
  position._balanceInP2P = inP2P;
  position._virtualP2P = virtualP2P;

  const borrowOnPool = onPool
    .times(market._lastPoolBorrowIndex!)
    .div(exponentToBigInt(market._indexesOffset));
  const borrowInP2P = inP2P
    .times(market._p2pBorrowIndex!)
    .div(exponentToBigInt(market._indexesOffset));
  position.balance = borrowOnPool.plus(borrowInP2P);
  position.save();

  borrow.position = position.id;
  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.account = account.id;
  borrow.nonce = event.transaction.nonce;
  borrow.market = market.id;
  borrow.hash = event.transaction.hash;
  borrow.logIndex = event.logIndex.toI32();
  borrow.asset = inputToken.id;
  borrow.amount = amount;
  borrow.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals))
    .times(market.inputTokenPriceUSD);
  borrow.gasPrice = event.transaction.gasPrice;
  borrow.gasLimit = event.transaction.gasLimit;
  borrow.save();

  // update metrics
  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(
    borrow.amountUSD
  );
  protocol.borrowCount += 1;
  protocol.save();
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(
    borrow.amountUSD
  );
  market.borrowCount += 1;
  market.save();

  // update usage metrics
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    borrow.account.toHexString(),
    EventType.BORROW,
    true
  );

  updateProtocolPosition(protocol, market);
  // update market daily / hourly snapshots / financialSnapshots
  updateSnapshots(
    protocol,
    market,
    borrow.amountUSD,
    borrow.amount,
    EventType.BORROW,
    event.block
  );
  updateProtocolValues(protocol.id);
}

export function _handleP2PIndexesUpdated(
  event: ethereum.Event,
  protocol: LendingProtocol,
  market: Market,
  poolSupplyIndex: BigInt,
  p2pSupplyIndex: BigInt,
  poolBorrowIndex: BigInt,
  p2pBorrowIndex: BigInt
): void {
  const inputToken = getOrInitToken(market.inputToken);

  // The token price is updated in reserveUpdated event
  // calculate new revenue
  // New Interest = totalScaledSupply * (difference in liquidity index)
  let totalSupplyOnPool = market._scaledSupplyOnPool!;
  if (market._scaledPoolCollateral)
    totalSupplyOnPool = totalSupplyOnPool.plus(market._scaledPoolCollateral!);

  const supplyDeltaIndexes = poolSupplyIndex
    .minus(market._lastPoolSupplyIndex!)
    .toBigDecimal()
    .div(exponentToBigDecimal(market._indexesOffset));
  const poolSupplyInterest = supplyDeltaIndexes
    .times(totalSupplyOnPool.toBigDecimal())
    .div(exponentToBigDecimal(inputToken.decimals));

  const virtualSupplyInterest = supplyDeltaIndexes
    .times(market._virtualScaledSupply!.toBigDecimal())
    .div(exponentToBigDecimal(inputToken.decimals));

  market._lastPoolSupplyIndex = poolSupplyIndex;

  const p2pSupplyInterest = p2pSupplyIndex
    .minus(market._p2pSupplyIndex!)
    .toBigDecimal()
    .div(exponentToBigDecimal(market._indexesOffset))
    .times(market._scaledSupplyInP2P!.toBigDecimal())
    .div(exponentToBigDecimal(inputToken.decimals));

  market._p2pSupplyIndex = p2pSupplyIndex;

  const borrowDeltaIndexes = poolBorrowIndex
    .minus(market._lastPoolBorrowIndex!)
    .toBigDecimal()
    .div(exponentToBigDecimal(market._indexesOffset));

  const poolBorrowInterest = borrowDeltaIndexes
    .times(market._scaledBorrowOnPool!.toBigDecimal())
    .div(exponentToBigDecimal(inputToken.decimals));

  const virtualBorrowInterest = borrowDeltaIndexes
    .times(market._virtualScaledBorrow!.toBigDecimal())
    .div(exponentToBigDecimal(inputToken.decimals));

  market._lastPoolBorrowIndex = poolBorrowIndex;

  const p2pBorrowInterest = p2pBorrowIndex
    .minus(market._p2pBorrowIndex!)
    .toBigDecimal()
    .div(exponentToBigDecimal(market._indexesOffset))
    .times(market._scaledBorrowInP2P!.toBigDecimal())
    .div(exponentToBigDecimal(inputToken.decimals));

  market._p2pBorrowIndex = p2pBorrowIndex;

  const totalRevenueDelta = poolSupplyInterest.plus(p2pSupplyInterest);

  const totalRevenueDeltaUSD = totalRevenueDelta.times(
    market.inputTokenPriceUSD
  );

  if (!market.reserveFactor) market.reserveFactor = BigDecimal.zero();
  const protocolSideRevenueDeltaUSD = totalRevenueDeltaUSD.times(
    market.reserveFactor!
  );

  const supplySideRevenueDeltaUSD = totalRevenueDeltaUSD.minus(
    protocolSideRevenueDeltaUSD
  );

  // Morpho specific: update the interests generated on Morpho by both suppliers and borrowers, matched or not
  market._poolSupplyInterests =
    market._poolSupplyInterests!.plus(poolSupplyInterest);
  market._poolSupplyInterestsUSD! = market._poolSupplyInterestsUSD!.plus(
    poolSupplyInterest.times(market.inputTokenPriceUSD)
  );

  market._p2pSupplyInterests =
    market._p2pSupplyInterests!.plus(p2pSupplyInterest);
  market._p2pSupplyInterestsUSD = market._p2pSupplyInterestsUSD!.plus(
    p2pSupplyInterest.times(market.inputTokenPriceUSD)
  );

  market._poolBorrowInterests =
    market._poolBorrowInterests!.plus(poolBorrowInterest);
  market._poolBorrowInterestsUSD = market._poolBorrowInterestsUSD!.plus(
    poolBorrowInterest.times(market.inputTokenPriceUSD)
  );

  market._p2pBorrowInterests =
    market._p2pBorrowInterests!.plus(p2pBorrowInterest);
  market._p2pBorrowInterestsUSD = market._p2pBorrowInterestsUSD!.plus(
    p2pBorrowInterest.times(market.inputTokenPriceUSD)
  );

  market._p2pSupplyInterestsImprovement =
    market._p2pSupplyInterestsImprovement!.plus(
      p2pSupplyInterest.minus(virtualSupplyInterest)
    );

  market._p2pSupplyInterestsImprovementUSD =
    market._p2pSupplyInterestsImprovementUSD!.plus(
      p2pSupplyInterest
        .minus(virtualSupplyInterest)
        .times(market.inputTokenPriceUSD)
    );

  market._p2pBorrowInterestsImprovement =
    market._p2pBorrowInterestsImprovement!.plus(
      virtualBorrowInterest.minus(p2pBorrowInterest)
    );

  market._p2pBorrowInterestsImprovementUSD =
    market._p2pBorrowInterestsImprovementUSD!.plus(
      virtualBorrowInterest
        .minus(p2pBorrowInterest)
        .times(market.inputTokenPriceUSD)
    );

  market.save();
  protocol.save();

  // update revenue in market snapshots
  updateRevenueSnapshots(
    market,
    protocol,
    supplySideRevenueDeltaUSD,
    protocolSideRevenueDeltaUSD,
    event.block
  );

  updateProtocolPosition(protocol, market);
  updateProtocolValues(protocol.id);
}

export function _handleRepaid(
  event: ethereum.Event,
  protocol: LendingProtocol,
  market: Market,
  accountID: Address,
  amount: BigInt,
  balanceOnPool: BigInt,
  balanceInP2P: BigInt
): void {
  const inputToken = getOrInitToken(market.inputToken);

  // create repay entity
  const repay = new Repay(getEventId(event.transaction.hash, event.logIndex));

  // get account
  let account = Account.load(accountID);
  if (!account) {
    account = createAccount(accountID);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  account.repayCount += 1;
  account.save();

  const borrowOnPool = balanceOnPool
    .times(market._lastPoolBorrowIndex!)
    .div(exponentToBigInt(market._indexesOffset));
  const borrowInP2P = balanceInP2P
    .times(market._p2pBorrowIndex!)
    .div(exponentToBigInt(market._indexesOffset));
  const balance = borrowOnPool.plus(borrowInP2P);

  const position = subtractPosition(
    protocol,
    market,
    account,
    balance, // try getting balance of account in debt market
    PositionSide.BORROWER,
    EventType.REPAY,
    event
  );
  if (position === null) {
    log.warning(
      "[handleRepay] Position not found for account: {} in transaction; {}",
      [accountID.toHexString(), event.transaction.hash.toHexString()]
    );
    return;
  }
  const virtualP2P = balanceInP2P
    .times(market._p2pBorrowIndex!)
    .div(market._lastPoolBorrowIndex!);

  market._virtualScaledBorrow = market
    ._virtualScaledBorrow!.minus(position._virtualP2P!)
    .plus(virtualP2P);
  market._scaledBorrowOnPool = market
    ._scaledBorrowOnPool!.minus(position._balanceOnPool!)
    .plus(balanceOnPool);
  market._scaledBorrowInP2P = market
    ._scaledBorrowInP2P!.minus(position._balanceInP2P!)
    .plus(balanceInP2P);

  position._balanceOnPool = balanceOnPool;
  position._balanceInP2P = balanceInP2P;
  position._virtualP2P = virtualP2P;

  position.save();

  repay.position = position.id;
  repay.blockNumber = event.block.number;
  repay.timestamp = event.block.timestamp;
  repay.account = account.id;
  repay.market = market.id;
  repay.hash = event.transaction.hash;
  repay.nonce = event.transaction.nonce;
  repay.logIndex = event.logIndex.toI32();
  repay.asset = inputToken.id;
  repay.amount = amount;
  repay.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals))
    .times(market.inputTokenPriceUSD);
  repay.gasPrice = event.transaction.gasPrice;
  repay.gasLimit = event.transaction.gasLimit;
  repay.save();

  protocol.repayCount += 1;
  protocol.save();
  market.repayCount += 1;

  market.save();

  // update usage metrics
  snapshotUsage(
    protocol,
    event.block.number,
    event.block.timestamp,
    repay.account.toHexString(),
    EventType.REPAY,
    true
  );

  updateProtocolPosition(protocol, market);
  // update market daily / hourly snapshots / financialSnapshots
  updateSnapshots(
    protocol,
    market,
    repay.amountUSD,
    repay.amount,
    EventType.REPAY,
    event.block
  );

  updateProtocolValues(protocol.id);
}

export function _handleReserveUpdate(
  params: ReserveUpdateParams,
  market: Market,
  __MATHS__: IMaths
): void {
  // Update the total supply and borrow frequently by using pool updates
  const totalDepositBalanceUSD = market
    ._totalSupplyOnPool!.plus(market._totalSupplyInP2P!)
    .times(market.inputTokenPriceUSD);
  market.totalDepositBalanceUSD = totalDepositBalanceUSD;

  const totalBorrowBalanceUSD = market
    ._totalBorrowOnPool!.plus(market._totalBorrowInP2P!)
    .times(market.inputTokenPriceUSD);
  market.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;
  // Update pool indexes
  market._reserveSupplyIndex = params.reserveSupplyIndex;
  market._reserveBorrowIndex = params.reserveBorrowIndex;
  market._poolSupplyRate = params.poolSupplyRate;
  market._poolBorrowRate = params.poolBorrowRate;
  market._lastReserveUpdate = params.event.block.timestamp;

  // update rates as APR as it is done for aave subgraphs
  const supplyRate = params.poolSupplyRate
    .toBigDecimal()
    .div(exponentToBigDecimal(market._indexesOffset));

  const borrowRate = params.poolBorrowRate
    .toBigDecimal()
    .div(exponentToBigDecimal(market._indexesOffset));
  const poolSupplyRate = createInterestRate(
    market.id,
    InterestRateSide.LENDER,
    InterestRateType.VARIABLE,
    supplyRate.times(BIGDECIMAL_HUNDRED)
  );
  const poolBorrowRate = createInterestRate(
    market.id,
    InterestRateSide.BORROWER,
    InterestRateType.VARIABLE,
    borrowRate.times(BIGDECIMAL_HUNDRED)
  );

  market.rates = [
    poolSupplyRate.id,
    poolSupplyRate.id, // p2p rates are updated right after
    poolBorrowRate.id, // p2p rates are updated right after
    poolBorrowRate.id,
  ];
  market.save();

  updateP2PRates(market, __MATHS__);
  updateProtocolPosition(params.protocol, market);
  updateProtocolValues(params.protocol.id);

  return;
}

export function _handleSupplierPositionUpdated(
  event: ethereum.Event,
  protocol: LendingProtocol,
  marketAddress: Address,
  accountID: Address,
  onPool: BigInt,
  inP2P: BigInt
): void {
  const market = getMarket(marketAddress);
  const account = Account.load(accountID);
  if (!account) {
    log.critical("Account not found for accountID: {}", [
      accountID.toHexString(),
    ]);
    return;
  }
  const position = addPosition(
    protocol,
    market,
    account,
    PositionSide.COLLATERAL,
    EventType.SUPPLIER_POSITION_UPDATE,
    event
  );
  const virtualP2P = inP2P
    .times(market._p2pSupplyIndex!)
    .div(market._lastPoolSupplyIndex!);

  market._virtualScaledSupply = market
    ._virtualScaledSupply!.minus(position._virtualP2P!)
    .plus(virtualP2P);

  market._scaledSupplyOnPool = market
    ._scaledSupplyOnPool!.minus(position._balanceOnPool!)
    .plus(onPool);
  market._scaledSupplyInP2P = market
    ._scaledSupplyInP2P!.minus(position._balanceInP2P!)
    .plus(inP2P);

  position._balanceOnPool = onPool;
  position._balanceInP2P = inP2P;
  position._virtualP2P = virtualP2P;

  position.save();
  market.save();
}

export function _handleBorrowerPositionUpdated(
  event: ethereum.Event,
  protocol: LendingProtocol,
  marketAddress: Address,
  accountID: Address,
  onPool: BigInt,
  inP2P: BigInt
): void {
  const market = getMarket(marketAddress);
  const account = Account.load(accountID);
  if (!account) {
    log.critical("Account not found for accountID: {}", [
      accountID.toHexString(),
    ]);
    return;
  }
  const position = addPosition(
    protocol,
    market,
    account,
    PositionSide.BORROWER,
    EventType.BORROWER_POSITION_UPDATE,
    event
  );
  const virtualP2P = inP2P
    .times(market._p2pBorrowIndex!)
    .div(market._lastPoolBorrowIndex!);

  market._virtualScaledBorrow = market
    ._virtualScaledBorrow!.minus(position._virtualP2P!)
    .plus(virtualP2P);

  market._scaledBorrowOnPool = market
    ._scaledBorrowOnPool!.minus(position._balanceOnPool!)
    .plus(onPool);
  market._scaledBorrowInP2P = market
    ._scaledBorrowInP2P!.minus(position._balanceInP2P!)
    .plus(inP2P);

  position._balanceOnPool = onPool;
  position._balanceInP2P = inP2P;
  position._virtualP2P = virtualP2P;

  position.save();
  market.save();
}
