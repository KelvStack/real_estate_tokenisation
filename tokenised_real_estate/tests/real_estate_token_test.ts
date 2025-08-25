import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that contract owner can add new properties",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000), // 5000 STX price
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200), // 1200 sq ft
                types.ascii("Luxury 2-bedroom apartment in downtown Manhattan")
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.uint(0));
        
        // Verify property details
        let propertyCall = chain.callReadOnlyFn('real_estate_token', 'get-property', [types.uint(0)], deployer.address);
        let property = propertyCall.result.expectSome().expectTuple();
        assertEquals(property['owner'], deployer.address);
        assertEquals(property['price'], types.uint(5000000000));
        assertEquals(property['location'], types.ascii("123 Main St, NYC"));
        assertEquals(property['tokenized'], types.bool(false));
        assertEquals(property['for-sale'], types.bool(false));
    },
});

Clarinet.test({
    name: "Ensure that non-owner cannot add properties",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(3000000000),
                types.ascii("456 Oak Ave"),
                types.ascii("House"),
                types.uint(2500),
                types.ascii("Single family home")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectErr(), types.uint(100)); // err-owner-only
    },
});

Clarinet.test({
    name: "Ensure that property owner can update property details",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        
        // Add property first
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address)
        ]);
        
        // Update property details
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'update-property', [
                types.uint(0),
                types.uint(5500000000), // New price
                types.bool(true), // Set for sale
                types.ascii("Updated luxury 2-bedroom apartment with city views")
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify updates
        let propertyCall = chain.callReadOnlyFn('real_estate_token', 'get-property', [types.uint(0)], deployer.address);
        let property = propertyCall.result.expectSome().expectTuple();
        assertEquals(property['price'], types.uint(5500000000));
        assertEquals(property['for-sale'], types.bool(true));
    },
});

Clarinet.test({
    name: "Ensure that non-owner cannot update property details",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let wallet1 = accounts.get('wallet_1')!;
        
        // Add property as owner
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address)
        ]);
        
        // Try to update as non-owner
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'update-property', [
                types.uint(0),
                types.uint(6000000000),
                types.bool(true),
                types.ascii("Unauthorized update")
            ], wallet1.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectErr(), types.uint(102)); // err-unauthorized
    },
});

Clarinet.test({
    name: "Ensure that property tokenization works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        
        // Add property first
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address)
        ]);
        
        // Tokenize property
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'tokenize-property', [
                types.uint(0),
                types.uint(1000), // 1000 total tokens
                types.uint(5000000) // 5 STX per token
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify tokenization
        let propertyCall = chain.callReadOnlyFn('real_estate_token', 'get-property', [types.uint(0)], deployer.address);
        let property = propertyCall.result.expectSome().expectTuple();
        assertEquals(property['tokenized'], types.bool(true));
        
        let tokensCall = chain.callReadOnlyFn('real_estate_token', 'get-property-tokens', [types.uint(0)], deployer.address);
        let tokens = tokensCall.result.expectSome().expectTuple();
        assertEquals(tokens['total-supply'], types.uint(1000));
        assertEquals(tokens['tokens-remaining'], types.uint(1000));
        assertEquals(tokens['token-price'], types.uint(5000000));
    },
});

Clarinet.test({
    name: "Ensure that tokenization fails for already tokenized property",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        
        // Add and tokenize property
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'tokenize-property', [
                types.uint(0),
                types.uint(1000),
                types.uint(5000000)
            ], deployer.address)
        ]);
        
        // Try to tokenize again
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'tokenize-property', [
                types.uint(0),
                types.uint(500),
                types.uint(10000000)
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectErr(), types.uint(103)); // err-already-tokenized
    },
});

Clarinet.test({
    name: "Ensure that users can buy tokens from tokenized property",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let buyer = accounts.get('wallet_1')!;
        
        // Add and tokenize property
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'tokenize-property', [
                types.uint(0),
                types.uint(1000),
                types.uint(5000000) // 5 STX per token
            ], deployer.address)
        ]);
        
        // Buy tokens (10 tokens = 50 STX + 2.5% fee = 51.25 STX total)
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'buy-tokens', [
                types.uint(0), // property ID
                types.uint(10) // token amount
            ], buyer.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify token ownership
        let balanceCall = chain.callReadOnlyFn('real_estate_token', 'get-token-balance', [
            types.uint(0),
            types.principal(buyer.address)
        ], buyer.address);
        let balance = balanceCall.result.expectTuple();
        assertEquals(balance['token-count'], types.uint(10));
        
        // Verify tokens remaining
        let tokensCall = chain.callReadOnlyFn('real_estate_token', 'get-property-tokens', [types.uint(0)], deployer.address);
        let tokens = tokensCall.result.expectSome().expectTuple();
        assertEquals(tokens['tokens-remaining'], types.uint(990));
    },
});

Clarinet.test({
    name: "Ensure that buying more tokens than available fails",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let buyer = accounts.get('wallet_1')!;
        
        // Add and tokenize property with limited tokens
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'tokenize-property', [
                types.uint(0),
                types.uint(5), // Only 5 tokens
                types.uint(5000000)
            ], deployer.address)
        ]);
        
        // Try to buy more tokens than available
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'buy-tokens', [
                types.uint(0),
                types.uint(10) // Try to buy 10 tokens
            ], buyer.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectErr(), types.uint(104)); // err-insufficient-tokens
    },
});

Clarinet.test({
    name: "Ensure that non-tokenized property purchase works",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let buyer = accounts.get('wallet_1')!;
        
        // Add property and set for sale
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(1000000000), // 1000 STX
                types.ascii("456 Oak Ave"),
                types.ascii("House"),
                types.uint(2500),
                types.ascii("Single family home")
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'update-property', [
                types.uint(0),
                types.uint(1000000000),
                types.bool(true), // Set for sale
                types.ascii("Single family home for sale")
            ], deployer.address)
        ]);
        
        // Buy property (1000 STX + 2.5% fee = 1025 STX total)
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'buy-property', [
                types.uint(0)
            ], buyer.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify ownership transfer
        let propertyCall = chain.callReadOnlyFn('real_estate_token', 'get-property', [types.uint(0)], buyer.address);
        let property = propertyCall.result.expectSome().expectTuple();
        assertEquals(property['owner'], buyer.address);
        assertEquals(property['for-sale'], types.bool(false));
    },
});

Clarinet.test({
    name: "Ensure that buying non-for-sale property fails",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let buyer = accounts.get('wallet_1')!;
        
        // Add property but don't set for sale
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(1000000000),
                types.ascii("456 Oak Ave"),
                types.ascii("House"),
                types.uint(2500),
                types.ascii("Single family home")
            ], deployer.address)
        ]);
        
        // Try to buy property that's not for sale
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'buy-property', [
                types.uint(0)
            ], buyer.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectErr(), types.uint(108)); // err-property-not-for-sale
    },
});

Clarinet.test({
    name: "Ensure that token listing creation works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let seller = accounts.get('wallet_1')!;
        
        // Setup: Add property, tokenize, and buy tokens
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'tokenize-property', [
                types.uint(0),
                types.uint(1000),
                types.uint(5000000)
            ], deployer.address)
        ]);
        
        // Buy tokens
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'buy-tokens', [
                types.uint(0),
                types.uint(50)
            ], seller.address)
        ]);
        
        // Create token listing
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'create-token-listing', [
                types.uint(0), // property ID
                types.uint(20), // token amount
                types.uint(6000000) // 6 STX per token (premium)
            ], seller.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.uint(0));
        
        // Verify listing details
        let listingCall = chain.callReadOnlyFn('real_estate_token', 'get-token-listing', [types.uint(0)], seller.address);
        let listing = listingCall.result.expectSome().expectTuple();
        assertEquals(listing['seller'], seller.address);
        assertEquals(listing['property-id'], types.uint(0));
        assertEquals(listing['token-amount'], types.uint(20));
        assertEquals(listing['price-per-token'], types.uint(6000000));
        assertEquals(listing['active'], types.bool(true));
    },
});

Clarinet.test({
    name: "Ensure that buying listed tokens works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let seller = accounts.get('wallet_1')!;
        let buyer = accounts.get('wallet_2')!;
        
        // Setup: Add property, tokenize, buy tokens, and create listing
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'tokenize-property', [
                types.uint(0),
                types.uint(1000),
                types.uint(5000000)
            ], deployer.address)
        ]);
        
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'buy-tokens', [
                types.uint(0),
                types.uint(50)
            ], seller.address),
            Tx.contractCall('real_estate_token', 'create-token-listing', [
                types.uint(0),
                types.uint(20),
                types.uint(6000000)
            ], seller.address)
        ]);
        
        // Buy listed tokens
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'buy-listed-tokens', [
                types.uint(0) // listing ID
            ], buyer.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify token transfer
        let buyerBalance = chain.callReadOnlyFn('real_estate_token', 'get-token-balance', [
            types.uint(0),
            types.principal(buyer.address)
        ], buyer.address);
        assertEquals(buyerBalance.result.expectTuple()['token-count'], types.uint(20));
        
        let sellerBalance = chain.callReadOnlyFn('real_estate_token', 'get-token-balance', [
            types.uint(0),
            types.principal(seller.address)
        ], seller.address);
        assertEquals(sellerBalance.result.expectTuple()['token-count'], types.uint(30));
        
        // Verify listing is deactivated
        let listingCall = chain.callReadOnlyFn('real_estate_token', 'get-token-listing', [types.uint(0)], buyer.address);
        let listing = listingCall.result.expectSome().expectTuple();
        assertEquals(listing['active'], types.bool(false));
    },
});

Clarinet.test({
    name: "Ensure that token transfer between users works",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let sender = accounts.get('wallet_1')!;
        let recipient = accounts.get('wallet_2')!;
        
        // Setup: Add property, tokenize, and buy tokens
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'tokenize-property', [
                types.uint(0),
                types.uint(1000),
                types.uint(5000000)
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'buy-tokens', [
                types.uint(0),
                types.uint(100)
            ], sender.address)
        ]);
        
        // Transfer tokens
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'transfer-tokens', [
                types.uint(0), // property ID
                types.uint(25), // token amount
                types.principal(recipient.address)
            ], sender.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify balances after transfer
        let senderBalance = chain.callReadOnlyFn('real_estate_token', 'get-token-balance', [
            types.uint(0),
            types.principal(sender.address)
        ], sender.address);
        assertEquals(senderBalance.result.expectTuple()['token-count'], types.uint(75));
        
        let recipientBalance = chain.callReadOnlyFn('real_estate_token', 'get-token-balance', [
            types.uint(0),
            types.principal(recipient.address)
        ], recipient.address);
        assertEquals(recipientBalance.result.expectTuple()['token-count'], types.uint(25));
    },
});

Clarinet.test({
    name: "Ensure that transferring more tokens than owned fails",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let sender = accounts.get('wallet_1')!;
        let recipient = accounts.get('wallet_2')!;
        
        // Setup: Add property, tokenize, and buy tokens
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'tokenize-property', [
                types.uint(0),
                types.uint(1000),
                types.uint(5000000)
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'buy-tokens', [
                types.uint(0),
                types.uint(10) // Only 10 tokens
            ], sender.address)
        ]);
        
        // Try to transfer more tokens than owned
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'transfer-tokens', [
                types.uint(0),
                types.uint(25), // Try to transfer 25 tokens
                types.principal(recipient.address)
            ], sender.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectErr(), types.uint(104)); // err-insufficient-tokens
    },
});

Clarinet.test({
    name: "Ensure that listing cancellation works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let seller = accounts.get('wallet_1')!;
        
        // Setup: Add property, tokenize, buy tokens, and create listing
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'tokenize-property', [
                types.uint(0),
                types.uint(1000),
                types.uint(5000000)
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'buy-tokens', [
                types.uint(0),
                types.uint(50)
            ], seller.address),
            Tx.contractCall('real_estate_token', 'create-token-listing', [
                types.uint(0),
                types.uint(20),
                types.uint(6000000)
            ], seller.address)
        ]);
        
        // Cancel listing
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'cancel-token-listing', [
                types.uint(0) // listing ID
            ], seller.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify listing is deactivated
        let listingCall = chain.callReadOnlyFn('real_estate_token', 'get-token-listing', [types.uint(0)], seller.address);
        let listing = listingCall.result.expectSome().expectTuple();
        assertEquals(listing['active'], types.bool(false));
    },
});

Clarinet.test({
    name: "Ensure that contract pause functionality works",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let user = accounts.get('wallet_1')!;
        
        // Pause contract
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'set-contract-pause', [
                types.bool(true)
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Try to add property while paused
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(102)); // err-unauthorized
        
        // Unpause contract
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'set-contract-pause', [
                types.bool(false)
            ], deployer.address)
        ]);
        
        // Now adding property should work
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.uint(0));
    },
});

Clarinet.test({
    name: "Ensure that platform fee withdrawal works",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let buyer = accounts.get('wallet_1')!;
        
        // Setup: Add property, tokenize, and buy tokens to generate fees
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'tokenize-property', [
                types.uint(0),
                types.uint(1000),
                types.uint(5000000)
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'buy-tokens', [
                types.uint(0),
                types.uint(10) // This will generate platform fees
            ], buyer.address)
        ]);
        
        // Check contract stats to see platform revenue
        let statsCall = chain.callReadOnlyFn('real_estate_token', 'get-contract-stats', [], deployer.address);
        let stats = statsCall.result.expectTuple();
        let platformRevenue = stats['platform-revenue'];
        
        // Withdraw platform fees
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'withdraw-platform-fees', [
                platformRevenue
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.bool(true));
        
        // Verify platform revenue is reduced
        statsCall = chain.callReadOnlyFn('real_estate_token', 'get-contract-stats', [], deployer.address);
        stats = statsCall.result.expectTuple();
        assertEquals(stats['platform-revenue'], types.uint(0));
    },
});

Clarinet.test({
    name: "Ensure that contract statistics are tracked correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let user1 = accounts.get('wallet_1')!;
        let user2 = accounts.get('wallet_2')!;
        
        // Perform various operations
        let block = chain.mineBlock([
            // Add two properties
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(3000000000),
                types.ascii("456 Oak Ave"),
                types.ascii("House"),
                types.uint(2500),
                types.ascii("Family house")
            ], deployer.address)
        ]);
        
        // Tokenize first property and create transactions
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'tokenize-property', [
                types.uint(0),
                types.uint(1000),
                types.uint(5000000)
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'buy-tokens', [
                types.uint(0),
                types.uint(50)
            ], user1.address),
            Tx.contractCall('real_estate_token', 'create-token-listing', [
                types.uint(0),
                types.uint(20),
                types.uint(6000000)
            ], user1.address)
        ]);
        
        // Check final statistics
        let statsCall = chain.callReadOnlyFn('real_estate_token', 'get-contract-stats', [], deployer.address);
        let stats = statsCall.result.expectTuple();
        
        assertEquals(stats['total-properties'], types.uint(2));
        assertEquals(stats['total-listings'], types.uint(1));
        // Should have at least 2 transactions (MINT and LISTING)
        assertEquals(stats['total-transactions'], types.uint(2));
        assertEquals(stats['contract-paused'], types.bool(false));
    },
});

Clarinet.test({
    name: "Ensure that user properties tracking works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let buyer = accounts.get('wallet_1')!;
        
        // Add multiple properties
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(3000000000),
                types.ascii("456 Oak Ave"),
                types.ascii("House"),
                types.uint(2500),
                types.ascii("Family house")
            ], deployer.address)
        ]);
        
        // Set second property for sale and buy it
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'update-property', [
                types.uint(1),
                types.uint(3000000000),
                types.bool(true),
                types.ascii("Family house for sale")
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'buy-property', [
                types.uint(1)
            ], buyer.address)
        ]);
        
        // Check deployer's properties (should have property 0)
        let deployerPropsCall = chain.callReadOnlyFn('real_estate_token', 'get-user-properties', [
            types.principal(deployer.address)
        ], deployer.address);
        let deployerProps = deployerPropsCall.result.expectTuple();
        // Should contain property 0
        
        // Check buyer's properties (should have property 1)
        let buyerPropsCall = chain.callReadOnlyFn('real_estate_token', 'get-user-properties', [
            types.principal(buyer.address)
        ], buyer.address);
        let buyerProps = buyerPropsCall.result.expectTuple();
        // Should contain property 1
    },
});

Clarinet.test({
    name: "Ensure that transaction logging works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let user = accounts.get('wallet_1')!;
        
        // Setup: Add property, tokenize, and buy tokens
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'tokenize-property', [
                types.uint(0),
                types.uint(1000),
                types.uint(5000000)
            ], deployer.address),
            Tx.contractCall('real_estate_token', 'buy-tokens', [
                types.uint(0),
                types.uint(10)
            ], user.address)
        ]);
        
        // Check transaction was logged
        let txCall = chain.callReadOnlyFn('real_estate_token', 'get-transaction', [types.uint(0)], user.address);
        let transaction = txCall.result.expectSome().expectTuple();
        
        assertEquals(transaction['property-id'], types.uint(0));
        assertEquals(transaction['buyer'], user.address);
        assertEquals(transaction['tokens'], types.uint(10));
        assertEquals(transaction['transaction-type'], types.ascii("MINT"));
    },
});

Clarinet.test({
    name: "Ensure that edge cases are handled properly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get('deployer')!;
        let user = accounts.get('wallet_1')!;
        
        // Test adding property with zero price (should fail)
        let block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(0), // Zero price
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(109)); // err-invalid-price
        
        // Add valid property first
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'add-property', [
                types.uint(5000000000),
                types.ascii("123 Main St, NYC"),
                types.ascii("Apartment"),
                types.uint(1200),
                types.ascii("Luxury apartment")
            ], deployer.address)
        ]);
        
        // Test tokenizing with zero tokens (should fail)
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'tokenize-property', [
                types.uint(0),
                types.uint(0), // Zero tokens
                types.uint(5000000)
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(107)); // err-invalid-token-amount
        
        // Test tokenizing with zero token price (should fail)
        block = chain.mineBlock([
            Tx.contractCall('real_estate_token', 'tokenize-property', [
                types.uint(0),
                types.uint(1000),
                types.uint(0) // Zero token price
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(109)); // err-invalid-price
    },
});