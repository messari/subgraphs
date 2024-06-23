import { Versions } from "../versions";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { ERC20 } from "../../generated/ezETH/ERC20";
import { Pool } from "../sdk/protocols/generic/pool";
import { ProtocolConfig } from "../sdk/protocols/config";
import { Pricer, TokenInit, readValue } from "../common/utils";
import { MintCall, BurnCall } from "../../generated/ezETH/ezETH";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function initializeSDKFromCall(call: ethereum.Call): SDK {
  const protocolConfig = new ProtocolConfig(
    constants.Protocol.ID,
    constants.Protocol.NAME,
    constants.Protocol.SLUG,
    Versions
  );
  const tokenPricer = new Pricer();
  const tokenInitializer = new TokenInit();

  const sdk = SDK.initializeFromCall(
    protocolConfig,
    tokenPricer,
    tokenInitializer,
    call
  );

  return sdk;
}

export function getOrCreatePool(poolAddress: Address, sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(poolAddress);

  if (!pool.isInitialized) {
    const inputToken = sdk.Tokens.getOrCreateToken(
      Address.fromString(constants.ETH_ADDRESS)
    );
    const outputToken = sdk.Tokens.getOrCreateToken(poolAddress);

    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [inputToken.id],
      outputToken
    );
  }

  return pool;
}

export function updatePoolTvlAndSupply(pool: Pool): void {
  const xezEthAddress = Address.fromBytes(pool.getBytesID());
  const xezEthContract = ERC20.bind(xezEthAddress);

  const tvl = readValue<BigInt>(
    xezEthContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  pool.setInputTokenBalances([tvl], true);
  pool.setOutputTokenSupply(tvl);
}

export function handleMint(call: MintCall): void {
  const sender = call.inputs._user;

  const sdk = initializeSDKFromCall(call);
  const pool = getOrCreatePool(call.to, sdk);

  updatePoolTvlAndSupply(pool);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}

export function handleBurn(call: BurnCall): void {
  const sender = call.inputs._user;

  const sdk = initializeSDKFromCall(call);
  const pool = getOrCreatePool(call.to, sdk);

  updatePoolTvlAndSupply(pool);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}
