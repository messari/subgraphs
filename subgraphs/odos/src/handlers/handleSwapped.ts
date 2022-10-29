import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Swapped } from "../../generated/OdosRouter/OdosRouter";
import { Token } from "../../generated/schema";
import { getOrCreateMultiToken, getOrCreateProtocol } from "../common/getters";
import { createSwap } from "../common/helpers";
import {
  updateFinancialsVolume,
  updateMultiTokenVolume,
  updateProtocolVolume,
  updateTokenVolume,
  updateUsageMetrics,
} from "../common/updateMetrics";
import {
  getTokenIds,
  getTokensFromTokensIn,
  getTokensFromTokensOut,
  getTotalVolumeUSD,
  getUSDValues,
} from "../common/utils";

export function handleSwapped(event: Swapped): void {
  // Protocol entity
  let protocol = getOrCreateProtocol();

  // Get sorted by ID input token entities.
  const tokensIn = getTokensFromTokensIn(event, event.params.tokensIn);
  const tokensOut = getTokensFromTokensOut(event, event.params.outputs);

  // Create token collections for input and output tokens.
  const tokensInCollection = new TokenCollection(
    getTokenIds(tokensIn),
    tokensIn,
    event.params.amountsIn,
    getUSDValues(tokensIn, event.params.amountsIn)
  );
  const tokensOutCollection = new TokenCollection(
    getTokenIds(tokensOut),
    tokensOut,
    event.params.amountsOut,
    getUSDValues(tokensOut, event.params.amountsOut)
  );

  // Sort Collection by token ID.
  tokensInCollection.sortTokens();
  tokensOutCollection.sortTokens();

  // Get Token entities from Addresses
  const multiToken = getOrCreateMultiToken(
    event,
    tokensInCollection.tokens,
    tokensOutCollection.tokens
  );

  // Get USD value of the swap
  const amountUSD = getTotalVolumeUSD(
    tokensInCollection.amountsUSD,
    tokensOutCollection.amountsUSD
  );

  createSwap(
    event,
    protocol,
    event.params.sender,
    tokensInCollection,
    tokensOutCollection,
    multiToken,
    amountUSD,
    event.params.valueOutQuote
  );
  protocol = updateProtocolVolume(protocol, amountUSD);
  updateFinancialsVolume(event, protocol, amountUSD);
  updateTokenVolume(event, tokensInCollection);
  updateMultiTokenVolume(
    event,
    multiToken,
    tokensInCollection,
    tokensOutCollection,
    amountUSD
  );
  updateUsageMetrics(event, event.params.sender);
}

export class TokenCollection {
  ids: string[];
  tokens: Token[];
  amounts: BigInt[];
  amountsUSD: BigDecimal[];

  constructor(
    ids: string[],
    tokens: Token[],
    amounts: BigInt[],
    amountsUSD: BigDecimal[]
  ) {
    this.ids = ids;
    this.tokens = tokens;
    this.amounts = amounts;
    this.amountsUSD = amountsUSD;
  }

  public sortTokens(): void {
    // Sort tokens by ID
    for (let i = 0; i < this.ids.length; i++) {
      for (let j = i + 1; j < this.ids.length; j++) {
        if (this.ids[i] > this.ids[j]) {
          let idTemp = this.ids[i];
          this.ids[i] = this.ids[j];
          this.ids[j] = idTemp;

          let tokensTemp = this.tokens[i];
          this.tokens[i] = this.tokens[j];
          this.tokens[j] = tokensTemp;

          let amountsTemp = this.amounts[i];
          this.amounts[i] = this.amounts[j];
          this.amounts[j] = amountsTemp;

          let amountsUSDTemp = this.amountsUSD[i];
          this.amountsUSD[i] = this.amountsUSD[j];
          this.amountsUSD[j] = amountsUSDTemp;
        }
      }
    }
  }
}
