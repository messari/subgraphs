// import { TypedMap } from "@graphprotocol/graph-ts";
// import { Network } from "../../src/common/constants";
// import { ConfigurationFields,  } from "../configurations/fields";
// import { ApeswapBscConfigurations } from "./bsc/bsc";
// import { ApeswapMaticConfigurations } from "./matic/matic";


// export let ApeswapConfigurations = new TypedMap<string, TypedMap<string, any>>();
// ApeswapConfigurations.set(Network.BSC, ApeswapBscConfigurations);
// ApeswapConfigurations.set(Network.MATIC, ApeswapMaticConfigurations);

// const ApeswapConfigurations: HashMap<ConfigurationFields> = {};
// ApeswapConfigurations[Network.BSC] = ApeswapBscConfigurations;
// ApeswapConfigurations[Network.MATIC] = ApeswapMaticConfigurations;
// export default ApeswapConfigurations

// export const UniswapV2Configurations: HashMap<ConfigurationFields> = {
//   BSC: ApeswapBscConfigurations,
//   MATIC: ApeswapMaticConfigurations
// }

// export const ApeswapConfigurations: NetworkConfigurationFields = {
//     [Network.BSC]: ApeswapBscConfigurations,
//     [Network.MATIC]: ApeswapMaticConfigurations,
//   }
  
