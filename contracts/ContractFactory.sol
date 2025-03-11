//SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Create2.sol";

interface IOwnable {
    function transferOwnership(address newOwner) external;
}

contract ContractFactory is Ownable  {
    address public latestAddress;
    mapping(bytes32 => address) public deployedContracts;

    constructor() Ownable(_msgSender()) {} 

    modifier isContractNotDeployed(bytes32 _salt) {
        require(deployedContracts[_salt] == address(0), "Contract deployed");
        _;
    }

    function changeTokenOwnership(address _contract, address _newOwner)
        external
    {
        (bool success,) = _contract.call(
            abi.encodeWithSignature("transferOwnership(address)", _newOwner)
        );
        require(success, "transfer ownership failed");
    }

    function deployContract(bytes32 _salt, bytes memory _code, bytes memory _params) 
        external 
        isContractNotDeployed(_salt) 
        returns (address) 
    {

        bytes memory initCode = abi.encodePacked(_code, _params);
        
        latestAddress = Create2.deploy(
            0,
            _salt,
            initCode
        );

        deployedContracts[_salt] = latestAddress;
        return latestAddress;
    }

    function computeTokenAddress(bytes32 _salt, bytes memory _code, bytes memory _params)
        public 
        view 
        returns (address) 
    {
        return Create2.computeAddress(
            _salt,
            keccak256(abi.encodePacked(_code, _params))
        );
    }
}
