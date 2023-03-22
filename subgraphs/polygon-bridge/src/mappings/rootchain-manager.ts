import { Address, BigInt } from "@graphprotocol/graph-ts";
import { TokenMapped } from "../../generated/RootChainManager/RootChainManager";
import { SDK } from "../sdk/protocols/bridge";
import {
  BridgePoolType,
  CrosschainTokenType,
} from "../sdk/protocols/bridge/enums";
import { conf, Pricer, TokenInit } from "./fx-erc20";

export function handlePOSTokenMapped(event: TokenMapped): void {
  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);
  const crosschainID = BigInt.fromI32(137);

  const pool = sdk.Pools.loadPool<string>(event.params.rootToken);
  const rootToken = sdk.Tokens.getOrCreateToken(event.params.rootToken);
  const childToken = sdk.Tokens.getOrCreateToken(event.params.childToken);

  if (!pool.isInitialized) {
    pool.initialize(
      rootToken.name,
      rootToken.symbol,
      BridgePoolType.LOCK_RELEASE,
      rootToken
    );
  }

  const crosschainTokenAddr = event.params.childToken;

  const crosschainToken = sdk.Tokens.getOrCreateCrosschainToken(
    crosschainID,
    crosschainTokenAddr,
    CrosschainTokenType.WRAPPED,
    Address.fromBytes(rootToken.id)
  );

  pool.addDestinationToken(crosschainToken);
}
