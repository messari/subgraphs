/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {InitializableOwnable} from "../../lib/InitializableOwnable.sol";
import {SafeMath} from "../../lib/SafeMath.sol";
import {DecimalMath} from "../../lib/DecimalMath.sol";

interface IFee {
    function getUserFee(address user,uint256 ticketAmount) external view returns (uint256);
}

interface IPrice {
    function getUserPrice(address user, uint256 originalPrice, uint256 ticketAmount) external view returns (uint256);
}

contract DropsFeeModel is InitializableOwnable {
    using SafeMath for uint256;

    struct DropBoxInfo {
        bool isSet;
        uint256 globalFee;
        address feeAddr;
        address priceAddr;
    }

    mapping(address => DropBoxInfo) dropBoxes;

    // ============ Event =============
    event AddDropBoxInfo(address dropBox, uint256 globalFee, address feeAddr, address priceAddr);
    event SetDropBoxInfo(address dropBox, uint256 globalFee, address feeAddr, address priceAddr);


    function addDropBoxInfo(address dropBox, uint256 globalFee, address feeAddr, address priceAddr) external onlyOwner {
        DropBoxInfo memory dropBoxInfo =  DropBoxInfo({
            isSet: true,
            globalFee: globalFee,
            feeAddr: feeAddr,
            priceAddr: priceAddr
        });
        dropBoxes[dropBox] = dropBoxInfo;
        emit AddDropBoxInfo(dropBox, globalFee, feeAddr, priceAddr);
    }

    function setDropBoxInfo(address dropBox, uint256 globalFee, address feeAddr, address priceAddr) external onlyOwner {
        require(dropBoxes[dropBox].isSet, "NOT_FOUND_BOX");
        dropBoxes[dropBox].globalFee = globalFee;
        dropBoxes[dropBox].feeAddr = feeAddr;
        dropBoxes[dropBox].priceAddr = priceAddr;
        emit SetDropBoxInfo(dropBox, globalFee, feeAddr, priceAddr);
    }

    function getPayAmount(address dropBox, address user, uint256 originalPrice, uint256 ticketAmount) external view returns (uint256 payAmount, uint256 feeAmount) {
        DropBoxInfo memory dropBoxInfo = dropBoxes[dropBox];
        if(!dropBoxInfo.isSet) {
            payAmount = originalPrice.mul(ticketAmount);
            feeAmount = 0;
        } else {
            uint256 feeRate = dropBoxInfo.globalFee;
            address feeAddr = dropBoxInfo.feeAddr;
            if(feeAddr != address(0))
                feeRate = IFee(feeAddr).getUserFee(user, ticketAmount);
            
            uint256 price = originalPrice;
            address priceAddr = dropBoxInfo.priceAddr;
            if(priceAddr != address(0))
                price = IPrice(priceAddr).getUserPrice(user, originalPrice, ticketAmount);
            
            payAmount = price.mul(ticketAmount);
            feeAmount = DecimalMath.mulFloor(payAmount, feeRate);
        }
    }
}