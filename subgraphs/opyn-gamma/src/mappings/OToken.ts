import { Option } from "../../generated/schema";
import { Transfer as TransferEvent } from "../../generated/templates/OToken/ERC20";
import { BIGINT_ZERO, ZERO_ADDRESS } from "../common/constants";
import {
  getOrCreateAccount,
  incrementAccountMintedCount,
} from "../entities/account";
import { burnOption, mintOption } from "../entities/option";
import { updatePosition } from "../entities/position";

export function handleTransfer(event: TransferEvent): void {
  const option = Option.load(event.address)!;
  const amount = event.params.value;
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    // mint
    mintOption(event, option, amount);
    const account = getOrCreateAccount(event.params.to);
    incrementAccountMintedCount(event, account, option);
    return;
  }
  const from = getOrCreateAccount(event.params.from);
  updatePosition(event, from, option, BIGINT_ZERO.minus(amount));
  if (event.params.to.toHexString() == ZERO_ADDRESS) {
    // burn
    burnOption(event, option, amount);
  } else {
    const to = getOrCreateAccount(event.params.to);
    updatePosition(event, to, option, amount);
  }
}
