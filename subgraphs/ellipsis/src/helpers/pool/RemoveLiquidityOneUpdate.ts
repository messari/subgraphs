import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { LiquidityPool, RemoveLiqudityOneEvent } from "../../../generated/schema";
import { getCoinCount, getOrCreateProtocol } from "../../utils/common";
import { removeLiquidity } from "./RemoveLiquidity";

// export function handleRLOEEntityUpdate(
//   poolAddress: Address,
//     entity: RemoveLiqudityOneEvent,
//     pool: LiquidityPool,
//     timestamp: BigInt,
//     blockNumber: BigInt,
//     transactionHash: Bytes,
//     logIndex: BigInt
//   ): void {
//     // handle liquidity removal only after both event and call are handled
//     if (!entity.eventApplied || !entity.callApplied) {
//       return;
//     }
  
//     let protocol = getOrCreateProtocol();
  
//     // collect data from RemoveLiqudityOneEvent entity
//     let tokenAmount = entity.tokenAmount as BigInt;
//     let i = entity.i as i32;
//     let dy = entity.dy as BigInt;
//     let provider = Address.fromBytes(entity.provider);
    
//     let coinCount = getCoinCount(Address.fromString(pool.id))
//     let tokenAmounts: BigInt[] = [];
//     for (let j = 0; j < coinCount.toI32(); ++j) {
//       if (j == i) {
//         tokenAmounts[j] = dy;
//       } else {
//         tokenAmounts[j] = BigInt.fromI32(0);
//       }
//     }
  
//     removeLiquidity(
//       poolAddress,
//       tokenAmount,
//       tokenAmounts,
//       provider,
//       [],
//       timestamp,
//       blockNumber,
//       logIndex,
//       transactionHash
//     );
//   }