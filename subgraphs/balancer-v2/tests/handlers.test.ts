import { test, assert, createMockedFunction } from "matchstick-as";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  createNewPoolBalanceChangeEvent,
  createNewPoolEvent,
  createNewSwapEvent,
  createTokensRegisteredEvent,
  mockMethod,
} from "./helpers";
import {
  handlePoolBalanceChanged,
  handlePoolRegister,
  handleSwap,
  handleTokensRegister,
} from "../src/mappings/handlers";
import { LiquidityPool, Token } from "../generated/schema";
import {
  usdcWethPoolId,
  batWethPoolId,
  usdc,
  weth,
  umaUsdcPoolId,
  umaUsdcPoolAddress,
  uma,
  usdcWethPoolAddress,
  bat,
  batWethPoolAddress,
  umaWethPoolId,
  umaWethPoolAddress,
} from "./state";
import { getOrCreateDex } from "../src/common/getters";

const EXPECTED_WETH_PRICE = "3010.039001622230703728310744540643";
const EXPECTED_TVL = "144119111.1126040007689007440805288";
const EXPECTED_UMA_PRICE = "6.380591211413646512498673013654479";
const EXPECTED_SWAP_VOLUME = "20490.320269";

test("Create and register pool", () => {
  let registerPoolEvent = createNewPoolEvent(usdcWethPoolId, usdcWethPoolAddress, 2);

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
  assert.fieldEquals("LiquidityPool", usdcWethPoolId.toHexString(), "outputToken", usdcWethPoolAddress.toHexString());
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
  const protocol = getOrCreateDex();
  protocol.network = "MAINNET";
  protocol.save();
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

  let token = Token.load(weth.id);
  let tokenPrice = token!.lastPriceUSD;
  if (!tokenPrice) throw Error("Token price is not defined");

  assert.stringEquals(tokenPrice.toString(), EXPECTED_WETH_PRICE);

  pool = LiquidityPool.load(usdcWethPoolId.toHexString());
  if (pool == null) throw new Error("Pool is not defined");
  assert.stringEquals(pool.totalValueLockedUSD.toString(), EXPECTED_TVL);
  assert.stringEquals(pool.cumulativeVolumeUSD.toString(), EXPECTED_SWAP_VOLUME);
});

test("Pool with stable and not base asset", () => {
  let registerPoolEvent = createNewPoolEvent(umaUsdcPoolId, umaUsdcPoolAddress, 2);

  const pair = [Address.fromString(uma.id), Address.fromString(usdc.id)];

  const tokensRegisterEvent = createTokensRegisteredEvent(umaUsdcPoolId, pair, []);

  handlePoolRegister(registerPoolEvent);
  handleTokensRegister(tokensRegisterEvent);

  const depositAmounts = [BigInt.fromString("123804125414775870192714"), BigInt.fromString("786018294699")];

  const deposit = createNewPoolBalanceChangeEvent(
    umaUsdcPoolId,
    Address.fromString("0xf71d161fdc3895f21612d79f15aa819b7a3d296a"),
    [Address.fromString(uma.id), Address.fromString(usdc.id)],
    depositAmounts,
    [new BigInt(0), new BigInt(0)],
  );

  handlePoolBalanceChanged(deposit);
  let amountIn = BigInt.fromString("1107936999999999800000");
  let amountOut = BigInt.fromString("7069293085");

  const swap = createNewSwapEvent(
    umaUsdcPoolId,
    Address.fromString(uma.id),
    Address.fromString(usdc.id),
    amountIn,
    amountOut,
  );
  handleSwap(swap);
  let token = Token.load(uma.id.toLowerCase());
  let tokenPrice = token!.lastPriceUSD;
  if (!tokenPrice) throw Error("Token price is not defined");

  assert.stringEquals(tokenPrice.toString(), EXPECTED_UMA_PRICE);
});

// Mock oracle contract
mockMethod(
  Address.fromString("0x83d95e0d5f402511db06817aff3f9ea88224b030"),
  "getPriceUsdcRecommended",
  ["address"],
  [ethereum.Value.fromAddress(Address.fromString(bat.id))],
  "uint256",
  [ethereum.Value.fromSignedBigInt(BigInt.fromI32(30000000))],
  false,
);
mockMethod(
  Address.fromString("0x83d95e0d5f402511db06817aff3f9ea88224b030"),
  "getPriceUsdcRecommended",
  ["address"],
  [ethereum.Value.fromAddress(Address.fromString(weth.id))],
  "uint256",
  [ethereum.Value.fromSignedBigInt(BigInt.fromI32(3010000000))],
  false,
);

test("Pool with weth and weight with low liquidity: Weth is the out token", () => {
  let registerPoolEvent = createNewPoolEvent(batWethPoolId, batWethPoolAddress, 2);

  const pair = [Address.fromString(weth.id), Address.fromString(bat.id)];

  const tokensRegisterEvent = createTokensRegisteredEvent(batWethPoolId, pair, []);

  handlePoolRegister(registerPoolEvent);
  handleTokensRegister(tokensRegisterEvent);

  const protocol = getOrCreateDex();
  protocol.network = "MAINNET";
  protocol.save();

  const depositAmounts = [BigInt.fromString("2449718558752805947"), BigInt.fromString("6770241474953669666076")];

  const deposit = createNewPoolBalanceChangeEvent(
    batWethPoolId,
    Address.fromString("0xf71d161fdc3895f21612d79f15aa819b7a3d296a"),
    [Address.fromString(weth.id), Address.fromString(bat.id)],
    depositAmounts,
    [new BigInt(0), new BigInt(0)],
  );

  handlePoolBalanceChanged(deposit);
  let amountIn = BigInt.fromString("122147267136589922389");
  let amountOut = BigInt.fromString("29828600727682853");

  const swap = createNewSwapEvent(
    batWethPoolId,
    Address.fromString(bat.id),
    Address.fromString(weth.id),
    amountIn,
    amountOut,
  );
  handleSwap(swap);
  let token = Token.load(bat.id.toLowerCase());
  let tokenPrice = token!.lastPriceUSD;
  if (!tokenPrice) throw Error("Token price should be defined");
  assert.stringEquals(tokenPrice.toString(), "30");
});

// Mock oracle contract
mockMethod(
  Address.fromString("0x83d95e0d5f402511db06817aff3f9ea88224b030"),
  "getPriceUsdcRecommended",
  ["address"],
  [ethereum.Value.fromAddress(Address.fromString(uma.id))],
  "uint256",
  [ethereum.Value.fromI32(70000000)],
  false,
);

test("Pool with weth and weight: Weth is the in token", () => {
  let registerPoolEvent = createNewPoolEvent(umaWethPoolId, umaWethPoolAddress, 2);

  const pair = [Address.fromString(uma.id), Address.fromString(weth.id)];

  const tokensRegisterEvent = createTokensRegisteredEvent(umaWethPoolId, pair, []);

  handlePoolRegister(registerPoolEvent);
  handleTokensRegister(tokensRegisterEvent);
  const protocol = getOrCreateDex();
  protocol.network = "MAINNET";
  protocol.save();
  const depositAmounts = [BigInt.fromString("549825169257350888063"), BigInt.fromString("311117203184081567")];

  const deposit = createNewPoolBalanceChangeEvent(
    umaWethPoolId,
    Address.fromString("0xf71d161fdc3895f21612d79f15aa819b7a3d296a"),
    [Address.fromString(uma.id), Address.fromString(weth.id)],
    depositAmounts,
    [new BigInt(0), new BigInt(0)],
  );

  let w = Token.load(weth.id);
  if (!w) throw new Error();
  w.lastPriceUSD = BigDecimal.fromString("2569.87");
  w.save();

  handlePoolBalanceChanged(deposit);
  let amountIn = BigInt.fromString("60000000000000005");
  let amountOut = BigInt.fromString("18731468530058780136");

  const swap = createNewSwapEvent(
    umaWethPoolId,
    Address.fromString(weth.id),
    Address.fromString(uma.id),
    amountIn,
    amountOut,
  );
  handleSwap(swap);
  let token = Token.load(uma.id.toLowerCase());
  let tokenPrice = token!.lastPriceUSD;
  if (!tokenPrice) throw Error("Token price should be defined");
  assert.stringEquals(tokenPrice.toString(), "70");
});
