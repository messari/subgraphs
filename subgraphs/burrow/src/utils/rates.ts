import { Market, InterestRate } from '../../generated/schema';
import { BigDecimal, BigInt, near, log } from '@graphprotocol/graph-ts';
import { BD_ONE, BD_ZERO, BI_ZERO } from './const';
import { getOrCreateBorrowRate, getOrCreateSupplyRate } from '../helpers/rates';
import { bigDecimalExponential } from './math';

const BD = (n: string): BigDecimal => BigDecimal.fromString(n);


export function getRate(market: Market): BigDecimal {
	if (market.inputTokenBalance.equals(BI_ZERO)) {
		return BD_ONE;
	}
	const pos = market._totalBorrowed.divDecimal(market._totalReserved.plus(market.inputTokenBalance).toBigDecimal());

	market._utilization = pos;
	const target = market._target_utilization.toBigDecimal().div(BD('10000'));
	let rate = BD_ZERO;

	if (pos.le(target)) {
		// BigDecimal::one() + pos * (BigDecimal::from(self.target_utilization_rate) - BigDecimal::one())/ target_utilization
        const highPos = market._target_utilization_rate.toBigDecimal()
			.div(BD('1000000000000000000000000000'))
			.minus(BD_ONE)
			.div(target);
		rate = BD_ONE.plus(pos.times(highPos));
	} else {
		// BigDecimal::from(self.target_utilization_rate) + (pos - target_utilization) * (BigDecimal::from(self.max_utilization_rate) - BigDecimal::from(self.target_utilization_rate)) / BigDecimal::from_ratio(MAX_POS - self.target_utilization)
		rate = market._target_utilization_rate.toBigDecimal()
			.div(BD('1000000000000000000000000000'))
			.plus(
				pos
					.minus(target)
					.times(
						market._max_utilization_rate
							.minus(market._target_utilization_rate).toBigDecimal()
							.div(BD('1000000000000000000000000000'))
					)
					.div(BD_ONE.minus(target))
			);
	}

	if (rate.lt(BD_ONE) || rate.gt(BD('1.1'))) {
		log.warning('getRate() :: RATE TOO BIG/LOW {} :: Market {} ::Collateral {} Borrowed {} Reserve {}', [rate.toString(), market.name!, market.inputTokenBalance.toString(), market._totalBorrowed.toString(), market._totalReserved.toString()]);
		rate = BD_ONE;
	}

	return rate;
}

export function updateApr(market: Market, receipt: near.ReceiptWithOutcome): void {
	const rate = getRate(market);
	if (rate.equals(BD_ONE)) return;

	const borrow_apr = bigDecimalExponential(
		rate.minus(BD_ONE),
		BD('31536000000')
	).minus(BD_ONE);

	const annualBorrowInterest = market._totalBorrowed.toBigDecimal().times(
		borrow_apr
	);

	const annualSupplyInterest = annualBorrowInterest.times(
		BD_ONE.minus(market._reserveRatio.toBigDecimal().div(BD('10000')))
	);

	const supply_apr = annualSupplyInterest.div(
		market.inputTokenBalance.toBigDecimal()
	);

	/* -------------------------------------------------------------------------- */
	/*                                 Supply Rate                                */
	/* -------------------------------------------------------------------------- */
	const supply_rate = getOrCreateSupplyRate(market);
	supply_rate.rate = supply_apr.times(BD('100'));
	supply_rate.save();

	/* -------------------------------------------------------------------------- */
	/*                                 Borrow Rate                                */
	/* -------------------------------------------------------------------------- */
	const borrow_rate = getOrCreateBorrowRate(market);
	borrow_rate.rate = borrow_apr.times(BD('100'));
	borrow_rate.save();

	/* -------------------------------------------------------------------------- */
	/*                               Daily Snapshot                               */
	/* -------------------------------------------------------------------------- */
	const supplyRateToday = getOrCreateSupplyRate(market, receipt);
	supplyRateToday.rate = supply_apr.times(BD('100'));
	supplyRateToday.save();

	const borrowRateToday = getOrCreateBorrowRate(market, receipt);
	borrowRateToday.rate = borrow_rate.rate
	borrowRateToday.save();
}