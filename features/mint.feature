Feature: Mint
Minting stable tokens must be an operation performed 
through Multisig consensus

    Background:
        Given I am Tron User
        And I deployed the Token contract
        And I transfered the ownership to the Multisig

    Scenario: Mint through Multisig (uid:b44cbc04-95c5-4ba6-8c7b-751d89079840)
        Given I am Owner of Multisig contract
        When I call submitTransaction with the address of the ARST token, value 0 and data encoded correctly as EVM protocol defines
        Then the transaction should be queued
        And an event SubmitTransaction should be emitted

    Scenario: Trying to mint from another account (uid:eea3888f-000a-4342-9139-ccd4489dd2d1)
        When I call function mint in StableToken with receiver address and amount
        Then the transaction should revert
    
    Scenario: Execute mint transaction (uid:8db984c4-2e06-4f86-bfab-8082dd675f56)
        Given I am Owner of Multisig contract
        When I call submitTransaction with the address of the ARST token, value 0 and data encoded correctly as EVM protocol defines
        And I call executeTransaction with the index of the submitted transaction
        Then the transaction should execute
        And the receiver should receive the amount of StableToken defined
