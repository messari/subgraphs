import { Address, Bytes } from "@graphprotocol/graph-ts";
import { addToArrayAtIndex } from "../utils/arrays";
import { _RocketContract } from "../../generated/schema";

export function createOrUpdateRocketContract(
  contractName: string,
  key: Bytes,
  value: Address
): _RocketContract {
  let contractEntity = _RocketContract.load(contractName);
  if (!contractEntity) {
    contractEntity = new _RocketContract(contractName);
    contractEntity.allAddresses = [];
  }

  contractEntity.keccak256 = key;
  contractEntity.latestAddress = value;
  contractEntity.allAddresses = addToArrayAtIndex(
    contractEntity.allAddresses,
    value
  );
  contractEntity.save();

  return contractEntity;
}

export function getRocketContract(contractName: string): _RocketContract {
  return _RocketContract.load(contractName)!;
}
