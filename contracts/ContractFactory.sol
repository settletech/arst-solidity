//SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/Create2.sol";
import "./MultiSigWallet.sol";
import "./StableToken.sol";
import "./Vault.sol";

contract ContractFactory {
    address public latestTokenAddress;
    mapping(bytes32 => address) public deployedTokens;
    mapping(bytes32 => address) public deployedMultiSigs;
    mapping(bytes32 => address) public deployedVaults;

    modifier isTokenNotDeployed(bytes32 _salt) {
        require(deployedTokens[_salt] == address(0), "T already deployed for this s");
        _;
    }

    modifier isMultiSigNotDeployed(bytes32 _salt) {
        require(deployedMultiSigs[_salt] == address(0), "M already deployed for this s");
        _;
    }

    modifier isVaultNotDeployed(bytes32 _salt) {
        require(deployedVaults[_salt] == address(0), "V already deployed for this s");
        _;
    }

    function deployMultiSigWallet(
        bytes32 _salt,
        address[] memory _owners,
        uint256 _numConfirmationsRequired
    ) external isMultiSigNotDeployed(_salt) returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(MultiSigWallet).creationCode,
            abi.encode(_owners, _numConfirmationsRequired)
        );

        address multiSigAddress = Create2.deploy(0, _salt, bytecode);
        deployedMultiSigs[_salt] = multiSigAddress;

        return multiSigAddress;
    }

    function computeMultiSigWalletAddress(
        bytes32 _salt,
        address[] memory _owners,
        uint256 _numConfirmationsRequired
    ) external view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(MultiSigWallet).creationCode,
            abi.encode(_owners, _numConfirmationsRequired)
        );

        return Create2.computeAddress(_salt, keccak256(bytecode));
    }

    function deployToken(bytes32 _salt, address _custodyVault)
        external
        isTokenNotDeployed(_salt)
        returns (address)
    {
        bytes memory bytecode = abi.encodePacked(
            type(StableToken).creationCode,
            abi.encode(_custodyVault)
        );

        address tokenAddress = Create2.deploy(0, _salt, bytecode);
        deployedTokens[_salt] = tokenAddress;
        latestTokenAddress = tokenAddress;

        return tokenAddress;
    }

    function computeTokenAddress(bytes32 _salt, address _custodyVault)
        external
        view
        returns (address)
    {
        bytes memory bytecode = abi.encodePacked(
            type(StableToken).creationCode,
            abi.encode(_custodyVault)
        );

        return Create2.computeAddress(_salt, keccak256(bytecode));
    }

    function deployVault(bytes32 _salt, address _multisig)
        external
        isVaultNotDeployed(_salt)
        returns (address)
    {
        bytes memory bytecode = abi.encodePacked(
            type(TokenVault).creationCode,
            abi.encode(_multisig)
        );

        address vaultAddress = Create2.deploy(0, _salt, bytecode);
        deployedVaults[_salt] = vaultAddress;

        return vaultAddress;
    }

    function computeVaultAddress(bytes32 _salt, address _multisig)
        external
        view
        returns (address)
    {
        bytes memory bytecode = abi.encodePacked(
            type(TokenVault).creationCode,
            abi.encode(_multisig)
        );

        return Create2.computeAddress(_salt, keccak256(bytecode));
    }

}
