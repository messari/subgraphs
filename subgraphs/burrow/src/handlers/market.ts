import {
	near,
	BigInt,
	JSONValue,
	TypedMap,
	log,
	JSONValueKind,
} from '@graphprotocol/graph-ts';
import { getOrCreateMarket } from '../helpers/market';
import { getOrCreateToken } from '../helpers/token';
import { assets, BIGDECIMAL_100, BIGDECIMAL_TWO } from '../utils/const';
import { getOrCreateProtocol } from '../helpers/protocol';
import { BigDecimal } from '@graphprotocol/graph-ts';

export function handleNewAsset(
	method: string,
	args: string, // only for logging: remove afterwards
	data: TypedMap<string, JSONValue>,
	receipt: near.ReceiptWithOutcome
): void {
	let token_id = data.get('token_id');
	if (!token_id) {
		log.info('NEW_ASSET::Token ID not found {}', [args]);
		return;
	}
	let token = getOrCreateToken(token_id.toString());
	let market = getOrCreateMarket(token_id.toString());

	let assetConfigObj = data.get('asset_config');
	if (!assetConfigObj) {
		log.info('NEW_ASSET::Data not found {}', [args]);
		return;
	}
	if (assetConfigObj.kind != JSONValueKind.OBJECT) {
		log.info('NEW_ASSET::Incorrect type assetConfigObj {}', [
			assetConfigObj.kind.toString(),
		]);
		return;
	}
	let assetConfig = assetConfigObj.toObject();

	market.name = token.name;

	market.createdBlockNumber = BigInt.fromU64(receipt.block.header.height);
	market.createdTimestamp = BigInt.fromU64(
		receipt.block.header.timestampNanosec
	).div(BigInt.fromI32(1000000000));

	market._last_update_timestamp = BigInt.fromU64(receipt.block.header.timestampNanosec / 1000000);

	/* -------------------------------------------------------------------------- */
	/*                                reserve_ratio                               */
	/* -------------------------------------------------------------------------- */
	let reserve_ratio = assetConfig.get('reserve_ratio');
	if (!reserve_ratio) {
		log.info('NEW_ASSET::Reserve ratio not found {}', [args]);
		return;
	}
	market._reserveRatio = BigInt.fromI64(reserve_ratio.toI64());

	/* -------------------------------------------------------------------------- */
	/*                             target_utilization                             */
	/* -------------------------------------------------------------------------- */
	let target_utilization = assetConfig.get('target_utilization');
	if (!target_utilization) {
		log.info('NEW_ASSET::Target utilization not found {}', [args]);
		return;
	}
	market._target_utilization = BigInt.fromI64(target_utilization.toI64());

	/* -------------------------------------------------------------------------- */
	/*                          _target_utilization_rate                          */
	/* -------------------------------------------------------------------------- */
	let target_utilization_rate = assetConfig.get('target_utilization_rate');
	if (!target_utilization_rate) {
		log.info('NEW_ASSET::Target utilization rate not found {}', [args]);
		return;
	}
	market._target_utilization_rate = BigInt.fromString(
		target_utilization_rate.toString()
	);

	/* -------------------------------------------------------------------------- */
	/*                            max_utilization_ratȩ                           */
	/* -------------------------------------------------------------------------- */
	let max_utilization_rate = assetConfig.get('max_utilization_rate');
	if (!max_utilization_rate) {
		log.info('NEW_ASSET::Max utilization rate not found {}', [args]);
		return;
	}
	market._max_utilization_rate = BigInt.fromString(
		max_utilization_rate.toString()
	);

	/* -------------------------------------------------------------------------- */
	/*                              volatility_ratio                              */
	/* -------------------------------------------------------------------------- */
	let volatility_ratio = assetConfig.get('volatility_ratio');
	if (!volatility_ratio) {
		log.info('NEW_ASSET::Volatility ratio not found {}', [args]);
		return;
	}
	market.maximumLTV = BigDecimal.fromString(volatility_ratio.toI64().toString()).div(BIGDECIMAL_100);
	market.liquidationThreshold = BigDecimal.fromString(volatility_ratio.toI64().toString()).div(BIGDECIMAL_100);
	market.liquidationPenalty = BIGDECIMAL_100.minus(market.liquidationThreshold).div(BIGDECIMAL_TWO);

	/* -------------------------------------------------------------------------- */
	/*                              extra_decimals                                */
	/* -------------------------------------------------------------------------- */
	market.inputToken = token.id;
	let extra_decimals = assetConfig.get('extra_decimals');
	if (!extra_decimals) {
		log.info('NEW_ASSET::extra_decimals ratio not found {}', [args]);
		return;
	}
	token.extraDecimals = extra_decimals.toI64() as i32;
	let asset = assets.get(token_id.toString());
	if (asset) {
		token.extraDecimals = asset.extraDecimals as i32;
	}

	/* -------------------------------------------------------------------------- */
	/*                          can_use_as_collateral                             */
	/* -------------------------------------------------------------------------- */
	let can_use_as_collateral = assetConfig.get('can_use_as_collateral');
	if (!can_use_as_collateral) {
		log.info('NEW_ASSET::can_use_as_collateral not found {}', [args]);
		return;
	}
	market.canUseAsCollateral = can_use_as_collateral.toBool();

	/* -------------------------------------------------------------------------- */
	/*                                 can_borrow                                 */
	/* -------------------------------------------------------------------------- */
	let can_borrow = assetConfig.get('can_borrow');
	if (!can_borrow) {
		log.info('NEW_ASSET::can_borrow not found {}', [args]);
		return;
	}
	market.canBorrowFrom = can_borrow.toBool();

	/* -------------------------------------------------------------------------- */
	/*                       can_deposit && can_withdraw                          */
	/* -------------------------------------------------------------------------- */
	let can_deposit = assetConfig.get('can_deposit');
	if (!can_deposit) {
		log.info('NEW_ASSET::can_deposit not found {}', [args]);
		return;
	}
	let can_withdraw = assetConfig.get('can_withdraw');
	if (!can_withdraw) {
		log.info('NEW_ASSET::can_withdraw not found {}', [args]);
		return;
	}
	market.isActive = can_deposit.toBool() && can_withdraw.toBool();

	// Save
	token.save();
	market.save();

	// save to protocol data
	let protocol = getOrCreateProtocol();
	let tempMarkets = protocol._marketIds;
	tempMarkets.push(market.id);
	protocol._marketIds = tempMarkets;

	protocol.totalPoolCount += 1;
	protocol.save();
}


export function handleUpdateAsset(
	method: string,
	args: string, // only for logging: remove afterwards
	data: TypedMap<string, JSONValue>,
	receipt: near.ReceiptWithOutcome
): void {
	let token_id = data.get('token_id');
	if (!token_id) {
		log.info('NEW_ASSET::Token ID not found {}', [args]);
		return;
	}
	let token = getOrCreateToken(token_id.toString());
	let market = getOrCreateMarket(token_id.toString());

	let assetConfigObj = data.get('asset_config');
	if (!assetConfigObj) {
		log.info('NEW_ASSET::Data not found {}', [args]);
		return;
	}
	if (assetConfigObj.kind != JSONValueKind.OBJECT) {
		log.info('NEW_ASSET::Incorrect type assetConfigObj {}', [
			assetConfigObj.kind.toString(),
		]);
		return;
	}
	let assetConfig = assetConfigObj.toObject();

	market._last_update_timestamp = BigInt.fromU64(receipt.block.header.timestampNanosec / 1000000);

	/* -------------------------------------------------------------------------- */
	/*                                reserve_ratio                               */
	/* -------------------------------------------------------------------------- */
	let reserve_ratio = assetConfig.get('reserve_ratio');
	if (!reserve_ratio) {
		log.info('NEW_ASSET::Reserve ratio not found {}', [args]);
		return;
	}
	market._reserveRatio = BigInt.fromI64(reserve_ratio.toI64());

	/* -------------------------------------------------------------------------- */
	/*                             target_utilization                             */
	/* -------------------------------------------------------------------------- */
	let target_utilization = assetConfig.get('target_utilization');
	if (!target_utilization) {
		log.info('NEW_ASSET::Target utilization not found {}', [args]);
		return;
	}
	market._target_utilization = BigInt.fromI64(target_utilization.toI64());

	/* -------------------------------------------------------------------------- */
	/*                          _target_utilization_rate                          */
	/* -------------------------------------------------------------------------- */
	let target_utilization_rate = assetConfig.get('target_utilization_rate');
	if (!target_utilization_rate) {
		log.info('NEW_ASSET::Target utilization rate not found {}', [args]);
		return;
	}
	market._target_utilization_rate = BigInt.fromString(
		target_utilization_rate.toString()
	);

	/* -------------------------------------------------------------------------- */
	/*                            max_utilization_ratȩ                           */
	/* -------------------------------------------------------------------------- */
	let max_utilization_rate = assetConfig.get('max_utilization_rate');
	if (!max_utilization_rate) {
		log.info('NEW_ASSET::Max utilization rate not found {}', [args]);
		return;
	}
	market._max_utilization_rate = BigInt.fromString(
		max_utilization_rate.toString()
	);

	/* -------------------------------------------------------------------------- */
	/*                              volatility_ratio                              */
	/* -------------------------------------------------------------------------- */
	let volatility_ratio = assetConfig.get('volatility_ratio');
	if (!volatility_ratio) {
		log.info('NEW_ASSET::Volatility ratio not found {}', [args]);
		return;
	}
	market._volatility_ratio = BigInt.fromI64(volatility_ratio.toI64());

	/* -------------------------------------------------------------------------- */
	/*                              extra_decimals                                */
	/* -------------------------------------------------------------------------- */
	market.inputToken = token.id;
	let extra_decimals = assetConfig.get('extra_decimals');
	if (!extra_decimals) {
		log.info('NEW_ASSET::extra_decimals ratio not found {}', [args]);
		return;
	}
	token.extraDecimals = extra_decimals.toI64() as i32;
	let asset = assets.get(token_id.toString());
	if (asset) {
		token.extraDecimals = asset.extraDecimals as i32;
	}

	/* -------------------------------------------------------------------------- */
	/*                          can_use_as_collateral                             */
	/* -------------------------------------------------------------------------- */
	let can_use_as_collateral = assetConfig.get('can_use_as_collateral');
	if (!can_use_as_collateral) {
		log.info('NEW_ASSET::can_use_as_collateral not found {}', [args]);
		return;
	}
	market.canUseAsCollateral = can_use_as_collateral.toBool();

	/* -------------------------------------------------------------------------- */
	/*                                 can_borrow                                 */
	/* -------------------------------------------------------------------------- */
	let can_borrow = assetConfig.get('can_borrow');
	if (!can_borrow) {
		log.info('NEW_ASSET::can_borrow not found {}', [args]);
		return;
	}
	market.canBorrowFrom = can_borrow.toBool();

	/* -------------------------------------------------------------------------- */
	/*                       can_deposit && can_withdraw                          */
	/* -------------------------------------------------------------------------- */
	let can_deposit = assetConfig.get('can_deposit');
	if (!can_deposit) {
		log.info('NEW_ASSET::can_deposit not found {}', [args]);
		return;
	}
	let can_withdraw = assetConfig.get('can_withdraw');
	if (!can_withdraw) {
		log.info('NEW_ASSET::can_withdraw not found {}', [args]);
		return;
	}
	market.isActive = can_deposit.toBool() && can_withdraw.toBool();

	// Save
	token.save();
	market.save();
}
