import { Token, RewardToken } from "../../generated/schema";
import {
  Approval as ApprovalVSP,
  Transfer as TransferVSP,
} from "../../generated/VSP/Erc20Token";
import {
  Approval as ApprovalVUSP,
  Transfer as TransferVUSP,
} from "../../generated/VUSD/Erc20Token";

export function handleApproval(event: ApprovalVSP | ApprovalVUSP) {}

export function handleTransfer(event: TransferVSP | TransferVUSP) {}
