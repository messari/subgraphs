import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";

import {
  vDODOToken,
  Approval,
  ChangePerReward,
  DonateDODO,
  MintVDODO,
  PreDeposit,
  OwnershipTransferPrepared,
  OwnershipTransferred,
  RedeemVDODO,
  SetCantransfer,
  Transfer,
  UpdateDODOFeeBurnRatio
} from "../generated/vDODOToken/vDODOToken";

import {
  DexAmmProtocol,
  LiquidityPool,
  Token,
  RewardToken
} from "../generated/schema";

export function handleApproval(event: Approval): void {}

export function handleChangePerReward(event: ChangePerReward): void {}

export function handleDonateDODO(event: DonateDODO): void {}

export function handleMintVDODO(event: MintVDODO): void {}

export function handlePreDeposit(event: PreDeposit): void {}

export function handleRedeemVDODO(event: RedeemVDODO): void {}

export function handleSetCantransfer(event: SetCantransfer): void {}

export function handleTransfer(event: Transfer): void {}

export function handleUpdateDODOFeeBurnRatios(
  event: UpdateDODOFeeBurnRatio
): void {}
