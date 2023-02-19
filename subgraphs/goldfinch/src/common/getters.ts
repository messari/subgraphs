import {
  Address,
  ethereum,
  BigDecimal,
  log,
  BigInt,
} from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/GoldfinchFactory/ERC20";
import {
  Token,
  LendingProtocol,
  Account,
  Market,
  MarketDailySnapshot,
  MarketHourlySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  FinancialsDailySnapshot,
  InterestRate,
  RewardToken,
  User,
  _PoolToken,
  _PositionCounter,
  Position,
} from "../../generated/schema";
import {
  Network,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  FACTORY_ADDRESS,
  ProtocolType,
  RiskType,
  InterestRateType,
  InterestRateSide,
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  USDC_ADDRESS,
  GFI_ADDRESS,
  INT_ONE,
  LendingType,
  BIGDECIMAL_ONE,
  SENIOR_POOL_ADDRESS,
  WETH_GFI_UniswapV2_Pair,
  USDC_WETH_UniswapV2_Pair,
  USDC_DECIMALS,
  WETH_ADDRESS,
  GFI_DECIMALS,
} from "./constants";
import { TranchedPool as TranchedPoolContract } from "../../generated/templates/TranchedPool/TranchedPool";
import { UniswapV2Pair } from "../../generated/BackerRewards/UniswapV2Pair";
import { prefixID } from "./utils";
import { Versions } from "../versions";

export function getOrCreatePoolToken(
  tokenId: string,
  marketId: string | null = null
): _PoolToken {
  let poolToken = _PoolToken.load(tokenId);
  if (!poolToken) {
    poolToken = new _PoolToken(tokenId);
    poolToken.market = marketId!;
    poolToken.save();
  }
  return poolToken;
}

export function getOrCreateToken(tokenAddr: Address): Token {
  const tokenId: string = tokenAddr.toHexString();
  let token = Token.load(tokenId);

  if (token == null) {
    token = new Token(tokenId);

    // GFI contract was deployed after senior pool; the following call will fail
    // when invoked by senior_pool.handleDepositMade
    if (tokenId == GFI_ADDRESS) {
      token.name = "Goldfinch";
      token.symbol = "GFI";
      token.decimals = 18;
    } else {
      log.info("[getOrCreateToken]tokenAddr={}", [tokenId]);
      const contract = ERC20.bind(tokenAddr);
      token.name = contract.name();
      token.symbol = contract.symbol();
      token.decimals = contract.decimals();
    }
    token.save();
  }
  return token;
}

export function getOrCreateRewardToken(
  tokenAddr: Address,
  type: string
): RewardToken {
  const tokenId: string = `${type}-${tokenAddr.toHexString()}`;
  let rewardToken = RewardToken.load(tokenId);
  if (!rewardToken) {
    const token = getOrCreateToken(tokenAddr);
    rewardToken = new RewardToken(tokenId);
    rewardToken.token = token.id;
    rewardToken.type = type;
    rewardToken.save();
  }
  return rewardToken;
}

export function getOrCreateProtocol(): LendingProtocol {
  let protocol = LendingProtocol.load(FACTORY_ADDRESS);

  if (!protocol) {
    protocol = new LendingProtocol(FACTORY_ADDRESS);
    protocol.name = PROTOCOL_NAME;
    protocol.slug = PROTOCOL_SLUG;
    protocol.network = Network.MAINNET;
    protocol.type = ProtocolType.LENDING;
    protocol.lendingType = LendingType.POOLED;
    protocol.riskType = RiskType.GLOBAL;
    protocol.mintedTokens = [];
    protocol.mintedTokenSupplies = [];
    ////// quantitative data //////
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.cumulativeUniqueDepositors = INT_ZERO;
    protocol.cumulativeUniqueBorrowers = INT_ZERO;
    protocol.cumulativeUniqueLiquidators = INT_ZERO;
    protocol.cumulativeUniqueLiquidatees = INT_ZERO;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    protocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    protocol.totalPoolCount = INT_ZERO;
    protocol.openPositionCount = INT_ZERO;
    protocol.cumulativePositionCount = INT_ZERO;
    protocol._marketIDs = [];
  }

  // ensure versions are updated even when grafting
  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  return protocol;
}

export function getOrCreateMarket(
  marketId: string,
  event: ethereum.Event
): Market {
  // marketID = poolAddr
  // all pool/market have the same underlying USDC
  // with one borrower and multiple lenders
  let market = Market.load(marketId);

  if (market == null) {
    let name: string;
    if (marketId != SENIOR_POOL_ADDRESS) {
      const poolContract = TranchedPoolContract.bind(
        Address.fromString(marketId)
      );
      name = poolContract._name;
    } else {
      name = "Senior Pool";
    }

    const protocol = getOrCreateProtocol();
    market = new Market(marketId);
    market.protocol = protocol.id;
    market.name = name;
    market.isActive = false;
    market.canUseAsCollateral = false;
    market.canBorrowFrom = true;
    // maximumLTV = 0 as Goldfinch borrowing is undercollateralized
    // to KYC'ed borrowers
    market.maximumLTV = BIGDECIMAL_ZERO;
    // no liquidations, so liquidationThreshold and liquidationPenalty set to 0
    market.liquidationThreshold = BIGDECIMAL_ZERO;
    market.liquidationPenalty = BIGDECIMAL_ZERO;

    market.inputToken = USDC_ADDRESS;
    market.rates = [];

    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeDepositUSD = BIGDECIMAL_ZERO;
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
    market.inputTokenBalance = BIGINT_ZERO;
    market.inputTokenPriceUSD = BIGDECIMAL_ONE; //USDC
    market.outputTokenSupply = BIGINT_ZERO;
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.exchangeRate = BIGDECIMAL_ZERO;
    market.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    market.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    market.rewardTokenEmissionsAmount = [];
    market.rewardTokenEmissionsUSD = [];
    market.positionCount = 0;
    market.openPositionCount = 0;
    market.closedPositionCount = 0;
    market.lendingPositionCount = 0;
    market.borrowingPositionCount = 0;

    market.createdTimestamp = event.block.timestamp;
    market.createdBlockNumber = event.block.number;

    market._lenderInterestAmountUSD = BIGDECIMAL_ZERO;
    market._borrowerInterestAmountUSD = BIGDECIMAL_ZERO;
    market._membershipRewardEligibleAmount = BIGINT_ZERO;
    market._membershipRewardNextEpochAmount = BIGINT_ZERO;

    market.save();

    let marketIDs = protocol._marketIDs!;
    marketIDs = marketIDs.concat([market.id]);
    protocol._marketIDs = marketIDs;
    protocol.save();
  }
  return market;
}

export function getOrCreateMarketDailySnapshot(
  marketId: string,
  event: ethereum.Event
): MarketDailySnapshot {
  const days = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const daysStr: string = days.toString();
  const id = prefixID(marketId, daysStr);

  let marketMetrics = MarketDailySnapshot.load(id);
  if (marketMetrics == null) {
    marketMetrics = new MarketDailySnapshot(id);

    const market = getOrCreateMarket(marketId, event);
    marketMetrics.protocol = FACTORY_ADDRESS;
    marketMetrics.market = marketId;
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;
    marketMetrics.rates = market.rates;
    marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
    marketMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    marketMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
    marketMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
    marketMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    marketMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
    marketMetrics.dailyRepayUSD = BIGDECIMAL_ZERO;
    marketMetrics.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.inputTokenBalance = market.inputTokenBalance;
    marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketMetrics.outputTokenSupply = market.outputTokenSupply;
    marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketMetrics.exchangeRate = market.exchangeRate;

    marketMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    marketMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    marketMetrics.cumulativeSupplySideRevenueUSD =
      market.cumulativeSupplySideRevenueUSD;
    marketMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeProtocolSideRevenueUSD =
      market.cumulativeProtocolSideRevenueUSD;
    marketMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
    marketMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateMarketHourlySnapshot(
  marketId: string,
  event: ethereum.Event
): MarketHourlySnapshot {
  // Hours since Unix epoch time
  const hours = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  const hoursStr = hours.toString();

  const id = prefixID(marketId, hoursStr);

  let marketMetrics = MarketHourlySnapshot.load(id);
  if (marketMetrics == null) {
    marketMetrics = new MarketHourlySnapshot(id);

    const market = getOrCreateMarket(marketId, event);
    marketMetrics.protocol = FACTORY_ADDRESS;
    marketMetrics.market = marketId;
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;
    marketMetrics.rates = market.rates;
    marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD;
    marketMetrics.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    marketMetrics.hourlyDepositUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeDepositUSD = market.cumulativeDepositUSD;
    marketMetrics.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
    marketMetrics.hourlyBorrowUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    marketMetrics.hourlyLiquidateUSD = BIGDECIMAL_ZERO;
    marketMetrics.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
    marketMetrics.hourlyWithdrawUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyRepayUSD = BIGDECIMAL_ZERO;
    marketMetrics.inputTokenBalance = market.inputTokenBalance;
    marketMetrics.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketMetrics.outputTokenSupply = market.outputTokenSupply;
    marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketMetrics.exchangeRate = market.exchangeRate;

    marketMetrics.cumulativeSupplySideRevenueUSD =
      market.cumulativeSupplySideRevenueUSD;
    marketMetrics.cumulativeProtocolSideRevenueUSD =
      market.cumulativeProtocolSideRevenueUSD;
    marketMetrics.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
    marketMetrics.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    marketMetrics.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;

    marketMetrics.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    marketMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateUsageMetricsDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  const days = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const daysStr: string = days.toString();

  const protocol = getOrCreateProtocol();
  let usageMetrics = UsageMetricsDailySnapshot.load(daysStr);
  if (usageMetrics == null) {
    usageMetrics = new UsageMetricsDailySnapshot(daysStr);

    usageMetrics.protocol = protocol.id;
    usageMetrics.totalPoolCount = INT_ZERO;
    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.dailyActiveDepositors = INT_ZERO;
    usageMetrics.dailyActiveBorrowers = INT_ZERO;
    usageMetrics.dailyActiveLiquidators = INT_ZERO;
    usageMetrics.dailyActiveLiquidatees = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueDepositors = INT_ZERO;
    usageMetrics.cumulativeUniqueBorrowers = INT_ZERO;
    usageMetrics.cumulativeUniqueLiquidators = INT_ZERO;
    usageMetrics.cumulativeUniqueLiquidatees = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailyBorrowCount = INT_ZERO;
    usageMetrics.dailyRepayCount = INT_ZERO;
    usageMetrics.dailyLiquidateCount = INT_ZERO;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.save();
  }
  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  const hours = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  const hoursStr: string = hours.toString();
  const protocol = getOrCreateProtocol();
  let usageMetrics = UsageMetricsHourlySnapshot.load(hoursStr);
  if (usageMetrics == null) {
    usageMetrics = new UsageMetricsHourlySnapshot(hoursStr);

    usageMetrics.protocol = protocol.id;
    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyDepositCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;
    usageMetrics.hourlyBorrowCount = INT_ZERO;
    usageMetrics.hourlyRepayCount = INT_ZERO;
    usageMetrics.hourlyLiquidateCount = INT_ZERO;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.save();
  }
  return usageMetrics;
}

export function getOrCreateFinancialsDailySnapshot(
  event: ethereum.Event
): FinancialsDailySnapshot {
  const daysStr: string = (
    event.block.timestamp.toI64() / SECONDS_PER_DAY
  ).toString();
  const protocol = getOrCreateProtocol();
  let financialMetrics = FinancialsDailySnapshot.load(daysStr);
  if (financialMetrics == null) {
    financialMetrics = new FinancialsDailySnapshot(daysStr);

    financialMetrics.protocol = FACTORY_ADDRESS;
    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.mintedTokenSupplies = protocol.mintedTokenSupplies;
    financialMetrics.cumulativeSupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.cumulativeTotalRevenueUSD =
      protocol.cumulativeTotalRevenueUSD;
    financialMetrics.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
    financialMetrics.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
    financialMetrics.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
    financialMetrics.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
    financialMetrics.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;

    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyDepositUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyBorrowUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyLiquidateUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyWithdrawUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyRepayUSD = BIGDECIMAL_ZERO;
    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;
    financialMetrics.save();
  }
  return financialMetrics;
}

export function getOrCreateInterestRate(
  marketId: string,
  side: string = InterestRateSide.BORROWER,
  type: string = InterestRateType.VARIABLE,
  rate: BigDecimal = BIGDECIMAL_ZERO
): InterestRate {
  const id = `${side}-${type}-${marketId}`;
  let interestRate = InterestRate.load(id);
  if (interestRate == null) {
    interestRate = new InterestRate(id);
    interestRate.side = side;
    interestRate.type = type;
    interestRate.rate = rate;
  }
  return interestRate;
}

export function getOrCreateUser(userAddr: string): User {
  let user = User.load(userAddr);
  if (!user) {
    user = new User(userAddr);
    user.save();
  }
  return user;
}

export function getOrCreateAccount(accountID: string): Account {
  let account = Account.load(accountID);
  if (account == null) {
    account = new Account(accountID);
    account.depositCount = INT_ZERO;
    account.withdrawCount = INT_ZERO;
    account.borrowCount = INT_ZERO;
    account.repayCount = INT_ZERO;
    account.liquidateCount = INT_ZERO;
    account.liquidationCount = INT_ZERO;
    account.positionCount = INT_ZERO;
    account.openPositionCount = INT_ZERO;
    account.closedPositionCount = INT_ZERO;
    account.save();
  }

  return account;
}

// create seperate InterestRate Entities for each market snapshot
// this is needed to prevent snapshot rates from being pointers to the current rate
export function getSnapshotRates(
  rates: string[],
  timeSuffix: string
): string[] {
  const snapshotRates: string[] = [];
  for (let i = 0; i < rates.length; i++) {
    const rate = InterestRate.load(rates[i]);
    if (!rate) {
      log.warning("[getSnapshotRates] rate {} not found, should not happen", [
        rates[i],
      ]);
      continue;
    }

    // create new snapshot rate
    const snapshotRateId = rates[i].concat("-").concat(timeSuffix);
    const snapshotRate = new InterestRate(snapshotRateId);
    snapshotRate.side = rate.side;
    snapshotRate.type = rate.type;
    snapshotRate.rate = rate.rate;
    snapshotRate.save();
    snapshotRates.push(snapshotRateId);
  }
  return snapshotRates;
}

export function getOrCreatePositionCounter(
  accountID: string,
  marketID: string,
  side: string
): _PositionCounter {
  const counterID = `${accountID}-${marketID}-${side}`;
  let positionCounter = _PositionCounter.load(counterID);
  if (!positionCounter) {
    positionCounter = new _PositionCounter(counterID);
    positionCounter.nextCount = INT_ZERO;
    positionCounter.save();
  }
  return positionCounter;
}

///////////////////////////
///////// Helpers /////////
///////////////////////////
export function getNextPositionCount(
  accountID: string,
  marketID: string,
  side: string
): i32 {
  const positionCounter = getOrCreatePositionCounter(accountID, marketID, side);
  return positionCounter.nextCount;
}

// find the open position for the matching urn/ilk/side combination
// there should be only one or none
export function getOpenPosition(
  accountID: string,
  marketID: string,
  side: string
): Position | null {
  const positionCounter = getOrCreatePositionCounter(accountID, marketID, side);

  const nextCount = positionCounter.nextCount;
  for (let counter = nextCount; counter >= 0; counter--) {
    const positionID = `${positionCounter.id}-${counter}`;
    const position = Position.load(positionID);
    if (position) {
      const hashClosed =
        position.hashClosed != null ? position.hashClosed! : "null";
      const balance = position.balance.toString();
      const account = position.account;
      if (position.hashClosed == null) {
        log.debug(
          "[getOpenPosition]found open position counter={}, position.id={}, account={}, balance={}, hashClosed={}",
          [counter.toString(), positionID, account, balance, hashClosed]
        );
        return position;
      }
    }
  }
  log.warning(
    "[getOpenPosition]No open position found for account {}/market {}/side {}",
    [accountID, marketID, side]
  );

  return null;
}

export function getNewPosition(
  accountID: string,
  marketID: string,
  side: string,
  event: ethereum.Event
): Position {
  const positionCounter = getOrCreatePositionCounter(accountID, marketID, side);
  positionCounter.nextCount += INT_ONE;
  positionCounter.save();

  const positionID = `${positionCounter.id}-${positionCounter.nextCount}`;
  const position = new Position(positionID);
  position.account = accountID;
  position.market = marketID;
  position.side = side;
  position.hashOpened = event.transaction.hash.toHexString();
  position.blockNumberOpened = event.block.number;
  position.timestampOpened = event.block.timestamp;
  position.side = side;
  position.isCollateral = false;
  position.balance = BIGINT_ZERO;
  position.depositCount = 0;
  position.withdrawCount = 0;
  position.borrowCount = 0;
  position.repayCount = 0;
  position.liquidationCount = 0;
  return position;
}

// Goldfinch (GFI) price is generated from WETH-GFI reserve on Uniswap.
export function getGFIPrice(event: ethereum.Event): BigDecimal | null {
  const GFIPriceInWETH = getToken0PriceInToken1(
    WETH_GFI_UniswapV2_Pair,
    GFI_ADDRESS,
    WETH_ADDRESS
  );

  const WETHPriceInUSDC = getToken0PriceInToken1(
    USDC_WETH_UniswapV2_Pair,
    WETH_ADDRESS,
    USDC_ADDRESS
  );

  if (!GFIPriceInWETH || !WETHPriceInUSDC) {
    return null;
  }
  const GFIPriceInUSD = GFIPriceInWETH.times(WETHPriceInUSDC).times(
    GFI_DECIMALS.div(USDC_DECIMALS)
  );
  log.info("[getGFIPrice]GFI Price USD={} at timestamp {}", [
    GFIPriceInUSD.toString(),
    event.block.timestamp.toString(),
  ]);

  return GFIPriceInUSD;
}

function getToken0PriceInToken1(
  pairAddress: string,
  token0: string,
  token1: string
): BigDecimal | null {
  const pairContract = UniswapV2Pair.bind(Address.fromString(pairAddress));
  const reserves = pairContract.try_getReserves();
  if (reserves.reverted) {
    log.error("[getToken0PriceInToken1]Unable to get reserves for pair {}", [
      pairAddress,
    ]);
    return null;
  }
  let token0Amount: BigInt;
  let token1Amount: BigInt;
  const pairToken0 = pairContract.token0().toHexString();
  const pairToken1 = pairContract.token1().toHexString();
  if (pairToken0 == token0) {
    if (pairToken1 != token1) {
      log.error(
        "[getToken0PriceInToken1]tokens for pair {} = ({}, {}) do not match ({}, {})",
        [pairAddress, pairToken0, pairToken1, token0, token1]
      );
      return null;
    }
    token0Amount = reserves.value.value0;
    token1Amount = reserves.value.value1;
  } else {
    if (pairToken0 != token1 || pairToken1 != token0) {
      log.error(
        "[getToken0PriceInToken1]tokens for pair {} = ({}, {}) do not match ({}, {})",
        [pairAddress, pairToken0, pairToken1, token1, token0]
      );
      return null;
    }
    token0Amount = reserves.value.value1;
    token1Amount = reserves.value.value0;
  }

  const token0PriceInToken1 = token1Amount.divDecimal(
    token0Amount.toBigDecimal()
  );

  return token0PriceInToken1;
}
