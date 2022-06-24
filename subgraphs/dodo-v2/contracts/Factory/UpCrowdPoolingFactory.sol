/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {InitializableOwnable} from "../lib/InitializableOwnable.sol";
import {ICloneFactory} from "../lib/CloneFactory.sol";
import {ICP} from "../CrowdPooling/intf/ICP.sol";
import {SafeMath} from "../lib/SafeMath.sol";
import {IERC20} from "../intf/IERC20.sol";
import {DecimalMath} from "../lib/DecimalMath.sol";

/**
 * @title UpCrowdPoolingFacotry
 * @author DODO Breeder
 *
 * @notice Create And Register vary price CP Pools 
 */
contract UpCrowdPoolingFactory is InitializableOwnable {
    using SafeMath for uint256;
    // ============ Templates ============

    address public immutable _CLONE_FACTORY_;
    address public immutable _DVM_FACTORY_;
    address public immutable _DEFAULT_MT_FEE_RATE_MODEL_;
    address public immutable _DEFAULT_PERMISSION_MANAGER_;
    address public _DEFAULT_MAINTAINER_;
    address public _CP_TEMPLATE_;

    // ============ Settings =============
    uint256 public _FREEZE_DURATION_ =  30 days;
    uint256 public _CALM_DURATION_ = 600;
    uint256 public _VEST_DURATION_ = 0;
    uint256 public _CLIFF_RATE_ = 10**18;


    // ============ Registry ============

    // base -> quote -> CP address list
    mapping(address => mapping(address => address[])) public _REGISTRY_;
    // creator -> CP address list
    mapping(address => address[]) public _USER_REGISTRY_;

    // ============ modifiers ===========

    modifier valueCheck(
        address cpAddress,
        address baseToken,
        uint256[] memory timeLine,
        uint256[] memory valueList)
    {
        require(timeLine[2] <= _CALM_DURATION_, "CP_FACTORY : PHASE_CALM_DURATION_INVALID");
        require(timeLine[4] == _VEST_DURATION_, "CP_FACTORY : VEST_DURATION_INVALID");
        require(valueList[3] == _CLIFF_RATE_, "CP_FACTORY : CLIFF_RATE_INVALID");
        require(timeLine[3] >= _FREEZE_DURATION_, "CP_FACTORY : FREEZE_DURATION_INVALID");
        _;
    }

    // ============ Events ============

    event NewCP(
        address baseToken,
        address quoteToken,
        address creator,
        address cp
    );

    constructor(
        address cloneFactory,
        address cpTemplate,
        address dvmFactory,
        address defaultMaintainer,
        address defaultMtFeeRateModel,
        address defaultPermissionManager
    ) public {
        _CLONE_FACTORY_ = cloneFactory;
        _CP_TEMPLATE_ = cpTemplate;
        _DVM_FACTORY_ = dvmFactory;
        _DEFAULT_MAINTAINER_ = defaultMaintainer;
        _DEFAULT_MT_FEE_RATE_MODEL_ = defaultMtFeeRateModel;
        _DEFAULT_PERMISSION_MANAGER_ = defaultPermissionManager;
    }

    // ============ Functions ============

    function createCrowdPooling() external returns (address newCrowdPooling) {
        newCrowdPooling = ICloneFactory(_CLONE_FACTORY_).clone(_CP_TEMPLATE_);
    }

    function initCrowdPooling(
        address cpAddress,
        address creator,
        address baseToken,
        address quoteToken,
        uint256[] memory timeLine,
        uint256[] memory valueList,
        bool isOpenTWAP
    ) external valueCheck(cpAddress,baseToken,timeLine,valueList) {
        {
        address[] memory addressList = new address[](7);
        addressList[0] = creator;
        addressList[1] = _DEFAULT_MAINTAINER_;
        addressList[2] = baseToken;
        addressList[3] = quoteToken;
        addressList[4] = _DEFAULT_PERMISSION_MANAGER_;
        addressList[5] = _DEFAULT_MT_FEE_RATE_MODEL_;
        addressList[6] = _DVM_FACTORY_;

        if(valueList[0] == 0) valueList[0] = uint112(-1);

        ICP(cpAddress).init(
            addressList,
            timeLine,
            valueList,
            isOpenTWAP
        );
        }

        _REGISTRY_[baseToken][quoteToken].push(cpAddress);
        _USER_REGISTRY_[creator].push(cpAddress);

        emit NewCP(baseToken, quoteToken, creator, cpAddress);
    }

    // ============ View Functions ============

    function getCrowdPooling(address baseToken, address quoteToken)
        external
        view
        returns (address[] memory pools)
    {
        return _REGISTRY_[baseToken][quoteToken];
    }

    function getCrowdPoolingBidirection(address token0, address token1)
        external
        view
        returns (address[] memory baseToken0Pools, address[] memory baseToken1Pools)
    {
        return (_REGISTRY_[token0][token1], _REGISTRY_[token1][token0]);
    }

    function getCrowdPoolingByUser(address user)
        external
        view
        returns (address[] memory pools)
    {
        return _USER_REGISTRY_[user];
    }

    // ============ Owner Functions ============
    
    function updateCPTemplate(address _newCPTemplate) external onlyOwner {
        _CP_TEMPLATE_ = _newCPTemplate;
    }

    function updateDefaultMaintainer(address _newMaintainer) external onlyOwner {
        _DEFAULT_MAINTAINER_ = _newMaintainer;
    }

    function setFreezeDuration(uint256 _newFreeDuration) public onlyOwner {
        _FREEZE_DURATION_ = _newFreeDuration;
    }

    function setCalmDuration(uint256 _newCalmDuration) public onlyOwner {
        _CALM_DURATION_ = _newCalmDuration;
    }

    function setVestDuration(uint256 _newVestDuration) public onlyOwner {
        _VEST_DURATION_ = _newVestDuration;
    }

    function setCliffRate(uint256 _newCliffRate) public onlyOwner {
        require(_newCliffRate <= 10**18, "CP_FACTORY : INVALID");
        _CLIFF_RATE_ = _newCliffRate;
    }
}
