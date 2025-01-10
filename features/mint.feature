Feature: Mint
Minting stable tokens must be an operation performed 
through Multisig consensus

    Background:
        Given I am Tron User
        And I deployed the Token contract
        And I transfered the ownership to the Multisig

    Scenario: Mint through Multisig
        Given I am Owner of Multisig contract
        When I call submitTransaction with the address of the ARST token, value 0 and data encoded correctly as EVM protocol defines
        Then the transaction should be queued
        And an event SubmitTransaction should be emitted

    Scenario: Trying to mint from another account
        When I call function mint in StableToken with receiver address and amount
        Then the transaction should revert
