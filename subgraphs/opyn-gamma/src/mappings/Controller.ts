import {
  AccountOperatorUpdated,
  CallExecuted,
  CallRestricted,
  CollateralAssetDeposited,
  CollateralAssetWithdrawed,
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

export function handleAccountOperatorUpdated(
  event: AccountOperatorUpdated
): void {}

export function handleCallExecuted(event: CallExecuted): void {}

export function handleCallRestricted(event: CallRestricted): void {}

export function handleCollateralAssetDeposited(
  event: CollateralAssetDeposited
): void {
  // deposit
}

export function handleCollateralAssetWithdrawed(
  event: CollateralAssetWithdrawed
): void {
  // withdraw
}

export function handleDonated(event: Donated): void {}

export function handleFullPauserUpdated(event: FullPauserUpdated): void {}

export function handleLongOtokenDeposited(event: LongOtokenDeposited): void {}

export function handleLongOtokenWithdrawed(event: LongOtokenWithdrawed): void {}

export function handleNakedCapUpdated(event: NakedCapUpdated): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handlePartialPauserUpdated(event: PartialPauserUpdated): void {}

export function handleRedeem(event: Redeem): void {
  // withdraw
}

export function handleShortOtokenBurned(event: ShortOtokenBurned): void {}

export function handleShortOtokenMinted(event: ShortOtokenMinted): void {}

export function handleSystemFullyPaused(event: SystemFullyPaused): void {}

export function handleSystemPartiallyPaused(
  event: SystemPartiallyPaused
): void {}

export function handleVaultLiquidated(event: VaultLiquidated): void {
  // withdraw
}

export function handleVaultOpened(event: VaultOpened): void {}

export function handleVaultSettled(event: VaultSettled): void {
  // withdraw
}
