import { Spell } from "../../../generated/schema";
import { CastCall, ScheduleCall } from "../../../generated/DSChief/DSSpell";
import { SpellState } from "../../../src/constants";

export function handleSchedule(call: ScheduleCall): void {
  const spellID = call.to.toHexString(); // spell address is the spellID
  const spell = Spell.load(spellID);
  if (!spell) return;
  spell.state = SpellState.SCHEDULED;
  spell.scheduledTxnHash = call.transaction.hash.toHexString();
  spell.scheduledBlock = call.block.number;
  spell.scheduledTime = call.block.timestamp;
  spell.save();
}

export function handleCast(call: CastCall): void {
  const spellID = call.to.toHexString(); // spell address is the spellID
  const spell = Spell.load(spellID);
  if (!spell) return;
  spell.state = SpellState.CAST;
  spell.castTxnHash = call.transaction.hash.toHexString();
  spell.castBlock = call.block.number;
  spell.castTime = call.block.timestamp;
  spell.castWith = spell.totalWeightedVotes;
  spell.save();
}
