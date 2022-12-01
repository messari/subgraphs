import { BigInt, log, BigDecimal, near } from "@graphprotocol/graph-ts";
import { Token, Market, MarketDailySnapshot, MarketHourlySnapshot, FinancialsDailySnapshot } from '../../generated/schema';
import { compound } from "../utils/compound";
import { updateApr } from "../utils/rates";
import { getOrCreateToken } from "../helpers/token";

export function updateMarket(
	market: Market,
	dailySnapshot: MarketDailySnapshot,
	hourlySnapshot: MarketHourlySnapshot,
	protocolDailySnapshot: FinancialsDailySnapshot,
	receipt: near.ReceiptWithOutcome
): void {
	let token = getOrCreateToken(market.inputToken);

	/*** update apr and compound values ***/
	updateApr(market, receipt);
	compound(market, receipt);
	
	// inputTokenPriceUSD
	market.inputTokenPriceUSD = token.lastPriceUSD!;
	// totalDepositBalanceUSD
	market.totalDepositBalanceUSD = market.inputTokenBalance
		.toBigDecimal()
		.div(
			BigInt.fromI32(10)
				.pow((token.decimals + token.extraDecimals) as u8)
				.toBigDecimal()
		)
		.times(market.inputTokenPriceUSD);
	// cumulativeDepositUSD
	market.cumulativeDepositUSD = market._totalDepositedHistory
		.toBigDecimal()
		.div(
			BigInt.fromI32(10)
				.pow((token.decimals + token.extraDecimals) as u8)
				.toBigDecimal()
		)
		.times(market.inputTokenPriceUSD);
	// totalValueLockedUSD
	market.totalValueLockedUSD = market.totalDepositBalanceUSD;

	// cumulativeSupplySideRevenueUSD, cumulativeTotalRevenueUSD
	let newRevenue = market._totalReserved.minus(market._added_to_reserve)
		.divDecimal(BigInt.fromI32(10).pow((token.decimals + token.extraDecimals) as u8).toBigDecimal()
		).times(market.inputTokenPriceUSD)
		.minus(market.cumulativeSupplySideRevenueUSD)

	market.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD.plus(newRevenue)
	market.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD.plus(newRevenue);
	dailySnapshot.dailySupplySideRevenueUSD = dailySnapshot.dailySupplySideRevenueUSD.plus(newRevenue);
	dailySnapshot.dailyTotalRevenueUSD = dailySnapshot.dailyTotalRevenueUSD.plus(newRevenue);
	hourlySnapshot.hourlySupplySideRevenueUSD = hourlySnapshot.hourlySupplySideRevenueUSD.plus(newRevenue);
	hourlySnapshot.hourlyTotalRevenueUSD = hourlySnapshot.hourlyTotalRevenueUSD.plus(newRevenue);
	protocolDailySnapshot.dailySupplySideRevenueUSD = protocolDailySnapshot.dailySupplySideRevenueUSD.plus(newRevenue);
	protocolDailySnapshot.dailyTotalRevenueUSD = protocolDailySnapshot.dailyTotalRevenueUSD.plus(newRevenue);

	// totalBorrowBalanceUSD
	market.totalBorrowBalanceUSD = market._totalBorrowed
		.toBigDecimal()
		.div(
			BigInt.fromI32(10)
				.pow((token.decimals + token.extraDecimals) as u8)
				.toBigDecimal()
		)
		.times(market.inputTokenPriceUSD);
	// cumulativeBorrowUSD
	market.cumulativeBorrowUSD = market._totalBorrowedHistory
		.toBigDecimal()
		.div(
			BigInt.fromI32(10)
				.pow((token.decimals + token.extraDecimals) as u8)
				.toBigDecimal()
		)
		.times(market.inputTokenPriceUSD);

	// exchangeRate
	market.exchangeRate = market.inputTokenBalance
		.toBigDecimal()
		.div(market.outputTokenSupply.toBigDecimal());
	// outputTokenPriceUSD
	market.outputTokenPriceUSD = market.exchangeRate!.times(
		market.inputTokenPriceUSD
	);

	market._last_update_timestamp = BigInt.fromU64(receipt.block.header.timestampNanosec / 1000000);
}
