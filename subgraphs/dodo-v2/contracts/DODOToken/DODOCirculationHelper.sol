/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {IERC20} from "../intf/IERC20.sol";
import {SafeMath} from "../lib/SafeMath.sol";
import {DecimalMath} from "../lib/DecimalMath.sol";
import {InitializableOwnable} from "../lib/InitializableOwnable.sol";


contract DODOCirculationHelper is InitializableOwnable {
    using SafeMath for uint256;

    // ============ Storage ============

    address immutable _VDODO_TOKEN_;
    address immutable _DODO_TOKEN_;
    address[] _LOCKED_CONTRACT_ADDRESS_;

    uint256 public _MIN_PENALTY_RATIO_ = 5 * 10**16; // 5%
    uint256 public _MAX_PENALTY_RATIO_ = 15 * 10**16; // 15%

    constructor(address vDodoToken,address dodoToken) public {
        _VDODO_TOKEN_ = vDodoToken;
        _DODO_TOKEN_ = dodoToken;
    }

    function addLockedContractAddress(address lockedContract) external onlyOwner {
        require(lockedContract != address(0));
        _LOCKED_CONTRACT_ADDRESS_.push(lockedContract);
    }

    function removeLockedContractAddress(address lockedContract) external onlyOwner {
        require(lockedContract != address(0));
        address[] memory lockedContractAddress = _LOCKED_CONTRACT_ADDRESS_;
        for (uint256 i = 0; i < lockedContractAddress.length; i++) {
            if (lockedContractAddress[i] == lockedContract) {
                lockedContractAddress[i] = lockedContractAddress[lockedContractAddress.length - 1];
                break;
            }
        }
        _LOCKED_CONTRACT_ADDRESS_ = lockedContractAddress;
        _LOCKED_CONTRACT_ADDRESS_.pop();
    } 

    function getCirculation() public view returns (uint256 circulation) {
        circulation = 10**9 * 10**18;
        for (uint256 i = 0; i < _LOCKED_CONTRACT_ADDRESS_.length; i++) {
            circulation -= IERC20(_DODO_TOKEN_).balanceOf(_LOCKED_CONTRACT_ADDRESS_[i]);
        }
    }

    function getDodoWithdrawFeeRatio() external view returns (uint256 ratio) {
        uint256 dodoCirculationAmout = getCirculation();
        uint256 x =
            DecimalMath.divCeil(
                IERC20(_VDODO_TOKEN_).totalSupply() * 100,
                dodoCirculationAmout
            );
        
        ratio = geRatioValue(x);
    }

    function geRatioValue(uint256 input) public view returns (uint256) {
        
        // y = 15% (x < 0.1)
        // y = 5% (x > 0.5)
        // y = 0.175 - 0.25 * x
        
        if (input < 10**17) {
            return _MAX_PENALTY_RATIO_;
        } else if (input > 5 * 10**17) {
            return _MIN_PENALTY_RATIO_;
        } else {
            return 175 * 10**15 - DecimalMath.mulFloor(input, 25 * 10**16);
        }
    }
}
