/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {SafeERC20} from "../../lib/SafeERC20.sol";
import {IERC20} from "../../intf/IERC20.sol";
import {SafeMath} from "../../lib/SafeMath.sol";
import {DecimalMath} from "../../lib/DecimalMath.sol";
import {InitializableOwnable} from "../../lib/InitializableOwnable.sol";
import {IRewardVault, RewardVault} from "./RewardVault.sol";

contract BaseMine is InitializableOwnable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // ============ Storage ============

    struct RewardTokenInfo {
        address rewardToken;
        uint256 startBlock;
        uint256 endBlock;
        address rewardVault;
        uint256 rewardPerBlock;
        uint256 accRewardPerShare;
        uint256 lastRewardBlock;
        uint256 workThroughReward;
        uint256 lastFlagBlock;
        mapping(address => uint256) userRewardPerSharePaid;
        mapping(address => uint256) userRewards;
    }

    RewardTokenInfo[] public rewardTokenInfos;

    uint256 internal _totalSupply;
    mapping(address => uint256) internal _balances;

    // ============ Event =============

    event Claim(uint256 indexed i, address indexed user, uint256 reward);
    event UpdateReward(uint256 indexed i, uint256 rewardPerBlock);
    event UpdateEndBlock(uint256 indexed i, uint256 endBlock);
    event NewRewardToken(uint256 indexed i, address rewardToken);
    event RemoveRewardToken(address rewardToken);
    event WithdrawLeftOver(address owner, uint256 i);

    // ============ View  ============

    function getPendingReward(address user, uint256 i) public view returns (uint256) {
        require(i<rewardTokenInfos.length, "DODOMineV3: REWARD_ID_NOT_FOUND");
        RewardTokenInfo storage rt = rewardTokenInfos[i];
        uint256 accRewardPerShare = rt.accRewardPerShare;
        if (rt.lastRewardBlock != block.number) {
            accRewardPerShare = _getAccRewardPerShare(i);
        }
        return
            DecimalMath.mulFloor(
                balanceOf(user), 
                accRewardPerShare.sub(rt.userRewardPerSharePaid[user])
            ).add(rt.userRewards[user]);
    }

    function getPendingRewardByToken(address user, address rewardToken) external view returns (uint256) {
        return getPendingReward(user, getIdByRewardToken(rewardToken));
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address user) public view returns (uint256) {
        return _balances[user];
    }

    function getRewardTokenById(uint256 i) external view returns (address) {
        require(i<rewardTokenInfos.length, "DODOMineV3: REWARD_ID_NOT_FOUND");
        RewardTokenInfo memory rt = rewardTokenInfos[i];
        return rt.rewardToken;
    }

    function getIdByRewardToken(address rewardToken) public view returns(uint256) {
        uint256 len = rewardTokenInfos.length;
        for (uint256 i = 0; i < len; i++) {
            if (rewardToken == rewardTokenInfos[i].rewardToken) {
                return i;
            }
        }
        require(false, "DODOMineV3: TOKEN_NOT_FOUND");
    }

    function getRewardNum() external view returns(uint256) {
        return rewardTokenInfos.length;
    }

    function getVaultByRewardToken(address rewardToken) public view returns(address) {
        uint256 len = rewardTokenInfos.length;
        for (uint256 i = 0; i < len; i++) {
            if (rewardToken == rewardTokenInfos[i].rewardToken) {
                return rewardTokenInfos[i].rewardVault;
            }
        }
        require(false, "DODOMineV3: TOKEN_NOT_FOUND");
    }

    function getVaultDebtByRewardToken(address rewardToken) public view returns(uint256) {
        uint256 len = rewardTokenInfos.length;
        for (uint256 i = 0; i < len; i++) {
            if (rewardToken == rewardTokenInfos[i].rewardToken) {
                uint256 totalDepositReward = IRewardVault(rewardTokenInfos[i].rewardVault)._TOTAL_REWARD_();
                uint256 gap = rewardTokenInfos[i].endBlock.sub(rewardTokenInfos[i].lastFlagBlock);
                uint256 totalReward = rewardTokenInfos[i].workThroughReward.add(gap.mul(rewardTokenInfos[i].rewardPerBlock));
                if(totalDepositReward >= totalReward) {
                    return 0;
                }else {
                    return totalReward.sub(totalDepositReward);
                }
            }
        }
        require(false, "DODOMineV3: TOKEN_NOT_FOUND");
    }

    // ============ Claim ============

    function claimReward(uint256 i) public {
        require(i<rewardTokenInfos.length, "DODOMineV3: REWARD_ID_NOT_FOUND");
        _updateReward(msg.sender, i);
        RewardTokenInfo storage rt = rewardTokenInfos[i];
        uint256 reward = rt.userRewards[msg.sender];
        if (reward > 0) {
            rt.userRewards[msg.sender] = 0;
            IRewardVault(rt.rewardVault).reward(msg.sender, reward);
            emit Claim(i, msg.sender, reward);
        }
    }

    function claimAllRewards() external {
        uint256 len = rewardTokenInfos.length;
        for (uint256 i = 0; i < len; i++) {
            claimReward(i);
        }
    }

    // =============== Ownable  ================

    function addRewardToken(
        address rewardToken,
        uint256 rewardPerBlock,
        uint256 startBlock,
        uint256 endBlock
    ) external onlyOwner {
        require(rewardToken != address(0), "DODOMineV3: TOKEN_INVALID");
        require(startBlock > block.number, "DODOMineV3: START_BLOCK_INVALID");
        require(endBlock > startBlock, "DODOMineV3: DURATION_INVALID");

        uint256 len = rewardTokenInfos.length;
        for (uint256 i = 0; i < len; i++) {
            require(
                rewardToken != rewardTokenInfos[i].rewardToken,
                "DODOMineV3: TOKEN_ALREADY_ADDED"
            );
        }

        RewardTokenInfo storage rt = rewardTokenInfos.push();
        rt.rewardToken = rewardToken;
        rt.startBlock = startBlock;
        rt.lastFlagBlock = startBlock;
        rt.endBlock = endBlock;
        rt.rewardPerBlock = rewardPerBlock;
        rt.rewardVault = address(new RewardVault(rewardToken));

        uint256 rewardAmount = rewardPerBlock.mul(endBlock.sub(startBlock));
        IERC20(rewardToken).safeTransfer(rt.rewardVault, rewardAmount);
        RewardVault(rt.rewardVault).syncValue();

        emit NewRewardToken(len, rewardToken);
    }

    function setEndBlock(uint256 i, uint256 newEndBlock)
        external
        onlyOwner
    {
        require(i < rewardTokenInfos.length, "DODOMineV3: REWARD_ID_NOT_FOUND");
        _updateReward(address(0), i);
        RewardTokenInfo storage rt = rewardTokenInfos[i];


        uint256 totalDepositReward = RewardVault(rt.rewardVault)._TOTAL_REWARD_();
        uint256 gap = newEndBlock.sub(rt.lastFlagBlock);
        uint256 totalReward = rt.workThroughReward.add(gap.mul(rt.rewardPerBlock));
        require(totalDepositReward >= totalReward, "DODOMineV3: REWARD_NOT_ENOUGH");

        require(block.number < newEndBlock, "DODOMineV3: END_BLOCK_INVALID");
        require(block.number > rt.startBlock, "DODOMineV3: NOT_START");
        require(block.number < rt.endBlock, "DODOMineV3: ALREADY_CLOSE");

        rt.endBlock = newEndBlock;
        emit UpdateEndBlock(i, newEndBlock);
    }

    function setReward(uint256 i, uint256 newRewardPerBlock)
        external
        onlyOwner
    {
        require(i < rewardTokenInfos.length, "DODOMineV3: REWARD_ID_NOT_FOUND");
        _updateReward(address(0), i);
        RewardTokenInfo storage rt = rewardTokenInfos[i];
        
        require(block.number < rt.endBlock, "DODOMineV3: ALREADY_CLOSE");
        
        rt.workThroughReward = rt.workThroughReward.add((block.number.sub(rt.lastFlagBlock)).mul(rt.rewardPerBlock));
        rt.rewardPerBlock = newRewardPerBlock;
        rt.lastFlagBlock = block.number;

        uint256 totalDepositReward = RewardVault(rt.rewardVault)._TOTAL_REWARD_();
        uint256 gap = rt.endBlock.sub(block.number);
        uint256 totalReward = rt.workThroughReward.add(gap.mul(newRewardPerBlock));
        require(totalDepositReward >= totalReward, "DODOMineV3: REWARD_NOT_ENOUGH");

        emit UpdateReward(i, newRewardPerBlock);
    }

    function withdrawLeftOver(uint256 i, uint256 amount) external onlyOwner {
        require(i < rewardTokenInfos.length, "DODOMineV3: REWARD_ID_NOT_FOUND");
        
        RewardTokenInfo storage rt = rewardTokenInfos[i];
        require(block.number > rt.endBlock, "DODOMineV3: MINING_NOT_FINISHED");
        
        uint256 gap = rt.endBlock.sub(rt.lastFlagBlock);
        uint256 totalReward = rt.workThroughReward.add(gap.mul(rt.rewardPerBlock));
        uint256 totalDepositReward = IRewardVault(rt.rewardVault)._TOTAL_REWARD_();
        require(amount <= totalDepositReward.sub(totalReward), "DODOMineV3: NOT_ENOUGH");

        IRewardVault(rt.rewardVault).withdrawLeftOver(msg.sender,amount);

        emit WithdrawLeftOver(msg.sender, i);
    }


    function directTransferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "DODOMineV3: ZERO_ADDRESS");
        emit OwnershipTransferred(_OWNER_, newOwner);
        _OWNER_ = newOwner;
    }

    // ============ Internal  ============

    function _updateReward(address user, uint256 i) internal {
        RewardTokenInfo storage rt = rewardTokenInfos[i];
        if (rt.lastRewardBlock != block.number){
            rt.accRewardPerShare = _getAccRewardPerShare(i);
            rt.lastRewardBlock = block.number;
        }
        if (user != address(0)) {
            rt.userRewards[user] = getPendingReward(user, i);
            rt.userRewardPerSharePaid[user] = rt.accRewardPerShare;
        }
    }

    function _updateAllReward(address user) internal {
        uint256 len = rewardTokenInfos.length;
        for (uint256 i = 0; i < len; i++) {
            _updateReward(user, i);
        }
    }

    function _getUnrewardBlockNum(uint256 i) internal view returns (uint256) {
        RewardTokenInfo memory rt = rewardTokenInfos[i];
        if (block.number < rt.startBlock || rt.lastRewardBlock > rt.endBlock) {
            return 0;
        }
        uint256 start = rt.lastRewardBlock < rt.startBlock ? rt.startBlock : rt.lastRewardBlock;
        uint256 end = rt.endBlock < block.number ? rt.endBlock : block.number;
        return end.sub(start);
    }

    function _getAccRewardPerShare(uint256 i) internal view returns (uint256) {
        RewardTokenInfo memory rt = rewardTokenInfos[i];
        if (totalSupply() == 0) {
            return rt.accRewardPerShare;
        }
        return
            rt.accRewardPerShare.add(
                DecimalMath.divFloor(_getUnrewardBlockNum(i).mul(rt.rewardPerBlock), totalSupply())
            );
    }

}
