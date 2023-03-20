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
import { Option } from "../../generated/schema";
import { BIGINT_ZERO } from "../common/constants";
import { getOrCreateAccount } from "../entities/account";
import { exercisePosition } from "../entities/position";

export function handleAccountOperatorUpdated(
  event: AccountOperatorUpdated
): void {}

export function handleCallExecuted(event: CallExecuted): void {}

export function handleCallRestricted(event: CallRestricted): void {}

export function handleCollateralAssetDeposited(
  event: CollateralAssetDeposited
): void {}

export function handleCollateralAssetWithdrawed(
  event: CollateralAssetWithdrawed
): void {}

export function handleDonated(event: Donated): void {}

export function handleFullPauserUpdated(event: FullPauserUpdated): void {}

export function handleLongOtokenDeposited(event: LongOtokenDeposited): void {}

export function handleLongOtokenWithdrawed(event: LongOtokenWithdrawed): void {}

export function handleNakedCapUpdated(event: NakedCapUpdated): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handlePartialPauserUpdated(event: PartialPauserUpdated): void {}

export function handleRedeem(event: Redeem): void {
  const option = Option.load(event.params.otoken)!;
  if (event.params.payout.gt(BIGINT_ZERO)) {
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

export function handleVaultLiquidated(event: VaultLiquidated): void {}

export function handleVaultOpened(event: VaultOpened): void {}

export function handleVaultSettled(event: VaultSettled): void {}
