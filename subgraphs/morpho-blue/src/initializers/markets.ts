import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

import { CreateMarketMarketParamsStruct } from "../../generated/MorphoBlue/MorphoBlue";
import {
  _MarketList,
  InterestRate,
  Market,
  Oracle,
} from "../../generated/schema";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_WAD,
  insert,
  INT_ONE,
  INT_ZERO,
  InterestRateSide,
  InterestRateType,
} from "../sdk/constants";
import { TokenManager } from "../sdk/token";
import { getLiquidationIncentiveFactor } from "../utils/liquidationIncentives";

import { getProtocol } from "./protocol";

export function createMarket(
  id: Bytes,
  marketStruct: CreateMarketMarketParamsStruct | null,
  event: ethereum.Event
): Market {
  const market = new Market(id);

  const collateralToken = new TokenManager(
    marketStruct ? marketStruct.collateralToken : Address.zero(),
    event
  );
  const loanToken = new TokenManager(
    marketStruct ? marketStruct.loanToken : Address.zero(),
    event
  );

  market.protocol = getProtocol().id;
  market.name =
    loanToken.getToken().symbol + " / " + collateralToken.getToken().symbol;
  market.isActive = true;
  market.canBorrowFrom = true;
  market.canUseAsCollateral = true;

  const lltvBD = marketStruct
    ? marketStruct.lltv.toBigDecimal().div(BIGDECIMAL_WAD)
    : BigDecimal.zero();
  market.maximumLTV = lltvBD;
  market.liquidationThreshold = lltvBD;
  market.liquidationPenalty = marketStruct
    ? getLiquidationIncentiveFactor(marketStruct.lltv)
        .toBigDecimal()
        .div(BIGDECIMAL_WAD)
        .minus(BIGDECIMAL_ONE)
    : BigDecimal.zero();

  market.canIsolate = true;
  market.createdTimestamp = event.block.timestamp;
  market.createdBlockNumber = event.block.number;

  market.inputToken = collateralToken.getToken().id;
  market.inputTokenBalance = BigInt.zero();
  market.inputTokenPriceUSD = collateralToken.getPriceUSD();
  market.rates = []; // initialized to zero, modified later
  market.reserves = BigDecimal.zero();
  market.reserveFactor = BigDecimal.zero();
  market.lltv = marketStruct ? marketStruct.lltv : BigInt.zero();

  market.borrowedToken = loanToken.getToken().id;
  market.variableBorrowedTokenBalance = BigInt.zero();

  // TODO: use indexes here

  market.totalValueLockedUSD = BigDecimal.zero();
  market.cumulativeSupplySideRevenueUSD = BigDecimal.zero();
  market.cumulativeProtocolSideRevenueUSD = BigDecimal.zero();
  market.cumulativeTotalRevenueUSD = BigDecimal.zero();
  // market.revenueDetail = RevenueDetail.load("")
  market.totalDepositBalanceUSD = BigDecimal.zero();
  market.cumulativeDepositUSD = BigDecimal.zero();
  market.totalBorrowBalanceUSD = BigDecimal.zero();
  market.cumulativeBorrowUSD = BigDecimal.zero();
  market.cumulativeLiquidateUSD = BigDecimal.zero();
  market.cumulativeTransferUSD = BigDecimal.zero();
  market.cumulativeFlashloanUSD = BigDecimal.zero();
  market.transactionCount = INT_ZERO;
  market.depositCount = INT_ZERO;
  market.withdrawCount = INT_ZERO;
  market.borrowCount = INT_ZERO;
  market.repayCount = INT_ZERO;
  market.liquidationCount = INT_ZERO;
  market.transferCount = INT_ZERO;
  market.flashloanCount = INT_ZERO;

  market.cumulativeUniqueUsers = INT_ZERO;
  market.cumulativeUniqueDepositors = INT_ZERO;
  market.cumulativeUniqueBorrowers = INT_ZERO;
  market.cumulativeUniqueLiquidators = INT_ZERO;
  market.cumulativeUniqueLiquidatees = INT_ZERO;
  market.cumulativeUniqueTransferrers = INT_ZERO;
  market.cumulativeUniqueFlashloaners = INT_ZERO;

  market.positionCount = INT_ZERO;
  market.openPositionCount = INT_ZERO;
  market.closedPositionCount = INT_ZERO;
  market.lendingPositionCount = INT_ZERO;
  market.borrowingPositionCount = INT_ZERO;
  market.collateralPositionCount = INT_ZERO;

  market.totalSupplyShares = BigInt.zero();
  market.totalBorrowShares = BigInt.zero();
  market.totalCollateral = BigInt.zero();
  market.totalSupply = BigInt.zero();
  market.totalBorrow = BigInt.zero();
  market.interest = BigInt.zero();
  market.fee = BigInt.zero();

  market.lastUpdate = event.block.timestamp;

  market.irm = marketStruct ? marketStruct.irm : Address.zero();

  const oracleAddress = marketStruct ? marketStruct.oracle : Address.zero();
  const oracle = new Oracle(market.id.concat(oracleAddress));
  oracle.oracleAddress = oracleAddress;
  oracle.blockCreated = event.block.number;
  oracle.timestampCreated = event.block.timestamp;
  oracle.isActive = true;
  const isUsd = !!loanToken.getToken().symbol.includes("USD");
  oracle.isUSD = isUsd;
  // TODO: whitelist oracleSource for a list of oracles.
  oracle.save();

  // TODO: fix this workaround of the relation between oracle & market.
  market.oracle = oracle.id;
  market.save();

  // Create interest rates
  const supplyRateId = market.id.toHexString() + "-supply";
  const supplyRate = new InterestRate(supplyRateId);
  supplyRate.rate = BigDecimal.zero();
  supplyRate.market = market.id;
  supplyRate.side = InterestRateSide.LENDER;
  supplyRate.type = InterestRateType.VARIABLE;
  supplyRate.save();

  const borrowRateId = market.id.toHexString() + "-borrow";
  const borrowRate = new InterestRate(borrowRateId);
  borrowRate.rate = BigDecimal.zero();
  borrowRate.market = market.id;
  borrowRate.side = InterestRateSide.BORROWER;
  borrowRate.type = InterestRateType.VARIABLE;
  borrowRate.save();

  market.rates = [supplyRateId, borrowRateId];
  market.save();

  const protocol = getProtocol();
  protocol.totalPoolCount += INT_ONE;
  protocol.save();

  const marketList = _MarketList.load(protocol.id)!;
  marketList.markets = insert<Bytes>(marketList.markets, market.id);
  marketList.save();
  return market;
}

/**
 * Market used to match the Messari framework when an action is not related to a specific market.
 * For example, on Morpho Blue, a flash loan is not linked to a specific market, but rather to a token.
 */
export function getZeroMarket(event: ethereum.Event): Market {
  const market = Market.load(Address.zero());
  if (!market) {
    return createMarket(Address.zero(), null, event);
  }
  return market;
}

export function getMarket(id: Bytes): Market {
  const market = Market.load(id);
  if (!market) log.critical("Market {} does not exist", [id.toHexString()]);

  return market!;
}
