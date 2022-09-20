import {
  PunkOffered,
  PunkBidEntered,
  PunkBought,
} from "../../generated/cryptopunkContract/cryptopunkContract";
import { _User } from "../../generated/schema";
import { getSellerAddressFromPunksOfferedForSale } from "../constants/utils";
import { createBid } from "../constants/initializers";
import { updateTrades } from "../modules/Trades";
import * as constants from "../constants/constants";
import { createUserCollectionAccount } from "../constants/initializers";


export function handlePunkBidEntered(event: PunkBidEntered): void {
  let tokenId = event.params.punkIndex;
  let bidAmount = event.params.value;
  let bidderAddress = event.params.fromAddress;
 
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
