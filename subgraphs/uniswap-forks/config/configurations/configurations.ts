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
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
    switch(deploy) {
        case Deploy.APESWAP_BSC: {
            return new ApeswapBscConfigurations();
        } case Deploy.APESWAP_MATIC: {
            return new ApeswapMaticConfigurations();
        } case Deploy.SUSHISWAP_ARBITRUM: {
            return new SushiswapArbitrumConfigurations();
        } case Deploy.SUSHISWAP_AVALANCHE: {
            return new SushiswapAvalancheConfigurations();
        } case Deploy.SUSHISWAP_BSC: {
            return new SushiswapBscConfigurations();
        } case Deploy.SUSHISWAP_CELO: {
            return new SushiswapCeloConfigurations();
        } case Deploy.SUSHISWAP_FANTOM: {
            return new SushiswapFantomConfigurations();
        } case Deploy.SUSHISWAP_FUSE: {
            return new SushiswapFuseConfigurations();
        } case Deploy.SUSHISWAP_MAINNET: {
            return new SushiswapMainnetConfigurations();
        } case Deploy.SUSHISWAP_MATIC: {
            return new SushiswapMaticConfigurations();
        } case Deploy.SUSHISWAP_MOONBEAM: {
            return new SushiswapMoonbeamConfigurations();
        } case Deploy.SUSHISWAP_MOONRIVER: {
            return new SushiswapMoonriverConfigurations();
        } case Deploy.SUSHISWAP_XDAI: {
            return new SushiswapXdaiConfigurations();
        } case Deploy.UNISWAP_V2_MAINNET: {
            return new UniswapV2MainnetConfigurations();
        } default: {
            log.critical("No configurations found for deployment protocol/network", []);
            return new SushiswapArbitrumConfigurations();
        }
    }
}