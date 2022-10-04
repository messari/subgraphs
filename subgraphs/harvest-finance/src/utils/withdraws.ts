import { Bytes, BigInt } from "@graphprotocol/graph-ts";
import { Withdraw } from "../../generated/schema";
import { constants } from "./constants";

export namespace withdraws {
  export function generateId(hash: Bytes, logIndex: BigInt): string {
    return hash.toHexString().concat(logIndex.toString());
  }

  export function findOrInitialize(id: string): Withdraw {
    let withdraw = Withdraw.load(id);

    if (withdraw) return withdraw;

    return initialize(id);
  }

  export function initialize(id: string): Withdraw {
    const withdraw = new Withdraw(id);

    withdraw.hash = "";
    withdraw.logIndex = 0;
    withdraw.protocol = "";
    withdraw.to = "";
    withdraw.from = "";
    withdraw.blockNumber = constants.BIG_INT_ZERO;
    withdraw.timestamp = constants.BIG_INT_ZERO;
    withdraw.asset = "";
    withdraw.amount = constants.BIG_INT_ZERO;
    withdraw.amountUSD = constants.BIG_DECIMAL_ZERO;
    withdraw.vault = "";

    return withdraw;
  }
}
