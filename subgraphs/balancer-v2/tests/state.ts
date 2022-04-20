import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { mockMethod } from "./helpers";
import { Token } from "../generated/schema";
import { FEE_COLLECTOR_ADDRESS } from "../src/common/constants";
import { createMockedFunction } from "matchstick-as";

/**
 * USDC-WETH: https://app.balancer.fi/#/pool/0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019
 */
export const usdcWethPoolId = Bytes.fromHexString("0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019");
export const usdcWethPoolAddress = Address.fromString("0x96646936b91d6B9D7D0c47C496AfBF3D6ec7B6f8");
mockMethod(usdcWethPoolAddress, "decimals", [], [], "uint8", [ethereum.Value.fromI32(18)], false);
mockMethod(usdcWethPoolAddress, "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(usdcWethPoolAddress, "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);
mockMethod(usdcWethPoolAddress, "getSwapFeePercentage", [], [], "uint256", [ethereum.Value.fromI32(18)], false);
mockMethod(usdcWethPoolAddress, "getNormalizedWeights", [], [], "uint256[]", [], true);
mockMethod(usdcWethPoolAddress, "totalSupply", [], [], "uint256", [ethereum.Value.fromI32(100000)], false);

export const weth = new Token("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2");
mockMethod(Address.fromString(weth.id), "decimals", [], [], "uint8", [ethereum.Value.fromI32(18)], false);
mockMethod(Address.fromString(weth.id), "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(Address.fromString(weth.id), "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);
weth.save();

export const usdc = new Token("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
mockMethod(Address.fromString(usdc.id), "decimals", [], [], "uint8", [ethereum.Value.fromI32(6)], false);
mockMethod(Address.fromString(usdc.id), "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(Address.fromString(usdc.id), "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);
usdc.save();

/**
 * UMA-USDC: https://app.balancer.fi/#/pool/0xf5aaf7ee8c39b651cebf5f1f50c10631e78e0ef9000200000000000000000069
 */
export const umaUsdcPoolId = Bytes.fromHexString("0xf5aaf7ee8c39b651cebf5f1f50c10631e78e0ef9000200000000000000000069");
export const umaUsdcPoolAddress = Address.fromString("0xf5aAf7Ee8C39B651CEBF5f1F50C10631E78e0ef9");
mockMethod(umaUsdcPoolAddress, "decimals", [], [], "uint8", [ethereum.Value.fromI32(18)], false);
mockMethod(umaUsdcPoolAddress, "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(umaUsdcPoolAddress, "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);
mockMethod(umaUsdcPoolAddress, "getSwapFeePercentage", [], [], "uint256", [ethereum.Value.fromI32(18)], false);
mockMethod(umaUsdcPoolAddress, "getNormalizedWeights", [], [], "uint256[]", [], true);
mockMethod(umaUsdcPoolAddress, "totalSupply", [], [], "uint256", [ethereum.Value.fromI32(100000)], false);

export const uma = new Token("0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828");
uma.save();
mockMethod(Address.fromString(uma.id), "decimals", [], [], "uint8", [ethereum.Value.fromI32(18)], false);
mockMethod(Address.fromString(uma.id), "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(Address.fromString(uma.id), "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);

/**
 * BAT-WETH: https://app.balancer.fi/#/pool/0xde148e6cc3f6047eed6e97238d341a2b8589e19e000200000000000000000017
 */
export const batWethPoolId = Bytes.fromHexString("0xde148e6cc3f6047eed6e97238d341a2b8589e19e000200000000000000000017");
export const batWethPoolAddress = Address.fromString("0xdE148e6cC3F6047EeD6E97238D341A2b8589e19E");
mockMethod(batWethPoolAddress, "decimals", [], [], "uint8", [ethereum.Value.fromI32(18)], false);
mockMethod(batWethPoolAddress, "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(batWethPoolAddress, "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);
mockMethod(batWethPoolAddress, "getSwapFeePercentage", [], [], "uint256", [ethereum.Value.fromI32(18)], false);
mockMethod(batWethPoolAddress, "totalSupply", [], [], "uint256", [ethereum.Value.fromI32(100000)], false);
mockMethod(
  batWethPoolAddress,
  "getNormalizedWeights",
  [],
  [],
  "uint256[]",
  [
    ethereum.Value.fromSignedBigIntArray([
      BigInt.fromString("600000000000000000"),
      BigInt.fromString("400000000000000000"),
    ]),
  ],
  false,
);

export const bat = new Token("0x0d8775f648430679a709e98d2b0cb6250d2887ef");
bat.save();
mockMethod(Address.fromString(bat.id), "decimals", [], [], "uint8", [ethereum.Value.fromI32(18)], false);
mockMethod(Address.fromString(bat.id), "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(Address.fromString(bat.id), "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);

/**
 * UMA-WETH
 */
export const umaWethPoolId = Bytes.fromHexString("0xf8a0623ab66f985effc1c69d05f1af4badb01b0000020000000000000000001d");
export const umaWethPoolAddress = Address.fromString("0xf8a0623ab66f985effc1c69d05f1af4badb01b00");
mockMethod(umaWethPoolAddress, "decimals", [], [], "uint8", [ethereum.Value.fromI32(18)], false);
mockMethod(umaWethPoolAddress, "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(umaWethPoolAddress, "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);
mockMethod(umaWethPoolAddress, "getSwapFeePercentage", [], [], "uint256", [ethereum.Value.fromI32(18)], false);
mockMethod(umaWethPoolAddress, "totalSupply", [], [], "uint256", [ethereum.Value.fromI32(100000)], false);
mockMethod(
  umaWethPoolAddress,
  "getNormalizedWeights",
  [],
  [],
  "uint256[]",
  [
    ethereum.Value.fromSignedBigIntArray([
      BigInt.fromString("800000000000000000"),
      BigInt.fromString("200000000000000000"),
    ]),
  ],
  false,
);

export const gno = new Token("0x6810e776880C02933D47DB1b9fc05908e5386b96");
gno.save();
mockMethod(Address.fromString(gno.id), "decimals", [], [], "uint8", [ethereum.Value.fromI32(18)], false);
mockMethod(Address.fromString(gno.id), "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(Address.fromString(gno.id), "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);

export const bal = new Token("0xba100000625a3754423978a60c9317c58a424e3D");
bal.save();
mockMethod(Address.fromString(bal.id), "decimals", [], [], "uint8", [ethereum.Value.fromI32(18)], false);
mockMethod(Address.fromString(bal.id), "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(Address.fromString(bal.id), "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);

/**
 * External contracts mock
 */
mockMethod(FEE_COLLECTOR_ADDRESS, "getSwapFeePercentage", [], [], "uint256", [ethereum.Value.fromI32(100000)], false);
const NEW_BAT_PRICE = "30";
// Mock oracle contract
createMockedFunction(
  Address.fromString("0x83d95e0d5f402511db06817aff3f9ea88224b030"),
  "getPriceUsdcRecommended",
  "getPriceUsdcRecommended(address):(uint256)",
)
  .withArgs([ethereum.Value.fromAddress(Address.fromString(bat.id))])
  .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString(NEW_BAT_PRICE))]);
