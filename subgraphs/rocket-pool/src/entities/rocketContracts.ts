import { Address, Bytes } from "@graphprotocol/graph-ts";

import { addToArrayAtIndex } from "../utils/arrays";

import { _RocketContracts } from "../../generated/schema";

export function createOrUpdateRocketContract(
  contractName: string,
  key: Bytes,
  value: Address
): _RocketContracts {
  let contractEntity = _RocketContracts.load(contractName);
  if (!contractEntity) {
    contractEntity = new _RocketContracts(contractName);
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

export function getRocketContract(contractName: string): _RocketContracts {
  return _RocketContracts.load(contractName)!;
}
