import {
	near,
	BigInt,
	log,
	Bytes,
	json,
	JSONValueKind,
	JSONValue,
	TypedMap,
	Result,
} from "@graphprotocol/graph-ts";
// import { getOrCreateAccount, getOrCreateToken } from "./helpers";

import {Event, Method} from "../generated/schema";

import { handleDeposit, handleDepositToReserve, handleWithdraw, handleBorrow, handleRepayment } from './handlers/actions';
import { handleNew } from './handlers/config';
import { handleNewAsset, handleUpdateAsset } from './handlers/market';

import { handleOracleCall } from "./handlers/oracle_calls";
import { handleLiquidate, handleForceClose } from './handlers/liquidate';
import { handleAddAssetFarmReward } from "./handlers/farm";

export function handleReceipt(receipt: near.ReceiptWithOutcome): void {
	const actions = receipt.receipt.actions;
	for (let i = 0; i < actions.length; i++) {
		handleAction(actions[i], receipt);
	}
}

function handleAction(
	action: near.ActionValue,
	receipt: near.ReceiptWithOutcome
): void {
	if (action.kind != near.ActionKind.FUNCTION_CALL) {
		log.info("Early return: {}", ["Not a function call"]);
		return;
	}
	const outcome = receipt.outcome;
	const methodName = action.toFunctionCall().methodName;
	const methodArgs = action.toFunctionCall().args;
	const argsData = json.try_fromBytes(methodArgs);

	if (argsData && argsData.isOk) {
		const argsObject = argsData.value.toObject();
		handleMethod(methodName, methodArgs.toString(), argsObject, receipt);
	} else {
		log.info("Invalid args {} {}", [methodName, methodArgs.toString()]);
	}

	for (let logIndex = 0; logIndex < outcome.logs.length; logIndex++) {
		let outcomeLog = outcome.logs[logIndex].toString().slice("EVENT_JSON:".length);
		const jsonData = json.try_fromString(outcomeLog);
		if(jsonData.isError) {
			log.info("Error parsing ourcomeLog {}", [outcomeLog])
			return
		}
		const jsonObject = jsonData.value.toObject();
		const event = jsonObject.get("event");
		let data = jsonObject.get("data");
		if(!event || !data) return
		const dataArr = data.toArray();
		const dataObj: TypedMap<string, JSONValue> = dataArr[0].toObject();
		let args = argsData.value.toObject()
		handleEvent(event.toString(), dataObj, outcomeLog, receipt, logIndex, methodName, args);
	}
}

function handleEvent(
	event: string,
	data: TypedMap<string, JSONValue>,
	outcomeLog: string,	// only for logging: remove afterwards
	receipt: near.ReceiptWithOutcome,
	logIndex: number,
	method?: string,
	args?: TypedMap<string, JSONValue>
): void {
	// log.info("Event from method {}: {}:: With data: {}", [method ?? "", event, outcomeLog])
    let _event = new Event("EVENT:" + receipt.receipt.id.toBase58());
	_event.name = event
    _event.args = outcomeLog;
	_event.timestamp = BigInt.fromString(receipt.block.header.timestampNanosec.toString())
    _event.save();

	if(event == "deposit"){
		handleDeposit(data, receipt, logIndex, method, args)
	}
	else if(event == 'deposit_to_reserve'){
		handleDepositToReserve(data, receipt, logIndex, method, args)
	}
	else if(event == "withdraw_succeeded"){
		handleWithdraw(data, receipt, logIndex, method, args)
	}
	else if(event == "borrow"){
		handleBorrow(data, receipt, logIndex, method, args)
	}
	else if(event == "repay"){
		handleRepayment(data, receipt, logIndex, method, args)
	}
	else if(event == "liquidate"){
		handleLiquidate(data, receipt, logIndex, method, args)
	} 
	else if(event == "force_close"){
		handleForceClose(data, receipt, logIndex, method, args)
	}
}

function handleMethod(
	method: string,
	args: string, // only for logging: remove afterwards
	data: TypedMap<string, JSONValue>,
	receipt: near.ReceiptWithOutcome
): void {
	// log.info("Method {}: args {}", [method, args])
	let _method = new Method("METHOD:" + receipt.receipt.id.toBase58());
	_method.name = method
    _method.args = args;
	_method.timestamp = BigInt.fromString(receipt.block.header.timestampNanosec.toString())
    _method.save();

	if(method == "new" || method == "update_config") {
		handleNew(method, args, data, receipt)
	} 
	else if(method == "oracle_on_call") {
		handleOracleCall(method, args, data, receipt)
	} 
	else if(method == "add_asset") {
		handleNewAsset(method, args, data, receipt)
	} 
	else if(method == "update_asset") {
		handleUpdateAsset(method, args, data, receipt)
	}
	else if(method == "add_asset_farm_reward") {
		handleAddAssetFarmReward(method, args, data, receipt)
	}
}