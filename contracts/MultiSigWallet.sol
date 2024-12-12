// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract MultiSigWallet is Ownable {

    mapping(address => bool) public isOwner;
    uint public required;
    address[] public owners;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
    }

    Transaction[] public transactions;
    mapping(uint => mapping(address => bool)) public confirmations;

    event Submission(uint indexed txIndex);
    event Confirmation(address indexed sender, uint indexed txIndex);
    event Revocation(address indexed sender, uint indexed txIndex);
    event Execution(uint indexed txIndex);
    event ExecutionFailure(uint indexed txIndex);
    event Deposit(address indexed sender, uint value);
    event OwnerAddition(address indexed owner);
    event OwnerRemoval(address indexed owner);
    event RequirementChange(uint required);

    modifier validRequirement(uint ownerCount, uint _required) {
        require(ownerCount <= 255 && _required <= ownerCount && _required > 0 && ownerCount > 0);
        _;
    }

    constructor(address[] memory _owners, uint _required) Ownable(msg.sender) validRequirement(_owners.length, _required) {
        for (uint i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0) && !isOwner[_owners[i]]);
            isOwner[_owners[i]] = true;
        }
        owners = _owners;
        required = _required;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function submitTransaction(address destination, uint value, bytes memory data) public returns (uint transactionId) {
        transactionId = transactions.length;
        transactions.push(Transaction({
            to: destination,
            value: value,
            data: data,
            executed: false
        }));
        emit Submission(transactionId);
        console.log("Submitted transaction ID:", transactionId);
    }

    function confirmTransaction(uint transactionId) public {
        require(isOwner[msg.sender], "isOwner[msg.sender]");
        require(!confirmations[transactionId][msg.sender]);
        confirmations[transactionId][msg.sender] = true;
        emit Confirmation(msg.sender, transactionId);
    }

    function revokeConfirmation(uint transactionId) public {
        require(isOwner[msg.sender], "Not an owner");
        require(confirmations[transactionId][msg.sender], "Transaction not confirmed");
        confirmations[transactionId][msg.sender] = false;
        emit Revocation(msg.sender, transactionId);
    }

    function executeTransaction(uint transactionId) public {
        require(isOwner[msg.sender], "Not an owner");
        Transaction storage txn = transactions[transactionId];
        require(!txn.executed, "Transaction already executed");
        bool success;
        console.log("Executing transaction", transactionId);
        uint count = 0;
        for (uint i = 0; i < owners.length; i++) {
            console.log("Owner", i, ":", owners[i]);
            console.log("Confirmed:", confirmations[transactionId][owners[i]]);
            if (confirmations[transactionId][owners[i]]) {
                count += 1;
            }
            console.log("Count:", count);
            if (count == required) {
                break;
            }
        }
        console.log("Checking confirmations"); 
        require(count == required, "Not enough confirmations");
        txn.executed = true;

        if (txn.value > 0) {
            (success, ) = txn.to.call{value: txn.value}(""); // Call with empty data for ETH transfers
            require(success, "Failed to send Ether");
        }
        console.log("Making contract call");
        if (txn.data.length > 0) {
            (success, ) = txn.to.call(txn.data); // Call for contract calls
            require(success, "Transaction failed");
        }
        
        if (success) {
            emit Execution(transactionId);
        } else {
            emit ExecutionFailure(transactionId);
        }
    }

    function addOwner(address owner) public onlyOwner {
        require(owner != address(0) && !isOwner[owner]);
        isOwner[owner] = true;
        owners.push(owner);
        emit OwnerAddition(owner);
    }

    function removeOwner(address owner) public onlyOwner {
        require(isOwner[owner]);
        isOwner[owner] = false;
        for (uint i = 0; i < owners.length - 1; i++) {
            if (owners[i] == owner) {
                owners[i] = owners[owners.length - 1];
                break;
            }
        }
        owners.pop();
        if (required > owners.length) {
            changeRequirement(owners.length);
        }
        emit OwnerRemoval(owner);
    }

    function changeRequirement(uint _required) public onlyOwner validRequirement(owners.length, _required) {
        required = _required;
        emit RequirementChange(_required);
    }

    function getConfirmationCount(uint transactionId) public view returns (uint count) {
        for (uint i = 0; i < owners.length; i++) {
            if (confirmations[transactionId][owners[i]]) {
                count += 1;
            }
        }
    }

    function getTransactionCount(bool pending, bool executed) public view returns (uint count) {
        for (uint i = 0; i < transactions.length; i++) {
            if (pending && !transactions[i].executed || executed && transactions[i].executed) {
                count += 1;
            }
        }
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getConfirmations(uint transactionId) public view returns (address[] memory _confirmations) {
        address[] memory confirmationsTemp = new address[](owners.length);
        uint count = 0;
        uint i;
        for (i = 0; i < owners.length; i++) {
            if (confirmations[transactionId][owners[i]]) {
                confirmationsTemp[count] = owners[i];
                count += 1;
            }
        }
        _confirmations = new address[](count);
        for (i = 0; i < count; i++) {
            _confirmations[i] = confirmationsTemp[i];
        }
    }

    function isConfirmed(uint transactionId) public view returns (bool) {
        uint count = 0;
        for (uint i = 0; i < owners.length; i++) {
            if (confirmations[transactionId][owners[i]]) {
                count += 1;
            }
            if (count == required) {
                return true;
            }
        }
        return false;
    }
}