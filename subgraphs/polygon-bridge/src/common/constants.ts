import { Address, BigInt, TypedMap } from "@graphprotocol/graph-ts";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const PROTOCOL_NAME = "Polygon";
export const PROTOCOL_SLUG = "polygon";

export const crossPoolTokens = new TypedMap<
  string,
  TypedMap<BigInt, Address>
>();
