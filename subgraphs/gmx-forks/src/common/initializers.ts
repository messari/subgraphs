import { ProtocolConfig } from "../sdk/protocols/config";
import { SDK } from "../sdk/protocols/perpfutures";
import { CustomEventType } from "../sdk/util/events";
import * as constants from "../common/constants";
import { Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { TokenInitialize, TokenPrice } from "../modules/token";
import { Versions } from "../versions";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { Account } from "../sdk/protocols/perpfutures/account";

export function initializeSDK(event: ethereum.Event): SDK {
  const protocolConfig = new ProtocolConfig(
    constants.PROTOCOL_ID,
    constants.PROTOCOL_NAME,
    constants.PROTOCOL_SLUG,
    Versions
  );
  const tokenPricer = new TokenPrice();
  const tokenInitializer = new TokenInitialize();
  const customEvent = CustomEventType.initialize(
    event.block,
    event.transaction,
    event.logIndex,
    event
  );
  // const sdk = new SDK(
  //   protocolConfig,
  //   tokenPricer,
  //   tokenInitializer,
  //   customEvent
  // );
  const sdk = SDK.initializeFromEvent(
    protocolConfig,
    tokenPricer,
    tokenInitializer,
    event
  );

  return sdk;
}

export function getOrCreatePool(event: ethereum.Event, sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(
    Bytes.fromHexString(constants.VAULT_ADDRESS.toHexString())
  );
  if (!pool.isInitialized) {
    const outputToken = sdk.Tokens.getOrCreateToken(constants.MLP_ADDRESS);
    pool.initialize(
      constants.POOL_NAME,
      constants.POOL_SYMBOL,
      [],
      outputToken
    );
  }
  return pool;
}

export function getOrCreateAccount(
  accountAddress: Address,
  pool: Pool,
  sdk: SDK
): Account {
  const loadAccountResponse = sdk.Accounts.loadAccount(accountAddress);
  const account = loadAccountResponse.account;
  if (loadAccountResponse.isNewUser) {
    const protocol = sdk.Protocol;
    protocol.addUser();
    pool.addUser();
  }
  return account;
}
