import { log } from "@graphprotocol/graph-ts";
import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  ArbitrumToken,
  MainnetToken,
  ArbitrumAmm,
  ArbitrumBridge,
  XdaiToken,
  PolygonToken,
  OptimismToken,
  ArbitrumRewardToken,
  ZERO_ADDRESS,
  RewardTokens,
  ArbitrumHtoken,
  ArbitrumNovaToken,
  ArbitrumNovaAmm,
  ArbitrumNovaHtoken,
  BaseToken,
  LineaToken,
  PolygonZKEVMToken,
} from "../../../../../src/sdk/util/constants";
import { Network } from "../../../../../src/sdk/util/constants";
export class HopProtocolArbitrumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.ARBITRUM_ONE;
  }
  getArbitrumNovaPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
  }
  getPoolAddressFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == ArbitrumToken.USDC) return ArbitrumAmm.USDC;
    else if (tokenAddress == ArbitrumToken.DAI) return ArbitrumAmm.DAI;
    else if (tokenAddress == ArbitrumToken.USDT) return ArbitrumAmm.USDT;
    else if (tokenAddress == ArbitrumToken.ETH) return ArbitrumAmm.ETH;
    else if (tokenAddress == ArbitrumToken.rETH) return ArbitrumAmm.rETH;
    else {
      log.critical("Token not found", []);
      return "";
    }
  }
  getTokenDetails(tokenAddress: string): string[] {
    if (this.getUsdcTokens().includes(tokenAddress)) {
      return ["USDC", "USDC", "6", ArbitrumBridge.USDC];
    } else if (this.getDaiTokens().includes(tokenAddress)) {
      return ["DAI", "DAI", "18", ArbitrumBridge.DAI];
    } else if (this.getUsdtTokens().includes(tokenAddress)) {
      return ["USDT", "USDT", "6", ArbitrumBridge.USDT];
    } else if (this.getRethTokens().includes(tokenAddress)) {
      return ["rETH", "Rocket Pool Ethereum", "18", ArbitrumBridge.rETH];
    } else if (this.getMagicTokens().includes(tokenAddress)) {
      return ["MAGIC", "MAGIC", "18", ArbitrumBridge.MAGIC];
    } else if (this.getEthTokens().includes(tokenAddress)) {
      return ["ETH", "ETH", "18", ArbitrumBridge.ETH];
    } else if (tokenAddress == RewardTokens.GNO) {
      return ["GNO", "Gnosis Token", "18", ZERO_ADDRESS];
    } else if (tokenAddress == RewardTokens.rETH_ARB) {
      return ["rETH", "Rocket Pool Ethereum", "18", ZERO_ADDRESS];
    } else if (tokenAddress == RewardTokens.HOP) {
      return ["HOP", "HOP Token", "18", ZERO_ADDRESS];
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
    else if (chainId == "42170")
      return this.getArbitrumNovaConfigFromTokenAddress(tokenAddress)[0];
    else if (chainId == "1")
      return this.getMainnetCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "8453")
      return this.getBaseCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "59144")
      return this.getLineaCrossTokenFromTokenAddress(tokenAddress);
    else if (chainId == "1101")
      return this.getPolygonZKEVMCrossTokenFromTokenAddress(tokenAddress);
    else {
      log.critical("Chain not found: {}", [chainId]);
      return "";
    }
  }

  getArbitrumCrossTokenFromTokenAddress(tokenAddress: string): string {
    return tokenAddress;
  }

  getArbitrumNovaConfigFromTokenAddress(tokenAddress: string): string[] {
    if (tokenAddress == ArbitrumToken.ETH)
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
    else if (tokenAddress == ArbitrumToken.MAGIC)
      return [
        ArbitrumNovaToken.MAGIC,
        ArbitrumNovaHtoken.MAGIC,
        "HOP-MAGIC",
        "hMAGIC/MAGIC Nova Pool - MAGIC",
        "hMAGIC/MAGIC Nova Pool - hMAGIC",
        ArbitrumNovaAmm.MAGIC,
        this.getTokenDetails(tokenAddress)[0],
        this.getTokenDetails(tokenAddress)[1],
        this.getTokenDetails(tokenAddress)[2],
      ];
    else {
      log.critical("Config not found", []);
    }
    return [""];
  }

  getPolygonCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == ArbitrumToken.USDC) return PolygonToken.USDC;
    else if (tokenAddress == ArbitrumToken.DAI) return PolygonToken.DAI;
    else if (tokenAddress == ArbitrumToken.USDT) return PolygonToken.USDT;
    else if (tokenAddress == ArbitrumToken.ETH) return PolygonToken.ETH;
    else {
      log.critical("Token not found", []);
    }
    return "";
  }

  getXdaiCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == ArbitrumToken.USDC) return XdaiToken.USDC;
    else if (tokenAddress == ArbitrumToken.DAI) return XdaiToken.DAI;
    else if (tokenAddress == ArbitrumToken.USDT) return XdaiToken.USDT;
    else if (tokenAddress == ArbitrumToken.ETH) return XdaiToken.ETH;
    else {
      log.critical("Token not found", []);
    }
    return "";
  }

  getOptimismCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == ArbitrumToken.USDC) {
      return OptimismToken.USDC;
    } else if (tokenAddress == ArbitrumToken.DAI) {
      return OptimismToken.DAI;
    } else if (tokenAddress == ArbitrumToken.USDT) {
      return OptimismToken.USDT;
    } else if (tokenAddress == ArbitrumToken.ETH) {
      return OptimismToken.ETH;
    } else if (tokenAddress == ArbitrumToken.rETH) {
      return OptimismToken.rETH;
    } else {
      log.critical("Token not found", []);
    }
    return "";
  }

  getMainnetCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == ArbitrumToken.USDC) return MainnetToken.USDC;
    else if (tokenAddress == ArbitrumToken.DAI) return MainnetToken.DAI;
    else if (tokenAddress == ArbitrumToken.USDT) return MainnetToken.USDT;
    else if (tokenAddress == ArbitrumToken.ETH) return MainnetToken.ETH;
    else if (tokenAddress == ArbitrumToken.rETH) return MainnetToken.rETH;
    else if (tokenAddress == ArbitrumToken.MAGIC) return MainnetToken.MAGIC;
    else {
      log.critical("Token not found", []);
    }
    return "";
  }

  getBaseCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == ArbitrumToken.USDC) return BaseToken.USDC;
    if (tokenAddress == ArbitrumToken.ETH) return BaseToken.ETH;
    else {
      log.critical("Base CrossToken not found for token: {}", [tokenAddress]);
    }
    return "";
  }

  getLineaCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == ArbitrumToken.ETH) return LineaToken.ETH;
    else {
      log.critical("Linea CrossToken not found for token: {}", [tokenAddress]);
    }
    return "";
  }

  getPolygonZKEVMCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == ArbitrumToken.ETH) return PolygonZKEVMToken.ETH;
    else {
      log.critical("PolygonZKEVM CrossToken not found for token: {}", [
        tokenAddress,
      ]);
    }
    return "";
  }

  getTokenAddressFromBridgeAddress(bridgeAddress: string): string[] {
    if (bridgeAddress == ArbitrumBridge.USDC) {
      return [ArbitrumToken.USDC, ArbitrumHtoken.USDC];
    } else if (bridgeAddress == ArbitrumBridge.DAI) {
      return [ArbitrumToken.DAI, ArbitrumHtoken.DAI];
    } else if (bridgeAddress == ArbitrumBridge.USDT) {
      return [ArbitrumToken.USDT, ArbitrumHtoken.USDT];
    } else if (bridgeAddress == ArbitrumBridge.ETH) {
      return [ArbitrumToken.ETH, ArbitrumHtoken.ETH];
    } else if (bridgeAddress == ArbitrumBridge.rETH) {
      return [ArbitrumToken.rETH, ArbitrumHtoken.rETH];
    } else if (bridgeAddress == ArbitrumBridge.MAGIC) {
      return [ArbitrumToken.MAGIC, ArbitrumHtoken.MAGIC];
    } else {
      log.critical("Token not found", []);
      return [""];
    }
  }

  getTokenAddressFromPoolAddress(poolAddress: string): string[] {
    if (poolAddress == ArbitrumAmm.USDC)
      return [ArbitrumToken.USDC, ArbitrumHtoken.USDC];
    else if (poolAddress == ArbitrumAmm.DAI)
      return [ArbitrumToken.DAI, ArbitrumHtoken.DAI];
    else if (poolAddress == ArbitrumAmm.USDT)
      return [ArbitrumToken.USDT, ArbitrumHtoken.USDT];
    else if (poolAddress == ArbitrumAmm.ETH)
      return [ArbitrumToken.ETH, ArbitrumHtoken.ETH];
    else if (poolAddress == ArbitrumAmm.rETH)
      return [ArbitrumToken.rETH, ArbitrumHtoken.rETH];
    else if (poolAddress == ArbitrumAmm.MAGIC)
      return [ArbitrumToken.MAGIC, ArbitrumHtoken.MAGIC];
    else {
      log.critical("Token not found", []);
      return [""];
    }
  }

  getPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    if (bridgeAddress == ArbitrumBridge.USDC) return ArbitrumAmm.USDC;
    else if (bridgeAddress == ArbitrumBridge.DAI) return ArbitrumAmm.DAI;
    else if (bridgeAddress == ArbitrumBridge.USDT) return ArbitrumAmm.USDT;
    else if (bridgeAddress == ArbitrumBridge.ETH) return ArbitrumAmm.ETH;
    else if (bridgeAddress == ArbitrumBridge.rETH) return ArbitrumAmm.rETH;
    else if (bridgeAddress == ArbitrumBridge.MAGIC) return ArbitrumAmm.MAGIC;
    else {
      log.critical("Address not found", []);
      return "";
    }
  }

  getPoolDetails(poolAddress: string): string[] {
    if (poolAddress == ArbitrumAmm.USDC) {
      return ["HOP-USDC", "hUSDC/USDC Pool - USDC", "hUSDC/USDC Pool - hUSDC"];
    } else if (poolAddress == ArbitrumAmm.DAI) {
      return ["HOP-DAI", "hDAI/DAI Pool - DAI", "hDAI/DAI Pool - hDAI"];
    } else if (poolAddress == ArbitrumAmm.USDT) {
      return ["HOP-USDT", "hUSDT/USDT Pool - USDT", "hUSDT/USDT Pool - hUSDT"];
    } else if (poolAddress == ArbitrumAmm.ETH) {
      return ["HOP-ETH", "hETH/ETH Pool - ETH", "hETH/ETH Pool - hETH"];
    } else if (poolAddress == ArbitrumAmm.rETH) {
      return ["HOP-rETH", "hrETH/rETH Pool - ETH", "hrETH/rETH Pool - hrETH"];
    } else if (poolAddress == ArbitrumAmm.MAGIC) {
      return [
        "HOP-MAGIC",
        "hMAGIC/MAGIC Pool - MAGIC",
        "hMAGIC/MAGIC Pool - hMAGIC",
      ];
    } else {
      log.critical("Token not found", []);
      return [];
    }
  }

  getTokenList(): string[] {
    return [
      ArbitrumToken.USDC,
      ArbitrumToken.DAI,
      ArbitrumToken.USDT,
      ArbitrumToken.ETH,
      ArbitrumToken.rETH,
      ArbitrumHtoken.MAGIC,
    ];
  }
  getPoolsList(): string[] {
    return [
      ArbitrumAmm.USDC,
      ArbitrumAmm.DAI,
      ArbitrumAmm.USDT,
      ArbitrumAmm.ETH,
      ArbitrumAmm.rETH,
      ArbitrumAmm.MAGIC,
    ];
  }
  getBridgeList(): string[] {
    return [
      ArbitrumBridge.USDC,
      ArbitrumBridge.DAI,
      ArbitrumBridge.USDT,
      ArbitrumBridge.ETH,
      ArbitrumBridge.rETH,
      ArbitrumBridge.MAGIC,
    ];
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
  getPolygonZKEVMPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
  }

  getPoolAddressFromChainId(chainId: string, bridgeAddress: string): string {
    return bridgeAddress;
  }
  getUsdcPools(): string[] {
    return [];
  }
  getUsdcTokens(): string[] {
    return [ArbitrumToken.USDC, ArbitrumHtoken.USDC];
  }
  getDaiTokens(): string[] {
    return [ArbitrumToken.DAI, ArbitrumHtoken.DAI];
  }
  getUsdtTokens(): string[] {
    return [ArbitrumToken.USDT, ArbitrumHtoken.USDT];
  }
  getEthTokens(): string[] {
    return [
      ArbitrumToken.ETH,
      ArbitrumHtoken.ETH,
      ArbitrumNovaToken.ETH,
      ArbitrumNovaHtoken.ETH,
    ];
  }
  getRethTokens(): string[] {
    return [ArbitrumToken.rETH, ArbitrumHtoken.rETH];
  }
  getMagicTokens(): string[] {
    return [
      ArbitrumToken.MAGIC,
      ArbitrumHtoken.MAGIC,
      ArbitrumNovaToken.MAGIC,
      ArbitrumHtoken.MAGIC,
    ];
  }
  getRethPools(): string[] {
    return [];
  }
  getsUSDPools(): string[] {
    return [];
  }
  getsUSDTokens(): string[] {
    return [];
  }
  getMagicPools(): string[] {
    return [];
  }

  getDaiPools(): string[] {
    return [];
  }
  getUsdtPools(): string[] {
    return [];
  }
  getEthPools(): string[] {
    return [];
  }
  getSnxPools(): string[] {
    return [];
  }
  getSnxTokens(): string[] {
    return [];
  }
  getMaticPools(): string[] {
    return [];
  }
  getMaticTokens(): string[] {
    return [];
  }

  getRewardTokenList(): string[] {
    return [
      ArbitrumRewardToken.DAI,
      ArbitrumRewardToken.ETH,
      ArbitrumRewardToken.USDC,
      ArbitrumRewardToken.rETH,
      ArbitrumRewardToken.USDT,
    ];
  }
  getPoolAddressFromRewardTokenAddress(rewardToken: string): string {
    if (rewardToken == ArbitrumRewardToken.DAI) return ArbitrumAmm.DAI;
    else if (rewardToken == ArbitrumRewardToken.ETH) return ArbitrumAmm.ETH;
    else if (rewardToken == ArbitrumRewardToken.USDC) return ArbitrumAmm.USDC;
    else if (rewardToken == ArbitrumRewardToken.USDT) return ArbitrumAmm.USDT;
    else if (rewardToken == ArbitrumRewardToken.rETH) return ArbitrumAmm.rETH;
    else {
      log.critical("Pool not found for reward token: {}", [rewardToken]);
      return "";
    }
  }
}
