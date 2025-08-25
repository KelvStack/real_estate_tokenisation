# Real Estate Token Platform 🏠

**Blockchain-Based Real Estate Tokenization Platform on Stacks**

This platform enables fractional real estate ownership through tokenization, allowing users to buy, sell, and trade property tokens while maintaining transparency and security through blockchain technology.

## 🌟 Key Features

### For Property Owners

- **Property Listing**: Add properties with detailed metadata (location, type, area, description)
- **Tokenization**: Convert properties into tradeable tokens with configurable supply and pricing
- **Ownership Control**: Update property details, pricing, and sale status
- **Revenue Generation**: Earn from both property sales and token transactions

### For Investors

- **Fractional Ownership**: Purchase property tokens for fractional real estate investment
- **Secondary Market**: Trade tokens with other users through listings marketplace
- **Direct Transfers**: Send tokens to other users without marketplace fees
- **Portfolio Tracking**: View owned properties and token balances across the platform

### Platform Benefits

- **2.5% Platform Fee**: Sustainable revenue model from all transactions
- **Transparent Transactions**: All property and token transfers recorded on blockchain
- **Secure Ownership**: Immutable ownership records and transfer history
- **Emergency Controls**: Contract pause functionality for platform security

## 📊 Smart Contract Architecture

### Core Components

1. **Property Management**

   - Property creation with comprehensive metadata
   - Owner-controlled updates for price, sale status, and descriptions
   - Property ownership tracking and transfer capabilities

2. **Tokenization System**

   - Convert properties into fungible tokens with configurable supply
   - Set token prices and manage remaining token inventory
   - Track token ownership across multiple users per property

3. **Marketplace & Trading**

   - Secondary market for token listings with custom pricing
   - Direct property purchases for non-tokenized assets
   - Peer-to-peer token transfers without marketplace fees
   - Listing management with creation and cancellation capabilities

4. **Platform Administration**
   - Contract pause/unpause for emergency situations
   - Platform fee collection and withdrawal mechanisms
   - Comprehensive transaction logging and statistics tracking

## 🚀 Getting Started

### Prerequisites

- Stacks wallet (Hiro Wallet recommended)
- STX tokens for transactions and fees
- Clarinet for local development and testing

### Deployment

```bash
# Install Clarinet
npm install -g @hirosystems/clarinet-cli

# Clone repository
git clone <repository-url>
cd real-estate-token

# Deploy to testnet
clarinet deploy --testnet

# Deploy to mainnet
clarinet deploy --mainnet
```

### Usage Examples

#### Adding a Property (Contract Owner)

```clarity
(contract-call? .real_estate_token add-property
    u5000000000                    ;; 5000 STX price
    "123 Main St, New York, NY"    ;; Location
    "Apartment"                    ;; Property type
    u1200                          ;; 1200 sq ft area
    "Luxury 2-bedroom apartment with city views") ;; Description
```

#### Tokenizing a Property

```clarity
(contract-call? .real_estate_token tokenize-property
    u0          ;; Property ID
    u1000       ;; 1000 total tokens
    u5000000)   ;; 5 STX per token
```

#### Purchasing Property Tokens

```clarity
(contract-call? .real_estate_token buy-tokens
    u0    ;; Property ID
    u50)  ;; Buy 50 tokens
```

#### Creating a Token Listing

```clarity
(contract-call? .real_estate_token create-token-listing
    u0          ;; Property ID
    u25         ;; 25 tokens for sale
    u6000000)   ;; 6 STX per token (20% premium)
```

#### Buying Listed Tokens

```clarity
(contract-call? .real_estate_token buy-listed-tokens
    u0)  ;; Listing ID
```

## 📈 Contract Functions

### Property Management

- `add-property()` - Add new property to platform (owner only)
- `update-property()` - Update property details and sale status
- `buy-property()` - Purchase entire non-tokenized property
- `get-property()` - Retrieve property information

### Tokenization Functions

- `tokenize-property()` - Convert property into tradeable tokens
- `buy-tokens()` - Purchase tokens directly from property
- `get-property-tokens()` - View token supply and pricing information
- `get-token-balance()` - Check user's token balance for specific property

### Trading & Marketplace

- `create-token-listing()` - List tokens for sale on secondary market
- `buy-listed-tokens()` - Purchase tokens from marketplace listing
- `cancel-token-listing()` - Cancel active token listing
- `transfer-tokens()` - Direct token transfer between users

### Administrative Functions

- `set-contract-pause()` - Pause/unpause contract operations
- `withdraw-platform-fees()` - Withdraw collected platform fees
- `get-contract-stats()` - View platform statistics and metrics

## 🔒 Security Features

- **Owner Authorization**: Property management restricted to property owners
- **Balance Validation**: Comprehensive token balance checking before transfers
- **Platform Fee Protection**: Automatic fee collection with secure withdrawal
- **Emergency Pause**: Contract-wide pause functionality for security incidents
- **Transaction Logging**: Complete audit trail of all property and token operations

## 💼 Business Model

### Revenue Streams

- **Transaction Fees**: 2.5% fee on all property and token purchases
- **Listing Fees**: Platform fees from secondary market token sales
- **Premium Services**: Enhanced property marketing and analytics tools
- **Enterprise Integration**: White-label solutions for real estate companies

### Market Opportunity

- **$300T+ Global Real Estate Market** addressable through tokenization
- **Growing Fractional Investment Demand**: Increasing interest in accessible real estate investing
- **Blockchain Adoption**: Rising adoption of blockchain for asset tokenization
- **Liquidity Premium**: Secondary market trading adds significant value to real estate assets

## 🛠️ Development

### Testing

```bash
# Run comprehensive test suite
clarinet test

# Check contract syntax
clarinet check

# Console integration testing
clarinet console
```

### Test Coverage

The test suite includes 20 comprehensive test cases covering:

- Property creation, updates, and ownership management
- Complete tokenization workflow and token purchasing
- Secondary marketplace functionality with listings and trades
- Direct token transfers and balance management
- Administrative functions and emergency controls
- Edge cases and error handling scenarios

## 📊 Platform Statistics

### Tracked Metrics

- **Total Properties**: Number of properties added to platform
- **Total Listings**: Active and historical token listings
- **Total Transactions**: Complete transaction history across all operations
- **Platform Revenue**: Accumulated fees from all platform activities
- **Contract Status**: Current operational status and pause state

### Transaction Types

- **MINT**: Initial token purchases from property owner
- **TRANSFER**: Token transfers between users (direct or marketplace)
- **LISTING**: Token listing creation for secondary market

## 🎯 Use Cases

### Real Estate Developers

- **Capital Access**: Raise funds through property tokenization
- **Faster Sales**: Enable fractional purchases for quicker property sales
- **Global Reach**: Access international investor pools
- **Reduced Barriers**: Lower minimum investment requirements

### Individual Investors

- **Fractional Ownership**: Invest in premium properties with smaller amounts
- **Portfolio Diversification**: Spread investments across multiple properties
- **Liquidity**: Trade property tokens without traditional real estate sale complexities
- **Transparency**: Blockchain-verified ownership and transaction history

### Real Estate Investment Platforms

- **Technology Integration**: Integrate tokenization into existing platforms
- **New Revenue Streams**: Platform fees from token trading activities
- **Enhanced Liquidity**: Provide secondary market for property investments
- **Regulatory Compliance**: Transparent, auditable transaction records

## 🚀 Future Enhancements

### Planned Features

- **Rental Income Distribution**: Automatic distribution of rental income to token holders
- **Property Valuation Updates**: Integration with real estate appraisal services
- **Governance Mechanisms**: Token holder voting on property management decisions
- **Cross-Chain Compatibility**: Support for multiple blockchain networks

### Integration Opportunities

- **DeFi Protocols**: Lending and borrowing against property tokens
- **Insurance Integration**: Property insurance linked to token ownership
- **Property Management**: Integration with property management service providers
- **Legal Framework**: Smart contract templates for regulatory compliance

## 📄 Legal Considerations

- Property tokenization subject to local securities and real estate regulations
- Platform facilitates transactions but does not provide legal or investment advice
- Users responsible for compliance with applicable laws and tax obligations
- Property ownership rights and token holder protections vary by jurisdiction

## 📋 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built on Stacks | Secured by Bitcoin | Democratizing Real Estate Investment**
