/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {InitializableOwnable} from "../../lib/InitializableOwnable.sol";
import {IERC20} from "../../intf/IERC20.sol";
import {SafeMath} from "../../lib/SafeMath.sol";

interface IBuyout {
    function getBuyoutQualification(address user) external view returns (bool);
}

contract BuyoutModel is InitializableOwnable {
    using SafeMath for uint256;

    uint256 public _MIN_FRAG_ = 100; //0.1
    uint256 public _MAX_FRAG_ = 1000; //1
    int public _BUYOUT_FEE_ = 0;

    struct FragInfo {
        uint256 minFrag;
        uint256 maxFrag;
        address buyoutAddr;
        bool isSet;
    }

    mapping(address => FragInfo) frags;

    function addFragInfo(address fragAddr, uint256 minFrag, uint256 maxFrag, address buyoutAddr) external onlyOwner {
        FragInfo memory fragInfo =  FragInfo({
            minFrag: minFrag,
            maxFrag: maxFrag,
            buyoutAddr: buyoutAddr,
            isSet: true
        });
        frags[fragAddr] = fragInfo;
    }

    function setFragInfo(address fragAddr, uint256 minFrag, uint256 maxFrag, address buyoutAddr) external onlyOwner {
        frags[fragAddr].minFrag = minFrag;
        frags[fragAddr].maxFrag = maxFrag;
        frags[fragAddr].buyoutAddr = buyoutAddr;
    }

    function setGlobalParam(uint256 minFrag, uint256 maxFrag, uint256 buyoutFee) external onlyOwner {
        require(minFrag <= 1000 && maxFrag <= 1000, "PARAM_INVALID");
        _MIN_FRAG_ = minFrag;
        _MAX_FRAG_ = maxFrag;
        _BUYOUT_FEE_ = int(buyoutFee);
    }

    function getBuyoutStatus(address fragAddr, address user) external view returns (int) {
        FragInfo memory fragInfo = frags[fragAddr];
        
        uint256 userBalance = IERC20(fragAddr).balanceOf(user);
        uint256 totalSupply = IERC20(fragAddr).totalSupply();
        uint256 minFrag = _MIN_FRAG_;
        uint256 maxFrag = _MAX_FRAG_;

        if(fragInfo.isSet) {
            address buyoutAddr = fragInfo.buyoutAddr;
            if(buyoutAddr != address(0)) {
                bool isQualified = IBuyout(buyoutAddr).getBuyoutQualification(user);
                if(isQualified) {
                    return _BUYOUT_FEE_;
                }else {
                    return -1;
                }
            }

            minFrag = fragInfo.minFrag;
            maxFrag = fragInfo.maxFrag;
        }

        if(userBalance >= totalSupply.mul(minFrag).div(1000) && userBalance <= totalSupply.mul(maxFrag).div(1000)) {
            return _BUYOUT_FEE_;
        }else {
            return -1;
        }
    }
}
