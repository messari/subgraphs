import { Created } from "../../../generated/DSProxyFactory/DSProxyFactory";
import { updateUsageMetrics } from "../../common/metrics";
import { _Proxy } from "../../../generated/schema";
import { LogNote } from "../../../generated/CdpManager/CdpManager";
import { getProxy } from "../../common/getters";
import { Address, log } from "@graphprotocol/graph-ts";

export function handleCreated(event: Created): void {
  // Register new user proxy
  let proxy = new _Proxy(event.params.proxy.toHexString());
  proxy.owner = event.params.owner.toHexString();
  proxy.save();
  updateUsageMetrics(event, event.params.owner);
}

export function handleGive(event: LogNote): void {
  let sender = event.transaction.from;
  let proxy = getProxy(event.params.usr);
  proxy.owner = Address.fromString(event.params.arg2.toHexString().substring(26)).toHexString();
  proxy.save();
  updateUsageMetrics(event, sender);
}

export function handleFrob(event: LogNote): void {
  log.debug("frobTx = {}", [event.transaction.hash.toHexString()]);
  let cdpAddress = event.params.usr;
  let proxy = getProxy(cdpAddress);
  updateUsageMetrics(event, Address.fromString(proxy.owner));
}
