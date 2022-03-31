/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {InitializableOwnable} from "../../lib/InitializableOwnable.sol";
import {IDODOApproveProxy} from "../DODOApproveProxy.sol";
import {IRewardVault} from "../../DODOToken/DODOMineV3/RewardVault.sol";
import {IDODOMineV3Registry} from "../../Factory/Registries/DODOMineV3Registry.sol";
import {ICloneFactory} from "../../lib/CloneFactory.sol";
import {SafeMath} from "../../lib/SafeMath.sol";

interface IMineV3 {
    function init(address owner, address token) external;

    function addRewardToken(
        address rewardToken,
        uint256 rewardPerBlock,
        uint256 startBlock,
        uint256 endBlock
    ) external;

    function directTransferOwnership(address newOwner) external;

    function getVaultByRewardToken(address rewardToken) external view returns(address);
}

/**
 * @title DODOMineV3 Proxy
 * @author DODO Breeder
 *
 * @notice Create And Register DODOMineV3 Contracts 
 */
contract DODOMineV3Proxy is InitializableOwnable {
    using SafeMath for uint256;
    // ============ Templates ============

    address public immutable _CLONE_FACTORY_;
    address public immutable _DODO_APPROVE_PROXY_;
    address public immutable _DODO_MINEV3_REGISTRY_;
    address public _MINEV3_TEMPLATE_;


    // ============ Events ============
    event DepositRewardToVault(address mine, address rewardToken, uint256 amount);
    event DepositRewardToMine(address mine, address rewardToken, uint256 amount);
    event CreateMineV3(address account, address mineV3);
    event ChangeMineV3Template(address mineV3);

    constructor(
        address cloneFactory,
        address mineTemplate,
        address dodoApproveProxy,
        address dodoMineV3Registry
    ) public {
        _CLONE_FACTORY_ = cloneFactory;
        _MINEV3_TEMPLATE_ = mineTemplate;
        _DODO_APPROVE_PROXY_ = dodoApproveProxy;
        _DODO_MINEV3_REGISTRY_ = dodoMineV3Registry;
    }

    // ============ Functions ============

    function createDODOMineV3(
        address stakeToken,
        bool isLpToken,
        address[] memory rewardTokens,
        uint256[] memory rewardPerBlock,
        uint256[] memory startBlock,
        uint256[] memory endBlock
    ) external returns (address newMineV3) {
        require(rewardTokens.length > 0, "REWARD_EMPTY");
        require(rewardTokens.length == rewardPerBlock.length, "REWARD_PARAM_NOT_MATCH");
        require(startBlock.length == rewardPerBlock.length, "REWARD_PARAM_NOT_MATCH");
        require(endBlock.length == rewardPerBlock.length, "REWARD_PARAM_NOT_MATCH");

        newMineV3 = ICloneFactory(_CLONE_FACTORY_).clone(_MINEV3_TEMPLATE_);

        IMineV3(newMineV3).init(address(this), stakeToken);

        for(uint i = 0; i<rewardTokens.length; i++) {
            uint256 rewardAmount = rewardPerBlock[i].mul(endBlock[i].sub(startBlock[i]));
            IDODOApproveProxy(_DODO_APPROVE_PROXY_).claimTokens(rewardTokens[i], msg.sender, newMineV3, rewardAmount);
            IMineV3(newMineV3).addRewardToken(
                rewardTokens[i],
                rewardPerBlock[i],
                startBlock[i],
                endBlock[i]
            );
        }

        IMineV3(newMineV3).directTransferOwnership(msg.sender);

        IDODOMineV3Registry(_DODO_MINEV3_REGISTRY_).addMineV3(newMineV3, isLpToken, stakeToken);

        emit CreateMineV3(msg.sender, newMineV3);
    }

    function depositRewardToVault(
        address mineV3,
        address rewardToken,
        uint256 amount
    ) external {    
        address rewardVault = IMineV3(mineV3).getVaultByRewardToken(rewardToken);
        IDODOApproveProxy(_DODO_APPROVE_PROXY_).claimTokens(rewardToken, msg.sender, rewardVault, amount);
        IRewardVault(rewardVault).syncValue();

        emit DepositRewardToVault(mineV3,rewardToken,amount);
    }

    function depositRewardToMine(
        address mineV3,
        address rewardToken,
        uint256 amount
    ) external {
        require(mineV3 != address(0), "MINE_EMPTY");
        IDODOApproveProxy(_DODO_APPROVE_PROXY_).claimTokens(rewardToken, msg.sender, mineV3, amount);

        emit DepositRewardToMine(mineV3,rewardToken,amount);
    }

    // ============ Admin Operation Functions ============
    
    function updateMineV3Template(address _newMineV3Template) external onlyOwner {
        _MINEV3_TEMPLATE_ = _newMineV3Template;
        emit ChangeMineV3Template(_newMineV3Template);
    }
}
