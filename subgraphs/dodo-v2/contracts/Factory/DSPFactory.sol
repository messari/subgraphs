/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {InitializableOwnable} from "../lib/InitializableOwnable.sol";
import {ICloneFactory} from "../lib/CloneFactory.sol";
import {IDSP} from "../DODOStablePool/intf/IDSP.sol";

interface IDSPFactory {
    function createDODOStablePool(
        address baseToken,
        address quoteToken,
        uint256 lpFeeRate,
        uint256 i,
        uint256 k,
        bool isOpenTWAP
    ) external returns (address newStablePool);
}

/**
 * @title DODO StablePool Factory
 * @author DODO Breeder
 *
 * @notice Create And Register DSP Pools
 */
contract DSPFactory is InitializableOwnable {
    // ============ Templates ============

    address public immutable _CLONE_FACTORY_;
    address public immutable _DEFAULT_MT_FEE_RATE_MODEL_;
    address public _DEFAULT_MAINTAINER_;
    address public _DSP_TEMPLATE_;

    // ============ Registry ============

    // base -> quote -> DSP address list
    mapping(address => mapping(address => address[])) public _REGISTRY_;
    // creator -> DSP address list
    mapping(address => address[]) public _USER_REGISTRY_;

    // ============ Events ============

    event NewDSP(address baseToken, address quoteToken, address creator, address DSP);

    event RemoveDSP(address DSP);

    // ============ Functions ============

    constructor(
        address cloneFactory,
        address DSPTemplate,
        address defaultMaintainer,
        address defaultMtFeeRateModel
    ) public {
        _CLONE_FACTORY_ = cloneFactory;
        _DSP_TEMPLATE_ = DSPTemplate;
        _DEFAULT_MAINTAINER_ = defaultMaintainer;
        _DEFAULT_MT_FEE_RATE_MODEL_ = defaultMtFeeRateModel;
    }

    function createDODOStablePool(
        address baseToken,
        address quoteToken,
        uint256 lpFeeRate,
        uint256 i,
        uint256 k,
        bool isOpenTWAP
    ) external returns (address newStablePool) {
        newStablePool = ICloneFactory(_CLONE_FACTORY_).clone(_DSP_TEMPLATE_);
        {
            IDSP(newStablePool).init(
                _DEFAULT_MAINTAINER_,
                baseToken,
                quoteToken,
                lpFeeRate,
                _DEFAULT_MT_FEE_RATE_MODEL_,
                i,
                k,
                isOpenTWAP
            );
        }
        _REGISTRY_[baseToken][quoteToken].push(newStablePool);
        _USER_REGISTRY_[tx.origin].push(newStablePool);
        emit NewDSP(baseToken, quoteToken, tx.origin, newStablePool);
    }

    // ============ Admin Operation Functions ============

    function updateDSPTemplate(address _newDSPTemplate) external onlyOwner {
        _DSP_TEMPLATE_ = _newDSPTemplate;
    }

    function updateDefaultMaintainer(address _newMaintainer) external onlyOwner {
        _DEFAULT_MAINTAINER_ = _newMaintainer;
    }

    function addPoolByAdmin(
        address creator,
        address baseToken,
        address quoteToken,
        address pool
    ) external onlyOwner {
        _REGISTRY_[baseToken][quoteToken].push(pool);
        _USER_REGISTRY_[creator].push(pool);
        emit NewDSP(baseToken, quoteToken, creator, pool);
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
        emit RemoveDSP(pool);
    }

    // ============ View Functions ============

    function getDODOPool(address baseToken, address quoteToken)
        external
        view
        returns (address[] memory machines)
    {
        return _REGISTRY_[baseToken][quoteToken];
    }

    function getDODOPoolBidirection(address token0, address token1)
        external
        view
        returns (address[] memory baseToken0Machines, address[] memory baseToken1Machines)
    {
        return (_REGISTRY_[token0][token1], _REGISTRY_[token1][token0]);
    }

    function getDODOPoolByUser(address user) external view returns (address[] memory machines) {
        return _USER_REGISTRY_[user];
    }
}
