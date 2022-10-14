import {
  DelegateChanged,
  DelegatedPowerChanged,
  Transfer,
} from "../../../generated/DydxToken/DydxToken";
import {
  _handleDelegateChanged,
  _handleDelegatedPowerChanged,
  _handleTransfer,
} from "../../../src/tokenHandlers";

// DelegateChanged(indexed address,indexed address,indexed address)
export function handleDelegateChanged(event: DelegateChanged): void {
  _handleDelegateChanged(
    event.params.delegationType,
    event.params.delegator.toHexString(),
    event.params.delegatee.toHexString(),
    event
  );
}

export function handleDelegatedPowerChanged(
  event: DelegatedPowerChanged
): void {
  _handleDelegatedPowerChanged(
    event.params.delegationType,
    event.params.user.toHexString(),
    event.params.amount,
    event,
    false
  );
}

// // Transfer(indexed address,indexed address,uint256)
export function handleTransfer(event: Transfer): void {
  _handleTransfer(
    event.params.from.toHexString(),
    event.params.to.toHexString(),
    event.params.value,
    event
  );
}
