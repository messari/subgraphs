import { Address } from "@graphprotocol/graph-ts";
import { cTokenDecimals } from "../../../src/constants";
import { TokenData } from "../../../src/mapping";

export const oldComptrollerAddr = Address.fromString(
  "0xD38A19100530b99c3b84CCA971DfD96BD557AA91"
);
export const comptrollerAddr = Address.fromString(
  "0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4"
);
export const AVAXAddr = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const qiAVAXAddr = Address.fromString(
  "0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c"
);
export const QiAddr = Address.fromString(
  "0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5"
);
export const TraderJoeQiWavaxPairAddr = Address.fromString(
  "0x2774516897AC629aD3ED9dCac7e375Dda78412b9"
);

export const TraderJoeQiWavaxPairStartBlock = 3077799;

export const nativeToken = new TokenData(
  Address.fromString("0x0000000000000000000000000000000000000000"),
  "AVAX",
  "AVAX",
  18
);

export const nativeCToken = new TokenData(
  Address.fromString("0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c"),
  "Benqi AVAX",
  "qiAVAX",
  cTokenDecimals
);
