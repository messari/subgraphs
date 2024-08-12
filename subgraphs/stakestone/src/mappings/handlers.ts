import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  log,
} from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { WETH_ADDRESS } from "../prices/config/mainnet";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { ETH_ADDRESS, INT_ZERO } from "../sdk/util/constants";

import {
  GetBalanceCall,
  DepositCall,
  WithdrawCall,
} from "../../generated/AssetVault/AssetVault";
import { GetAllStrategiesValueCall } from "../../generated/StrategyController/StrategyController";
import { _ERC20 } from "../../generated/AssetVault/_ERC20";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    return getUsdPricePerToken(Address.fromBytes(token.id)).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const erc20 = _ERC20.bind(address);
    let name = "unknown";
    let symbol = "UNKNOWN";
    let decimals = INT_ZERO as i32;

    if (address == Address.fromString(ETH_ADDRESS)) {
      name = "eth";
      symbol = "ETH";
      decimals = 18 as i32;
    } else {
      const nameCall = erc20.try_name();
      if (!nameCall.reverted) {
        name = nameCall.value;
      } else {
        log.warning("[getTokenParams] nameCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const symbolCall = erc20.try_symbol();
      if (!symbolCall.reverted) {
        symbol = symbolCall.value;
      } else {
        log.warning("[getTokenParams] symbolCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const decimalsCall = erc20.try_decimals();
      if (!decimalsCall.reverted) {
        decimals = decimalsCall.value.toI32();
      } else {
        log.warning("[getTokenParams] decimalsCall reverted for {}", [
          address.toHexString(),
        ]);
      }
    }
    const tokenParams = new TokenParams(name, symbol, decimals);

    return tokenParams;
  }
}

export function handleGetBalance(call: GetBalanceCall): void {
  const sdk = SDK.initializeFromCall(conf, new Pricer(), new TokenInit(), call);
  const token = sdk.Tokens.getOrCreateToken(WETH_ADDRESS);

  const pool = sdk.Pools.loadPool(Bytes.fromUTF8("AssetVault"));
  if (!pool.isInitialized) {
    pool.initialize("AssetVault", "AssetVault", [token.id], null, true);
  }
  pool.setInputTokenBalances([call.outputs.amount], true);
}

export function handleDeposit(call: DepositCall): void {
  const sdk = SDK.initializeFromCall(conf, new Pricer(), new TokenInit(), call);
  const user = call.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleWithdraw(call: WithdrawCall): void {
  const sdk = SDK.initializeFromCall(conf, new Pricer(), new TokenInit(), call);
  const user = call.transaction.from;

  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleGetAllStrategiesValue(
  call: GetAllStrategiesValueCall
): void {
  const sdk = SDK.initializeFromCall(conf, new Pricer(), new TokenInit(), call);
  const token = sdk.Tokens.getOrCreateToken(WETH_ADDRESS);

  const pool = sdk.Pools.loadPool(Bytes.fromUTF8("StrategyController"));
  if (!pool.isInitialized) {
    pool.initialize(
      "StrategyController",
      "StrategyController",
      [token.id],
      null,
      true
    );
  }
  pool.setInputTokenBalances([call.outputs.value], true);
}
