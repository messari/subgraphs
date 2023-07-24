import {
  PriceUpdated,
  CompoundOracle,
} from "../../../generated/templates/CompoundOracle/CompoundOracle";
import { getCompoundProtocol } from "./fetchers";
import { Address, Bytes, log } from "@graphprotocol/graph-ts";
import { getMarket, getOrInitToken } from "../../utils/initializers";
import { exponentToBigDecimal, MORPHO_COMPOUND_ADDRESS } from "../../constants";

export function handlePriceUpdated(event: PriceUpdated): void {
  const protocol = getCompoundProtocol(MORPHO_COMPOUND_ADDRESS);
  if (!protocol._oracle) {
    log.info("Unknown oracle: {}", [event.address.toHexString()]);
    return;
  }
  const oracleStored = protocol._oracle as Bytes;
  if (!oracleStored.equals(event.address)) {
    log.info("Oracle {} deprecated. Current oracle: {}", [
      event.address.toHexString(),
      oracleStored.toHexString(),
    ]);
    return;
  }
  // Map between the hash of a symbol and its address
  const hashToSymbol = new Map<string, string>();
  hashToSymbol.set(
    "0xa5e92f3efb6826155f1f728e162af9d7cda33a574a1153b58f03ea01cc37e568",
    "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643"
  );
  hashToSymbol.set(
    "0xb6dbcaeee318e11fe1e87d4af04bdd7b4d6a3f13307225dc7ee72f7c085ab454",
    "0x70e36f6bf80a52b3b46b3af8e106cc0ed743e8e4"
  );
  hashToSymbol.set(
    "0xaaaebeba3810b1e6b70781f14b2d72c1cb89c0b2b320c43bb67ff79f562f5ff4",
    "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5"
  );
  hashToSymbol.set(
    "0x58c46f3a00a69ae5a5ce163895c14f8f5b7791333af9fe6e7a73618cb5460913",
    "0x7713dd9ca933848f6819f38b8352d9a15ea73f67"
  );
  hashToSymbol.set(
    "0xfba01d52a7cd84480d0573725899486a0b5e55c20ff45d6628874349375d1650",
    "0x35a18000230da775cac24873d00ff85bccded550"
  );
  hashToSymbol.set(
    "0xd6aca1be9729c13d677335161321649cccae6a591554772516700f986f942eaa",
    "0x39aa39c021dfbae8fac545936693ac917d5e7563"
  );
  hashToSymbol.set(
    "0x8b1a1d9c2b109e527c9134b25b1a1833b16b6594f92daa9f6d9b7a6024bce9d0",
    "0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9"
  );
  hashToSymbol.set(
    "0xe98e2830be1a7e4156d656a7505e65d08c67660dc618072422e9c78053c261e9",
    "0xccf4429db6322d5c611ee964527d42e5d685dd6a"
  );
  const symbolHash = event.params.symbolHash.toHexString();
  if (!hashToSymbol.has(symbolHash)) return;
  const marketAddress = Address.fromString(hashToSymbol.get(symbolHash));
  const market = getMarket(marketAddress);
  const inputToken = getOrInitToken(market.inputToken);
  const oracle = CompoundOracle.bind(event.address);
  const price = oracle
    .getUnderlyingPrice(marketAddress)
    .toBigDecimal()
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    .div(exponentToBigDecimal(36 - inputToken.decimals));
  market.inputTokenPriceUSD = price;
  market.save();
  inputToken.lastPriceUSD = price;
  inputToken.save();
}
