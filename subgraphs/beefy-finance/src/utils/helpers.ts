import { Address } from "@graphprotocol/graph-ts";

export function getAddressFromId(id: string): Address {
  const address = Address.fromHexString(id.split("-")[0]);
  return changetype<Address>(address.slice(0, 20));
}
