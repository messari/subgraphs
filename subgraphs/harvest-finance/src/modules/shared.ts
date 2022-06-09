import { ethereum } from "@graphprotocol/graph-ts";

export namespace shared {
	// TODO add this to toolkit
	export function readValue<T>(callResult: ethereum.CallResult<T>, fallBackValue: T): T {
		return callResult.reverted ? fallBackValue : callResult.value;
	}
}