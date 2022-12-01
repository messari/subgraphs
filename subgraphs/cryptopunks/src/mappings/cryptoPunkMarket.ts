import {
  PunkBidEntered,
  PunkBought,
} from "../../generated/cryptopunkContract/cryptopunkContract";
import { createBid } from "../constants/initializers";
import { updateTrades } from "../modules/Trades";

export function handlePunkBidEntered(event: PunkBidEntered): void {
  const tokenId = event.params.punkIndex;
  const bidAmount = event.params.value;
  const bidderAddress = event.params.fromAddress;

  createBid(tokenId, bidAmount, bidderAddress, event.block);
}

export function handlePunkBought(event: PunkBought): void {
  updateTrades(
    event.params.value,
    event.params.punkIndex,
    event.params.toAddress,
    event.params.fromAddress,
    event.transaction,
    event.block
  );
}
