import { Address, Bytes } from "@graphprotocol/graph-ts";
import { OToken, Position } from "../../generated/schema";
import { Transfer as TransferEvent } from "../../generated/templates/OToken/ERC20";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ZERO_ADDRESS,
} from "../common/constants";
import { getOrCreateToken } from "../common/tokens";
import {
  getOrCreateAccount,
  incrementAccountPositionCount,
} from "../entities/account";
import { getOrCreatePool } from "../entities/pool";
import { getUnderlyingPrice } from "../price";

export function handleTransfer(event: TransferEvent): void {
  if (
    event.params.from.toHexString() == ZERO_ADDRESS ||
    event.params.to.toHexString() == ZERO_ADDRESS
  ) {
    return;
  }

  const oToken = OToken.load(event.address)!;
  const underlying = getOrCreateToken(
    Address.fromBytes(oToken.underlyingAsset)
  );
  const collateral = getOrCreateToken(
    Address.fromBytes(oToken.collateralAsset)
  );

  const account = getOrCreateAccount(event.params.to);
  incrementAccountPositionCount(account);
  const position = new Position(
    Bytes.fromUTF8(
      `${account.id}-${oToken.id}-${oToken.type}-${account.openPositionCount}`
    )
  );

  position.pool = getOrCreatePool(collateral).id;
  position.type = oToken.type;
  position.account = account.id;
  position.asset = underlying.id;
  position.expirationBlockNumber = BIGINT_ZERO; // unknown
  position.expirationTimestamp = oToken.expirationTimestamp;
  position.takenHash = event.transaction.hash;
  position.takenBlockNumber = event.block.number;
  position.takenTimestamp = event.block.timestamp;

  position.strikePrice = oToken.strikePrice;
  position.takenPrice = getUnderlyingPrice(oToken);

  position.premium = BIGINT_ZERO;
  position.premiumUSD = BIGDECIMAL_ZERO;
  position.exercisedBlockNumber = null;
  position.exercisedTimestamp = null;
  position.closedBlockNumber = null;
  position.closedTimestamp = null;
  position.exercisedPriceUSD = null;
  position.closePremium = null;
  position.closePremiumUSD = null;

  position.save();
}
