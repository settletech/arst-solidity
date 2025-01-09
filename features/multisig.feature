Feature: Multisig
    Multisig contract acts as a "democratic table" for owners of the Multisig
    to take actions or execute transactions in a consensual manner.
    Every action related to "Multisig governance" must be made after voting a proposed transaction.
    The following scenarios will demonstrate the actions that can be done via Multisig voting.
    
    Scenario: Get Multisig Owners
    Any blockchain user should retrieve the current owners list from the contract
        
        Given I am Tron User
        When I call getOwners function in Multisig
        Then I should get the complete list of owners of the MultiSig contract
    
    Scenario: Check Multisig accopunt ownership
    An ownership of the multisig should see his/her address in the owners list

        Given I am Owner of Multisig contract
        When I call getOwners function in Multisig
        Then I should see my account as one of the owners of the contract