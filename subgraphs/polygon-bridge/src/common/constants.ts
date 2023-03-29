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

export const posDecoderAddress = "0x13E301F8d9563e3D8d48F1d21aE8110B22558cd5";
