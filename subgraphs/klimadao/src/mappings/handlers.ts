import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal, safeDivide } from "../sdk/util/numbers";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
  ZERO_ADDRESS,
} from "../sdk/util/constants";

import { Transfer, RedeemFeePaid, BCT } from "../../generated/BCT/BCT";
import { _ERC20 } from "../../generated/BCT/_ERC20";
import { PoolV2 } from "../../generated/BCT/PoolV2";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

function getBCTPriceFromV2Pool(): BigDecimal {
  const pairAddr = Address.fromString(
    "0x1e67124681b402064cd0abe8ed1b5c79d2e02f64"
  );
  const poolContract = PoolV2.bind(pairAddr);

  // USDC
  const reserve0 = poolContract.getReserves().get_reserve0();
  const decimals0 = 6 as i32;
  // BCT
  const reserve1 = poolContract.getReserves().get_reserve1();
  const decimals1 = 18;

  const price1 = safeDivide(
    bigIntToBigDecimal(reserve0, decimals0),
    bigIntToBigDecimal(reserve1, decimals1)
  );
  return price1;
}

class Pricer implements TokenPricer {
  getTokenPrice(token: Token, block: BigInt): BigDecimal {
    if (block > BigInt.fromString("20294523")) {
      return getBCTPriceFromV2Pool();
    }

    return BIGDECIMAL_ZERO;
  }

  getAmountValueUSD(token: Token, amount: BigInt, block: BigInt): BigDecimal {
    const usdPrice = this.getTokenPrice(token, block);
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    return usdPrice.times(_amount);
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

export function handleRedeemFeePaid(event: RedeemFeePaid): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const fee = event.params.fees;
  pool.addRevenueNative(token, BIGINT_ZERO, fee);
}

export function handleTransfer(event: Transfer): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const bctContract = BCT.bind(event.address);
  const supplySTBT = bctContract.totalSupply();
  pool.setInputTokenBalances([supplySTBT], true);

  if (event.params.from == Address.fromString(ZERO_ADDRESS)) {
    const user = event.params.to;
    const account = sdk.Accounts.loadAccount(user);
    account.trackActivity();
  } else if (event.params.to == Address.fromString(ZERO_ADDRESS)) {
    const user = event.params.from;
    const account = sdk.Accounts.loadAccount(user);
    account.trackActivity();
  }
}
