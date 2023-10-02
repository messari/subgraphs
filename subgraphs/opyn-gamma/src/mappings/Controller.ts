import { Redeem, VaultSettled } from "../../generated/Controller/Controller";
import { Option } from "../../generated/schema";
import { BIGINT_ZERO } from "../common/constants";
import { getOrCreateAccount } from "../entities/account";
import { markOptionExpired } from "../entities/option";
import { exercisePosition } from "../entities/position";

export function handleRedeem(event: Redeem): void {
  const option = Option.load(event.params.otoken)!;
  if (event.params.payout.gt(BIGINT_ZERO)) {
    const account = getOrCreateAccount(event.params.redeemer);
    exercisePosition(event, account, option);
  }
}

export function handleVaultSettled(event: VaultSettled): void {
  const option = Option.load(event.params.oTokenAddress)!;
  markOptionExpired(event, option);
}
