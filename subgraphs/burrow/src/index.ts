import { near, log, json, JSONValue, TypedMap } from "@graphprotocol/graph-ts";

import {
  handleDeposit,
  handleDepositToReserve,
  handleWithdraw,
  handleBorrow,
  handleRepayment,
} from "./handlers/actions";
import { handleNew } from "./handlers/config";
import { handleNewAsset, handleUpdateAsset } from "./handlers/market";
import { handleOracleCall } from "./handlers/oracle";
import { handleLiquidate, handleForceClose } from "./handlers/liquidate";
import { EventData } from "./utils/type";

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
  if (argsData.isError) {
    log.warning("[handleAction] Error parsing args {}", [methodName]);
    return;
  }

  const argsObject = argsData.value.toObject();
  const eventData = new EventData(
    null,
    methodName,
    argsObject,
    receipt,
    0,
    null
  );
  handleMethod(eventData);

  for (let logIndex = 0; logIndex < outcome.logs.length; logIndex++) {
    const outcomeLog = outcome.logs[logIndex]
      .toString()
      .slice("EVENT_JSON:".length);
    const jsonData = json.try_fromString(outcomeLog);
    if (jsonData.isError) {
      log.warning("Error parsing outcomeLog {}", [outcomeLog]);
      return;
    }
    const jsonObject = jsonData.value.toObject();
    const event = jsonObject.get("event");
    const data = jsonObject.get("data");
    if (!event || !data) return;
    const dataArr = data.toArray();
    const dataObj: TypedMap<string, JSONValue> = dataArr[0].toObject();
    const args = argsData.value.toObject();
    const eventData = new EventData(
      event.toString(),
      methodName,
      dataObj,
      receipt,
      logIndex,
      args
    );
    handleEvent(eventData);
  }
}

function handleEvent(event: EventData): void {
  if (event.eventName == "deposit") {
    handleDeposit(event);
  } else if (event.eventName == "deposit_to_reserve") {
    handleDepositToReserve(event);
  } else if (event.eventName == "withdraw_succeeded") {
    handleWithdraw(event);
  } else if (event.eventName == "borrow") {
    handleBorrow(event);
  } else if (event.eventName == "repay") {
    handleRepayment(event);
  } else if (event.eventName == "liquidate") {
    handleLiquidate(event);
  } else if (event.eventName == "force_close") {
    handleForceClose(event);
  }
}

function handleMethod(method: EventData): void {
  if (method.methodName == "new" || method.methodName == "update_config") {
    handleNew(method);
  } else if (method.methodName == "oracle_on_call") {
    handleOracleCall(method);
  } else if (method.methodName == "add_asset") {
    handleNewAsset(method);
  } else if (method.methodName == "update_asset") {
    handleUpdateAsset(method);
  }
}
