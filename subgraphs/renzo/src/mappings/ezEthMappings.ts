import { Versions } from "../versions";
import { Token } from "../../generated/schema";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { ERC20 } from "../../generated/ezETH/ERC20";
import { Pool } from "../sdk/protocols/generic/pool";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { MintCall, BurnCall } from "../../generated/ezETH/ezETH";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);

    return getUsdPricePerToken(pricedToken).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    return getUsdPrice(pricedToken, _amount);
  }
}

export class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const contract = ERC20.bind(address);
    let default_name = "unknown";
    let default_symbol = "UNKNOWN";
    let default_decimals = constants.INT_ZERO as i32;

    if (address == Address.fromString(constants.ETH_ADDRESS)) {
      default_name = constants.ETH_NAME;
      default_symbol = constants.ETH_SYMBOL;
      default_decimals = constants.DEFAULT_DECIMALS as i32;
    }

    const name = readValue<string>(contract.try_name(), default_name);
    const symbol = readValue<string>(contract.try_symbol(), default_symbol);
    const decimals = readValue<i32>(contract.try_decimals(), default_decimals);

    return new TokenParams(name, symbol, decimals);
  }
}

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
