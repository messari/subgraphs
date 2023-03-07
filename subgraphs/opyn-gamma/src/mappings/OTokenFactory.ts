import { OtokenCreated as OtokenCreatedEvent } from "../../generated/OTokenFactory/OTokenFactory";
import { OToken } from "../../generated/schema";
import { OToken as OTokenTemplate } from "../../generated/templates";
import { OptionType } from "../common/constants";
import { getOrCreateToken } from "../common/tokens";
import { bigIntToBigDecimal } from "../common/utils/numbers";

export function handleOtokenCreated(event: OtokenCreatedEvent): void {
  const token = new OToken(event.params.tokenAddress);
  token.underlyingAsset = getOrCreateToken(event.params.underlying).id;
  token.collateralAsset = getOrCreateToken(event.params.collateral).id;

  const strikeToken = getOrCreateToken(event.params.strike);
  token.strikeAsset = strikeToken.id;
  token.strikePrice = bigIntToBigDecimal(event.params.strikePrice);

  token.type = event.params.isPut ? OptionType.PUT : OptionType.CALL;
  token.expirationTimestamp = event.params.expiry;
  token.creator = event.params.creator;
  token.createdTimestamp = event.block.timestamp;
  token.save();

  OTokenTemplate.create(event.params.tokenAddress);
}
