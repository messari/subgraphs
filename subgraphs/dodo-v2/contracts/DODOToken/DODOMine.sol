/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {Ownable} from "../lib/Ownable.sol";
import {DecimalMath} from "../lib/DecimalMath.sol";
import {SafeERC20} from "../lib/SafeERC20.sol";
import {SafeMath} from "../lib/SafeMath.sol";
import {IERC20} from "../intf/IERC20.sol";
import {IDODORewardVault, DODORewardVault} from "./DODORewardVault.sol";

contract DODOMine is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of DODOs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accDODOPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accDODOPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        address lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. DODOs to distribute per block.
        uint256 lastRewardBlock; // Last block number that DODOs distribution occurs.
        uint256 accDODOPerShare; // Accumulated DODOs per share, times 1e12. See below.
    }

    address public dodoRewardVault;
    uint256 public dodoPerBlock;

    // Info of each pool.
    PoolInfo[] public poolInfos;
    mapping(address => uint256) public lpTokenRegistry;

    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    mapping(address => uint256) public realizedReward;

    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    // The block number when DODO mining starts.
    uint256 public startBlock;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Claim(address indexed user, uint256 amount);

    constructor(address _dodoToken, uint256 _startBlock) public {
        dodoRewardVault = address(new DODORewardVault(_dodoToken));
        startBlock = _startBlock;
    }

    // ============ Modifiers ============

    modifier lpTokenExist(address lpToken) {
        require(lpTokenRegistry[lpToken] > 0, "LP Token Not Exist");
        _;
    }

    modifier lpTokenNotExist(address lpToken) {
        require(lpTokenRegistry[lpToken] == 0, "LP Token Already Exist");
        _;
    }

    // ============ Helper ============

    function poolLength() external view returns (uint256) {
        return poolInfos.length;
    }

    function getPid(address _lpToken) public view lpTokenExist(_lpToken) returns (uint256) {
        return lpTokenRegistry[_lpToken] - 1;
    }

    function getUserLpBalance(address _lpToken, address _user) public view returns (uint256) {
        uint256 pid = getPid(_lpToken);
        return userInfo[pid][_user].amount;
    }

    // ============ Ownable ============

    function addLpToken(
        address _lpToken,
        uint256 _allocPoint,
        bool _withUpdate
    ) public lpTokenNotExist(_lpToken) onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfos.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accDODOPerShare: 0
            })
        );
        lpTokenRegistry[_lpToken] = poolInfos.length;
    }

    function setLpToken(
        address _lpToken,
        uint256 _allocPoint,
        bool _withUpdate
    ) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 pid = getPid(_lpToken);
        totalAllocPoint = totalAllocPoint.sub(poolInfos[pid].allocPoint).add(_allocPoint);
        poolInfos[pid].allocPoint = _allocPoint;
    }

    function setReward(uint256 _dodoPerBlock, bool _withUpdate) external onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        dodoPerBlock = _dodoPerBlock;
    }

    // ============ View Rewards ============

    function getPendingReward(address _lpToken, address _user) external view returns (uint256) {
        uint256 pid = getPid(_lpToken);
        PoolInfo storage pool = poolInfos[pid];
        UserInfo storage user = userInfo[pid][_user];
        uint256 accDODOPerShare = pool.accDODOPerShare;
        uint256 lpSupply = IERC20(pool.lpToken).balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 DODOReward = block
                .number
                .sub(pool.lastRewardBlock)
                .mul(dodoPerBlock)
                .mul(pool.allocPoint)
                .div(totalAllocPoint);
            accDODOPerShare = accDODOPerShare.add(DecimalMath.divFloor(DODOReward, lpSupply));
        }
        return DecimalMath.mulFloor(user.amount, accDODOPerShare).sub(user.rewardDebt);
    }

    function getAllPendingReward(address _user) external view returns (uint256) {
        uint256 length = poolInfos.length;
        uint256 totalReward = 0;
        for (uint256 pid = 0; pid < length; ++pid) {
            if (userInfo[pid][_user].amount == 0 || poolInfos[pid].allocPoint == 0) {
                continue; // save gas
            }
            PoolInfo storage pool = poolInfos[pid];
            UserInfo storage user = userInfo[pid][_user];
            uint256 accDODOPerShare = pool.accDODOPerShare;
            uint256 lpSupply = IERC20(pool.lpToken).balanceOf(address(this));
            if (block.number > pool.lastRewardBlock && lpSupply != 0) {
                uint256 DODOReward = block
                    .number
                    .sub(pool.lastRewardBlock)
                    .mul(dodoPerBlock)
                    .mul(pool.allocPoint)
                    .div(totalAllocPoint);
                accDODOPerShare = accDODOPerShare.add(DecimalMath.divFloor(DODOReward, lpSupply));
            }
            totalReward = totalReward.add(
                DecimalMath.mulFloor(user.amount, accDODOPerShare).sub(user.rewardDebt)
            );
        }
        return totalReward;
    }

    function getRealizedReward(address _user) external view returns (uint256) {
        return realizedReward[_user];
    }

    function getDlpMiningSpeed(address _lpToken) external view returns (uint256) {
        uint256 pid = getPid(_lpToken);
        PoolInfo storage pool = poolInfos[pid];
        return dodoPerBlock.mul(pool.allocPoint).div(totalAllocPoint);
    }

    // ============ Update Pools ============

    // Update reward vairables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfos.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfos[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = IERC20(pool.lpToken).balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 DODOReward = block
            .number
            .sub(pool.lastRewardBlock)
            .mul(dodoPerBlock)
            .mul(pool.allocPoint)
            .div(totalAllocPoint);
        pool.accDODOPerShare = pool.accDODOPerShare.add(DecimalMath.divFloor(DODOReward, lpSupply));
        pool.lastRewardBlock = block.number;
    }

    // ============ Deposit & Withdraw & Claim ============
    // Deposit & withdraw will also trigger claim

    function deposit(address _lpToken, uint256 _amount) public {
        uint256 pid = getPid(_lpToken);
        PoolInfo storage pool = poolInfos[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        updatePool(pid);
        if (user.amount > 0) {
            uint256 pending = DecimalMath.mulFloor(user.amount, pool.accDODOPerShare).sub(
                user.rewardDebt
            );
            safeDODOTransfer(msg.sender, pending);
        }
        IERC20(pool.lpToken).safeTransferFrom(address(msg.sender), address(this), _amount);
        user.amount = user.amount.add(_amount);
        user.rewardDebt = DecimalMath.mulFloor(user.amount, pool.accDODOPerShare);
        emit Deposit(msg.sender, pid, _amount);
    }

    function withdraw(address _lpToken, uint256 _amount) public {
        uint256 pid = getPid(_lpToken);
        PoolInfo storage pool = poolInfos[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        require(user.amount >= _amount, "withdraw too much");
        updatePool(pid);
        uint256 pending = DecimalMath.mulFloor(user.amount, pool.accDODOPerShare).sub(
            user.rewardDebt
        );
        safeDODOTransfer(msg.sender, pending);
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = DecimalMath.mulFloor(user.amount, pool.accDODOPerShare);
        IERC20(pool.lpToken).safeTransfer(address(msg.sender), _amount);
        emit Withdraw(msg.sender, pid, _amount);
    }

    function withdrawAll(address _lpToken) public {
        uint256 balance = getUserLpBalance(_lpToken, msg.sender);
        withdraw(_lpToken, balance);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(address _lpToken) public {
        uint256 pid = getPid(_lpToken);
        PoolInfo storage pool = poolInfos[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        IERC20(pool.lpToken).safeTransfer(address(msg.sender), user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
    }

    function claim(address _lpToken) public {
        uint256 pid = getPid(_lpToken);
        if (userInfo[pid][msg.sender].amount == 0 || poolInfos[pid].allocPoint == 0) {
            return; // save gas
        }
        PoolInfo storage pool = poolInfos[pid];
        UserInfo storage user = userInfo[pid][msg.sender];
        updatePool(pid);
        uint256 pending = DecimalMath.mulFloor(user.amount, pool.accDODOPerShare).sub(
            user.rewardDebt
        );
        user.rewardDebt = DecimalMath.mulFloor(user.amount, pool.accDODOPerShare);
        safeDODOTransfer(msg.sender, pending);
    }

    function claimAll() public {
        uint256 length = poolInfos.length;
        uint256 pending = 0;
        for (uint256 pid = 0; pid < length; ++pid) {
            if (userInfo[pid][msg.sender].amount == 0 || poolInfos[pid].allocPoint == 0) {
                continue; // save gas
            }
            PoolInfo storage pool = poolInfos[pid];
            UserInfo storage user = userInfo[pid][msg.sender];
            updatePool(pid);
            pending = pending.add(
                DecimalMath.mulFloor(user.amount, pool.accDODOPerShare).sub(user.rewardDebt)
            );
            user.rewardDebt = DecimalMath.mulFloor(user.amount, pool.accDODOPerShare);
        }
        safeDODOTransfer(msg.sender, pending);
    }

    // Safe DODO transfer function
    function safeDODOTransfer(address _to, uint256 _amount) internal {
        IDODORewardVault(dodoRewardVault).reward(_to, _amount);
        realizedReward[_to] = realizedReward[_to].add(_amount);
        emit Claim(_to, _amount);
    }
}
