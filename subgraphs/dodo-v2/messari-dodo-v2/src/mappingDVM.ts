import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import {
  DODOLpToken_ADDRESS,
  vDODOToken_ADDRESS,
  ZERO_BI,
  ONE_BI,
  ZERO_BD,
  ADDRESS_ZERO
} from "./utils/constants";

import {
  DVMFactory,
  NewDVM,
  OwnershipTransferPrepared,
  OwnershipTransferred,
  RemoveDVM
} from "../generated/DVMFactory/DVMFactory";

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
  DVM,
  BuyShares,
  SellShares,
  DODOSwap,
  DODOFlashLoan,
  Transfer,
  Approval,
  Mint,
  Burn
} from "../generated/templates/DVM/DVM";

import { ERC20, Transfer, Approval } from "../generated/templates/ERC20/ERC20";

import {
  DexAmmProtocol,
  LiquidityPool,
  Token,
  RewardToken
} from "../generated/schema";

export function handleBuyShares(event: BuyShares): void {}

export function handleSellShares(event: SellShares): void {}

export function handleDODOSwap(event: DODOSwap): void {}
