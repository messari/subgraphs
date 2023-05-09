import { VaultSettled } from "../../generated/Controller_V1/Controller_V1";
import { Option } from "../../generated/schema";
import { markOptionExpired } from "../entities/option";

export function handleVaultSettled(event: VaultSettled): void {
  const option = Option.load(event.params.oTokenAddress)!;
  markOptionExpired(event, option);
}
