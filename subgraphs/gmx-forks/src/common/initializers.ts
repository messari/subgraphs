import { ProtocolConfig } from "../sdk/protocols/config";
import { SDK } from "../sdk/protocols/perpfutures";
import { CustomEventType } from "../sdk/util/events";
import * as constants from "../common/constants";
import { Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { TokenInitialize, TokenPrice } from "../modules/token";
import { Versions } from "../versions";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { MlpManager } from "../../generated/MlpManager/MlpManager";
import { readValue } from "./utils";
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
  const sdk = new SDK(
    protocolConfig,
    tokenPricer,
    tokenInitializer,
    customEvent
  );

  return sdk;
}

export function getOrCreatePool(event: ethereum.Event): Pool {
  const sdk = initializeSDK(event);

  const pool = sdk.Pools.loadPool(
    Bytes.fromHexString(constants.POOL_ADDRESS.toHexString())
  );
  if (!pool.isInitialized) {
    const mlpManagerContract = MlpManager.bind(constants.MLP_MANAGER_ADDRESS);
    const mmyLpAddress = readValue(
      mlpManagerContract.try_glp(),
      constants.NULL.TYPE_ADDRESS
    );
    const outputToken = sdk.Tokens.getOrCreateToken(mmyLpAddress);
    pool.initialize("MMYVault", "VAULT", [], outputToken);
  }
  return pool;
}

export function getOrCreateAccount(
  event: ethereum.Event,
  accountAddress: Address
): Account {
  const sdk = initializeSDK(event);

  const loadAccountResponse = sdk.Accounts.loadAccount(accountAddress);
  const account = sdk.Accounts.loadAccount(accountAddress).account;
  if (loadAccountResponse.isNewUser) {
    const protocol = sdk.Protocol;
    const pool = getOrCreatePool(event);
    protocol.addUser();
    pool.addUser();
  }
  return account;
}
