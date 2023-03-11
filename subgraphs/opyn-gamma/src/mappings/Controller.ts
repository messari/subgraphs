import { Address } from "@graphprotocol/graph-ts";
import {
  AccountOperatorUpdated,
  CallExecuted,
  CallRestricted,
  CollateralAssetDeposited,
  CollateralAssetWithdrawed,
  Controller,
  Donated,
  FullPauserUpdated,
  LongOtokenDeposited,
  LongOtokenWithdrawed,
  NakedCapUpdated,
  OwnershipTransferred,
  PartialPauserUpdated,
  Redeem,
  ShortOtokenBurned,
  ShortOtokenMinted,
  SystemFullyPaused,
  SystemPartiallyPaused,
  VaultLiquidated,
  VaultOpened,
  VaultSettled,
} from "../../generated/Controller/Controller";
import { Option } from "../../generated/schema";
import { BIGINT_ZERO } from "../common/constants";
import { getOrCreateAccount } from "../entities/account";
import { createDeposit, createWithdraw } from "../entities/event";
import { markOptionExpired } from "../entities/option";
import { exercisePosition } from "../entities/position";

export function handleAccountOperatorUpdated(
  event: AccountOperatorUpdated
): void {}

export function handleCallExecuted(event: CallExecuted): void {}

export function handleCallRestricted(event: CallRestricted): void {}

export function handleCollateralAssetDeposited(
  event: CollateralAssetDeposited
): void {
  createDeposit(
    event,
    event.params.asset,
    event.params.amount,
    event.params.from,
    event.params.accountOwner
  );
}

export function handleCollateralAssetWithdrawed(
  event: CollateralAssetWithdrawed
): void {
  createWithdraw(
    event,
    event.params.asset,
    event.params.amount,
    event.params.to,
    event.params.AccountOwner
  );
}

export function handleDonated(event: Donated): void {}

export function handleFullPauserUpdated(event: FullPauserUpdated): void {}

export function handleLongOtokenDeposited(event: LongOtokenDeposited): void {}

export function handleLongOtokenWithdrawed(event: LongOtokenWithdrawed): void {}

export function handleNakedCapUpdated(event: NakedCapUpdated): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handlePartialPauserUpdated(event: PartialPauserUpdated): void {}

export function handleRedeem(event: Redeem): void {
  const option = Option.load(event.params.otoken)!;
  markOptionExpired(event, option);
  if (event.params.payout.gt(BIGINT_ZERO)) {
    createWithdraw(
      event,
      event.params.collateralAsset,
      event.params.payout,
      event.params.receiver,
      event.params.redeemer
    );
    const account = getOrCreateAccount(event.params.redeemer);
    exercisePosition(event, account, option);
  }
}

export function handleShortOtokenBurned(event: ShortOtokenBurned): void {}

export function handleShortOtokenMinted(event: ShortOtokenMinted): void {}

export function handleSystemFullyPaused(event: SystemFullyPaused): void {}

export function handleSystemPartiallyPaused(
  event: SystemPartiallyPaused
): void {}

export function handleVaultLiquidated(event: VaultLiquidated): void {
  const controller = Controller.bind(event.address);
  const vault = controller.getVault(
    event.params.vaultOwner,
    event.params.vaultId
  );
  createWithdraw(
    event,
    vault.collateralAssets[0],
    event.params.collateralPayout,
    event.params.receiver,
    event.params.liquidator
  );
}

export function handleVaultOpened(event: VaultOpened): void {}

export function handleVaultSettled(event: VaultSettled): void {
  const option = Option.load(event.params.oTokenAddress)!;
  markOptionExpired(event, option);
  createWithdraw(
    event,
    Address.fromBytes(option.collateralAsset),
    event.params.payout,
    event.params.to,
    event.params.accountOwner
  );
}
