Feature: StableToken
    Scenario: Token Ownership
    Initial stable token owner will be the account that deployed the token

        Given I am Tron User
        And I deployed the Token contract
        When I call owner public view in Token contract
        Then I should see my address as contract owner
    
    Rule: Multisig as Token owner
    Stable token owner should be the Multisig contract
    so that minting and burning tokens should be a decision
    of the onwers of the Multisig

        Example: Multisig as Token owner -- Transfer ownership
            Given I am Tron User
            And I deployed the Token contract
            And I transfered the ownership to the Multisig
            When I call owner public view in Token contract
            Then I should see the address of the Multisig contract as contract owner
        
        Example: Multisig as Token owner -- Not owner anymore
            Given I am Tron User
            And I deployed the Token contract
            And I transfered the ownership to the Multisig
            When I call owner public view in Token contract
            Then I should NOT see my address as contract owner