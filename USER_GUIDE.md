# Tregu User Guide

## Overview
Tregu is a marketplace platform that connects businesses with buyers. This guide will help you understand how to use the system effectively.

---

## For Personal Users (Buyers)

### Creating a Personal Account
1. Navigate to the **Join** page (`/join`)
2. Keep the **Personal** account mode selected
3. Enter your email and password
4. Accept the terms and conditions
5. Click **Create Account**
6. You'll be redirected to the **Market** page where you can browse products

### Using the Market
- **Browse Products**: The market page shows all available catalog items from businesses
- **Search**: Use the search bar at the top to find specific items
- **Location Filters**: 
  - Select a **State** to filter by location
  - Select a **City** once a state is chosen
  - Select a **ZIP Code** if needed
  - Click **Apply Location Filters** to update results
  - Click **Clear** to reset filters
- **View Seller Details**: Click on any listing to see more details

### Browsing the Feed
- Navigate to `/feed` to see the latest catalog items from all businesses
- This is a curated view of what's new on the platform

---

## For Business Users (Sellers)

### Creating a Business Account
1. Navigate to the **Join** page (`/join?mode=business`)
2. Select the **Business** account mode
3. Enter your:
   - Business name
   - Email and password
   - Business verification (EIN/TIN or SSN)
4. Select your plan tier (Starter, Standard, Pro, or Enterprise)
5. Click **Create Account**
6. **You'll be automatically redirected to the Business Catalog page** (`/business/catalog`)

### Managing Your Business Catalog

#### Adding Products to Your Catalog
1. From the **Business Catalog** page, click **Add New Product**
2. Fill in the product details:
   - **Product Title**: Name of your product
   - **Category**: Select from the dropdown (Food & Beverages, Electronics, etc.)
   - **Price**: Enter the price in USD
   - **Quantity**: Number of items available
   - **Description**: Detailed product description
   - **Image URL** (optional): Link to a product image
3. Click **Save** to add the product

#### Editing Existing Products
1. Find the product in your catalog list
2. Click the **Edit** button
3. Update the fields you want to change
4. Click **Update** to save changes

#### Managing Product Status
- Toggle **Active** to control whether a product is visible to buyers
- Inactive products remain in your catalog but don't appear in the market

### How Your Catalog Appears to Buyers
- Once you add products to your catalog, they automatically appear in:
  - **Market** page (`/market`) - All buyers can see your products
  - **Feed** page (`/feed`) - Recent products are featured here
- Buyers can click on your business name to see your complete catalog

---

## Workspace Pods

### What are Pods?
Workspace Pods are flexible business workspaces available for rent on 30-day terms. They include:
- Physical workspace (150-200 sq ft)
- Business amenities (Wi-Fi, storage, etc.)
- Business systems access (barcode scanning, inventory management)

### Browsing Pods
1. Navigate to the **Pods** page (`/pods`)
2. Use the search bar to find pods by location, size, or amenities
3. **Note**: Pod listings are currently sample data. Location filters are not yet functional.

### Reserving a Pod
- Click **Reserve Pod** on any listing
- Contact information will be collected to finalize your reservation

---

## Navigation

### Main Menu
- **Market**: Browse all business catalogs
- **Feed**: See latest products from businesses
- **Pods**: Explore workspace rental options
- **Join**: Create a new account (personal or business)
- **Dashboard** (if logged in): Manage your account and products

### Quick Links
- **Become a Seller**: Convert your personal account to a business account
- **Create Business Account**: Direct link to business registration
- **Business Catalog**: Manage your products (business accounts only)

---

## Tips & Best Practices

### For Buyers
- Use location filters to find local sellers
- Check the feed regularly for new products
- Bookmark sellers you frequently purchase from

### For Sellers
- Add clear product titles and descriptions
- Include product images whenever possible
- Keep your inventory quantities updated
- Set products to inactive when out of stock (instead of deleting them)
- Regularly review your catalog to ensure prices are current

---

## Current Limitations

1. **ZIP Code Filtering**: Currently not fully implemented - ZIP codes don't populate yet
2. **Pod Listings**: Sample data only - not connected to live database
3. **Anonymous Browsing**: Limited - some features require login
4. **Image Upload**: Currently requires external image URLs (no direct upload)

---

## Troubleshooting

### I can't see my products in the market
- Make sure your products are marked as **Active** in your catalog
- Check that you've completed the product creation process
- Try refreshing the market page

### Location filters don't work
- Make sure you've clicked **Apply Location Filters** after selecting your location
- ZIP codes are not yet implemented - use State and City filters only

### I created a business account but don't see the catalog page
- After account creation, you should be automatically redirected to `/business/catalog`
- If not, manually navigate to this page or click **Business Catalog** in the menu

---

## Support

For additional help or to report issues, please contact the development team or refer to the technical documentation in the repository.

---

**Last Updated**: Current version
**Platform**: Tregu Marketplace Platform
