import { BigInt, log, BigDecimal, near } from "@graphprotocol/graph-ts";
import { Token, Market, MarketDailySnapshot, MarketHourlySnapshot } from '../../generated/schema';
import { compound } from "../utils/compound";
import { assets, BI_ZERO, BD_ZERO, ADDRESS_ZERO } from "../utils/const";
import { getOrCreateProtocol } from "./protocol";
import { getOrCreateToken } from "./token";
import { getOrCreateBorrowRate, getOrCreateSupplyRate } from './rates';

export function getOrCreateMarket(id: string): Market {
	let r = Market.load(id);
	if (!r) {
		let token = getOrCreateToken(id);
        let protocol = getOrCreateProtocol();

		r = new Market(id);
		r.protocol = protocol.id;
		r.name = token.name;
		r.isActive = false;
		r.canUseAsCollateral = false;
		r.canBorrowFrom = false;
		r.maximumLTV = BD_ZERO;
		r.liquidationThreshold = BD_ZERO;
		r.liquidationPenalty = BD_ZERO;
		r.inputToken = token.id;
		r.outputToken = ADDRESS_ZERO;

		// quants
		r.rates = [
			"SUPPLY-VARIABLE-".concat(id),
			"BORROW-VARIABLE-".concat(id),
		];
		r.totalValueLockedUSD = BD_ZERO;
		r.cumulativeSupplySideRevenueUSD = BD_ZERO;
		r.cumulativeProtocolSideRevenueUSD = BD_ZERO;
		r.cumulativeTotalRevenueUSD = BD_ZERO;
		r.totalDepositBalanceUSD = BD_ZERO;
		r.cumulativeDepositUSD = BD_ZERO;
		r.totalBorrowBalanceUSD = BD_ZERO;
		r.cumulativeBorrowUSD = BD_ZERO;
		r.cumulativeLiquidateUSD = BD_ZERO;

		// reward token
		r.rewardTokens = new Array<string>();
		r._reward_remaining_amounts = new Array<BigInt>();
		r.rewardTokenEmissionsAmount = new Array<BigInt>();
		r.rewardTokenEmissionsUSD = new Array<BigDecimal>();

		// token balances
		r.inputTokenBalance = BI_ZERO;
		r.inputTokenPriceUSD = BD_ZERO;
		r.outputTokenSupply = BI_ZERO;
		r.outputTokenPriceUSD = BD_ZERO;
		r.exchangeRate = BD_ZERO;

		r.createdTimestamp = BigInt.fromI32(0);
		r.createdBlockNumber = BigInt.fromI32(0);
		r.positionCount = 0;
		r.openPositionCount = 0;
		r.closedPositionCount = 0;
		r.lendingPositionCount = 0;
		r.borrowingPositionCount = 0;

		r._last_update_timestamp = BigInt.fromI32(0);

		r._reserveRatio = BI_ZERO;
		r._target_utilization = BI_ZERO;
		r._target_utilization_rate = BI_ZERO;
		r._max_utilization_rate = BI_ZERO;
		r._volatility_ratio = BI_ZERO;

		r._totalWithrawnHistory = BI_ZERO;
		r._totalDepositedHistory = BI_ZERO;

		r._totalBorrowed = BI_ZERO;
		r._totalBorrowedHistory = BI_ZERO;
		r._totalRepaidHistory = BI_ZERO;

		r.save();
	}
	return r;
}

export function getOrCreateMarketDailySnapshot(
	market: Market,
	receipt: near.ReceiptWithOutcome,
): MarketDailySnapshot {
	let dayId = (receipt.block.header.timestampNanosec / 86400000000000).toString()
	let id = market.id.concat("-").concat(dayId);
	let snapshot = MarketDailySnapshot.load(id);

	// --- if new day ---
	if(!snapshot){
		snapshot = new MarketDailySnapshot(id);
		snapshot.protocol = getOrCreateProtocol().id;
		snapshot.market = market.id
		snapshot.blockNumber = BigInt.fromU64(receipt.block.header.height)
		snapshot.timestamp = BigInt.fromU64(receipt.block.header.timestampNanosec / 1000000000)
		// supply rate
		let supplyRateMarket = getOrCreateSupplyRate(market);
		let supplyRateToday = getOrCreateSupplyRate(market, receipt);
		supplyRateToday.rate = supplyRateMarket.rate;
		supplyRateToday.save();

		// borrow rate
		let borrowRateMarket = getOrCreateBorrowRate(market);
		let borrowRateToday = getOrCreateBorrowRate(market, receipt);
		borrowRateToday.rate = borrowRateMarket.rate;
		borrowRateToday.save();

		snapshot.rates = [
			supplyRateToday.id,
			borrowRateToday.id,
		]
		snapshot.totalValueLockedUSD = market.totalValueLockedUSD
		snapshot.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD
		snapshot.dailySupplySideRevenueUSD = BD_ZERO
		snapshot.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD
		snapshot.dailyProtocolSideRevenueUSD = BD_ZERO
		snapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD
		snapshot.dailyTotalRevenueUSD = BD_ZERO
		snapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD
		snapshot.dailyDepositUSD = BD_ZERO
		snapshot.cumulativeDepositUSD = market.cumulativeDepositUSD
		snapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD
		snapshot.dailyBorrowUSD = BD_ZERO
		snapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD
		snapshot.dailyLiquidateUSD = BD_ZERO
		snapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD
		snapshot.dailyWithdrawUSD = BD_ZERO
		snapshot.dailyRepayUSD = BD_ZERO
		snapshot.inputTokenBalance = market.inputTokenBalance
		snapshot.inputTokenPriceUSD = market.inputTokenPriceUSD
		snapshot.outputTokenSupply = market.outputTokenSupply
		snapshot.outputTokenPriceUSD = market.outputTokenPriceUSD
		snapshot.exchangeRate = market.exchangeRate
		snapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount
		snapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD

		let previousDayId = (receipt.block.header.timestampNanosec / 86400000000000 - 1).toString()
		let previousId = market.id.concat("-").concat(previousDayId);
		let previousSnapshot = MarketDailySnapshot.load(previousId);
		if(previousSnapshot){
			previousSnapshot.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD
			previousSnapshot.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD
			previousSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD
			previousSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD
			previousSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD
			previousSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD
			previousSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD
			previousSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD
			previousSnapshot.inputTokenBalance = market.inputTokenBalance
			previousSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD
			previousSnapshot.outputTokenSupply = market.outputTokenSupply
			previousSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD
			previousSnapshot.exchangeRate = market.exchangeRate
			previousSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount
			previousSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD
			previousSnapshot.save();
		}
	}
	return snapshot as MarketDailySnapshot;
}

export function getOrCreateMarketHourlySnapshot(
	market: Market,
	receipt: near.ReceiptWithOutcome,
): MarketHourlySnapshot {
	let hourId = (receipt.block.header.timestampNanosec / 3600000000000).toString()
	let id = market.id.concat("-").concat(hourId);
	let snapshot = MarketHourlySnapshot.load(id);

	// --- if new hour ---
	if(!snapshot){
		snapshot = new MarketHourlySnapshot(id);
		snapshot.protocol = getOrCreateProtocol().id;
		snapshot.market = market.id
		snapshot.blockNumber = BigInt.fromU64(receipt.block.header.height)
		snapshot.timestamp = BigInt.fromU64(receipt.block.header.timestampNanosec / 1000000000)
		// supply rate
		let supplyRateMarket = getOrCreateSupplyRate(market);
		let supplyRateToday = getOrCreateSupplyRate(market, receipt);
		supplyRateToday.rate = supplyRateMarket.rate;
		supplyRateToday.save();

		// borrow rate
		let borrowRateMarket = getOrCreateBorrowRate(market);
		let borrowRateToday = getOrCreateBorrowRate(market, receipt);
		borrowRateToday.rate = borrowRateMarket.rate;
		borrowRateToday.save();

		snapshot.rates = [
			supplyRateToday.id,
			borrowRateToday.id,
		]
		snapshot.totalValueLockedUSD = market.totalValueLockedUSD
		snapshot.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD
		snapshot.hourlySupplySideRevenueUSD = BD_ZERO
		snapshot.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD
		snapshot.hourlyProtocolSideRevenueUSD = BD_ZERO
		snapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD
		snapshot.hourlyTotalRevenueUSD = BD_ZERO
		snapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD
		snapshot.hourlyDepositUSD = BD_ZERO
		snapshot.cumulativeDepositUSD = market.cumulativeDepositUSD
		snapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD
		snapshot.hourlyBorrowUSD = BD_ZERO
		snapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD
		snapshot.hourlyLiquidateUSD = BD_ZERO
		snapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD
		snapshot.hourlyWithdrawUSD = BD_ZERO
		snapshot.hourlyRepayUSD = BD_ZERO
		snapshot.inputTokenBalance = market.inputTokenBalance
		snapshot.inputTokenPriceUSD = market.inputTokenPriceUSD
		snapshot.outputTokenSupply = market.outputTokenSupply
		snapshot.outputTokenPriceUSD = market.outputTokenPriceUSD
		snapshot.exchangeRate = market.exchangeRate
		snapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount
		snapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD

		let previousHourId = (receipt.block.header.timestampNanosec / 3600000000000 - 1).toString()
		let previousId = market.id.concat("-").concat(previousHourId);
		let previousSnapshot = MarketHourlySnapshot.load(previousId);
		if(previousSnapshot){
			previousSnapshot.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD
			previousSnapshot.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD
			previousSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD
			previousSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD
			previousSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD
			previousSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD
			previousSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD
			previousSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD
			previousSnapshot.inputTokenBalance = market.inputTokenBalance
			previousSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD
			previousSnapshot.outputTokenSupply = market.outputTokenSupply
			previousSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD
			previousSnapshot.exchangeRate = market.exchangeRate
			previousSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount
			previousSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD
			previousSnapshot.save();
		}
	}
	return snapshot as MarketHourlySnapshot;
}