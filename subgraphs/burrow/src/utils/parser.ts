import { JSONValue, log, TypedMap } from "@graphprotocol/graph-ts";

export function parse0(data: TypedMap<string, JSONValue>): string[] {
  /* -------------------------------------------------------------------------- */
  /*                                   Account                                  */
  /* -------------------------------------------------------------------------- */
  const account_id = data.get("account_id");
  if (!account_id) {
    log.warning("parse0() :: account_id data not found :: data", []);
    throw new Error();
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Amount                                   */
  /* -------------------------------------------------------------------------- */
  const amount = data.get("amount");
  if (!amount) {
    log.warning("parse0() :: account_id data not found :: data", []);
    throw new Error();
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Token ID                                  */
  /* -------------------------------------------------------------------------- */
  const token_id = data.get("token_id");
  if (!token_id) {
    log.warning("parse0() :: account_id data not found :: data", []);
    throw new Error();
  }

  return [account_id.toString(), amount.toString(), token_id.toString()];
}
