import { Network } from "../../src/common/constants";
import { NetworkFieldMap } from "../configurations/types";
import { SushiswapArbitrumConfigurations } from "./arbitrum/arbitrum";
import { SushiswapAvalancheConfigurations } from "./avalanche/avalanche";
import { SushiswapBscConfigurations } from "./bsc/bsc";
import { SushiswapCeloConfigurations } from "./celo/celo";
import { SushiswapFantomConfigurations } from "./fantom/fantom";
import { SushiswapFuseConfigurations } from "./fuse/fuse";
import { SushiswapMainnetConfigurations } from "./mainnet/mainnet";
import { SushiswapMaticConfigurations } from "./matic/matic";
import { SushiswapMoonbeamConfigurations } from "./moonbeam/moonbeam";
import { SushiswapMoonriverConfigurations } from "./moonriver/moonriver";
import { SushiswapXdaiConfigurations } from "./xdai/xdai";
    

export const SushiswapConfigurations: NetworkFieldMap = {
    [Network.ARBITRUM_ONE]: SushiswapArbitrumConfigurations,
    [Network.AVALANCHE]: SushiswapAvalancheConfigurations,
    [Network.BSC]: SushiswapBscConfigurations,
    [Network.CELO]: SushiswapCeloConfigurations,
    [Network.FANTOM]: SushiswapFantomConfigurations,
    [Network.FUSE]: SushiswapFuseConfigurations,
    [Network.MAINNET]: SushiswapMainnetConfigurations,
    [Network.MATIC]: SushiswapMaticConfigurations,
    [Network.MOONBEAM]: SushiswapMoonbeamConfigurations,
    [Network.MOONRIVER]: SushiswapMoonriverConfigurations,
    [Network.XDAI]: SushiswapXdaiConfigurations,
  }