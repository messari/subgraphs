import { readValue } from "../common/utils";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { ERC20 } from "../../generated/ezETH/ERC20";
import { Pool } from "../sdk/protocols/generic/pool";
import { Transfer } from "../../generated/ezETH/ezETH";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { initializeSDKFromEvent } from "../common/initializers";

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

export function handleTransfer(event: Transfer): void {
  const from = event.params.from;
  const to = event.params.to;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolTvlAndSupply(pool);

  const fromAccount = sdk.Accounts.loadAccount(from);
  const toAccount = sdk.Accounts.loadAccount(to);
  fromAccount.trackActivity();
  toAccount.trackActivity();
}
