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

export const posDecoderAddress = "0x13e301f8d9563e3d8d48f1d21ae8110b22558cd5";
