import { ethereum } from "@graphprotocol/graph-ts";

import { handleUpdatePoolWeightImpl } from "../../common/handlers/handelCreatePool";

export function handleUpdatePoolWeight(event: ethereum.Event): void {
  handleUpdatePoolWeightImpl(event);
}
