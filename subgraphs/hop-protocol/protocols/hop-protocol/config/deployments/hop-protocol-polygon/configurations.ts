import { log } from "@graphprotocol/graph-ts";
import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  ArbitrumToken,
  MainnetToken,
  OptimismToken,
  PolygonBridge,
  XdaiToken,
  PolygonAmm,
  PolygonToken,
  PolygonRewardToken,
  ZERO_ADDRESS,
  RewardTokens,
  PolygonHtoken,
  ArbitrumNovaToken,
  ArbitrumNovaHtoken,
  ArbitrumNovaAmm,
  BaseToken,
  LineaToken,
  PolygonZKEVMToken,
} from "../../../../../src/sdk/util/constants";
import { Network } from "../../../../../src/sdk/util/constants";
export class HopProtocolPolygonConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MATIC;
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
    return bridgeAddress || chainId;
  }

  getArbitrumNovaPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    return bridgeAddress;
  }
  getPoolAddressFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonToken.USDC) {
      return PolygonAmm.USDC; //USDC AMM
    } else if (tokenAddress == PolygonToken.DAI) {
      return PolygonAmm.DAI; //DAI AMM
    } else if (tokenAddress == PolygonToken.MATIC) {
      return PolygonAmm.DAI; //MATIC AMM
    } else if (tokenAddress == PolygonToken.USDT) {
      return PolygonAmm.USDT; //USDT AMM
    } else if (tokenAddress == PolygonToken.ETH) {
      return PolygonAmm.ETH; //ETH AMM
    } else {
      log.critical("Token not found", []);
      return "";
    }
  }
  getTokenDetails(tokenAddress: string): string[] {
    if (this.getUsdcTokens().includes(tokenAddress)) {
      return ["USDC", "USD Coin", "6", PolygonBridge.USDC];
    } else if (this.getDaiTokens().includes(tokenAddress)) {
      return ["DAI", "DAI Stablecoin", "18", PolygonBridge.DAI];
    } else if (this.getUsdtTokens().includes(tokenAddress)) {
      return ["USDT", "Tether USD", "6", PolygonBridge.USDT];
    } else if (this.getEthTokens().includes(tokenAddress)) {
      return ["ETH", "ETH", "18", PolygonBridge.ETH];
    } else if (this.getMaticTokens().includes(tokenAddress)) {
      return ["MATIC", "MATIC", "18", PolygonBridge.MATIC];
    } else if (tokenAddress == RewardTokens.GNO) {
      return ["GNO", "Gnosis Token", "18", ZERO_ADDRESS];
    } else if (tokenAddress == RewardTokens.HOP) {
      return ["HOP", "HOP Token", "18", ZERO_ADDRESS];
    } else {
      log.critical("Token not found", []);
      return [];
    }
  }

  getArbitrumNovaConfigFromTokenAddress(tokenAddress: string): string[] {
    if (tokenAddress == PolygonToken.ETH)
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

  getPoolAddressFromRewardTokenAddress(rewardToken: string): string {
    if (rewardToken == PolygonRewardToken.USDC_A) return PolygonAmm.USDC;
    else if (rewardToken == PolygonRewardToken.USDC_B) return PolygonAmm.USDC;
    else if (rewardToken == PolygonRewardToken.USDT_A) return PolygonAmm.USDT;
    else if (rewardToken == PolygonRewardToken.USDT_B) return PolygonAmm.USDT;
    else if (rewardToken == PolygonRewardToken.ETH_A) return PolygonAmm.ETH;
    else if (rewardToken == PolygonRewardToken.ETH_B) return PolygonAmm.ETH;
    else if (rewardToken == PolygonRewardToken.DAI_A) return PolygonAmm.DAI;
    else if (rewardToken == PolygonRewardToken.DAI_B) return PolygonAmm.DAI;
    else if (rewardToken == PolygonRewardToken.MATIC) return PolygonAmm.MATIC;
    else {
      log.critical("Pool not found for reward token: {}", [rewardToken]);
      return "";
    }
  }

  getTokenAddressFromBridgeAddress(bridgeAddress: string): string[] {
    if (bridgeAddress == PolygonBridge.USDC) {
      return [PolygonToken.USDC, PolygonHtoken.USDC];
    } else if (bridgeAddress == PolygonBridge.DAI) {
      return [PolygonToken.DAI, PolygonHtoken.DAI];
    } else if (bridgeAddress == PolygonBridge.USDT) {
      return [PolygonToken.USDT, PolygonHtoken.USDT];
    } else if (bridgeAddress == PolygonBridge.ETH) {
      return [PolygonToken.ETH, PolygonHtoken.ETH];
    } else if (bridgeAddress == PolygonBridge.MATIC) {
      return [PolygonToken.MATIC, PolygonHtoken.MATIC];
    } else {
      log.critical("Token not found", []);
      return [""];
    }
  }

  getCrossTokenAddress(chainId: string, tokenAddress: string): string {
    if (chainId == "42161") {
      return this.getArbitrumCrossTokenFromTokenAddress(tokenAddress); //Arbitrum
    } else if (chainId == "10") {
      return this.getOptimismCrossTokenFromTokenAddress(tokenAddress); //Optimism
    } else if (chainId == "100") {
      return this.getXdaiCrossTokenFromTokenAddress(tokenAddress); //Xdai
    } else if (chainId == "137") {
      return this.getPolygonCrossTokenFromTokenAddress(tokenAddress); //Polygon
    } else if (chainId == "42170") {
      return this.getArbitrumNovaConfigFromTokenAddress(tokenAddress)[0];
    } else if (chainId == "1") {
      return this.getMainnetCrossTokenFromTokenAddress(tokenAddress); //Mainnet
    } else if (chainId == "8453") {
      return this.getBaseCrossTokenFromTokenAddress(tokenAddress);
    } else if (chainId == "59144") {
      return this.getLineaCrossTokenFromTokenAddress(tokenAddress);
    } else if (chainId == "1101") {
      return this.getPolygonZKEVMCrossTokenFromTokenAddress(tokenAddress);
    } else {
      log.critical("Chain not found", []);
      return "";
    }
  }

  getXdaiCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonToken.USDC) {
      return XdaiToken.USDC;
    } else if (tokenAddress == PolygonToken.DAI) {
      return XdaiToken.DAI;
    } else if (tokenAddress == PolygonToken.USDT) {
      return XdaiToken.USDT;
    } else if (tokenAddress == PolygonToken.ETH) {
      return XdaiToken.ETH;
    } else if (tokenAddress == PolygonToken.MATIC) {
      return XdaiToken.MATIC;
    } else {
      log.critical("Token not found", []);
    }
    return "";
  }
  getArbitrumCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonToken.USDC) {
      return ArbitrumToken.USDC;
    } else if (tokenAddress == PolygonToken.DAI) {
      return ArbitrumToken.DAI;
    } else if (tokenAddress == PolygonToken.USDT) {
      return ArbitrumToken.USDT;
    } else if (tokenAddress == PolygonToken.ETH) {
      return ArbitrumToken.ETH;
    } else {
      log.critical("Token not found", []);
    }
    return "";
  }

  getOptimismCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonToken.USDC) {
      return OptimismToken.USDC;
    } else if (tokenAddress == PolygonToken.DAI) {
      return OptimismToken.DAI;
    } else if (tokenAddress == PolygonToken.USDT) {
      return OptimismToken.USDT;
    } else if (tokenAddress == PolygonToken.ETH) {
      return OptimismToken.ETH;
    } else {
      log.critical("Token not found", []);
    }
    return "";
  }

  getMainnetCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonToken.USDC) {
      return MainnetToken.USDC; //MAINNET USDC
    } else if (tokenAddress == PolygonToken.DAI) {
      return MainnetToken.DAI; //MAINNET DAI
    } else if (tokenAddress == PolygonToken.USDT) {
      return MainnetToken.USDT; //MAINNET USDT
    } else if (tokenAddress == PolygonToken.MATIC) {
      return MainnetToken.MATIC; //MAINNET MATIC
    } else if (tokenAddress == PolygonToken.ETH) {
      return MainnetToken.ETH; //MAINNET ETH
    } else {
      log.critical("Token not found", []);
    }
    return "";
  }

  getBaseCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonToken.USDC) return BaseToken.USDC;
    if (tokenAddress == PolygonToken.ETH) return BaseToken.ETH;
    else {
      log.critical("Base CrossToken not found for token: {}", [tokenAddress]);
    }
    return "";
  }

  getLineaCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonToken.ETH) return LineaToken.ETH;
    else {
      log.critical("Linea CrossToken not found for token: {}", [tokenAddress]);
    }
    return "";
  }

  getPolygonZKEVMCrossTokenFromTokenAddress(tokenAddress: string): string {
    if (tokenAddress == PolygonToken.ETH) return PolygonZKEVMToken.ETH;
    else {
      log.critical("PolygonZKEVM CrossToken not found for token: {}", [
        tokenAddress,
      ]);
    }
    return "";
  }

  getTokenAddressFromPoolAddress(poolAddress: string): string[] {
    if (poolAddress == PolygonAmm.USDC) {
      return [PolygonToken.USDC, PolygonHtoken.USDC];
    } else if (poolAddress == PolygonAmm.DAI) {
      return [PolygonToken.DAI, PolygonHtoken.DAI];
    } else if (poolAddress == PolygonAmm.USDT) {
      return [PolygonToken.USDT, PolygonHtoken.USDT];
    } else if (poolAddress == PolygonAmm.ETH) {
      return [PolygonToken.ETH, PolygonHtoken.ETH];
    } else if (poolAddress == PolygonAmm.MATIC) {
      return [PolygonToken.MATIC, PolygonHtoken.MATIC];
    } else {
      log.critical("Token not found", []);
      return [""];
    }
  }

  getPoolAddressFromBridgeAddress(bridgeAddress: string): string {
    if (bridgeAddress == PolygonBridge.USDC) {
      return PolygonAmm.USDC;
    } else if (bridgeAddress == PolygonBridge.DAI) {
      return PolygonAmm.DAI;
    } else if (bridgeAddress == PolygonBridge.USDT) {
      return PolygonAmm.USDT;
    } else if (bridgeAddress == PolygonBridge.ETH) {
      return PolygonAmm.ETH;
    } else if (bridgeAddress == PolygonBridge.MATIC) {
      return PolygonAmm.MATIC;
    } else {
      log.critical("Address not found", []);
      return "";
    }
  }

  getPoolDetails(poolAddress: string): string[] {
    if (poolAddress == PolygonAmm.USDC) {
      return ["HOP-USDC", "hUSDC/USDC Pool - USDC", "hUSDC/USDC Pool - hUSDC"];
    } else if (poolAddress == PolygonAmm.DAI) {
      return ["HOP-DAI", "hDAI/DAI Pool - DAI", "hDAI/DAI Pool - hDAI"];
    } else if (poolAddress == PolygonAmm.USDT) {
      return ["HOP-USDT", "hUSDT/USDT Pool - USDT", "hUSDT/USDT Pool - hUSDT"];
    } else if (poolAddress == PolygonAmm.ETH) {
      return ["HOP-ETH", "hETH/ETH Pool - ETH", "hETH/ETH Pool - hETH"];
    } else if (poolAddress == PolygonAmm.MATIC) {
      return [
        "HOP-MATIC",
        "hMATIC/MATIC Pool - MATIC",
        "hMATIC/MATIC Pool - hMATIC",
      ];
    } else {
      log.critical("Token not found", []);
      return [];
    }
  }

  getTokenList(): string[] {
    return [
      PolygonToken.USDC,
      PolygonToken.DAI,
      PolygonToken.USDT,
      PolygonToken.MATIC,
      PolygonToken.ETH,
    ];
  }
  getPoolsList(): string[] {
    return [
      PolygonAmm.USDC,
      PolygonAmm.DAI,
      PolygonAmm.USDT,
      PolygonAmm.MATIC,
      PolygonAmm.ETH,
    ];
  }
  getBridgeList(): string[] {
    return [
      PolygonBridge.USDC,
      PolygonBridge.DAI,
      PolygonBridge.USDT,
      PolygonBridge.MATIC,
      PolygonBridge.ETH,
    ];
  }

  getPolygonCrossTokenFromTokenAddress(tokenAddress: string): string {
    return tokenAddress;
  }

  getRewardTokenList(): string[] {
    return [
      PolygonRewardToken.DAI_A,
      PolygonRewardToken.DAI_B,
      PolygonRewardToken.ETH_A,
      PolygonRewardToken.ETH_B,
      PolygonRewardToken.USDC_A,
      PolygonRewardToken.USDC_B,
      PolygonRewardToken.USDT_A,
      PolygonRewardToken.USDT_B,
      PolygonRewardToken.MATIC,
    ];
  }
  getUsdcPools(): string[] {
    return [];
  }
  getDaiPools(): string[] {
    return [];
  }
  getUsdcTokens(): string[] {
    return [PolygonToken.USDC, PolygonHtoken.USDC];
  }
  getDaiTokens(): string[] {
    return [PolygonToken.DAI, PolygonHtoken.DAI];
  }
  getEthTokens(): string[] {
    return [PolygonToken.ETH, PolygonHtoken.ETH];
  }
  getMaticTokens(): string[] {
    return [PolygonToken.MATIC, PolygonHtoken.MATIC];
  }
  getUsdtTokens(): string[] {
    return [PolygonToken.USDT, PolygonHtoken.USDT];
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
  getRethPools(): string[] {
    return [];
  }
  getRethTokens(): string[] {
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
  getMagicTokens(): string[] {
    return [];
  }
}
