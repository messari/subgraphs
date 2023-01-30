import { TypedMap } from "@graphprotocol/graph-ts";
import { JSONValue } from "@graphprotocol/graph-ts";
import { near } from "@graphprotocol/graph-ts";

export class EventData {
  constructor(
    public readonly eventName: string | null,
    public readonly methodName: string,
    public readonly data: TypedMap<string, JSONValue>,
    public readonly receipt: near.ReceiptWithOutcome,
    public readonly logIndex: number,
    public readonly args: TypedMap<string, JSONValue> | null
  ) {}
}
