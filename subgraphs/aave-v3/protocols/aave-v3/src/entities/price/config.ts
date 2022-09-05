import {
  BigDecimal,
  BigInt,
  dataSource,
  TypedMap,
} from "@graphprotocol/graph-ts";

const OPTIMISM = "optimism";
const OPTIMISM_U3_USDC_WETH_005_ADDRESS = "0x85149247691df622eaf1a8bd0cafd40bc45154a9"; // 005 seems the most liquid
const OPTIMISM_U3_FACTORY_ADDRESS = "0x1f98431c8ad98523631ae4a59f267346ea31f984";
const OPTIMISM_WETH = "0x4200000000000000000000000000000000000006";
const OPTIMISM_USDC = "0x7f5c764cbc14f9669b88837ca1490cca17c31607";

class PriceConfig {
  FACTORY_ADDRESS: string;
  USDC_WETH_POOL_ADDRESS: string;
  USDC_ADDRESS: string;
  USDC_DECIMALS: BigDecimal;
  WETH_ADDRESS: string;
  WETH_DECIMALS: BigDecimal;
}

const uniswapV3Config = new TypedMap<string, PriceConfig>();
uniswapV3Config.set(OPTIMISM, <PriceConfig>{
  FACTORY_ADDRESS: OPTIMISM_U3_FACTORY_ADDRESS,
  USDC_WETH_POOL_ADDRESS: OPTIMISM_U3_USDC_WETH_005_ADDRESS,
  USDC_ADDRESS: OPTIMISM_USDC,
  USDC_DECIMALS: BigDecimal.fromString("1e6"),
  WETH_ADDRESS: OPTIMISM_WETH,
  WETH_DECIMALS: BigDecimal.fromString("1e18"),
});

// getPriceFallbackConfig will return UniswapV3 info, if available for the current network,
// to calculate prices as a fallback mechanism.
export function getPriceFallbackConfig(): PriceConfig | null {
  let net = dataSource.network();
  return uniswapV3Config.get(net);
}
