import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Account, Asset } from "../../generated/schema";
import { BIGINT_ZERO } from "../common/constants";

export function getOrCreateAsset(
  accountId: string,
  currencyId: string,
  maturity: BigInt
): Asset {
  const id = accountId + "-" + currencyId + "-" + maturity.toString();
  let asset = Asset.load(id);

  if (asset == null) {
    asset = new Asset(id);
    asset.currency = currencyId;
    asset.maturity = maturity;
    asset.notional = BIGINT_ZERO;
    asset.settlementDate = maturity;
  }

  return asset;
}

export function updateAccountAssets(
  account: Account,
  portfolio: ethereum.Tuple[],
  event: ethereum.Event
): void {
  for (let i: i32 = 0; i < portfolio.length; i++) {
    const genericAsset = portfolio[i];
    // This casting is required to get around type errors in AssemblyScript
    const currencyId = genericAsset[0].toBigInt().toI32();
    const maturity = genericAsset[1].toBigInt();
    const notional = genericAsset[3].toBigInt();

    const asset = getOrCreateAsset(account.id, currencyId.toString(), maturity);

    if (asset.notional.notEqual(notional)) {
      asset.notional = notional;
      asset.lastUpdateBlockNumber = event.block.number;
      asset.lastUpdateTimestamp = event.block.timestamp;
      asset.lastUpdateTransactionHash = event.transaction.hash;

      log.debug("Updated asset entity {}", [asset.id]);
      asset.save();
    }
  }
}

export function updateAccountAssetOnEmptyPortfolio(
  accountId: string,
  currencyId: string,
  maturity: BigInt,
  event: ethereum.Event
): void {
  const asset = getOrCreateAsset(accountId, currencyId, maturity);

  asset.notional = BIGINT_ZERO;
  asset.lastUpdateBlockNumber = event.block.number;
  asset.lastUpdateTimestamp = event.block.timestamp;
  asset.lastUpdateTransactionHash = event.transaction.hash;

  log.debug("Updated asset entity when empty portfolio was returned {}", [
    asset.id,
  ]);
  asset.save();
}
