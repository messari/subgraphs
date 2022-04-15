import { test, assert } from "matchstick-as";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  createNewPoolBalanceChangeEvent,
  createNewPoolEvent,
  createNewSwapEvent,
  createTokensRegisteredEvent,
} from "./helpers";
import {
  handlePoolBalanceChanged,
  handlePoolRegister,
  handleSwap,
  handleTokensRegister,
} from "../src/mappings/handlers";
import {_TokenPrice, LiquidityPool} from "../generated/schema";
import {usdcWethPoolId, gnoBalPoolAddress, usdc, weth} from "./state";

const expectedWethPrice = '3010.039001622230703728310744540643'
const expectedTVL = '144119111.1126040007689007440805288'

test("Create and register pool", () => {
  let registerPoolEvent = createNewPoolEvent(usdcWethPoolId, gnoBalPoolAddress, 2);

  const pair = [Address.fromString(usdc.id), Address.fromString(weth.id)];

  const tokensRegisterEvent = createTokensRegisteredEvent(usdcWethPoolId, pair, []);

  handlePoolRegister(registerPoolEvent);
  handleTokensRegister(tokensRegisterEvent);
  let pool = LiquidityPool.load(usdcWethPoolId.toHexString());
  if (pool == null) throw new Error("Pool is not defined");

  assert.equals(
    ethereum.Value.fromStringArray([usdc.id.toLowerCase(), weth.id.toLowerCase()]),
    ethereum.Value.fromStringArray(pool.inputTokens),
  );
  assert.fieldEquals("LiquidityPool", usdcWethPoolId.toHexString(), "outputToken", gnoBalPoolAddress.toHexString());
});

test("Handle pool balance change because of deposit", () => {
  const newAmounts = [BigInt.fromString("72094331532549"), BigInt.fromString("23928188153455141033647")];
  const deposit = createNewPoolBalanceChangeEvent(
    usdcWethPoolId,
    Address.fromString("0xf71d161fdc3895f21612d79f15aa819b7a3d296a"),
    [Address.fromString(usdc.id), Address.fromString(weth.id)],
    newAmounts,
    [new BigInt(0), new BigInt(0)],
  );

  handlePoolBalanceChanged(deposit);

  let pool = LiquidityPool.load(usdcWethPoolId.toHexString());
  if (pool == null) throw new Error("Pool is not defined");
  assert.equals(
    ethereum.Value.fromSignedBigIntArray(pool.inputTokenBalances),
    ethereum.Value.fromSignedBigIntArray(newAmounts),
  );
});

/**
 * Amounts inspired from https://etherscan.io/tx/0x792c49770ded77cb7bd2b1e9b2348431e2ec4b34fd93bbd0a17f854277566bfc
 */
test("Handle swap and updates base asset usd price value", () => {
  let amountIn = BigInt.fromString("6807327166843002652");
  let amountOut = BigInt.fromString("20490320269");

  let pool = LiquidityPool.load(usdcWethPoolId.toHexString());
  if (pool == null) throw new Error("Pool is not defined");
  let newAmounts = [pool.inputTokenBalances[0].minus(amountOut), pool.inputTokenBalances[1].plus(amountIn)];

  const swap = createNewSwapEvent(
    usdcWethPoolId,
    Address.fromString(weth.id),
    Address.fromString(usdc.id),
    amountIn,
    amountOut,
  );
  handleSwap(swap);
  pool = LiquidityPool.load(usdcWethPoolId.toHexString());
  if (pool == null) throw new Error("Pool is not defined");
  assert.equals(
    ethereum.Value.fromSignedBigIntArray(pool.inputTokenBalances),
    ethereum.Value.fromSignedBigIntArray(newAmounts),
  );

  let token = _TokenPrice.load(weth.id)
  if (!token) throw Error("Token price is not defined")

  assert.stringEquals(
      token.lastUsdPrice.toString(),
      expectedWethPrice
  )

  pool = LiquidityPool.load(usdcWethPoolId.toHexString())
  if (pool == null) throw new Error("Pool is not defined");
  assert.stringEquals(pool.totalValueLockedUSD.toString(), expectedTVL)
});
