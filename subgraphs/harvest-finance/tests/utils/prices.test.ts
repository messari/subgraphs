import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { assert, describe, test } from "matchstick-as";
import {
  getChainLinkPricePerToken,
  getPrice,
  getUniswapPricePerToken,
  getYearnLensPricePerToken,
} from "../../src/utils/prices";
import {
  mockChainLink,
  mockERC20,
  mockUniswapRouter,
  mockYearnLens,
} from "../controller-utils";

import { constants } from "../../src/utils/constants";

const tokenAddress = Address.fromString(
  "0x6b175474e89094c44da98b954eedeac495271d0f"
);

describe("prices", () => {
  describe("getChainLinkPricePerToken", () => {
    test("returns token price", () => {
      mockChainLink(
        constants.CHAIN_LINK_CONTRACT_ADDRESS,
        tokenAddress,
        constants.CHAIN_LINK_USD_ADDRESS,
        BigInt.fromString("99975399"),
        8
      );

      const result = getChainLinkPricePerToken(tokenAddress);

      assert.stringEquals("0.99975399", result!.toString());
    });
  });

  describe("getUniswapPricePerToken", () => {
    test("returns token price", () => {
      mockERC20(tokenAddress, "DAI", "DAI", 18);
      mockERC20(constants.USDC_ADDRESS, "USDC", "USDC", 6);
      mockUniswapRouter(
        constants.UNISWAP_ROUTER_CONTRACT_ADDRESS,
        BigInt.fromString("1000000000000000000"), // 1 dai
        [tokenAddress, constants.WETH_ADDRESS, constants.USDC_ADDRESS],
        BigInt.fromString("991234")
      );

      const result = getUniswapPricePerToken(tokenAddress);

      assert.stringEquals("0.991234", result!.toString());
    });
  });

  describe("getYearnLensPricePerToken", () => {
    test("returns token price", () => {
      mockYearnLens(
        constants.YEARN_LENS_CONTRACT_ADDRESS,
        tokenAddress,
        BigInt.fromString("991234")
      );

      const result = getYearnLensPricePerToken(tokenAddress);

      assert.stringEquals("0.991234", result!.toString());
    });
  });

  describe("getPrice", () => {
    test("returns amount in USD", () => {
      const result = getPrice(tokenAddress, BigDecimal.fromString("2"));

      assert.stringEquals("1.99950798", result.toString());
    });
  });
});
