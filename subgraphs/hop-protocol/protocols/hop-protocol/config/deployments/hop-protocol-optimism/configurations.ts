import { log } from "@graphprotocol/graph-ts";
import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  ArbitrumToken,
  MainnetToken,
  OptimismToken,
  OptimismBridge,
  XdaiToken,
  PolygonToken,
  ZERO_ADDRESS,
  OptimismAmm,
  OptimismRewardToken,
  RewardTokens,
  OptimismHtoken,
  ArbitrumNovaToken,
  ArbitrumNovaHtoken,
  ArbitrumNovaAmm,
} from "../../../../../src/sdk/util/constants";
import { Network } from "../../../../../src/sdk/util/constants";
export class HopProtocolOptimismConfigurations implements Configurations {
  getNetwork(): string {
    return Network.OPTIMISM;
  }
  getArbitrumPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
  }
  getPolygonPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
  }
  getXdaiPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
  }
  getOptimismPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
  }
  getPoolAddressFromChainId(chainId: string, bridgeAddress: string): string {
    return bridgeAddress || chainId;
  }

  getPoolAddressFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == OptimismToken.USDC) return OptimismAmm.USDC;
    else if (tokenAddress == OptimismToken.DAI) return OptimismAmm.DAI;
    else if (tokenAddress == OptimismToken.USDT) return OptimismAmm.USDT;
    else if (tokenAddress == OptimismToken.ETH) return OptimismAmm.ETH;
    else if (tokenAddress == OptimismToken.SNX) return OptimismAmm.SNX;
    else if (tokenAddress == OptimismToken.rETH) return OptimismAmm.rETH;
    else if (tokenAddress == OptimismToken.sUSD) return OptimismAmm.sUSD;
    else {
      log.critical("Token not found", []);
      return "";
    }
  }

  getPoolAddressFromRewardTokenAddress(rewardToken: string): string {
    if (rewardToken == OptimismRewardToken.SNX_A) return OptimismAmm.SNX;
    else if (rewardToken == OptimismRewardToken.SNX_B) return OptimismAmm.SNX;
    else if (rewardToken == OptimismRewardToken.DAI) return OptimismAmm.DAI;
    else if (rewardToken == OptimismRewardToken.ETH) return OptimismAmm.ETH;
    else if (rewardToken == OptimismRewardToken.rETH) return OptimismAmm.rETH;
    else if (rewardToken == OptimismRewardToken.sUSD_A) return OptimismAmm.sUSD;
    else if (rewardToken == OptimismRewardToken.sUSD_B) return OptimismAmm.sUSD;
    else if (rewardToken == OptimismRewardToken.USDC) return OptimismAmm.USDC;
    else if (rewardToken == OptimismRewardToken.USDT) return OptimismAmm.USDT;
    else {
      log.critical("RewardToken not found", []);
      return "";
    }
  }
  getTokenDetails(tokenAddress: string): string[] {
    if (this.getUsdcTokens().includes(tokenAddress)) {
      return ["USDC", "USD Coin", "6", OptimismBridge.USDC];
    } else if (this.getDaiTokens().includes(tokenAddress)) {
      return ["DAI", "DAI Stablecoin", "18", OptimismBridge.DAI];
    } else if (this.getUsdtTokens().includes(tokenAddress)) {
      return ["USDT", "Tether USD", "6", OptimismBridge.USDT];
    } else if (this.getsUSDTokens().includes(tokenAddress)) {
      return ["sUSD", "sUSD", "18", OptimismBridge.sUSD];
    } else if (this.getRethTokens().includes(tokenAddress)) {
      return ["rETH", "Rocket Pool Ethereum", "18", OptimismBridge.rETH];
    } else if (this.getEthTokens().includes(tokenAddress)) {
      return ["ETH", "Ethereum", "18", OptimismBridge.ETH];
    } else if (this.getSnxTokens().includes(tokenAddress)) {
      return ["SNX", "SNX", "18", OptimismBridge.SNX];
    } else if (tokenAddress == RewardTokens.GNO) {
      return ["GNO", "Gnosis Token", "18", ZERO_ADDRESS];
    } else if (tokenAddress == RewardTokens.HOP) {
      return ["HOP", "HOP Token", "18", ZERO_ADDRESS];
    } else if (tokenAddress == RewardTokens.OP) {
      return ["OP", "Optimism Token", "18", ZERO_ADDRESS];
    } else if (tokenAddress == RewardTokens.rETH_OP) {
      return ["rETH", "Rocket Pool Ethereum", "18", ZERO_ADDRESS];
    } else {
      log.critical("Token not found", []);
      return [];
    }
  }
  getCrossTokenAddress(chainId: string, tokenAddress: string): string {
    if (chainId == "42161")
      return this.getArbitrumCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "10")
      return this.getOptimismCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "100")
      return this.getXdaiCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "137")
      return this.getPolygonCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "1")
      return this.getMainnetCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "42170")
      return this.getArbitrumNovaConfigFromTokenAddress(tokenAddress)[0];
    else {
      log.critical("Chain not found", []);
      return "";
    }
  }

  getArbitrumCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == OptimismToken.USDC) return ArbitrumToken.USDC;
    else if (tokenAddress == OptimismToken.DAI) return ArbitrumToken.DAI;
    else if (tokenAddress == OptimismToken.USDT) return ArbitrumToken.USDT;
    else if (tokenAddress == OptimismToken.ETH) return ArbitrumToken.ETH;
    else if (tokenAddress == OptimismToken.rETH) return ArbitrumToken.rETH;
    else {
      log.critical("Token not found", []);
    }
    return "";
  }
  getPolygonCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == OptimismToken.USDC) return PolygonToken.USDC;
    else if (tokenAddress == OptimismToken.DAI) return PolygonToken.DAI;
    else if (tokenAddress == OptimismToken.USDT) return PolygonToken.USDT;
    else if (tokenAddress == OptimismToken.ETH) return PolygonToken.ETH;
    else {
      log.critical("Token not found", []);
    }
    return "";
  }
  getXdaiCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == OptimismToken.USDC) return XdaiToken.USDC;
    else if (tokenAddress == OptimismToken.DAI) return XdaiToken.DAI;
    else if (tokenAddress == OptimismToken.USDT) return XdaiToken.USDT;
    else if (tokenAddress == OptimismToken.ETH) return XdaiToken.ETH;
    else {
      log.critical("Token not found", []);
    }
    return "";
  }
  getArbitrumNovaConfigFromTokenAddress(tokenAddress: string): string[] {
    if (tokenAddress == OptimismToken.ETH)
      return [
        ArbitrumNovaToken.ETH,
        ArbitrumNovaHtoken.ETH,
        "HOP-ETH",
        "hETH/ETH Nova Pool - ETH",
        "hETH/ETH Nova Pool - hETH",
        ArbitrumNovaAmm.ETH,
        this.getTokenDetails(tokenAddress)[0],
        this.getTokenDetails(tokenAddress)[1],
        this.getTokenDetails(tokenAddress)[2],
      ];
    else {
      log.critical("Config not found", []);
    }
    return [""];
  }

  getOptimismCrossTokenFromTokenAddress(tokenAddress: string): string {
    log.critical("CrossToken not found", []);
    return tokenAddress;
  }

  getMainnetCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == OptimismToken.USDC) return MainnetToken.USDC;
    else if (tokenAddress == OptimismToken.DAI) return MainnetToken.DAI;
    else if (tokenAddress == OptimismToken.USDT) return MainnetToken.USDT;
    else if (tokenAddress == OptimismToken.SNX) return MainnetToken.SNX;
    else if (tokenAddress == OptimismToken.ETH) return MainnetToken.ETH;
    else if (tokenAddress == OptimismToken.sUSD) return MainnetToken.sUSD;
    else if (tokenAddress == OptimismToken.rETH) return MainnetToken.rETH;
    else {
      log.critical("Token not found", []);
    }
    return "";
  }

  getArbitrumNovaPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
  }

  getTokenAddressFromBridgeAddress(bridgeAddress: string): string[] {
    if (bridgeAddress == OptimismBridge.USDC) {
      return [OptimismToken.USDC, OptimismHtoken.USDC];
    } else if (bridgeAddress == OptimismBridge.DAI) {
      return [OptimismToken.DAI, OptimismHtoken.DAI];
    } else if (bridgeAddress == OptimismBridge.USDT) {
      return [OptimismToken.USDT, OptimismHtoken.USDT];
    } else if (bridgeAddress == OptimismBridge.ETH) {
      return [OptimismToken.ETH, OptimismHtoken.ETH];
    } else if (bridgeAddress == OptimismBridge.SNX) {
      return [OptimismToken.SNX, OptimismHtoken.SNX];
    } else if (bridgeAddress == OptimismBridge.sUSD) {
      return [OptimismToken.sUSD, OptimismHtoken.sUSD];
    } else if (bridgeAddress == OptimismBridge.rETH) {
      return [OptimismToken.rETH, OptimismHtoken.rETH];
    } else {
      log.critical("Token not found", []);
      return [""];
    }
  }
  getTokenAddressFromPoolAddress(poolAddress: string): string[] {
    if (poolAddress == OptimismAmm.USDC)
      return [OptimismToken.USDC, OptimismHtoken.USDC];
    else if (poolAddress == OptimismAmm.DAI)
      return [OptimismToken.DAI, OptimismHtoken.DAI];
    else if (poolAddress == OptimismAmm.USDT)
      return [OptimismToken.USDT, OptimismHtoken.USDT];
    else if (poolAddress == OptimismAmm.ETH)
      return [OptimismToken.ETH, OptimismHtoken.ETH];
    else if (poolAddress == OptimismAmm.SNX)
      return [OptimismToken.SNX, OptimismHtoken.SNX];
    else if (poolAddress == OptimismAmm.sUSD)
      return [OptimismToken.sUSD, OptimismHtoken.sUSD];
    else if (poolAddress == OptimismAmm.rETH)
      return [OptimismToken.rETH, OptimismHtoken.rETH];
    else {
      log.critical("Token not found", []);
      return [""];
    }
  }

  getPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    if (bridgeAddress == OptimismBridge.USDC) return OptimismAmm.USDC;
    else if (bridgeAddress == OptimismBridge.DAI) return OptimismAmm.DAI;
    else if (bridgeAddress == OptimismBridge.USDT) return OptimismAmm.USDT;
    else if (bridgeAddress == OptimismBridge.ETH) return OptimismAmm.ETH;
    else if (bridgeAddress == OptimismBridge.SNX) return OptimismAmm.SNX;
    else if (bridgeAddress == OptimismBridge.sUSD) return OptimismAmm.sUSD;
    else if (bridgeAddress == OptimismBridge.rETH) return OptimismAmm.rETH;
    else {
      log.critical("Address not found", []);
      return "";
    }
  }

  getPoolDetails(poolAddress: string): string[] {
    if (poolAddress == OptimismAmm.USDC) {
      return ["HOP-USDC", "hUSDC/USDC Pool - USDC", "hUSDC/USDC Pool - hUSDC"];
    } else if (poolAddress == OptimismAmm.DAI) {
      return ["HOP-DAI", "hDAI/DAI Pool - DAI", "hDAI/DAI Pool - hDAI"];
    } else if (poolAddress == OptimismAmm.USDT) {
      return ["HOP-USDT", "hUSDT/USDT Pool - USDT", "hUSDT/USDT Pool - hUSDT"];
    } else if (poolAddress == OptimismAmm.ETH) {
      return ["HOP-ETH", "hETH/ETH Pool - ETH", "hETH/ETH Pool - hETH"];
    } else if (poolAddress == OptimismAmm.SNX) {
      return ["HOP-SNX", "hSNX/SNX Pool - SNX", "hSNX/SNX Pool - hSNX"];
    } else if (poolAddress == OptimismAmm.rETH) {
      return ["HOP-rETH", "hrETH/rETH Pool - rETH", "hrETH/rETH Pool - hrETH"];
    } else if (poolAddress == OptimismAmm.sUSD) {
      return ["HOP-sUSD", "hsUSD/sUSD Pool - SNX", "hsUSD /sUSD Pool - hsUSD"];
    } else if (poolAddress == ZERO_ADDRESS) {
      return ["HOP-POOL", "HOP/HOP Pool - HOP", "hHOP/HOP Pool - hHOP"];
    } else {
      log.critical("Token not found", []);
      return [];
    }
  }

  getTokenList(): string[] {
    return [
      OptimismToken.USDC,
      OptimismToken.DAI,
      OptimismToken.USDT,
      OptimismToken.ETH,
      OptimismToken.SNX,
      OptimismToken.sUSD,
      OptimismToken.rETH,
    ];
  }
  getPoolsList(): string[] {
    return [
      OptimismAmm.USDC,
      OptimismAmm.DAI,
      OptimismAmm.USDT,
      OptimismAmm.SNX,
      OptimismAmm.ETH,
      OptimismAmm.rETH,
      OptimismAmm.sUSD,
    ];
  }
  getBridgeList(): string[] {
    return [
      OptimismBridge.USDC,
      OptimismBridge.DAI,
      OptimismBridge.USDT,
      OptimismBridge.SNX,
      OptimismBridge.ETH,
      OptimismBridge.rETH,
      OptimismBridge.sUSD,
    ];
  }
  getRewardTokenList(): string[] {
    return [
      OptimismRewardToken.SNX_A,
      OptimismRewardToken.SNX_B,
      OptimismRewardToken.DAI,
      OptimismRewardToken.sUSD_A,
      OptimismRewardToken.sUSD_B,
      OptimismRewardToken.rETH,
      OptimismRewardToken.ETH,
      OptimismRewardToken.USDC,
      OptimismRewardToken.USDT,
    ];
  }

  getUsdcPools(): string[] {
    return [];
  }
  getUsdcTokens(): string[] {
    return [OptimismToken.USDC, OptimismHtoken.USDC];
  }

  getRethPools(): string[] {
    return [];
  }
  getRethTokens(): string[] {
    return [OptimismToken.rETH, OptimismHtoken.rETH];
  }

  getsUSDPools(): string[] {
    return [];
  }
  getsUSDTokens(): string[] {
    return [OptimismToken.sUSD, OptimismHtoken.sUSD];
  }
  getDaiPools(): string[] {
    return [];
  }
  getDaiTokens(): string[] {
    return [OptimismToken.DAI, OptimismHtoken.DAI];
  }
  getUsdtPools(): string[] {
    return [];
  }
  getUsdtTokens(): string[] {
    return [OptimismToken.USDT, OptimismHtoken.USDT];
  }
  getEthPools(): string[] {
    return [];
  }
  getEthTokens(): string[] {
    return [
      OptimismToken.ETH,
      OptimismHtoken.ETH,
      ArbitrumNovaToken.ETH,
      ArbitrumNovaToken.ETH,
    ];
  }
  getSnxPools(): string[] {
    return [];
  }
  getSnxTokens(): string[] {
    return [OptimismToken.SNX, OptimismHtoken.SNX];
  }

  getMaticPools(): string[] {
    return [];
  }
  getMaticTokens(): string[] {
    return [];
  }
  getMagicPools(): string[] {
    return [];
  }
  getMagicTokens(): string[] {
    return [];
  }
}
