import {Address, BigInt, Bytes, ethereum} from "@graphprotocol/graph-ts";
import { mockMethod } from "./helpers";
import { Token } from "../generated/schema";

/**
 * USDC-WETH: https://app.balancer.fi/#/pool/0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019
 */

export const usdcWethPoolId = Bytes.fromHexString("0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019")
export const usdcWethPoolAddress = Address.fromString("0x96646936b91d6B9D7D0c47C496AfBF3D6ec7B6f8")
mockMethod(usdcWethPoolAddress, "decimals", [], [], "uint8", [ethereum.Value.fromI32(18)], false);
mockMethod(usdcWethPoolAddress, "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(usdcWethPoolAddress, "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);
mockMethod(usdcWethPoolAddress, "getSwapFeePercentage", [], [], "uint256", [ethereum.Value.fromI32(18)], false);
mockMethod(usdcWethPoolAddress, "getNormalizedWeights", [], [], "uint256[]", [], true);

export const weth = new Token("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2");
mockMethod(Address.fromString(weth.id), "decimals", [], [], "uint8", [ethereum.Value.fromI32(18)], false);
mockMethod(Address.fromString(weth.id), "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(Address.fromString(weth.id), "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);
weth.save()

export const usdc = new Token("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
mockMethod(Address.fromString(usdc.id), "decimals", [], [], "uint8", [ethereum.Value.fromI32(6)], false);
mockMethod(Address.fromString(usdc.id), "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(Address.fromString(usdc.id), "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);
usdc.save()

/**
 * BAL-WETH: https://app.balancer.fi/#/pool/0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014
 */
export const balWethPoolId = Bytes.fromHexString("0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014")
export const balWethPoolAddress = Address.fromString("0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56")
mockMethod(balWethPoolAddress, "decimals", [], [], "uint8", [ethereum.Value.fromI32(18)], false);
mockMethod(balWethPoolAddress, "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(balWethPoolAddress, "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);
mockMethod(balWethPoolAddress, "getSwapFeePercentage", [], [], "uint256", [ethereum.Value.fromI32(18)], false);
mockMethod(balWethPoolAddress, "getNormalizedWeights", [], [], "uint256[]", [ethereum.Value.fromSignedBigInt(BigInt.fromI64(800000000000000000)), ethereum.Value.fromSignedBigInt(BigInt.fromI64(200000000000000000))], false);

export const bal = new Token("0xba100000625a3754423978a60c9317c58a424e3D");
bal.save();
mockMethod(Address.fromString(bal.id), "decimals", [], [], "uint8", [ethereum.Value.fromI32(18)], false);
mockMethod(Address.fromString(bal.id), "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(Address.fromString(bal.id), "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);

/**
 * GNO-BAL: https://app.balancer.fi/#/pool/0x36128d5436d2d70cab39c9af9cce146c38554ff0000200000000000000000009
 */
export const gnoBalPoolId = Bytes.fromHexString("0x36128d5436d2d70cab39c9af9cce146c38554ff0000200000000000000000009");
export const gnoBalPoolAddress = Address.fromString("0x8e9aa87e45e92bad84d5f8dd1bff34fb92637de9");
mockMethod(gnoBalPoolAddress, "decimals", [], [], "uint8", [ethereum.Value.fromI32(18)], false);
mockMethod(gnoBalPoolAddress, "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(gnoBalPoolAddress, "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);
mockMethod(gnoBalPoolAddress, "getSwapFeePercentage", [], [], "uint256", [ethereum.Value.fromI32(18)], false);
mockMethod(gnoBalPoolAddress, "getNormalizedWeights", [], [], "uint256[]", [], true);

export const gno = new Token("0x6810e776880C02933D47DB1b9fc05908e5386b96");
gno.save();
mockMethod(Address.fromString(gno.id), "decimals", [], [], "uint8", [ethereum.Value.fromI32(18)], false);
mockMethod(Address.fromString(gno.id), "name", [], [], "string", [ethereum.Value.fromString("name")], false);
mockMethod(Address.fromString(gno.id), "symbol", [], [], "string", [ethereum.Value.fromString("symbol")], false);

