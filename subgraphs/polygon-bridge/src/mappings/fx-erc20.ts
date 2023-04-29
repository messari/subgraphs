import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Token } from "../../generated/schema";
import {
  TokenMappedERC20,
  FxDepositERC20,
  FxWithdrawERC20,
} from "../../generated/FxERC20Events/FxERC20RootTunnel";
import { NetworkConfigs } from "../../configurations/configure";

import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { BridgeConfig } from "../sdk/protocols/bridge/config";
import { SDK } from "../sdk/protocols/bridge";
import { TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/bridge/tokens";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "../sdk/protocols/bridge/enums";
import { getUsdPricePerToken, getUsdPrice } from "../prices";
import { Versions } from "../versions";
import { ERC20 } from "../../generated/FxERC20Events/ERC20";
import { RootChainManager } from "../../generated/FxERC20Events/RootChainManager";
import { BIGDECIMAL_ZERO } from "../prices/common/constants";

export const conf = new BridgeConfig(
  NetworkConfigs.getFactoryAddress(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  BridgePermissionType.PERMISSIONLESS,
  Versions
);

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
    const wrappedERC20 = ERC20.bind(address);
    const name_call = wrappedERC20.try_name();
    const symbol_call = wrappedERC20.try_symbol();
    const decimals_call = wrappedERC20.try_decimals();

    if (name_call.reverted || symbol_call.reverted || decimals_call.reverted) {
      log.warning("[tokenInit] token params not found for address: {}", [
        address.toHexString(),
      ]);

      return {
        name: "unknown",
        symbol: "unknown",
        decimals: 18,
      };
    }

    return {
      name: name_call.value,
      symbol: symbol_call.value,
      decimals: decimals_call.value,
    };
  }
}

export function handleTokenMappedERC20(event: TokenMappedERC20): void {
  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);
  const crosschainID = BigInt.fromI32(137);

  const pool = sdk.Pools.loadPool<string>(event.params.rootToken);
  const rootToken = sdk.Tokens.getOrCreateToken(event.params.rootToken);

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

export function handleFxDepositERC20(event: FxDepositERC20): void {
  // poolAddress == RootToken Address
  const poolAddr = event.params.rootToken;
  const amount = event.params.amount;
  const crosschainID = BigInt.fromI32(137);

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  const pool = sdk.Pools.loadPool<string>(event.params.rootToken);
  const token = sdk.Tokens.getOrCreateToken(event.params.rootToken);

  if (!pool.isInitialized) {
    pool.initialize(
      token.name,
      token.symbol,
      BridgePoolType.LOCK_RELEASE,
      token
    );
  }

  const rootChainManger = RootChainManager.bind(
    Address.fromString(conf.getID())
  );
  const crosschainTokenAddr_call = rootChainManger.try_rootToChildToken(
    event.params.rootToken
  );

  if (crosschainTokenAddr_call.reverted) {
    log.warning(
      "[handleSwapIn] No crosschainToken for network: {} poolID: {} token: {}",
      [
        crosschainID.toString(),
        poolAddr.toHexString(),
        event.params.rootToken.toHexString(),
      ]
    );

    return;
  }

  const crosschainTokenAddr = crosschainTokenAddr_call.value;

  const crosschainToken = sdk.Tokens.getOrCreateCrosschainToken(
    crosschainID,
    crosschainTokenAddr,
    CrosschainTokenType.WRAPPED,
    Address.fromBytes(token.id)
  );

  pool.addDestinationToken(crosschainToken);
  const route = pool.getDestinationTokenRoute(crosschainToken);

  const account = sdk.Accounts.loadAccount(event.params.userAddress);
  account.transferOut(pool, route!, event.params.userAddress, amount);
}

export function handleFxWithdrawERC20(event: FxWithdrawERC20): void {
  // poolAddress == RootToken Address
  const poolAddr = event.params.rootToken;
  const amount = event.params.amount;
  const crosschainID = BigInt.fromI32(137);

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  const pool = sdk.Pools.loadPool<string>(poolAddr);
  const token = sdk.Tokens.getOrCreateToken(event.params.rootToken);

  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, BridgePoolType.BURN_MINT, token);
  }

  const crosschainTokenAddr = event.params.childToken;

  const crosschainToken = sdk.Tokens.getOrCreateCrosschainToken(
    crosschainID,
    crosschainTokenAddr,
    CrosschainTokenType.CANONICAL,
    Address.fromBytes(token.id)
  );

  pool.addDestinationToken(crosschainToken);
  const route = pool.getDestinationTokenRoute(crosschainToken);

  const account = sdk.Accounts.loadAccount(event.params.userAddress);
  account.transferIn(pool, route!, event.params.userAddress, amount);
}
