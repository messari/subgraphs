import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPricePerToken } from "../prices";
import { getLPTPrice } from "./helpers";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import { BIGDECIMAL_ZERO, ETH_ADDRESS, INT_ZERO } from "../sdk/util/constants";

import { NewTenderizer } from "../../generated/Registry/Registry";
import { Tenderizer as TenderizerTemplate } from "../../generated/templates";
import {
  Deposit,
  Withdraw,
  Tenderizer,
  Rebase,
} from "../../generated/templates/Tenderizer/Tenderizer";
import { _ERC20 } from "../../generated/Registry/_ERC20";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    let returnPrice = BIGDECIMAL_ZERO;
    const tokenAddr = Address.fromBytes(token.id);

    if (
      tokenAddr ==
      Address.fromString("0x289ba1701c2f088cf0faf8b3705246331cb8a839") // LPT on Arbitrum
    ) {
      const ethPriceUSD = getUsdPricePerToken(
        Address.fromString("0x82af49447d8a07e3bd95bd0d56f35241523fbab1")
      ).usdPrice;
      returnPrice = getLPTPrice(ethPriceUSD);
    } else {
      const customPrice = getUsdPricePerToken(Address.fromBytes(token.id));
      returnPrice = customPrice.usdPrice;
    }
    return returnPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    let returnPrice = BIGDECIMAL_ZERO;
    const tokenAddr = Address.fromBytes(token.id);
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    if (
      tokenAddr ==
      Address.fromString("0x289ba1701c2f088cf0faf8b3705246331cb8a839") // LPT on Arbitrum
    ) {
      const ethPriceUSD = getUsdPricePerToken(
        Address.fromString("0x82af49447d8a07e3bd95bd0d56f35241523fbab1")
      ).usdPrice;
      returnPrice = getLPTPrice(ethPriceUSD);
    } else {
      const customPrice = getUsdPricePerToken(Address.fromBytes(token.id));
      returnPrice = customPrice.usdPrice;
    }
    return returnPrice.times(_amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    let name = "unknown";
    let symbol = "UNKNOWN";
    let decimals = INT_ZERO as i32;

    if (address == Address.fromString(ETH_ADDRESS)) {
      name = "eth";
      symbol = "ETH";
      decimals = 18 as i32;
    } else {
      const erc20 = _ERC20.bind(address);
      name = erc20.name();
      symbol = erc20.symbol();
      decimals = erc20.decimals().toI32();
    }
    return new TokenParams(name, symbol, decimals);
  }
}

export function handleNewTenderizer(event: NewTenderizer): void {
  TenderizerTemplate.create(event.params.tenderizer);
}

export function handleDeposit(event: Deposit): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const contract = Tenderizer.bind(event.address);
  const token = sdk.Tokens.getOrCreateToken(contract.asset());
  const tokenContract = _ERC20.bind(Address.fromBytes(token.id));

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(
      tokenContract.name(),
      tokenContract.symbol(),
      [token.id],
      null
    );
  }

  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleWithdraw(event: Withdraw): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const contract = Tenderizer.bind(event.address);
  const token = sdk.Tokens.getOrCreateToken(contract.asset());
  const tokenContract = _ERC20.bind(Address.fromBytes(token.id));

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(
      tokenContract.name(),
      tokenContract.symbol(),
      [token.id],
      null
    );
  }

  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRebase(event: Rebase): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const contract = Tenderizer.bind(event.address);
  const token = sdk.Tokens.getOrCreateToken(contract.asset());
  const tokenContract = _ERC20.bind(Address.fromBytes(token.id));

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(
      tokenContract.name(),
      tokenContract.symbol(),
      [token.id],
      null
    );
  }

  // https://whitepaper.tenderize.me/core-architecture/tendervault-ttokens#fees
  const netStake = event.params.newStake.minus(event.params.oldStake);
  const fees = netStake.toBigDecimal().times(BigDecimal.fromString("0.005"));
  const rewards = netStake.toBigDecimal().minus(fees);
  pool.addRevenueNative(
    token,
    bigDecimalToBigInt(rewards),
    bigDecimalToBigInt(fees)
  );
}
