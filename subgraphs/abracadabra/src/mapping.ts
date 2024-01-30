import {
  Address,
  Bytes,
  dataSource,
  log,
  BigInt,
} from "@graphprotocol/graph-ts";
import { DegenBox, LogDeploy } from "../generated/BentoBox/DegenBox";
import {
  LogAddCollateral,
  LogBorrow,
  LogRemoveCollateral,
  LogRepay,
  Cauldron,
  LogAccrue,
  LogExchangeRate,
} from "../generated/templates/Cauldron/Cauldron";
import { MarketOracle } from "../generated/templates/Cauldron/MarketOracle";
import {
  Deposit,
  Borrow,
  Repay,
  Liquidate,
  Withdraw,
} from "../generated/schema";
import {
  NEG_INT_ONE,
  DEFAULT_DECIMALS,
  ABRA_ACCOUNTS,
  EventType,
  BIGINT_ZERO,
  InterestRateSide,
  PositionSide,
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
  ActivityInterval,
} from "./common/constants";
import { bigIntToBigDecimal } from "./common/utils/numbers";
import {
  getOrCreateToken,
  getOrCreateLendingProtocol,
  getMarket,
  getLiquidateEvent,
  getMIMAddress,
  getOrCreateActivityHelper,
} from "./common/getters";
import { Cauldron as CauldronDataSource } from "../generated/templates";
import {
  updateUsageMetrics,
  updateTVL,
  updateMarketStats,
  updateFinancials,
  updateTotalBorrows,
  updateBorrowAmount,
} from "./common/metrics";
import {
  createMarket,
  createLiquidateEvent,
  updateTokenPrice,
} from "./common/setters";
import { takeMarketSnapshots, takeProtocolSnapshots } from "./common/snapshots";
import {
  addAccountToProtocol,
  getLiquidatePosition,
  getOrCreateAccount,
  updatePositions,
} from "./positions";

export function handleLogDeploy(event: LogDeploy): void {
  const account = event.transaction.from.toHex().toLowerCase();
  if (ABRA_ACCOUNTS.indexOf(account) > NEG_INT_ONE) {
    const marketID = event.params.cloneAddress.toHexString();
    createMarket(marketID, event.block.number, event.block.timestamp);
    CauldronDataSource.create(event.params.cloneAddress);
    takeProtocolSnapshots(event);
    takeMarketSnapshots(marketID, event);
  }
}

export function handleLogAddCollateral(event: LogAddCollateral): void {
  const depositEvent = new Deposit(
    event.transaction.hash.toHexString() +
      "-" +
      event.transactionLogIndex.toString()
  );
  const market = getMarket(event.address.toHexString());
  if (!market) {
    return;
  }

  // update market prices
  updateAllTokenPrices(event.block.number);

  const CauldronContract = Cauldron.bind(event.address);
  const collateralToken = getOrCreateToken(
    Address.fromString(market.inputToken)
  );
  const tokenPriceUSD = collateralToken.lastPriceUSD;
  const amountUSD = bigIntToBigDecimal(
    event.params.share,
    collateralToken.decimals
  ).times(tokenPriceUSD!);

  const protocol = getOrCreateLendingProtocol();
  const account = getOrCreateAccount(event.params.to.toHexString(), protocol);

  depositEvent.hash = event.transaction.hash.toHexString();
  depositEvent.nonce = event.transaction.nonce;
  depositEvent.logIndex = event.transactionLogIndex.toI32();
  depositEvent.market = market.id;
  depositEvent.account = account.id;
  depositEvent.blockNumber = event.block.number;
  depositEvent.timestamp = event.block.timestamp;
  depositEvent.market = market.id;
  depositEvent.asset = collateralToken.id;
  // Amount needs to be calculated differently as bentobox deals shares and amounts in a different way.
  // usage of toAmount function converts shares to actual amount based on collateral
  depositEvent.amount = DegenBox.bind(CauldronContract.bentoBox()).toAmount(
    Address.fromString(collateralToken.id),
    event.params.share,
    false
  );
  depositEvent.amountUSD = amountUSD;
  depositEvent.position = updatePositions(
    PositionSide.LENDER,
    protocol,
    market,
    EventType.DEPOSIT,
    account,
    event
  );
  depositEvent.save();

  updateMarketStats(
    market.id,
    EventType.DEPOSIT,
    collateralToken.id,
    event.params.share,
    event
  );
  updateTVL();
  updateUsageMetrics(event, event.params.from, event.params.to);
  takeProtocolSnapshots(event);
  takeMarketSnapshots(market.id, event);
}

export function handleLogRemoveCollateral(event: LogRemoveCollateral): void {
  let liquidation = false;
  if (event.params.from.toHexString() != event.params.to.toHexString()) {
    createLiquidateEvent(event);
    liquidation = true;
  }
  const withdrawalEvent = new Withdraw(
    event.transaction.hash.toHexString() +
      "-" +
      event.transactionLogIndex.toString()
  );
  const market = getMarket(event.address.toHexString());
  if (!market) {
    return;
  }

  // update market prices
  updateAllTokenPrices(event.block.number);

  const collateralToken = getOrCreateToken(
    Address.fromString(market.inputToken)
  );
  const CauldronContract = Cauldron.bind(event.address);
  const tokenPriceUSD = collateralToken.lastPriceUSD;
  const amountUSD = bigIntToBigDecimal(
    event.params.share,
    collateralToken.decimals
  ).times(tokenPriceUSD!);

  const protocol = getOrCreateLendingProtocol();
  const account = getOrCreateAccount(event.params.from.toHexString(), protocol);

  withdrawalEvent.hash = event.transaction.hash.toHexString();
  withdrawalEvent.nonce = event.transaction.nonce;
  withdrawalEvent.logIndex = event.transactionLogIndex.toI32();
  withdrawalEvent.market = market.id;
  withdrawalEvent.account = account.id;
  withdrawalEvent.blockNumber = event.block.number;
  withdrawalEvent.timestamp = event.block.timestamp;
  withdrawalEvent.market = market.id;
  withdrawalEvent.asset = collateralToken.id;
  withdrawalEvent.amount = DegenBox.bind(CauldronContract.bentoBox()).toAmount(
    Address.fromString(collateralToken.id),
    event.params.share,
    false
  );
  withdrawalEvent.amountUSD = amountUSD;
  withdrawalEvent.position = updatePositions(
    PositionSide.LENDER,
    protocol,
    market,
    EventType.WITHDRAW,
    account,
    event,
    liquidation
  );
  withdrawalEvent.save();

  updateMarketStats(
    market.id,
    EventType.WITHDRAW,
    collateralToken.id,
    event.params.share,
    event
  );
  updateTVL();
  updateUsageMetrics(event, event.params.from, event.params.to);
  takeProtocolSnapshots(event);
  takeMarketSnapshots(market.id, event);
}

export function handleLogBorrow(event: LogBorrow): void {
  const borrowEvent = new Borrow(
    event.transaction.hash.toHexString() +
      "-" +
      event.transactionLogIndex.toString()
  );
  const market = getMarket(event.address.toHexString());
  if (!market) {
    return;
  }

  // update market prices
  updateAllTokenPrices(event.block.number);

  const mimToken = getOrCreateToken(
    Address.fromString(getMIMAddress(dataSource.network()))
  );
  const mimPriceUSD = mimToken.lastPriceUSD;
  const amountUSD = bigIntToBigDecimal(
    event.params.amount,
    DEFAULT_DECIMALS
  ).times(mimPriceUSD!);

  const protocol = getOrCreateLendingProtocol();
  const account = getOrCreateAccount(event.params.from.toHexString(), protocol);

  borrowEvent.hash = event.transaction.hash.toHexString();
  borrowEvent.nonce = event.transaction.nonce;
  borrowEvent.logIndex = event.transactionLogIndex.toI32();
  borrowEvent.market = market.id;
  borrowEvent.account = account.id;
  borrowEvent.blockNumber = event.block.number;
  borrowEvent.timestamp = event.block.timestamp;
  borrowEvent.market = market.id;
  borrowEvent.asset = mimToken.id;
  borrowEvent.amount = event.params.amount;
  borrowEvent.amountUSD = amountUSD;
  borrowEvent.position = updatePositions(
    PositionSide.BORROWER,
    protocol,
    market,
    EventType.BORROW,
    account,
    event
  );
  borrowEvent.save();

  updateBorrowAmount(market);
  updateTotalBorrows();
  updateMarketStats(
    market.id,
    EventType.BORROW,
    getMIMAddress(dataSource.network()),
    event.params.amount,
    event
  );
  updateUsageMetrics(event, event.params.from, event.params.to);
  takeProtocolSnapshots(event);
  takeMarketSnapshots(market.id, event);
}

// Liquidation steps
// - Liquidations are found in logRemoveCollateral event when from!=to, logRepay events are emitted directly after (logRemoveCollateral's log index +1)
// 1) When handling logRemoveCollateral emitted by a market contract, check if from!=to in the log receipt
// 2) If from!=to, save the collateral amount removed in Liquidate entity
// 3) In logRepay, also check if from!=to and check if we saved the tx_hash - log_index +1 in a Liquidate entity
//    - Retrieve Liquidate entity to obtain the collateral amount removed and subtract the MIM amount repayed from LogRepay to determine the profit in USD

export function handleLiquidation(event: LogRepay): void {
  // Retrieve cached liquidation that holds amount of collateral to help calculate profit usd (obtained from log remove collateral with from != to)
  const liquidateProxy = getLiquidateEvent(event); // retrieve cached liquidation by subtracting 1 from the current event log index (as we registered the liquidation in logRemoveCollateral that occurs 1 log index before this event)
  if (!liquidateProxy) {
    log.error(
      "Liquidation {} not found in cache. Liquidation event must be registered in logRemoveCollateral event",
      [
        event.transaction.hash.toHexString() +
          "-" +
          event.transactionLogIndex.toString(),
      ]
    );
    return;
  }
  const liquidateEvent = new Liquidate(
    "liquidate" +
      "-" +
      event.transaction.hash.toHexString() +
      "-" +
      event.transactionLogIndex.toString()
  );
  liquidateEvent.amount = liquidateProxy.amount;
  const market = getMarket(event.address.toHexString());
  if (!market) {
    return;
  }

  const hourlyId: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  const hourlyActivity = getOrCreateActivityHelper(
    ActivityInterval.HOURLY.concat("-").concat(hourlyId.toString())
  );
  const dailyId: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const dailyActivity = getOrCreateActivityHelper(
    ActivityInterval.DAILY.concat("-").concat(dailyId.toString())
  );

  // update market prices
  updateAllTokenPrices(event.block.number);

  const collateralToken = getOrCreateToken(
    Address.fromString(market.inputToken)
  );
  const mimToken = getOrCreateToken(
    Address.fromString(getMIMAddress(dataSource.network()))
  );
  const CauldronContract = Cauldron.bind(event.address);
  const tokenPriceUSD = collateralToken.lastPriceUSD;
  const collateralAmount = DegenBox.bind(CauldronContract.bentoBox()).toAmount(
    Address.fromString(collateralToken.id),
    liquidateEvent.amount,
    false
  );
  const protocol = getOrCreateLendingProtocol();
  const collateralAmountUSD = bigIntToBigDecimal(
    collateralAmount,
    collateralToken.decimals
  ).times(tokenPriceUSD!);
  const mimAmountUSD = bigIntToBigDecimal(
    event.params.amount,
    DEFAULT_DECIMALS
  ).times(
    getOrCreateToken(Address.fromString(getMIMAddress(dataSource.network())))
      .lastPriceUSD!
  );

  const liquidateeAccount = getOrCreateAccount(
    event.params.to.toHexString(),
    protocol
  );
  const liquidatorAccount = getOrCreateAccount(
    event.params.from.toHexString(),
    protocol
  );

  liquidateEvent.hash = event.transaction.hash.toHexString();
  liquidateEvent.nonce = event.transaction.nonce;
  liquidateEvent.logIndex = event.transactionLogIndex.toI32();
  liquidateEvent.liquidatee = liquidateeAccount.id;
  liquidateEvent.liquidator = liquidatorAccount.id;
  liquidateEvent.blockNumber = event.block.number;
  liquidateEvent.timestamp = event.block.timestamp;
  liquidateEvent.market = market.id;
  liquidateEvent.asset = mimToken.id;
  liquidateEvent.amount = collateralAmount;
  liquidateEvent.amountUSD = collateralAmountUSD;
  liquidateEvent.profitUSD = collateralAmountUSD.minus(mimAmountUSD);
  liquidateEvent.position = getLiquidatePosition(
    InterestRateSide.BORROW,
    market.id,
    event.params.to.toHexString()
  );
  liquidateEvent.save();

  hourlyActivity.liquidateCount += 1;
  hourlyActivity.save();

  dailyActivity.liquidateCount += 1;
  dailyActivity.save();

  liquidateeAccount.liquidateCount = liquidateeAccount.liquidateCount + 1;
  liquidateeAccount.save();
  addAccountToProtocol(
    EventType.LIQUIDATEE,
    liquidateeAccount,
    event,
    protocol
  );

  liquidatorAccount.liquidationCount = liquidatorAccount.liquidationCount + 1;
  liquidatorAccount.save();
  addAccountToProtocol(
    EventType.LIQUIDATOR,
    liquidatorAccount,
    event,
    protocol
  );

  const marketCumulativeLiquidateUSD =
    market.cumulativeLiquidateUSD.plus(collateralAmountUSD);
  market.cumulativeLiquidateUSD = marketCumulativeLiquidateUSD;
  market.save();

  const protocolCumulativeLiquidateUSD =
    protocol.cumulativeLiquidateUSD.plus(collateralAmountUSD);
  protocol.cumulativeLiquidateUSD = protocolCumulativeLiquidateUSD;
  protocol.save();

  takeProtocolSnapshots(event);
  takeMarketSnapshots(market.id, event);
}

export function handleLogRepay(event: LogRepay): void {
  const invoker = event.transaction.from.toHex().toLowerCase();
  const address = event.address.toHex().toLowerCase();
  const to = event.transaction.to
    ? (event.transaction.to as Address).toHex().toLowerCase()
    : null;
  const user = event.params.to.toHex().toLowerCase();
  let liquidation = false;
  if ([invoker, address, to].indexOf(user) == -1) {
    handleLiquidation(event);
    liquidation = true;
  }

  // update market prices
  updateAllTokenPrices(event.block.number);

  const repayEvent = new Repay(
    event.transaction.hash.toHexString() +
      "-" +
      event.transactionLogIndex.toString()
  );
  const market = getMarket(event.address.toHexString());
  if (!market) {
    return;
  }
  const mimToken = getOrCreateToken(
    Address.fromString(getMIMAddress(dataSource.network()))
  );
  const mimPriceUSD = mimToken.lastPriceUSD;
  const amountUSD = bigIntToBigDecimal(
    event.params.amount,
    DEFAULT_DECIMALS
  ).times(mimPriceUSD!);

  const protocol = getOrCreateLendingProtocol();
  const account = getOrCreateAccount(event.params.to.toHexString(), protocol);

  repayEvent.hash = event.transaction.hash.toHexString();
  repayEvent.nonce = event.transaction.nonce;
  repayEvent.logIndex = event.transactionLogIndex.toI32();
  repayEvent.market = market.id;
  repayEvent.account = account.id;
  repayEvent.blockNumber = event.block.number;
  repayEvent.timestamp = event.block.timestamp;
  repayEvent.market = market.id;
  repayEvent.asset = mimToken.id;
  repayEvent.amount = event.params.amount;
  repayEvent.amountUSD = amountUSD;
  repayEvent.position = updatePositions(
    PositionSide.BORROWER,
    protocol,
    market,
    EventType.REPAY,
    account,
    event,
    liquidation
  );
  repayEvent.save();

  updateBorrowAmount(market);
  updateTotalBorrows();
  updateMarketStats(
    market.id,
    EventType.REPAY,
    getMIMAddress(dataSource.network()),
    event.params.part,
    event
  ); // smart contract code subs event.params.part from totalBorrow
  updateUsageMetrics(event, event.params.from, event.params.to);
  takeProtocolSnapshots(event);
  takeMarketSnapshots(market.id, event);
}

export function handleLogExchangeRate(event: LogExchangeRate): void {
  const market = getMarket(event.address.toHexString());
  if (!market) {
    return;
  }
  const token = getOrCreateToken(Address.fromString(market.inputToken));
  updateTokenPrice(event.params.rate, token, market, event.block.number);
  updateTVL();
  takeProtocolSnapshots(event);
  takeMarketSnapshots(market.id, event);
}

export function handleLogAccrue(event: LogAccrue): void {
  const marketID = event.address.toHexString();
  const mimPriceUSD = getOrCreateToken(
    Address.fromString(getMIMAddress(dataSource.network()))
  ).lastPriceUSD;
  const feesUSD = bigIntToBigDecimal(
    event.params.accruedAmount,
    DEFAULT_DECIMALS
  ).times(mimPriceUSD!);
  updateFinancials(event, feesUSD, marketID);
  takeProtocolSnapshots(event);
  takeMarketSnapshots(marketID, event);
}

// updates all input token prices using the price oracle
// this is a secondary option since not every market's price oracle "peekSpot()" will work
function updateAllTokenPrices(blockNumber: BigInt): void {
  const protocol = getOrCreateLendingProtocol();
  for (let i = 0; i < protocol.marketIDList.length; i++) {
    const market = getMarket(protocol.marketIDList[i]);
    if (!market) {
      log.warning("[updateAllTokenPrices] Market not found: {}", [
        protocol.marketIDList[i],
      ]);
      continue;
    }

    // check if price was already updated this block
    const inputToken = getOrCreateToken(Address.fromString(market.inputToken));
    if (
      inputToken.lastPriceBlockNumber &&
      inputToken.lastPriceBlockNumber!.ge(blockNumber)
    ) {
      continue;
    }

    // load PriceOracle contract and get peek (real/current) exchange rate
    if (market.priceOracle === null) {
      log.warning("[updateAllTokenPrices] Market {} has no priceOracle", [
        market.id,
      ]);
      continue;
    }
    const marketPriceOracle = MarketOracle.bind(
      Address.fromBytes(market.priceOracle!)
    );

    // get exchange rate for input token
    const exchangeRateCall = marketPriceOracle.try_peekSpot(
      Bytes.fromHexString("0x00")
    );
    if (exchangeRateCall.reverted || exchangeRateCall.value == BIGINT_ZERO) {
      log.warning(
        "[updateAllTokenPrices] Market {} priceOracle peekSpot() failed",
        [market.id]
      );
      continue;
    }
    const exchangeRate = exchangeRateCall.value;

    updateTokenPrice(exchangeRate, inputToken, market, blockNumber);
  }
}
