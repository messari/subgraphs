import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Delegate, Vote } from "../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "./constants";

export function hexToNumberString(hex: string): string {
  let hexNumber = BigInt.fromI32(0);
  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
  }
  for (let i = 0; i < hex.length; i += 1) {
    let character = hex.substr(hex.length - 1 - i, 1);
    let digit = parseInt(character, 16) as u8;
    if (digit) {
      hexNumber = hexNumber.plus(
        BigInt.fromI32(digit).times(BigInt.fromI32(16).pow(i as u8))
      );
    }
  }

  return hexNumber.toString();
}

export function toDecimal(value: BigInt, decimals: number = 18): BigDecimal {
  return value.divDecimal(
    BigInt.fromI32(10)
      .pow(<u8>decimals)
      .toBigDecimal()
  );
}

export function getDelegate(address: string): Delegate {
  let delegate = Delegate.load(address);
  if (!delegate) {
    delegate = new Delegate(address);
    delegate.votingPowerRaw = BIGINT_ZERO;
    delegate.votingPower = BIGDECIMAL_ZERO;
    delegate.numberVotes = 0;
  }
  return delegate;
}

export function createVote(
  sender: string,
  spellID: string,
  weight: BigInt,
  event: ethereum.Event
): void {
  let voteId = sender.concat("-").concat(spellID);
  let vote = new Vote(voteId);
  vote.weight = weight;
  vote.reason = "";
  vote.voter = sender;
  vote.spell = spellID;
  vote.block = event.block.number;
  vote.blockTime = event.block.timestamp;
  vote.txnHash = event.transaction.hash.toHexString();
  vote.save();
}
