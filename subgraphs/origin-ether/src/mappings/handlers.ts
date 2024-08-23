import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { BIGINT_ZERO, ETH_ADDRESS, INT_ZERO } from "../sdk/util/constants";

import { _ERC20 } from "../../generated/Vault/_ERC20";
import {
  AssetAllocated,
  Redeem,
  WithdrawalRequested,
  WithdrawalClaimed,
  YieldDistribution,
  Vault,
} from "../../generated/Vault/Vault";
import { Token } from "../../generated/schema";
import { addToArrayAtIndex, updateArrayAtIndex } from "../sdk/util/arrays";
import { WETH_ADDRESS } from "../prices/config/mainnet";

const conf = new ProtocolConfig(
  NetworkConfigs.getLSTAddress().toHexString(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    return getUsdPricePerToken(Address.fromBytes(token.id)).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    return getUsdPrice(
      Address.fromBytes(token.id),
      bigIntToBigDecimal(amount, token.decimals)
    );
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

export function handleAssetAllocated(event: AssetAllocated): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(WETH_ADDRESS);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("OETH Vault", "OETHVault", [token.id], null, false);
  }

  // get balance in WETH
  const vaultContract = Vault.bind(event.address);
  const assets = vaultContract.getAllAssets();

  let assetBalances: BigInt[] = [];
  for (let i = 0; i < assets.length; i++) {
    assetBalances = addToArrayAtIndex(assetBalances, BIGINT_ZERO);
  }
  for (let i = 0; i < assets.length; i++) {
    const b = vaultContract.checkBalance(assets[i]);
    assetBalances = updateArrayAtIndex(assetBalances, b, i);
  }
  let wethBalance = BIGINT_ZERO;
  for (let i = 0; i < assetBalances.length; i++) {
    wethBalance = wethBalance.plus(assetBalances[i]);
  }

  pool.setInputTokenBalances([wethBalance], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRedeem(event: Redeem): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(WETH_ADDRESS);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("OETH Vault", "OETHVault", [token.id], null, false);
  }

  // get balance in WETH
  const vaultContract = Vault.bind(event.address);
  const assets = vaultContract.getAllAssets();

  let assetBalances: BigInt[] = [];
  for (let i = 0; i < assets.length; i++) {
    assetBalances = addToArrayAtIndex(assetBalances, BIGINT_ZERO);
  }
  for (let i = 0; i < assets.length; i++) {
    const b = vaultContract.checkBalance(assets[i]);
    assetBalances = updateArrayAtIndex(assetBalances, b, i);
  }
  let wethBalance = BIGINT_ZERO;
  for (let i = 0; i < assetBalances.length; i++) {
    wethBalance = wethBalance.plus(assetBalances[i]);
  }

  pool.setInputTokenBalances([wethBalance], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleWithdrawalRequested(event: WithdrawalRequested): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleWithdrawalClaimed(event: WithdrawalClaimed): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(WETH_ADDRESS);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("OETH Vault", "OETHVault", [token.id], null, false);
  }

  // get balance in WETH
  const vaultContract = Vault.bind(event.address);
  const assets = vaultContract.getAllAssets();

  let assetBalances: BigInt[] = [];
  for (let i = 0; i < assets.length; i++) {
    assetBalances = addToArrayAtIndex(assetBalances, BIGINT_ZERO);
  }
  for (let i = 0; i < assets.length; i++) {
    const b = vaultContract.checkBalance(assets[i]);
    assetBalances = updateArrayAtIndex(assetBalances, b, i);
  }
  let wethBalance = BIGINT_ZERO;
  for (let i = 0; i < assetBalances.length; i++) {
    wethBalance = wethBalance.plus(assetBalances[i]);
  }

  pool.setInputTokenBalances([wethBalance], true);
}

export function handleYieldDistribution(event: YieldDistribution): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(WETH_ADDRESS);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("OETH Vault", "OETHVault", [token.id], null, false);
  }

  pool.addRevenueNative(token, event.params._fee, event.params._yield);
}
