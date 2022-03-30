import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";

import { ERC20, Transfer, Approval } from "../generated/ERC20/ERC20";

import {
  DexAmmProtocol,
  LiquidityPool,
  Token,
  RewardToken
} from "../generated/schema";

export function handleTransfer(event: Transfer): void {}

export function handleApproval(event: Approval): void {}
