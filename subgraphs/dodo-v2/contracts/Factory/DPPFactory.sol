/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {InitializableOwnable} from "../lib/InitializableOwnable.sol";
import {ICloneFactory} from "../lib/CloneFactory.sol";
import {IFeeRateModel} from "../lib/FeeRateModel.sol";
import {IDPP} from "../DODOPrivatePool/intf/IDPP.sol";
import {IDPPAdmin} from "../DODOPrivatePool/intf/IDPPAdmin.sol";

/**
 * @title DODO PrivatePool Factory
 * @author DODO Breeder
 *
 * @notice Create And Register DPP Pools 
 */
contract DPPFactory is InitializableOwnable {
    // ============ Templates ============

    address public immutable _CLONE_FACTORY_;
    address public immutable _DEFAULT_MT_FEE_RATE_MODEL_;
    address public immutable _DODO_APPROVE_PROXY_;
    address public _DEFAULT_MAINTAINER_;
    address public _DPP_TEMPLATE_;
    address public _DPP_ADMIN_TEMPLATE_;

    mapping (address => bool) public isAdminListed;

    // ============ Registry ============

    // base -> quote -> DPP address list
    mapping(address => mapping(address => address[])) public _REGISTRY_;
    // creator -> DPP address list
    mapping(address => address[]) public _USER_REGISTRY_;

    // ============ Events ============

    event NewDPP(
        address baseToken,
        address quoteToken,
        address creator,
        address dpp
    );

    event RemoveDPP(address dpp);

    event addAdmin(address admin);
    event removeAdmin(address admin);

    constructor(
        address cloneFactory,
        address dppTemplate,
        address dppAdminTemplate,
        address defaultMaintainer,
        address defaultMtFeeRateModel,
        address dodoApproveProxy
    ) public {
        _CLONE_FACTORY_ = cloneFactory;
        _DPP_TEMPLATE_ = dppTemplate;
        _DPP_ADMIN_TEMPLATE_ = dppAdminTemplate;
        _DEFAULT_MAINTAINER_ = defaultMaintainer;
        _DEFAULT_MT_FEE_RATE_MODEL_ = defaultMtFeeRateModel;
        _DODO_APPROVE_PROXY_ = dodoApproveProxy;
    }

    // ============ Functions ============

    function createDODOPrivatePool() external returns (address newPrivatePool) {
        newPrivatePool = ICloneFactory(_CLONE_FACTORY_).clone(_DPP_TEMPLATE_);
    }

    function initDODOPrivatePool(
        address dppAddress,
        address creator,
        address baseToken,
        address quoteToken,
        uint256 lpFeeRate,
        uint256 k,
        uint256 i,
        bool isOpenTwap
    ) external {
        require(isAdminListed[msg.sender], "ACCESS_DENIED");
        {
            address _dppAddress = dppAddress;
            address adminModel = _createDPPAdminModel(
                creator,
                _dppAddress,
                creator,
                _DODO_APPROVE_PROXY_
            );
            IDPP(_dppAddress).init(
                adminModel,
                _DEFAULT_MAINTAINER_,
                baseToken,
                quoteToken,
                lpFeeRate,
                _DEFAULT_MT_FEE_RATE_MODEL_,
                k,
                i,
                isOpenTwap
            );
        }

        _REGISTRY_[baseToken][quoteToken].push(dppAddress);
        _USER_REGISTRY_[creator].push(dppAddress);
        emit NewDPP(baseToken, quoteToken, creator, dppAddress);
    }

    function _createDPPAdminModel(
        address owner,
        address dpp,
        address operator,
        address dodoApproveProxy
    ) internal returns (address adminModel) {
        adminModel = ICloneFactory(_CLONE_FACTORY_).clone(_DPP_ADMIN_TEMPLATE_);
        IDPPAdmin(adminModel).init(owner, dpp, operator, dodoApproveProxy);
    }

    // ============ Admin Operation Functions ============
    
    function updateAdminTemplate(address _newDPPAdminTemplate) external onlyOwner {
        _DPP_ADMIN_TEMPLATE_ = _newDPPAdminTemplate;
    }

    function updateDefaultMaintainer(address _newMaintainer) external onlyOwner {
        _DEFAULT_MAINTAINER_ = _newMaintainer;
    }

    function updateDppTemplate(address _newDPPTemplate) external onlyOwner {
        _DPP_TEMPLATE_ = _newDPPTemplate;
    }

    function addAdminList (address contractAddr) external onlyOwner {
        isAdminListed[contractAddr] = true;
        emit addAdmin(contractAddr);
    }

    function removeAdminList (address contractAddr) external onlyOwner {
        isAdminListed[contractAddr] = false;
        emit removeAdmin(contractAddr);
    }

    function addPoolByAdmin(
        address creator,
        address baseToken, 
        address quoteToken,
        address pool
    ) external onlyOwner {
        _REGISTRY_[baseToken][quoteToken].push(pool);
        _USER_REGISTRY_[creator].push(pool);
        emit NewDPP(baseToken, quoteToken, creator, pool);
    }

    function batchAddPoolByAdmin(
        address[] memory creators,
        address[] memory baseTokens, 
        address[] memory quoteTokens,
        address[] memory pools
    ) external onlyOwner {
        require(creators.length == baseTokens.length,"PARAMS_INVALID");
        require(creators.length == quoteTokens.length,"PARAMS_INVALID");
        require(creators.length == pools.length,"PARAMS_INVALID");
        for(uint256 i = 0; i < creators.length; i++) {
            address creator = creators[i];
            address baseToken = baseTokens[i];
            address quoteToken = quoteTokens[i];
            address pool = pools[i];
            
            _REGISTRY_[baseToken][quoteToken].push(pool);
            _USER_REGISTRY_[creator].push(pool);
            emit NewDPP(baseToken, quoteToken, creator, pool);
        }
    }

    function removePoolByAdmin(
        address creator,
        address baseToken, 
        address quoteToken,
        address pool
    ) external onlyOwner {
        address[] memory registryList = _REGISTRY_[baseToken][quoteToken];
        for (uint256 i = 0; i < registryList.length; i++) {
            if (registryList[i] == pool) {
                registryList[i] = registryList[registryList.length - 1];
                break;
            }
        }
        _REGISTRY_[baseToken][quoteToken] = registryList;
        _REGISTRY_[baseToken][quoteToken].pop();
        address[] memory userRegistryList = _USER_REGISTRY_[creator];
        for (uint256 i = 0; i < userRegistryList.length; i++) {
            if (userRegistryList[i] == pool) {
                userRegistryList[i] = userRegistryList[userRegistryList.length - 1];
                break;
            }
        }
        _USER_REGISTRY_[creator] = userRegistryList;
        _USER_REGISTRY_[creator].pop();
        emit RemoveDPP(pool);
    }

    // ============ View Functions ============

    function getDODOPool(address baseToken, address quoteToken)
        external
        view
        returns (address[] memory pools)
    {
        return _REGISTRY_[baseToken][quoteToken];
    }

    function getDODOPoolBidirection(address token0, address token1)
        external
        view
        returns (address[] memory baseToken0Pool, address[] memory baseToken1Pool)
    {
        return (_REGISTRY_[token0][token1], _REGISTRY_[token1][token0]);
    }

    function getDODOPoolByUser(address user) 
        external
        view
        returns (address[] memory pools)
    {
        return _USER_REGISTRY_[user];
    }
}
