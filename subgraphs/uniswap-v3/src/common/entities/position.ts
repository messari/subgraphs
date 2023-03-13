import { ethereum, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../configurations/configure";
import { NonfungiblePositionManager } from "../../../generated/NonFungiblePositionManager/NonFungiblePositionManager";
import { Position, PositionSnapshot } from "../../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  TokenType,
} from "../constants";

export function getOrCreatePosition(
  event: ethereum.Event,
  tokenId: BigInt
): Position | null {
  const id = Bytes.fromHexString("xPosition-").concatI32(tokenId.toI32());
  let position = Position.load(id);

  if (position === null) {
    const contract = NonfungiblePositionManager.bind(event.address);
    const positionCall = contract.try_positions(tokenId);

    if (!positionCall.reverted) {
      const positionResult = positionCall.value;
      const poolAddress = NetworkConfigs.getFactoryContract().getPool(
        positionResult.value2,
        positionResult.value3,
        positionResult.value4
      );

      position = new Position(id);
      // Gets updated on transfer events
      position.account = event.transaction.from;
      position.pool = poolAddress;
      position.hashOpened = event.transaction.hash;
      position.blockNumberOpened = event.block.number;
      position.timestampOpened = event.block.timestamp;
      position.liquidityTokenType = TokenType.ERC721;
      position.liquidity = BIGINT_ZERO;
      position.liquidityUSD = BIGDECIMAL_ZERO;
      position.tickLower = position.pool.concatI32(positionResult.value5);
      position.tickUpper = position.pool.concatI32(positionResult.value6);
      position.cumulativeDepositTokenAmounts = [BIGINT_ZERO, BIGINT_ZERO];
      position.cumulativeDepositUSD = BIGDECIMAL_ZERO;
      position.cumulativeWithdrawTokenAmounts = [BIGINT_ZERO, BIGINT_ZERO];
      position.cumulativeWithdrawUSD = BIGDECIMAL_ZERO;
      position.depositCount = INT_ZERO;
      position.withdrawCount = INT_ZERO;
      position.save();
    }
  }

  return position;
}

// Save Position Snapshot
export function savePositionSnapshot(
  position: Position,
  event: ethereum.Event
): void {
  const id = Bytes.fromHexString("xPositionSnapshot-").concat(
    event.transaction.hash
  );
  const positionSnapshot = new PositionSnapshot(id);
  positionSnapshot.hash = event.transaction.hash;
  positionSnapshot.logIndex = event.logIndex.toI32();
  positionSnapshot.nonce = event.transaction.nonce;
  positionSnapshot.position = position.id;
  positionSnapshot.liquidity = position.liquidity;
  positionSnapshot.liquidityUSD = position.liquidityUSD;
  positionSnapshot.cumulativeDepositTokenAmounts =
    position.cumulativeDepositTokenAmounts;
  positionSnapshot.cumulativeDepositUSD = position.cumulativeDepositUSD;
  positionSnapshot.cumulativeWithdrawTokenAmounts =
    position.cumulativeWithdrawTokenAmounts;
  positionSnapshot.cumulativeWithdrawUSD = position.cumulativeWithdrawUSD;
  positionSnapshot.depositCount = position.depositCount;
  positionSnapshot.withdrawCount = position.withdrawCount;
  positionSnapshot.blockNumber = event.block.number;
  positionSnapshot.timestamp = event.block.timestamp;
  positionSnapshot.save();
}
