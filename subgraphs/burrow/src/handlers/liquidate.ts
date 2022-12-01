import {
	near,
	BigInt,
	JSONValue,
	TypedMap,
	log,
	BigDecimal,
	JSONValueKind,
	json,
} from '@graphprotocol/graph-ts';
import { getOrCreateAccount } from '../helpers/account';
import { updatePosition } from '../update/position';
import { getOrCreatePosition } from '../helpers/position';

import { getOrCreateLiquidation  } from '../helpers/actions';
import { getOrCreateMarket, getOrCreateMarketDailySnapshot, getOrCreateMarketHourlySnapshot } from '../helpers/market';
import { getOrCreateToken } from '../helpers/token';

import { updateMarket } from '../update/market';
import { amount_to_shares } from '../utils/shares';
import { updateProtocol } from '../update/protocol';
import { getOrCreateProtocol } from '../helpers/protocol';
import { Position } from '../../generated/schema';
import { BI_ZERO } from '../utils/const';

// { account_id, liquidation_account_id, collateral_sum, repaid_sum }
export function handleLiquidate(
	data: TypedMap<string, JSONValue>,
	receipt: near.ReceiptWithOutcome,
	logIndex: number,
	method?: string,
	args?: TypedMap<string, JSONValue>
): void {
    let protocol = getOrCreateProtocol();

	let liq = getOrCreateLiquidation(
		receipt.outcome.id
			.toBase58()
			.concat('-')
			.concat((logIndex as i32).toString()),
		receipt
	);
	liq.logIndex = logIndex as i32;

	/* -------------------------------------------------------------------------- */
	/*                                 Liquidator                                 */
	/* -------------------------------------------------------------------------- */
	let account_id = data.get('account_id');
	if (!account_id) {
		log.info('{} data not found', ['account_id']);
		return;
	}

	let liquidator = getOrCreateAccount(account_id.toString());
    if(liquidator.liquidateCount == 0){
        protocol.cumulativeUniqueLiquidators = protocol.cumulativeUniqueLiquidators + 1
    }
	liquidator.liquidateCount += 1;
	liq.liquidator = liquidator.id;
	liquidator.save();

	/* -------------------------------------------------------------------------- */
	/*                                 Liquidatee                                 */
	/* -------------------------------------------------------------------------- */
	let liquidation_account_id = data.get('liquidation_account_id');
	if (!liquidation_account_id) {
		log.info('{} data not found', ['liquidation_account_id']);
		return;
	}
	let liquidatee = getOrCreateAccount(liquidation_account_id.toString());
    if(liquidatee.liquidationCount == 0){
        protocol.cumulativeUniqueLiquidatees = protocol.cumulativeUniqueLiquidatees + 1
    }
	liquidatee.liquidationCount += 1;
	liq.liquidatee = liquidatee.id;
	liquidatee.save();

	/* -------------------------------------------------------------------------- */
	/*                              Collateral Amount                             */
	/* -------------------------------------------------------------------------- */
	let collateral_sum = data.get('collateral_sum');
	if (!collateral_sum) {
		log.info('{} data not found', ['collateral_sum']);
		return;
	}

    let collateral_sum_value = BigDecimal.fromString(collateral_sum.toString());
	liq.amountUSD = collateral_sum_value
	
	/* -------------------------------------------------------------------------- */
	/*                                Repaid Amount                               */
	/* -------------------------------------------------------------------------- */
	let repaid_sum = data.get('repaid_sum');
	if (!repaid_sum) {
		log.info('{} data not found', ['repaid_sum']);
		return;
	}
    let repaid_sum_value = BigDecimal.fromString(repaid_sum.toString());
	liq.profitUSD = liq.amountUSD.minus(repaid_sum_value);
	

    // finding token_in, token_in_amount, token_out and token_out_amount
    // TOKEN_IN: borrowed token
    // TOKEN_OUT: collateral token
    let token_in: string|null = null, token_out: string|null = null;
    let token_in_amount: string|null = null, token_out_amount: string|null = null;
	if (args) {
		let msg = args.get('msg');
		if (!msg) {
			log.info('LIQ::Msg not found', []);
			return;
		}
		log.info('LIQ::MSG {}', [msg.toString()]);
		msg = json.fromString(msg.toString());
		let exec = msg.toObject().get('Execute');
		if (!exec) {
			log.info('LIQ::Execute not found', []);
			return;
		}

		if (exec.kind != JSONValueKind.OBJECT) return;
		let actions = exec.toObject().get('actions');
		if (!actions) {
			log.info('LIQ::Actions not found', []);
			return;
		}

		if (actions.kind != JSONValueKind.ARRAY) return;
		let actionsArr = actions.toArray();

		for (let i = 0; i < actionsArr.length; i++) {
			if (actionsArr[i].kind == JSONValueKind.OBJECT) {
				let a = actionsArr[i].toObject();
				let liqCall = a.get('Liquidate');
				if (liqCall) {
					if (liqCall.kind == JSONValueKind.OBJECT) {
						/* -------------------------------------------------------------------------- */
						/*                       Repaid asset: id & amount                            */
						/* -------------------------------------------------------------------------- */
						let in_assets = liqCall.toObject().get('in_assets');
						if (
							in_assets &&
							in_assets.kind == JSONValueKind.ARRAY
						) {
							if (
								in_assets.toArray()[0].kind ==
								JSONValueKind.OBJECT
							) {
								let asset = in_assets.toArray()[0].toObject();
								let asset_id = asset.get('token_id');
								let asset_amt = asset.get('amount');
								if (asset_id && asset_amt) {
									token_in = asset_id.toString();
                                    token_in_amount = asset_amt.toString();
								}
							}
						}
						/* -------------------------------------------------------------------------- */
						/*                            Collateral asset: id & amount                   */
						/* -------------------------------------------------------------------------- */
						let out_assets = liqCall.toObject().get('out_assets');
						if (
							out_assets &&
							out_assets.kind == JSONValueKind.ARRAY
						) {
							if (
								out_assets.toArray()[0].kind ==
								JSONValueKind.OBJECT
							) {
								let asset = out_assets.toArray()[0].toObject();
								let asset_id = asset.get('token_id');
								let asset_amt = asset.get('amount');
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

    if(token_in && token_out && token_in_amount && token_out_amount) {
        let repaidMarket = getOrCreateMarket(token_in);
		let dailySnapshot = getOrCreateMarketDailySnapshot(repaidMarket, receipt);
		let hourlySnapshot = getOrCreateMarketHourlySnapshot(repaidMarket, receipt);
        let collateralMarket = getOrCreateMarket(token_out);
		
        liq.asset = repaidMarket.id;
        liq.market = collateralMarket.id;
        liq.amount = BigInt.fromString(token_out_amount);
        liq.position = getOrCreatePosition(
			liquidation_account_id.toString(),
            token_in,
            "BORROWER"
		).id;
			
		repaidMarket.cumulativeLiquidateUSD = repaidMarket.cumulativeLiquidateUSD.plus(repaid_sum_value);
		repaidMarket._totalBorrowed = repaidMarket._totalBorrowed.minus(BigInt.fromString(token_in_amount));
		repaidMarket.inputTokenBalance = repaidMarket.inputTokenBalance.minus(BigInt.fromString(token_in_amount));

		// collateralMarket._

		// ? Should we update the cumulativeLiquidateUSD in both collateral and borrowed market?
		// ? Should we count liquidation as repayment?
		dailySnapshot.cumulativeLiquidateUSD = dailySnapshot.cumulativeLiquidateUSD.plus(repaid_sum_value);
		hourlySnapshot.cumulativeLiquidateUSD = hourlySnapshot.cumulativeLiquidateUSD.plus(repaid_sum_value);

        // TODO - remove deposit and borrow from liquidatee account
		
		dailySnapshot.save()
		hourlySnapshot.save()
        repaidMarket.save();
        collateralMarket.save();
    } else {
        log.warning('LIQ::Liquidation data not found', []);
        return;
    }

	liq.save();
    protocol.save();
	updateProtocol();
}

export function handleForceClose(
	data: TypedMap<string, JSONValue>,
	receipt: near.ReceiptWithOutcome,
	logIndex: number,
	method?: string,
	args?: TypedMap<string, JSONValue>
): void {
	let protocol = getOrCreateProtocol();

	// let liquidator = getOrCreateAccount(receipt.receipt.signerId);
	// liquidator.liquidateCount += 1;
	// liquidator.save();

	// { liquidation_account_id, collateral_sum, repaid_sum }
	let liquidation_account_id = data.get('liquidation_account_id');
	if (!liquidation_account_id) {
		log.info('{} data not found', ['liquidation_account_id']);
		return;
	}
	// let liquidatee = getOrCreateAccount(liquidation_account_id.toString());
    // if(liquidatee.liquidationCount == 0){
    //     protocol.cumulativeUniqueLiquidatees = protocol.cumulativeUniqueLiquidatees + 1
    // }
	// liquidatee.liquidationCount += 1;
	// liquidatee.save();

	// let all position of liquidatee
	let repaid_sum_calc = BigDecimal.fromString('0');
	let collateral_sum_calc = BigDecimal.fromString('0');
	let markets = protocol._marketIds;
	for(let i=0; i<markets.length; i++){
		let market = getOrCreateMarket(markets[i]);
		let borrow_position = Position.load(markets[i].concat("-").concat(liquidation_account_id.toString()).concat("-BORROWER"));
		let supply_position = Position.load(markets[i].concat("-").concat(liquidation_account_id.toString()).concat("-BORROWER"));
		if(borrow_position){
			if(borrow_position.balance.gt(BI_ZERO)){
				repaid_sum_calc = repaid_sum_calc.plus(borrow_position.balance.toBigDecimal().times(market.inputTokenPriceUSD));
				borrow_position.balance = BI_ZERO;
				market._totalBorrowed = market._totalBorrowed.minus(borrow_position.balance);
				market.inputTokenBalance = market.inputTokenBalance.minus(borrow_position.balance);
			}
		}
		if(supply_position){
			if(supply_position.balance.gt(BI_ZERO)){
				collateral_sum_calc = collateral_sum_calc.plus(supply_position.balance.toBigDecimal().times(market.inputTokenPriceUSD));
				supply_position.balance = BI_ZERO;
			}
		}
	}
	
	let collateral_sum = data.get('collateral_sum');
	let repaid_sum = data.get('repaid_sum');

	log.warning('FC::collateral_sum_calc: {} collateral_sum {}', [collateral_sum_calc.toString(), collateral_sum!.toString()]);
	log.warning('FC::repaid_sum_calc: {} repaid_sum {}', [repaid_sum_calc.toString(), repaid_sum!.toString()]);
}