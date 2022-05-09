// import { TypedMap } from "@graphprotocol/graph-ts";
// import { Network } from "../../src/common/constants";
// import { ConfigurationFields, HashMap } from "../configurations/fields";
// import { SushiswapArbitrumConfigurations } from "./arbitrum/arbitrum";
// import { SushiswapAvalancheConfigurations } from "./avalanche/avalanche";
// import { SushiswapBscConfigurations } from "./bsc/bsc";
// import { SushiswapCeloConfigurations } from "./celo/celo";
// import { SushiswapFantomConfigurations } from "./fantom/fantom";
// import { SushiswapFuseConfigurations } from "./fuse/fuse";
// import { SushiswapMainnetConfigurations } from "./mainnet/mainnet";
// import { SushiswapMaticConfigurations } from "./matic/matic";
// import { SushiswapMoonbeamConfigurations } from "./moonbeam/moonbeam";
// import { SushiswapMoonriverConfigurations } from "./moonriver/moonriver";
// import { SushiswapXdaiConfigurations } from "./xdai/xdai";


// export let SushiswapConfigurations = new TypedMap<string, TypedMap<string, any>>();
// SushiswapConfigurations.set(Network.ARBITRUM_ONE, SushiswapArbitrumConfigurations)
// SushiswapConfigurations.set(Network.AVALANCHE, SushiswapAvalancheConfigurations)
// SushiswapConfigurations.set(Network.BSC, SushiswapBscConfigurations)
// SushiswapConfigurations.set(Network.CELO, SushiswapCeloConfigurations)
// SushiswapConfigurations.set(Network.FANTOM, SushiswapFantomConfigurations)
// SushiswapConfigurations.set(Network.FUSE, SushiswapFuseConfigurations)
// SushiswapConfigurations.set(Network.MAINNET, SushiswapMainnetConfigurations)
// SushiswapConfigurations.set(Network.MATIC, SushiswapMaticConfigurations)
// SushiswapConfigurations.set(Network.MOONBEAM, SushiswapMoonbeamConfigurations)
// SushiswapConfigurations.set(Network.MOONRIVER, SushiswapMoonriverConfigurations)
// SushiswapConfigurations.set(Network.XDAI, SushiswapXdaiConfigurations)


// const SushiswapConfigurations: HashMap<ConfigurationFields> = {};
// SushiswapConfigurations[Network.ARBITRUM_ONE] = SushiswapArbitrumConfigurations
// SushiswapConfigurations[Network.AVALANCHE] = SushiswapAvalancheConfigurations
// SushiswapConfigurations[Network.BSC] = SushiswapBscConfigurations
// SushiswapConfigurations[Network.CELO] = SushiswapCeloConfigurations
// SushiswapConfigurations[Network.FANTOM] = SushiswapFantomConfigurations
// SushiswapConfigurations[Network.FUSE] = SushiswapFuseConfigurations
// SushiswapConfigurations[Network.MAINNET] = SushiswapMainnetConfigurations
// SushiswapConfigurations[Network.MATIC] = SushiswapMaticConfigurations
// SushiswapConfigurations[Network.MOONBEAM] = SushiswapMoonbeamConfigurations
// SushiswapConfigurations[Network.MOONRIVER] = SushiswapMoonriverConfigurations
// SushiswapConfigurations[Network.XDAI] = SushiswapXdaiConfigurations
// export default SushiswapConfigurations

// export const SushiswapConfigurations: NetworkConfigurationFields = {
//     [Network.ARBITRUM_ONE]: SushiswapArbitrumConfigurations,
//     [Network.AVALANCHE]: SushiswapAvalancheConfigurations,
//     [Network.BSC]: SushiswapBscConfigurations,
//     [Network.CELO]: SushiswapCeloConfigurations,
//     [Network.FANTOM]: SushiswapFantomConfigurations,
//     [Network.FUSE]: SushiswapFuseConfigurations,
//     [Network.MAINNET]: SushiswapMainnetConfigurations,
//     [Network.MATIC]: SushiswapMaticConfigurations,
//     [Network.MOONBEAM]: SushiswapMoonbeamConfigurations,
//     [Network.MOONRIVER]: SushiswapMoonriverConfigurations,
//     [Network.XDAI]: SushiswapXdaiConfigurations,
//   }

// UniswapV2Configurations