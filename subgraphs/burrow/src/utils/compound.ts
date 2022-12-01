import { Market, InterestRate } from "../../generated/schema";
import { BigDecimal, BigInt, near, log } from "@graphprotocol/graph-ts";
import { BD_ONE, BD_ZERO, BI_ZERO } from "./const";
import { getOrCreateBorrowRate } from "../helpers/rates";

import { getRate } from "./rates";
import { bigDecimalExponential } from "./math";

const BD = (n: string): BigDecimal => BigDecimal.fromString(n);

export function compound(
	market: Market,
	receipt: near.ReceiptWithOutcome
): Market {
	let time_diff_ms = BigInt.fromU64(
		receipt.block.header.timestampNanosec / 1000000
	).minus(market._last_update_timestamp);

	if (time_diff_ms.equals(BI_ZERO)) {
		return market;
	}

	let rate = getRate(market);
	let interestScaled = bigDecimalExponential(
		rate.minus(BD_ONE),
		time_diff_ms.toBigDecimal()
	);

	let interest = interestScaled
		.times(market._totalBorrowed.toBigDecimal())
		.minus(market._totalBorrowed.toBigDecimal())
		.truncate(0);

	if (interestScaled.equals(BD_ONE)) {
		return market;
	}

	// TODO: Split interest based on ratio between reserved and supplied?
	let reserved = interest
		.times(market._reserveRatio.toBigDecimal())
		.div(BD("10000"))
		.truncate(0);

	market._totalReserved = market._totalReserved.plus(
		BigInt.fromString(reserved.toString())
	);
	market.inputTokenBalance = market.inputTokenBalance.plus(
		BigInt.fromString(interest.minus(reserved).toString())
	);
	market._totalBorrowed = market._totalBorrowed.plus(
		BigInt.fromString(interest.toString())
	);

	// sub remaining reward
	let rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount!;
	let rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD!; 
	let _reward_remaining_amounts = market._reward_remaining_amounts

	for (let i = 0; i < rewardTokenEmissionsAmount.length; i++) {
		let dailyRewardTokenEmission = rewardTokenEmissionsAmount[i];
		let rewardTokenEmittedEveryMs = dailyRewardTokenEmission.div(BigInt.fromI32(24 * 60 * 60 * 1000)); // in millisec

		_reward_remaining_amounts[i] = _reward_remaining_amounts[i].minus(rewardTokenEmittedEveryMs.times(time_diff_ms))

		if(_reward_remaining_amounts[i].lt(rewardTokenEmissionsAmount[i])){
			rewardTokenEmissionsAmount[i] = BI_ZERO;
			rewardTokenEmissionsUSD[i] = BD_ZERO;
			_reward_remaining_amounts[i] = BI_ZERO;
		}
	}
	market._reward_remaining_amounts = _reward_remaining_amounts
	market.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount
	market.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD

	// update timestamp
	market._last_update_timestamp = market._last_update_timestamp.plus(
		time_diff_ms
	);

	return market;
}
