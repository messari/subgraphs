import {
  msgJoinPoolHandler,
  msgJoinSwapExternAmountInHandler,
  msgJoinSwapShareAmountOutHandler,
} from "../modules/Deposit";
import {
  msgExitPoolHandler,
  msgExitSwapExternAmountOutHandler,
  msgExitSwapShareAmountInHandler,
} from "../modules/Withdraw";
import { msgSwapExactAmountHandler } from "../modules/Swap";
import { msgCreatePoolHandler } from "../common/initializer";
import * as constants from "../common/constants";
import { log, cosmos } from "@graphprotocol/graph-ts";

export function handleTx(data: cosmos.TransactionData): void {
  const messages = data.tx.tx.body.messages;

  for (let i = 0; i < messages.length; i++) {
    const msgType = messages[i].typeUrl;
    const msgValue = messages[i].value as Uint8Array;

    if (
      msgType == constants.Messages.MsgCreatePool ||
      msgType == constants.Messages.MsgCreateBalancerPool
    ) {
      if (msgType == constants.Messages.MsgCreatePool) {
        log.warning("new create pool MsgCreatePool", []);
      } else if (msgType == constants.Messages.MsgCreateBalancerPool) {
        log.warning("new create pool MsgCreateBalancerPool", []);
      }
      msgCreatePoolHandler(msgValue, data);
    } else if (
      msgType == constants.Messages.MsgSwapExactAmountIn ||
      msgType == constants.Messages.MsgSwapExactAmountOut
    ) {
      msgSwapExactAmountHandler(msgValue, data);
    } else if (msgType == constants.Messages.MsgJoinPool) {
      msgJoinPoolHandler(msgValue, data);
    } else if (msgType == constants.Messages.MsgJoinSwapExternAmountIn) {
      msgJoinSwapExternAmountInHandler(msgValue, data);
    } else if (msgType == constants.Messages.MsgJoinSwapShareAmountOut) {
      msgJoinSwapShareAmountOutHandler(msgValue, data);
    } else if (msgType == constants.Messages.MsgExitPool) {
      msgExitPoolHandler(msgValue, data);
    } else if (msgType == constants.Messages.MsgExitSwapExternAmountOut) {
      msgExitSwapExternAmountOutHandler(msgValue, data);
    } else if (msgType == constants.Messages.MsgExitSwapShareAmountIn) {
      msgExitSwapShareAmountInHandler(msgValue, data);
    }
  }
}
