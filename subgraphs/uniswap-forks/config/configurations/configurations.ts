import { UniswapV2MainnetConfigurations } from "../uniswap-v2/mainnet/mainnet";
import { ApeswapBscConfigurations } from "../apeswap/bsc/bsc";
import { ApeswapMaticConfigurations } from "../apeswap/matic/matic";
import { SushiswapArbitrumConfigurations } from "../sushiswap/arbitrum/arbitrum";
import { SushiswapAvalancheConfigurations } from "../sushiswap/avalanche/avalanche";
import { SushiswapBscConfigurations } from "../sushiswap/bsc/bsc";
import { SushiswapCeloConfigurations } from "../sushiswap/celo/celo";
import { SushiswapFantomConfigurations } from "../sushiswap/fantom/fantom";
import { SushiswapFuseConfigurations } from "../sushiswap/fuse/fuse";
import { SushiswapMainnetConfigurations } from "../sushiswap/mainnet/mainnet";
import { SushiswapMaticConfigurations } from "../sushiswap/matic/matic";
import { SushiswapMoonbeamConfigurations } from "../sushiswap/moonbeam/moonbeam";
import { SushiswapMoonriverConfigurations } from "../sushiswap/moonriver/moonriver";
import { SushiswapXdaiConfigurations } from "../sushiswap/xdai/xdai";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log, TypedMap } from "@graphprotocol/graph-ts";

// export let UniswapV2MainnetConfigurations = new TypedMap<string, string>();
export let configurationsMap = new TypedMap<string, Configurations>()
configurationsMap.set(Deploy.APESWAP_BSC, new ApeswapBscConfigurations())
configurationsMap.set(Deploy.APESWAP_MATIC, new ApeswapMaticConfigurations())
configurationsMap.set(Deploy.SUSHISWAP_ARBITRUM, new SushiswapArbitrumConfigurations())
configurationsMap.set(Deploy.SUSHISWAP_AVALANCHE, new SushiswapAvalancheConfigurations())
configurationsMap.set(Deploy.SUSHISWAP_BSC, new SushiswapBscConfigurations())
configurationsMap.set(Deploy.SUSHISWAP_CELO, new SushiswapCeloConfigurations())
configurationsMap.set(Deploy.SUSHISWAP_FANTOM, new SushiswapFantomConfigurations())
configurationsMap.set(Deploy.SUSHISWAP_FUSE, new SushiswapFuseConfigurations())
configurationsMap.set(Deploy.SUSHISWAP_MAINNET, new SushiswapMainnetConfigurations())
configurationsMap.set(Deploy.SUSHISWAP_MATIC, new SushiswapMaticConfigurations())
configurationsMap.set(Deploy.SUSHISWAP_MOONBEAM, new SushiswapMoonbeamConfigurations())
configurationsMap.set(Deploy.SUSHISWAP_MOONRIVER, new SushiswapMoonriverConfigurations())
configurationsMap.set(Deploy.SUSHISWAP_XDAI, new SushiswapXdaiConfigurations())
configurationsMap.set(Deploy.UNISWAP_V2_MAINNET, new UniswapV2MainnetConfigurations())

export function getNetworkConfigurations(deploy: string): Configurations | void {
    log.warning("Loading configurations for: " + deploy, []);
    if (deploy == Deploy.UNISWAP_V2_MAINNET) {
        return new UniswapV2MainnetConfigurations();
    } else if (deploy == Deploy.APESWAP_BSC) {
        return new ApeswapBscConfigurations();
    } else if (deploy == Deploy.APESWAP_MATIC) {
        return new ApeswapMaticConfigurations();
    } else if (deploy == Deploy.SUSHISWAP_ARBITRUM) {
        return new SushiswapArbitrumConfigurations();
    } else if (deploy == Deploy.SUSHISWAP_AVALANCHE) {
        return new SushiswapAvalancheConfigurations();
    } else if (deploy == Deploy.SUSHISWAP_BSC) {
        return new SushiswapBscConfigurations();
    } else if (deploy == Deploy.SUSHISWAP_CELO) {
        return new SushiswapCeloConfigurations();
    } else if (deploy == Deploy.SUSHISWAP_FANTOM) {
        return new SushiswapFantomConfigurations();
    } else if (deploy == Deploy.SUSHISWAP_FUSE) {
        return new SushiswapFuseConfigurations();
    } else if (deploy == Deploy.SUSHISWAP_MAINNET) {
        return new SushiswapMainnetConfigurations();
    } else if (deploy == Deploy.SUSHISWAP_MATIC) {
        return new SushiswapMaticConfigurations();
    } else if (deploy == Deploy.SUSHISWAP_MOONBEAM) {
        return new SushiswapMoonbeamConfigurations();
    } else if (deploy == Deploy.SUSHISWAP_MOONRIVER) {
        return new SushiswapMoonriverConfigurations();
    } else if (deploy == Deploy.SUSHISWAP_XDAI) {
        return new SushiswapXdaiConfigurations();
    } else {
        log.critical("No configurations found for deployment: " + deploy, []);
    }
}