import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { BIGDECIMAL_ZERO, ETH_ADDRESS, INT_ZERO } from "../sdk/util/constants";

import { AddEntity } from "../../generated/CollateralFactory/CollateralFactory";
import { Collateral as CollateralTemplate } from "../../generated/templates";
import {
  Deposit,
  Withdraw,
  Collateral,
} from "../../generated/CollateralFactory/Collateral";
import { _ERC20 } from "../../generated/CollateralFactory/_ERC20";
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
    let tokenAddr = Address.fromBytes(token.id);

    if (
      tokenAddr ==
      Address.fromString("0x00000000efe302beaa2b3e6e1b18d08d69a9012a")
    ) {
      tokenAddr = Address.fromString(
        "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e"
      );
    }
    if (
      tokenAddr ==
      Address.fromString("0xbc78d84ba0c46dfe32cf2895a19939c86b81a777")
    ) {
      tokenAddr = Address.fromString(
        "0x152b9d0fdc40c096757f570a51e494bd4b943e50"
      );
    }

    const customPrice = getUsdPricePerToken(tokenAddr);
    returnPrice = customPrice.usdPrice;
    return returnPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    let returnPrice = BIGDECIMAL_ZERO;
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    returnPrice = this.getTokenPrice(token);
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

export function handleAddEntity(event: AddEntity): void {
  CollateralTemplate.create(event.params.entity);
}

export function handleDeposit(event: Deposit): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const contract = Collateral.bind(event.address);
  const token = sdk.Tokens.getOrCreateToken(contract.asset());
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const balance = contract.totalSupply();
  pool.setInputTokenBalances([balance], true);

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

  const contract = Collateral.bind(event.address);
  const token = sdk.Tokens.getOrCreateToken(contract.asset());
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const balance = contract.totalSupply();
  pool.setInputTokenBalances([balance], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}
