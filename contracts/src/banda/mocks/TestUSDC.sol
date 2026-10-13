// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {DemoToken} from "../demo/DemoToken.sol";

/// @notice Arc settlement stand-in for Paxos testnet USDG: test USDC with no monetary value.
/// Wallets claim from a limited faucet; only the owner can mint, to fund the pool's solvency buffer.
contract TestUSDC is DemoToken {
    uint256 public constant GRANT = 1_000e6;
    uint256 public constant LIFETIME_LIMIT = 5_000e6;
    mapping(address => uint256) public claimed;
    mapping(address => uint256) public nextClaimAt;
    event Claimed(address indexed wallet, uint256 amount, uint256 nextClaimAt);

    constructor(address owner_) DemoToken("Banda Test USDC - No Monetary Value", "tUSDC", 6, owner_) {}

    function claim() external {
        require(block.timestamp >= nextClaimAt[msg.sender], "Faucet: daily limit");
        require(claimed[msg.sender] + GRANT <= LIFETIME_LIMIT, "Faucet: lifetime limit");
        claimed[msg.sender] += GRANT;
        nextClaimAt[msg.sender] = block.timestamp + 1 days;
        _mint(msg.sender, GRANT);
        emit Claimed(msg.sender, GRANT, nextClaimAt[msg.sender]);
    }
}
