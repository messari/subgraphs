import {
  Approval as DelegateApprovalEvent,
  WithdrawApproval as DelegateWithdrawApprovalEvent,
} from "../../generated/delegation_DelegateApprovals_0/DelegateApprovals";

import { DelegatedWallet } from "../../generated/schema";

import { Address, Bytes, log } from "@graphprotocol/graph-ts";

function setDelegateApproval(
  authoriser: Address,
  delegate: Address,
  action: Bytes,
  isApproval: boolean
): void {
  const id = authoriser.toHex() + "-" + delegate.toHex();
  let delegatedWalletEntity = DelegatedWallet.load(id);
  const actionRight = isApproval ? true : false;
  if (delegatedWalletEntity == null) {
    if (!isApproval) {
      return;
    }
    delegatedWalletEntity = new DelegatedWallet(id);
    delegatedWalletEntity.authoriser = authoriser;
    delegatedWalletEntity.delegate = delegate;
  }
  const actionAsString = action.toString();
  if (actionAsString == "ApproveAll") {
    delegatedWalletEntity.canMint = actionRight;
    delegatedWalletEntity.canBurn = actionRight;
    delegatedWalletEntity.canClaim = actionRight;
    delegatedWalletEntity.canExchange = actionRight;
  } else if (actionAsString == "IssueForAddress") {
    delegatedWalletEntity.canMint = actionRight;
  } else if (actionAsString == "BurnForAddress") {
    delegatedWalletEntity.canBurn = actionRight;
  } else if (actionAsString == "ClaimForAddress") {
    delegatedWalletEntity.canClaim = actionRight;
  } else if (actionAsString == "ExchangeForAddress") {
    delegatedWalletEntity.canExchange = actionRight;
  } else {
    log.error(
      'Unknown action "' + actionAsString + '" no entry will be saved.',
      []
    );
    return;
  }

  delegatedWalletEntity.save();
}

export function handleDelegateApproval(event: DelegateApprovalEvent): void {
  const authoriser = event.params.authoriser;
  const delegate = event.params.delegate;
  const action = event.params.action;
  setDelegateApproval(authoriser, delegate, action, true);
}

export function handleDelegateWithdrawApproval(
  event: DelegateWithdrawApprovalEvent
): void {
  const authoriser = event.params.authoriser;
  const delegate = event.params.delegate;
  const action = event.params.action;
  setDelegateApproval(authoriser, delegate, action, false);
}
