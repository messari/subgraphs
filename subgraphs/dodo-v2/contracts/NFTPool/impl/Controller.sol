/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {InitializableOwnable} from "../../lib/InitializableOwnable.sol";
import {SafeMath} from "../../lib/SafeMath.sol";

contract Controller is InitializableOwnable {
    using SafeMath for uint256;

    uint256 public _GLOBAL_NFT_IN_FEE_RATE_ = 0;
    uint256 public _GLOBAL_NFT_OUT_FEE_RATE_ = 0;

    struct FilterAdminFeeRateInfo {
        uint256 nftInFeeRate;
        uint256 nftOutFeeRate;
        bool isOpen;
    }

    mapping(address => FilterAdminFeeRateInfo) filterAdminFeeRates;

    mapping(address => bool) public isEmergencyWithdrawOpen;

    //==================== Event =====================
    event SetEmergencyWithdraw(address filter, bool isOpen);
    event SetFilterAdminFeeRateInfo(address filterAdmin, uint256 nftInFee, uint256 nftOutFee, bool isOpen);
    event SetGlobalParam(uint256 nftInFee, uint256 nftOutFee);

    //==================== Ownable ====================

    function setFilterAdminFeeRateInfo(
        address filterAdminAddr,
        uint256 nftInFeeRate,
        uint256 nftOutFeeRate,
        bool isOpen
    ) external onlyOwner {
        require(nftInFeeRate <= 1e18 && nftOutFeeRate <= 1e18, "FEE_RATE_TOO_LARGE");
        FilterAdminFeeRateInfo memory feeRateInfo = FilterAdminFeeRateInfo({
            nftInFeeRate: nftInFeeRate,
            nftOutFeeRate: nftOutFeeRate,
            isOpen: isOpen
        });
        filterAdminFeeRates[filterAdminAddr] = feeRateInfo;

        emit SetFilterAdminFeeRateInfo(filterAdminAddr, nftInFeeRate, nftOutFeeRate, isOpen);
    }

    function setGlobalParam(uint256 nftInFeeRate, uint256 nftOutFeeRate) external onlyOwner {
        require(nftInFeeRate <= 1e18 && nftOutFeeRate <= 1e18, "FEE_RATE_TOO_LARGE");
        _GLOBAL_NFT_IN_FEE_RATE_ = nftInFeeRate;
        _GLOBAL_NFT_OUT_FEE_RATE_ = nftOutFeeRate;

        emit SetGlobalParam(nftInFeeRate, nftOutFeeRate);
    }

    function setEmergencyWithdraw(address filter, bool isOpen) external onlyOwner {
        isEmergencyWithdrawOpen[filter] = isOpen;
        emit SetEmergencyWithdraw(filter, isOpen);
    }

    //===================== View ========================
    function getMintFeeRate(address filterAdminAddr) external view returns (uint256) {
        FilterAdminFeeRateInfo memory filterAdminFeeRateInfo = filterAdminFeeRates[filterAdminAddr];

        if (filterAdminFeeRateInfo.isOpen) {
            return filterAdminFeeRateInfo.nftInFeeRate;
        } else {
            return _GLOBAL_NFT_IN_FEE_RATE_;
        }
    }

    function getBurnFeeRate(address filterAdminAddr) external view returns (uint256) {
        FilterAdminFeeRateInfo memory filterAdminFeeInfo = filterAdminFeeRates[filterAdminAddr];

        if (filterAdminFeeInfo.isOpen) {
            return filterAdminFeeInfo.nftOutFeeRate;
        } else {
            return _GLOBAL_NFT_OUT_FEE_RATE_;
        }
    }
}
