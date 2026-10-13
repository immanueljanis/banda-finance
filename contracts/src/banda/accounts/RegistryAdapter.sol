// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IStandard6551Registry {
    function createAccount(address implementation, bytes32 salt, uint256 chainId, address nft, uint256 id) external returns (address);
    function account(address implementation, bytes32 salt, uint256 chainId, address nft, uint256 id) external view returns (address);
}

/// @notice Preserves the existing DepositFacet ABI while using the standard registry.
contract RegistryAdapter {
    IStandard6551Registry public immutable registry;
    constructor(address registry_) {
        require(registry_.code.length != 0, "Registry: missing code");
        registry = IStandard6551Registry(registry_);
    }
    function createAccount(address implementation, uint256 chainId, address nft, uint256 id, uint256 salt, bytes calldata initData) external returns (address) {
        require(initData.length == 0, "Registry: no initialization");
        return registry.createAccount(implementation, bytes32(salt), chainId, nft, id);
    }
    function account(address implementation, uint256 chainId, address nft, uint256 id, uint256 salt) external view returns (address) {
        return registry.account(implementation, bytes32(salt), chainId, nft, id);
    }
}
