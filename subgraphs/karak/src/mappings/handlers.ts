import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { BIGINT_MINUS_ONE, ETH_ADDRESS, INT_ZERO } from "../sdk/util/constants";

import { NewVault } from "../../generated/VaultSupervisor/VaultSupervisor";
import { StartedWithdrawal } from "../../generated/DelegationSupervisor/DelegationSupervisor";
import { Vault } from "../../generated/VaultSupervisor/Vault";
import { _ERC20 } from "../../generated/VaultSupervisor/_ERC20";
import { Vault as VaultTemplate } from "../../generated/templates";
import { Deposit, Withdraw } from "../../generated/templates/Vault/Vault";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
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

export function handleNewVault(event: NewVault): void {
  VaultTemplate.create(event.params.vault);
}

export function handleDeposit(event: Deposit): void {
  const amount = event.params.assets;
  const user = event.params.by;

  const vaultContract = Vault.bind(event.address);
  const asset = vaultContract.asset();
  const supply = vaultContract.totalSupply();

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(asset);
  const outputToken = sdk.Tokens.getOrCreateToken(event.address);

  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [token.id],
      outputToken,
      true
    );
  }
  pool.addInputTokenBalances([amount], true);
  pool.setOutputTokenSupply(outputToken, supply);

  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleStartedWithdrawal(event: StartedWithdrawal): void {
  const user = event.params.withdrawer;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleWithdraw(event: Withdraw): void {
  const amount = event.params.assets;

  const vaultContract = Vault.bind(event.address);
  const asset = vaultContract.asset();
  const supply = vaultContract.totalSupply();

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(asset);
  const outputToken = sdk.Tokens.getOrCreateToken(event.address);

  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [token.id],
      outputToken,
      true
    );
  }
  pool.addInputTokenBalances([amount.times(BIGINT_MINUS_ONE)], true);
  pool.setOutputTokenSupply(outputToken, supply);
}
