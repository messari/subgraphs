import { TypedMap } from "@graphprotocol/graph-ts";
import { JSONValue } from "@graphprotocol/graph-ts";
import { near } from "@graphprotocol/graph-ts";

export class EventData {
  eventName: string | null;
  methodName: string;
  data: TypedMap<string, JSONValue>;
  receipt: near.ReceiptWithOutcome;
  logIndex: number;
  args: TypedMap<string, JSONValue> | null;

  constructor(
    eventName: string | null,
    methodName: string,
    data: TypedMap<string, JSONValue>,
    receipt: near.ReceiptWithOutcome,
    logIndex: number,
    args: TypedMap<string, JSONValue> | null
  ) {
    this.eventName = eventName;
    this.methodName = methodName;
    this.data = data;
    this.receipt = receipt;
    this.logIndex = logIndex;
    this.args = args;
  }
}
