import {
	near,
	BigInt,
	JSONValue,
	TypedMap,
	log,
	BigDecimal,
	JSONValueKind,
	json,
} from "@graphprotocol/graph-ts";
import { getOrCreateAccount } from "../helpers/account";
import { getOrCreatePosition } from "../helpers/position";

import { getOrCreateLiquidation } from "../helpers/actions";
import {
	getOrCreateMarket,
	getOrCreateMarketDailySnapshot,
	getOrCreateMarketHourlySnapshot,
} from "../helpers/market";

import { updateProtocol } from "../update/protocol";
import {
	getOrCreateProtocol,
	getOrCreateUsageMetricsDailySnapshot,
	getOrCreateUsageMetricsHourlySnapshot,
	getOrCreateFinancialDailySnapshot,
} from "../helpers/protocol";
import { Position } from "../../generated/schema";
import { BI_ZERO } from "../utils/const";

// { account_id, liquidation_account_id, collateral_sum, repaid_sum }
export function handleLiquidate(
	data: TypedMap<string, JSONValue>,
	receipt: near.ReceiptWithOutcome,
	logIndex: number,
	method?: string,
	args?: TypedMap<string, JSONValue>
): void {
	const protocol = getOrCreateProtocol();

	const usageHourly = getOrCreateUsageMetricsHourlySnapshot(receipt);
	usageHourly.hourlyLiquidateCount += 1;
	const usageDaily = getOrCreateUsageMetricsDailySnapshot(receipt);
	usageDaily.dailyLiquidateCount += 1;
	const financialDaily = getOrCreateFinancialDailySnapshot(receipt);

	const liq = getOrCreateLiquidation(
		receipt.outcome.id
			.toBase58()
			.concat("-")
			.concat((logIndex as i32).toString()),
		receipt
	);
	liq.logIndex = logIndex as i32;

	/* -------------------------------------------------------------------------- */
	/*                                 Liquidator                                 */
	/* -------------------------------------------------------------------------- */
	const account_id = data.get("account_id");
	if (!account_id) {
		log.info("{} data not found", ["account_id"]);
		return;
	}

	const liquidator = getOrCreateAccount(account_id.toString());
	if (liquidator.liquidateCount == 0) {
		protocol.cumulativeUniqueLiquidators =
			protocol.cumulativeUniqueLiquidators + 1;
	}
	if (liquidator._last_active_timestamp.lt(usageDaily.timestamp)) {
		usageDaily.dailyActiveLiquidators += 1;
	}

	liquidator.liquidateCount += 1;
	liq.liquidator = liquidator.id;

	/* -------------------------------------------------------------------------- */
	/*                                 Liquidatee                                 */
	/* -------------------------------------------------------------------------- */
	const liquidation_account_id = data.get("liquidation_account_id");
	if (!liquidation_account_id) {
		log.info("{} data not found", ["liquidation_account_id"]);
		return;
	}
	const liquidatee = getOrCreateAccount(liquidation_account_id.toString());
	if (liquidatee.liquidationCount == 0) {
		protocol.cumulativeUniqueLiquidatees =
			protocol.cumulativeUniqueLiquidatees + 1;
	}
	if (liquidatee._last_active_timestamp.lt(usageDaily.timestamp)) {
		usageDaily.dailyActiveLiquidatees += 1;
	}
	liquidatee.liquidationCount += 1;
	liq.liquidatee = liquidatee.id;

	/* -------------------------------------------------------------------------- */
	/*                              Collateral Amount                             */
	/* -------------------------------------------------------------------------- */
	const collateral_sum = data.get("collateral_sum");
	if (!collateral_sum) {
		log.info("{} data not found", ["collateral_sum"]);
		return;
	}

	const collateral_sum_value = BigDecimal.fromString(
		collateral_sum.toString()
	);
	liq.amountUSD = collateral_sum_value;

	/* -------------------------------------------------------------------------- */
	/*                                Repaid Amount                               */
	/* -------------------------------------------------------------------------- */
	const repaid_sum = data.get("repaid_sum");
	if (!repaid_sum) {
		log.info("{} data not found", ["repaid_sum"]);
		return;
	}
	const repaid_sum_value = BigDecimal.fromString(repaid_sum.toString());
	liq.profitUSD = liq.amountUSD.minus(repaid_sum_value);

	// finding token_in, token_in_amount, token_out and token_out_amount
	// TOKEN_IN: borrowed token
	// TOKEN_OUT: collateral token
	let token_in: string | null = null,
		token_out: string | null = null;
	let token_in_amount: string | null = null,
		token_out_amount: string | null = null;
	if (args) {
		let msg = args.get("msg");
		if (!msg) {
			log.info("LIQ::Msg not found", []);
			return;
		}
		log.info("LIQ::MSG {}", [msg.toString()]);
		msg = json.fromString(msg.toString());
		const exec = msg.toObject().get("Execute");
		if (!exec) {
			log.info("LIQ::Execute not found", []);
			return;
		}

		if (exec.kind != JSONValueKind.OBJECT) return;
		const actions = exec.toObject().get("actions");
		if (!actions) {
			log.info("LIQ::Actions not found", []);
			return;
		}

		if (actions.kind != JSONValueKind.ARRAY) return;
		const actionsArr = actions.toArray();

		for (let i = 0; i < actionsArr.length; i++) {
			if (actionsArr[i].kind == JSONValueKind.OBJECT) {
				let a = actionsArr[i].toObject();
				let liqCall = a.get("Liquidate");
				if (liqCall) {
					if (liqCall.kind == JSONValueKind.OBJECT) {
						/* -------------------------------------------------------------------------- */
						/*                       Repaid asset: id & amount                            */
						/* -------------------------------------------------------------------------- */
						let in_assets = liqCall.toObject().get("in_assets");
						if (
							in_assets &&
							in_assets.kind == JSONValueKind.ARRAY
						) {
							if (
								in_assets.toArray()[0].kind ==
								JSONValueKind.OBJECT
							) {
								const asset = in_assets.toArray()[0].toObject();
								const asset_id = asset.get("token_id");
								const asset_amt = asset.get("amount");
								if (asset_id && asset_amt) {
									token_in = asset_id.toString();
									token_in_amount = asset_amt.toString();
								}
							}
						}
						/* -------------------------------------------------------------------------- */
						/*                            Collateral asset: id & amount                   */
						/* -------------------------------------------------------------------------- */
						const out_assets = liqCall.toObject().get("out_assets");
						if (
							out_assets &&
							out_assets.kind == JSONValueKind.ARRAY
						) {
							if (
								out_assets.toArray()[0].kind ==
								JSONValueKind.OBJECT
							) {
								const asset = out_assets
									.toArray()[0]
									.toObject();
								const asset_id = asset.get("token_id");
								const asset_amt = asset.get("amount");
								if (asset_id && asset_amt) {
									token_out = asset_id.toString();
									token_out_amount = asset_amt.toString();
								}
							}
						}
					}
				}
			}
		}
	}

	if (token_in && token_out && token_in_amount && token_out_amount) {
		const repaidMarket = getOrCreateMarket(token_in);
		const repaidPosition = getOrCreatePosition(
			liquidatee,
			repaidMarket,
			"BORROWER",
			receipt
		);
		const dailySnapshot = getOrCreateMarketDailySnapshot(
			repaidMarket,
			receipt
		);
		const hourlySnapshot = getOrCreateMarketHourlySnapshot(
			repaidMarket,
			receipt
		);
		const collateralMarket = getOrCreateMarket(token_out);
		const collateralPosition = getOrCreatePosition(
			liquidatee,
			collateralMarket,
			"LENDER",
			receipt
		);

		repaidPosition.balance = BI_ZERO;
		repaidPosition.hashClosed = receipt.receipt.id.toBase58();
		repaidPosition.blockNumberClosed = BigInt.fromU64(
			receipt.block.header.height
		);
		repaidPosition.timestampClosed = BigInt.fromU64(
			receipt.block.header.timestampNanosec / 1000000
		);

		collateralPosition.balance = BI_ZERO;
		collateralPosition.hashClosed = receipt.receipt.id.toBase58();
		collateralPosition.blockNumberClosed = BigInt.fromU64(
			receipt.block.header.height
		);
		collateralPosition.timestampClosed = BigInt.fromU64(
			receipt.block.header.timestampNanosec / 1000000
		);

		liquidatee.openPositionCount -= 1;
		// closing borrowed position
		repaidMarket.openPositionCount -= 1;
		repaidMarket.closedPositionCount += 1;
		// closing collateral position
		collateralMarket.openPositionCount -= 1;
		collateralMarket.closedPositionCount += 1;

		liq.asset = repaidMarket.id;
		liq.market = collateralMarket.id;
		liq.amount = BigInt.fromString(token_out_amount);
		liq.position = repaidPosition.id;

		repaidMarket.cumulativeLiquidateUSD = repaidMarket.cumulativeLiquidateUSD.plus(
			repaid_sum_value
		);
		repaidMarket._totalBorrowed = repaidMarket._totalBorrowed.minus(
			BigInt.fromString(token_in_amount)
		);
		repaidMarket.inputTokenBalance = repaidMarket.inputTokenBalance.minus(
			BigInt.fromString(token_in_amount)
		);

		dailySnapshot.cumulativeLiquidateUSD = dailySnapshot.cumulativeLiquidateUSD.plus(
			repaid_sum_value
		);
		dailySnapshot.dailyLiquidateUSD = dailySnapshot.dailyLiquidateUSD.plus(
			repaid_sum_value
		);
		hourlySnapshot.cumulativeLiquidateUSD = hourlySnapshot.cumulativeLiquidateUSD.plus(
			repaid_sum_value
		);
		hourlySnapshot.hourlyLiquidateUSD = hourlySnapshot.hourlyLiquidateUSD.plus(
			repaid_sum_value
		);

		collateralPosition.save();
		repaidPosition.save();
		dailySnapshot.save();
		hourlySnapshot.save();
		repaidMarket.save();
		collateralMarket.save();
	} else {
		log.warning("LIQ::Liquidation data not found", []);
		return;
	}

	liquidator.save();
	liquidatee.save();
	financialDaily.dailyLiquidateUSD = financialDaily.dailyLiquidateUSD.plus(
		repaid_sum_value
	);
	financialDaily.save();
	liq.save();
	protocol.save();
	usageHourly.save();
	usageDaily.save();
	updateProtocol();
}

export function handleForceClose(
	data: TypedMap<string, JSONValue>,
	receipt: near.ReceiptWithOutcome,
	logIndex: number,
	method?: string,
	args?: TypedMap<string, JSONValue>
): void {
	const protocol = getOrCreateProtocol();
	const dailyProtocol = getOrCreateUsageMetricsDailySnapshot(receipt);
	const hourlyProtocol = getOrCreateUsageMetricsHourlySnapshot(receipt);
	const financialDaily = getOrCreateFinancialDailySnapshot(receipt);

	const liquidator = getOrCreateAccount(receipt.receipt.signerId);
	liquidator.liquidateCount += 1;
	liquidator.save();

	const liquidation_account_id = data.get("liquidation_account_id");
	if (!liquidation_account_id) {
		log.info("{} data not found", ["liquidation_account_id"]);
		return;
	}

	const collateral_sum = data.get("collateral_sum");
	if (!collateral_sum) {
		log.info("{} data not found", ["collateral_sum"]);
		return;
	}
	const repaid_sum = data.get("repaid_sum");
	if (!repaid_sum) {
		log.info("{} data not found", ["repaid_sum"]);
		return;
	}

	const liquidatee = getOrCreateAccount(liquidation_account_id.toString());
	if (liquidatee.liquidationCount == 0) {
		protocol.cumulativeUniqueLiquidatees =
			protocol.cumulativeUniqueLiquidatees + 1;
	}
	liquidatee.liquidationCount += 1;
	liquidatee.save();

	protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(
		BigDecimal.fromString(repaid_sum.toString())
	);
	financialDaily.dailyLiquidateUSD = financialDaily.dailyLiquidateUSD.plus(
		BigDecimal.fromString(repaid_sum.toString())
	);
	hourlyProtocol.hourlyLiquidateCount += 1;
	dailyProtocol.dailyLiquidateCount += 1;
	if (liquidator.liquidateCount == 0) {
		protocol.cumulativeUniqueLiquidators += 1;
		dailyProtocol.cumulativeUniqueLiquidators += 1;
	}
	if (liquidator._last_active_timestamp.lt(dailyProtocol.timestamp)) {
		dailyProtocol.dailyActiveLiquidators += 1;
	}
	if (liquidatee.liquidationCount == 0) {
		protocol.cumulativeUniqueLiquidatees += 1;
		dailyProtocol.cumulativeUniqueLiquidatees += 1;
	}
	if (liquidatee._last_active_timestamp.lt(dailyProtocol.timestamp)) {
		dailyProtocol.dailyActiveLiquidatees += 1;
	}
	protocol.save();

	// let all position of liquidatee
	const markets = protocol._marketIds;
	for (let i = 0; i < markets.length; i++) {
		const market = getOrCreateMarket(markets[i]);
		const borrow_position = Position.load(
			markets[i]
				.concat("-")
				.concat(liquidation_account_id.toString())
				.concat("-BORROWER")
		);
		const supply_position = Position.load(
			markets[i]
				.concat("-")
				.concat(liquidation_account_id.toString())
				.concat("-BORROWER")
		);
		if (borrow_position) {
			if (borrow_position.balance.gt(BI_ZERO)) {
				market._totalBorrowed = market._totalBorrowed.minus(
					borrow_position.balance
				);
				market.inputTokenBalance = market.inputTokenBalance.minus(
					borrow_position.balance
				);
				market._totalReserved = market._totalReserved.plus(
					borrow_position.balance
				);
				borrow_position.balance = BI_ZERO;
				borrow_position.hashClosed = receipt.receipt.id.toBase58();
				borrow_position.timestampClosed = BigInt.fromU64(
					receipt.block.header.timestampNanosec / 1000000
				);
				borrow_position.save();
			}
		}
		if (supply_position) {
			if (supply_position.balance.gt(BI_ZERO)) {
				market.inputTokenBalance = market.inputTokenBalance.minus(
					supply_position.balance
				);
				market._totalReserved = market._totalReserved.plus(
					supply_position.balance
				);
				supply_position.balance = BI_ZERO;
				supply_position.hashClosed = receipt.receipt.id.toBase58();
				supply_position.timestampClosed = BigInt.fromU64(
					receipt.block.header.timestampNanosec / 1000000
				);
				supply_position.save();
			}
		}
	}
}
