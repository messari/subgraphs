import { log } from "@graphprotocol/graph-ts";
import {
  DelegateChanged,
  DelegateVotesChanged,
  Transfer,
} from "../../../generated/StkTruToken/StkTruToken";
import {
  _handleDelegateChanged,
  _handleDelegateVotesChanged,
  _handleTransfer,
} from "../../../src/tokenHandlers";

// DelegateChanged(indexed address,indexed address,indexed address)
export function handleDelegateChanged(event: DelegateChanged): void {
  _handleDelegateChanged(
    {
      delegator: event.params.delegator,
      fromDelegate: event.params.fromDelegate,
      toDelegate: event.params.toDelegate,
    },
    event
  );
}

// DelegateVotesChanged(indexed address,uint256,uint256)
// Called in succession to the above DelegateChanged event
export function handleDelegateVotesChanged(event: DelegateVotesChanged): void {
  _handleDelegateVotesChanged(
    {
      delegate: event.params.delegate,
      previousBalance: event.params.previousBalance,
      newBalance: event.params.newBalance,
    },
    event
  );
}

// Transfer(indexed address,indexed address,uint256)
export function handleTransfer(event: Transfer): void {
  _handleTransfer(
    {
      from: event.params.from,
      to: event.params.to,
      value: event.params.value,
    },
    event
  );
}
