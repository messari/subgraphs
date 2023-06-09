import { Versions } from "../versions";
import * as constants from "../common/constants";
import { SDK } from "../sdk/protocols/perpfutures";
import { ProtocolConfig } from "../sdk/protocols/config";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { LiquidityPoolFeeType } from "../common/constants";
import { TokenInitialize, TokenPrice } from "../modules/token";
import { Account } from "../sdk/protocols/perpfutures/account";
import { Address, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { _Tranche } from "../../generated/schema";

export function initializeSDK(event: ethereum.Event): SDK {
  const protocolConfig = new ProtocolConfig(
    constants.PROTOCOL_ID,
    constants.PROTOCOL_NAME,
    constants.PROTOCOL_SLUG,
    Versions
  );
  const tokenPricer = new TokenPrice();
  const tokenInitializer = new TokenInitialize();

  const sdk = SDK.initializeFromEvent(
    protocolConfig,
    tokenPricer,
    tokenInitializer,
    event
  );

  return sdk;
}

export function getOrCreatePool(sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(
    Bytes.fromHexString(constants.VAULT_ADDRESS.toHexString())
  );
  if (!pool.isInitialized) {
    const outputToken = sdk.Tokens.getOrCreateToken(
      constants.OUTPUT_TOKEN_ADDRESS
    );
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

export function getOrCreateTranche(address: Address): _Tranche {
  let tranche = _Tranche.load(Bytes.fromHexString(address.toHexString()));
  if (!tranche) {
    tranche = new _Tranche(Bytes.fromHexString(address.toHexString()));
    tranche.token = Bytes.fromHexString(address.toHexString());
    tranche.tokenPrice = constants.BIGDECIMAL_ZERO;
    tranche.totalSupply = constants.BIGINT_ZERO;
    tranche.tvl = constants.BIGDECIMAL_ZERO;
    tranche.save();
  }
  return tranche;
}
