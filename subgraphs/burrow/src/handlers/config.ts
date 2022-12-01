import {
	near,
	BigInt,
	JSONValue,
	TypedMap,
	log,
	JSONValueKind,
} from '@graphprotocol/graph-ts';
import {
	getOrCreateMarket,
} from '../helpers/market';
import {
	getOrCreateToken,
} from '../helpers/token';
import { assets } from '../utils/const';
import { getOrCreateProtocol } from '../helpers/protocol';

export function handleNew(
	method: string,
	args: string, // only for logging: remove afterwards
	data: TypedMap<string, JSONValue>,
	receipt: near.ReceiptWithOutcome
): void {
	let controller = getOrCreateProtocol();
	let eventArgsArr = data.get('config');
	if (!eventArgsArr) return;
	let eventArgs = eventArgsArr.toObject();
	/* -------------------------------------------------------------------------- */
	/*                                   Oracle                                   */
	/* -------------------------------------------------------------------------- */
	let oracle = eventArgs.get('oracle_account_id');
	if (!oracle) return;
	/* -------------------------------------------------------------------------- */
	/*                                    Owner                                   */
	/* -------------------------------------------------------------------------- */
	let owner = eventArgs.get('owner_id');
	if (!owner) return;
	/* -------------------------------------------------------------------------- */
	/*                                  _booster                                  */
	/* -------------------------------------------------------------------------- */
	let booster = eventArgs.get('booster_token_id');
	if (!booster) return;
	let booster_decimals = eventArgs.get('booster_decimals');
	if (!booster_decimals) return;
	let multiplier = eventArgs.get(
		'x_booster_multiplier_at_maximum_staking_duration'
	);
	if (!multiplier) return;
	/* -------------------------------------------------------------------------- */
	/*                                  max assets                                */
	/* -------------------------------------------------------------------------- */
	let max_num_assets = eventArgs.get('max_num_assets');
	if (!max_num_assets) return;

	controller._oracle = oracle.toString();
	controller._owner = owner.toString();

	let boosterToken = getOrCreateToken(booster.toString());
	controller._booster = boosterToken.id;
	boosterToken.decimals = booster_decimals.toI64() as i32;
	
	controller._boosterMultiplier = multiplier.toBigInt();
	controller._maxAssets = max_num_assets.data as i32;
	controller.save();
}