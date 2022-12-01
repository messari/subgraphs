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
import { getOrCreateToken } from "../helpers/token";
import { getOrCreateProtocol } from "../helpers/protocol";
import { BD_ZERO } from '../utils/const';

export function handleOracleCall(
	method: string,
	args: string, // only for logging: remove afterwards
	data: TypedMap<string, JSONValue>,
	receipt: near.ReceiptWithOutcome
): void {
	let controller = getOrCreateProtocol();
	let eventArgsArr = data.get("data");
	if (!eventArgsArr) {
		log.warning("ORACLE::Data not found {}", [args]);
		return;
	}
	if (eventArgsArr.kind != JSONValueKind.OBJECT) {
		log.warning("ORACLE::Incorrect type eventArgsArr {}", [
			eventArgsArr.kind.toString(),
		]);
		return;
	}
	let eventArgs = eventArgsArr.toObject();
	let prices = eventArgs.get("prices");
	if (!prices) {
		log.warning("ORACLE::Prices not found. Args: {}", [args]);
		return;
	} else if (prices.kind !== JSONValueKind.ARRAY) {
		log.warning("ORACLE::Prices kind not array {}", [
			prices.kind.toString(),
		]);
		return;
	}
	let pricesArr = prices.toArray();

	for (let i = 0; i < pricesArr.length; i++) {
		if (pricesArr[i].kind != JSONValueKind.OBJECT) {
			log.warning("ORACLE::Incorrect type pricesArr {}", [
				pricesArr[i].kind.toString(),
			]);
			return;
		}

		/* -------------------------------------------------------------------------- */
		/*                                  Asset ID                                  */
		/* -------------------------------------------------------------------------- */
		let price = pricesArr[i].toObject();
		let token_id = price.get("asset_id");
		if (!token_id) {
			log.warning("ORACLE::Token unable to parse {}", ["token_id"]);
			return;
		}

		/* -------------------------------------------------------------------------- */
		/*                                    Price                                   */
		/* -------------------------------------------------------------------------- */
		let priceObj = price.get("price");
		if (priceObj) {
			if (priceObj.kind == JSONValueKind.OBJECT) {
				/* -------------------------------------------------------------------------- */
				/*                                 Multiplier                                 */
				/* -------------------------------------------------------------------------- */
				let multiplier = priceObj.toObject().get("multiplier");
				let decimals = priceObj.toObject().get("decimals");
				if (!multiplier || !decimals) {
					log.warning("ORACLE::Token unable to get {}", [
						"multiplier | decimals",
					]);
					return;
				}

				if (
					multiplier.kind != JSONValueKind.STRING &&
					decimals.kind != JSONValueKind.NUMBER
				) {
					log.warning(
						"ORACLE::Incorrect type multiplier {} decimals {}",
						[multiplier.kind.toString(), decimals.kind.toString()]
					);
					return;
				}

				let token = getOrCreateToken(token_id.toString());
				let decimalFactor = decimals.toI64() - token.decimals;
				if (decimalFactor > 254 || decimalFactor < 0) {
					log.warning(
						"ORACLE::Decimal factor {} Token {} OracleDecimals {} TokenDecimals  {} Extradecimals {}",
						[
							decimalFactor.toString(),
							token.id,
							decimals.toI64().toString(),
							token.decimals.toString(),
							token.extraDecimals.toString(),
						]
					);
					decimalFactor = 0;
				}

				token.lastPriceUSD = BigDecimal.fromString(
					multiplier.toString()
				).div(
					BigInt.fromI32(10)
						.pow(decimalFactor as u8)
						.toBigDecimal()
				);

				token.lastPriceBlockNumber = BigInt.fromString(
					receipt.block.header.height.toString()
				);

				if(token.lastPriceUSD!.gt(BD_ZERO)){
					token.save();
				} else {
					log.warning("ORACLE::Token price is zero {} :: multiplier {} :: decimals {}", [token.id, multiplier.toString(), decimals.toString()]);
				}
			} else {
				log.warning("ORACLE::Incorrect type priceObj {}", [
					priceObj.kind.toString(),
				]);
			}
		} else {
			log.warning("ORACLE::Token unable to parse {}", ["priceObj"]);
		}
	}
}
