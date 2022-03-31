import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";

import {
  DODOLpToken,
  Approval,
  Burn,
  Mint,
  OwnershipTransferPrepared,
  OwnershipTransferred,
  Transfer
} from "../generated/DODOLpToken/DODOLpToken";

import {
  DexAmmProtocol,
  LiquidityPool,
  Token,
  RewardToken
} from "../generated/schema";

export function handleApproval(event: Approval): void {}

export function handleBurn(event: Burn): void {}

export function handleMint(event: Mint): void {}

export function handleTransfer(event: Transfer): void {}
