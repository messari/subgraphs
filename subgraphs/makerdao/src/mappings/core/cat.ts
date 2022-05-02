import { Address } from "@graphprotocol/graph-ts";
import { getMarketFromIlk } from "../../common/getters";
import { bigIntToBigDecimal } from "../../common/utils/numbers";
import {
  BIGDECIMAL_ONE_HUNDRED,
  BIGDECIMAL_ONE,
  MCD_CAT_ADDRESS,
  MCD_CAT_V2_ADDRESS,
  DEFAULT_DECIMALS,
  COLLATERAL_FILE_SIGNATURE,
} from "../../common/constants";
import { LogNote } from "./../../../generated/Cat/Cat";
import { LogNote as LogNoteV2 } from "./../../../generated/Cat_v2/Cat";
import { Cat } from "../../../generated/templates/Cat/Cat";
import { File2 } from "../../../generated/Dog/Dog";

// set liquidation penalties for all 3 liquidation contracts

export function handleFile(event: LogNote): void {
  let ilk = event.params.arg1;
  let what = event.params.arg2.toString();
  let signature = event.params.sig.toHexString();
  if (signature == COLLATERAL_FILE_SIGNATURE) {
    if (what == "chop") {
      let market = getMarketFromIlk(ilk);
      let catContract = Cat.bind(Address.fromString(MCD_CAT_ADDRESS));
      market.liquidationPenalty = bigIntToBigDecimal(catContract.ilks(ilk).value1, 27)
        .minus(BIGDECIMAL_ONE)
        .times(BIGDECIMAL_ONE_HUNDRED);
      market.save();
    }
  }
}

export function handleFileV2(event: LogNoteV2): void {
  let ilk = event.params.arg1;
  let what = event.params.arg2.toString();
  let signature = event.params.sig.toHexString();
  if (signature == COLLATERAL_FILE_SIGNATURE) {
    if (what == "chop") {
      let market = getMarketFromIlk(ilk);
      let catContract = Cat.bind(Address.fromString(MCD_CAT_V2_ADDRESS));
      market.liquidationPenalty = bigIntToBigDecimal(catContract.ilks(ilk).value1, 27)
        .minus(BIGDECIMAL_ONE)
        .times(BIGDECIMAL_ONE_HUNDRED);
      market.save();
    }
  }
}

export function handleFileDog(event: File2): void {
  let ilk = event.params.ilk;
  let what = event.params.what.toString();
  if (what == "chop") {
    let market = getMarketFromIlk(ilk);
    market.liquidationPenalty = bigIntToBigDecimal(event.params.data, DEFAULT_DECIMALS)
      .minus(BIGDECIMAL_ONE)
      .times(BIGDECIMAL_ONE_HUNDRED);
    market.save();
  }
}
