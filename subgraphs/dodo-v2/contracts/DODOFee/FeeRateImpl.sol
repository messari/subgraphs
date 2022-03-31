/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {InitializableOwnable} from "../lib/InitializableOwnable.sol";
import {ICloneFactory} from "../lib/CloneFactory.sol";
import {IERC20} from "../intf/IERC20.sol";
import {SafeMath} from "../lib/SafeMath.sol";

interface ICrowdPooling {
    function _QUOTE_RESERVE_() external view returns (uint256);
    function getShares(address user) external view returns (uint256);
    function _OWNER_() external returns (address);
    function _QUOTE_TOKEN_() external view returns(address);
}

interface IFee {
    function getUserFee(address user) external view returns (uint256);
}

interface IQuota {
    function getUserQuota(address user) external view returns (int);
    function initOwner(address newOwner) external; 
}

interface IPool {
    function version() external pure returns (string memory);
    function _LP_FEE_RATE_() external view returns (uint256);
}

contract FeeRateImpl is InitializableOwnable {
    using SafeMath for uint256;

    // ============ Storage  ============
    address public _CLONE_FACTORY_;
    address public _QUOTA_TEMPLATE_;
    uint256 public _LP_MT_RATIO_ = 25;

    struct CPPoolInfo {
        address quoteToken;
        int globalQuota;
        address feeAddr;
        address quotaAddr;
    }

    mapping(address => CPPoolInfo) cpPools;
    mapping(address => uint256) public specPoolList;


    function init(
        address owner,
        address cloneFactory,
        address quotaTemplate
    ) external {
        initOwner(owner);
        _CLONE_FACTORY_ = cloneFactory;
        _QUOTA_TEMPLATE_ = quotaTemplate;
    }


    // ============ Ownable Functions ============
    
    function addCpPoolInfo(address cpPool, address quoteToken, int globalQuota, address feeAddr, address quotaAddr) external onlyOwner {
        CPPoolInfo memory cpPoolInfo =  CPPoolInfo({
            quoteToken: quoteToken,
            feeAddr: feeAddr,
            quotaAddr: quotaAddr,
            globalQuota: globalQuota
        });
        cpPools[cpPool] = cpPoolInfo;
    }

    function setCpPoolInfo(address cpPool, address quoteToken, int globalQuota, address feeAddr, address quotaAddr) external onlyOwner {
        cpPools[cpPool].quoteToken = quoteToken;
        cpPools[cpPool].feeAddr = feeAddr;
        cpPools[cpPool].quotaAddr = quotaAddr;
        cpPools[cpPool].globalQuota = globalQuota;
    }

    function setLpMtRatio(uint256 newLpMtRatio) external onlyOwner {
        _LP_MT_RATIO_ = newLpMtRatio;
    }


    function setSpecPoolList (address poolAddr, uint256 mtFeeRate) public onlyOwner {
        specPoolList[poolAddr] = mtFeeRate;
    }

    function setQuotaTemplate(address newQuotaTemplate) public onlyOwner {
        _QUOTA_TEMPLATE_ = newQuotaTemplate;
    }

    function createWhitelist(address cpPool, address quotaOwner) external returns (address quotaAddr) {
        require(msg.sender == ICrowdPooling(cpPool)._OWNER_(), "Access restricted");
        
        quotaAddr = ICloneFactory(_CLONE_FACTORY_).clone(_QUOTA_TEMPLATE_);
        IQuota(quotaAddr).initOwner(quotaOwner);
        address quoteToken = ICrowdPooling(cpPool)._QUOTE_TOKEN_();
        
        CPPoolInfo memory cpPoolInfo =  CPPoolInfo({
            quoteToken: quoteToken,
            feeAddr: address(0x0),
            quotaAddr: quotaAddr,
            globalQuota: 0
        });
        cpPools[cpPool] = cpPoolInfo;
    }

    // ============ View Functions ============

    function getFeeRate(address pool, address user) external view returns (uint256) {
        if(specPoolList[pool] != 0) {
            return specPoolList[pool];
        }

        try IPool(pool).version() returns (string memory poolVersion) {
            bytes32 hashPoolVersion = keccak256(abi.encodePacked(poolVersion));
            if(hashPoolVersion == keccak256(abi.encodePacked("CP 1.0.0"))) {
                CPPoolInfo memory cpPoolInfo = cpPools[pool];
                address quoteToken = cpPoolInfo.quoteToken;
                if(quoteToken == address(0)) {
                    return 0;
                }else {
                    uint256 userInput = IERC20(quoteToken).balanceOf(pool).sub(ICrowdPooling(pool)._QUOTE_RESERVE_());
                    uint256 userStake = ICrowdPooling(pool).getShares(user);
                    address feeAddr = cpPoolInfo.feeAddr;
                    address quotaAddr = cpPoolInfo.quotaAddr;
                    int curQuota = cpPoolInfo.globalQuota;
                    if(quotaAddr != address(0))
                        curQuota = IQuota(quotaAddr).getUserQuota(user);

                    require(curQuota == -1 || (curQuota != -1 && int(userInput.add(userStake)) <= curQuota), "DODOFeeImpl: EXCEED_YOUR_QUOTA");

                    if(feeAddr == address(0)) {
                        return 0;
                    } else {
                        return IFee(feeAddr).getUserFee(user);
                    }
                }
            } else if(hashPoolVersion == keccak256(abi.encodePacked("DVM 1.0.2")) || hashPoolVersion == keccak256(abi.encodePacked("DSP 1.0.1"))) {
                uint256 lpFeeRate = IPool(pool)._LP_FEE_RATE_();
                uint256 mtFeeRate = lpFeeRate.mul(_LP_MT_RATIO_).div(100);
                if(lpFeeRate.add(mtFeeRate) >= 10**18) {
                    return 0;
                } else {
                    return mtFeeRate;
                }
            } else {
                return 0;
            }
        } catch (bytes memory) {
            return 0;
        }
    }

    function getCPInfoByUser(address pool, address user) external view returns (bool isHaveCap, int curQuota, uint256 userFee) {
        CPPoolInfo memory cpPoolInfo = cpPools[pool];
        if(cpPoolInfo.quoteToken == address(0)) {
            isHaveCap = false;
            curQuota = -1;
            userFee = 0;
        }else {
            address quotaAddr = cpPoolInfo.quotaAddr;
            curQuota = cpPoolInfo.globalQuota;
            if(quotaAddr != address(0))
                curQuota = IQuota(quotaAddr).getUserQuota(user);
        
            if(curQuota == -1) {
                isHaveCap = false;
            }else {
                isHaveCap = true;
                uint256 userStake = ICrowdPooling(pool).getShares(user);
                curQuota = int(uint256(curQuota).sub(userStake));
            }

            address feeAddr = cpPoolInfo.feeAddr;
            if(feeAddr == address(0)) {
                userFee =  0;
            } else {
                userFee = IFee(feeAddr).getUserFee(user);
            }
        }
    }
}
