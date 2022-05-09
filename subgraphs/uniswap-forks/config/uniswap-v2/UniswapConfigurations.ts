import { TypedMap } from "@graphprotocol/graph-ts";
import { Network } from "../../src/common/constants";
import { ConfigurationFields } from "../configurations/fields";
import { UniswapV2MainnetConfigurations } from "./mainnet/mainnet";

export let UniswapV2Configurations = new TypedMap<string, TypedMap<string, string>>();
UniswapV2Configurations.set(Network.ARBITRUM_ONE, UniswapV2MainnetConfigurations);

// export const UniswapV2Configurations = {
//     [Network.ARBITRUM_ONE]: UniswapV2MainnetConfigurations
// };

// export const UniswapV2Configurations: HashMap<ConfigurationFields> = {
//   [Network.MAINNET]: UniswapV2MainnetConfigurations,
// };

// export var UniswapV2Configurations: NetworkConfigurationFields = {
//     [Network.MAINNET]: UniswapV2MainnetConfigurations,
//   }
  