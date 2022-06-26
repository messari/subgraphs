import { Address } from "@graphprotocol/graph-ts";

export function getAddressFromId(id: string): Address {
  return Address.fromHexString(id).subarray(-20) as Address;
}
