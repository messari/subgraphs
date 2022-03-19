import {
  DistributedBorrowerReward as DistributedBorrowerRewardEvent,
  DistributedSupplierReward as DistributedSupplierRewardEvent,
  ActionPaused1 as MarketPausedEvent,
} from "../generated/BenqiTokenqiAVAX/Comptroller";
import { handleDistributedReward, handleMarketPaused } from "./handlers";

export function DistributedBorrowerReward(event: DistributedBorrowerRewardEvent): void {
  handleDistributedReward(
    event.params.tokenType,
    event.params.qiToken,
    "0x316aE55EC59e0bEb2121C0e41d4BDef8bF66b32B",
    event.block.number,
    event.block.timestamp,
    event.params.qiDelta,
  );
}

export function DistributedSupplierReward(event: DistributedSupplierRewardEvent): void {
  handleDistributedReward(
    event.params.tokenType,
    event.params.qiToken,
    "0x316aE55EC59e0bEb2121C0e41d4BDef8bF66b32B",
    event.block.number,
    event.block.timestamp,
    event.params.qiDelta,
  );
}

export function MarketPaused(event: MarketPausedEvent): void {
  handleMarketPaused(
    event.params.action,
    event.params.pauseState,
    event.params.qiToken,
    "0x316aE55EC59e0bEb2121C0e41d4BDef8bF66b32B",
    event.block.number,
    event.block.timestamp,
  );
}