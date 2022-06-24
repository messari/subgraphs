/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/
pragma solidity 0.6.9;

import {InitializableOwnable} from "../lib/InitializableOwnable.sol";
import {SafeMath} from "../lib/SafeMath.sol";

interface IVDODOMine {
    function balanceOf(address account) external view returns (uint256);
}

contract Governance is InitializableOwnable {
    using SafeMath for uint256;

    // ============ Storage ============
    address[] public _VDODO_MINE_LIST_;


    // ============ Event =============
    event AddMineContract(address mineContract);
    event RemoveMineContract(address mineContract);


    function getLockedvDODO(address account) external view returns (uint256 lockedvDODO) {
        uint256 len = _VDODO_MINE_LIST_.length;
        for(uint i = 0; i < len; i++){
            uint256 curLocked = IVDODOMine(_VDODO_MINE_LIST_[i]).balanceOf(account);
            lockedvDODO = lockedvDODO.add(curLocked);
        }
    }

    // =============== Ownable  ================

    function addMineContract(address[] memory mineContracts) external onlyOwner {
        for(uint i = 0; i < mineContracts.length; i++){
            require(mineContracts[i] != address(0),"ADDRESS_INVALID");
            _VDODO_MINE_LIST_.push(mineContracts[i]);
            emit AddMineContract(mineContracts[i]);
        }
    }

    function removeMineContract(address mineContract) external onlyOwner {
        uint256 len = _VDODO_MINE_LIST_.length;
        for (uint256 i = 0; i < len; i++) {
            if (mineContract == _VDODO_MINE_LIST_[i]) {
                _VDODO_MINE_LIST_[i] = _VDODO_MINE_LIST_[len - 1];
                _VDODO_MINE_LIST_.pop();
                emit RemoveMineContract(mineContract);
                break;
            }
        }
    }
}
