// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice Local rehearsal registry using the ERC-6551 reference proxy layout.
/// Mainnet uses the canonical singleton and its published bytecode instead.
contract ERC6551Registry {
    event ERC6551AccountCreated(address account, address indexed implementation, bytes32 salt, uint256 chainId, address indexed tokenContract, uint256 indexed tokenId);
    error AccountCreationFailed();
    function _code(address implementation, bytes32 salt, uint256 chainId, address nft, uint256 id) private pure returns (bytes memory) {
        return abi.encodePacked(hex"3d60ad80600a3d3981f3", hex"363d3d373d3d3d363d73", implementation,
            hex"5af43d82803e903d91602b57fd5bf3", abi.encode(salt, chainId, nft, id));
    }
    function account(address implementation, bytes32 salt, uint256 chainId, address nft, uint256 id) public view returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(_code(implementation, salt, chainId, nft, id)))))));
    }
    function createAccount(address implementation, bytes32 salt, uint256 chainId, address nft, uint256 id) external returns (address result) {
        result = account(implementation, salt, chainId, nft, id);
        if (result.code.length != 0) return result;
        bytes memory code = _code(implementation, salt, chainId, nft, id);
        assembly { result := create2(0, add(code, 32), mload(code), salt) }
        if (result == address(0)) revert AccountCreationFailed();
        emit ERC6551AccountCreated(result, implementation, salt, chainId, nft, id);
    }
}
