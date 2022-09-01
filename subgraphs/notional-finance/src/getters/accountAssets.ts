import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Notional } from "../../generated/Notional/Notional";
import { Account, Asset } from "../../generated/schema";
import { BIGINT_ZERO, PROTOCOL_ID } from "../common/constants";

export function getOrCreateAsset(
  accountId: string,
  currencyId: string,
  maturity: BigInt
): Asset {
  let id = accountId + "-" + currencyId + "-" + maturity.toString();
  let entity = Asset.load(id);

  if (entity == null) {
    entity = new Asset(id);
    entity.currency = currencyId;
    entity.maturity = maturity;
    entity.notional = BigInt.fromI32(0);
    entity.settlementDate = maturity;
  }

  return entity as Asset;
}

export function updateAccountAssets(
  account: Account,
  portfolio: ethereum.Tuple[],
  event: ethereum.Event
): void {
  for (let i: i32 = 0; i < portfolio.length; i++) {
    let genericAsset = portfolio[i];
    // This casting is required to get around type errors in AssemblyScript
    let currencyId = genericAsset[0].toBigInt().toI32();
    let maturity = genericAsset[1].toBigInt();
    let notional = genericAsset[3].toBigInt();

    let asset = getOrCreateAsset(account.id, currencyId.toString(), maturity);

    if (asset.notional.notEqual(notional)) {
      asset.notional = notional;
      asset.lastUpdateBlockNumber = event.block.number.toI32();
      asset.lastUpdateTimestamp = event.block.timestamp.toI32();
      asset.lastUpdateBlockHash = event.block.hash;
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
  let asset = getOrCreateAsset(accountId, currencyId, maturity);

  asset.notional = BIGINT_ZERO;
  asset.lastUpdateBlockNumber = event.block.number.toI32();
  asset.lastUpdateTimestamp = event.block.timestamp.toI32();
  asset.lastUpdateBlockHash = event.block.hash;
  asset.lastUpdateTransactionHash = event.transaction.hash;

  log.debug("Updated asset entity when empty portfolio was returned {}", [
    asset.id,
  ]);
  asset.save();
}
