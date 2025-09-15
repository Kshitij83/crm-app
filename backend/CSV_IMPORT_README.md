# CSV Import Feature

This feature allows you to bulk import customers and orders data via CSV files.

## File Format Requirements

### Customers CSV Format
The customers CSV file should have the following columns:
- `name` (required): Full name of the customer
- `email` (optional): Email address of the customer
- `phone` (optional): Phone number
- `address` (optional): Physical address
- `notes` (optional): Additional information about the customer

Example:
```
name,email,phone,address,notes
John Smith,john.smith@example.com,+1-555-123-4567,"123 Main St, Anytown, USA","Regular customer, prefers email contact"
```

### Orders CSV Format
The orders CSV file should have the following columns:
- `customerEmail` (required): Email of the customer associated with the order
- `amount` (required): Order amount
- `status` (optional): Order status (completed, processing, shipped, etc.)
- `productName` (optional): Name of the product ordered
- `quantity` (required): Number of items ordered
- `orderDate` (optional): Date of the order (YYYY-MM-DD format)

Example:
```
customerEmail,amount,status,productName,quantity,orderDate
john.smith@example.com,199.99,completed,Premium Widget,2,2025-08-15
```

## How to Use

### Via API (Postman)

1. **Import Customers:**
   - Endpoint: `POST /api/imports/customers`
   - Content-Type: `multipart/form-data`
   - Body: Include a file field named `file` with your CSV file
   - Authentication: Bearer token required

2. **Import Orders:**
   - Endpoint: `POST /api/imports/orders`
   - Content-Type: `multipart/form-data`
   - Body: Include a file field named `file` with your CSV file
   - Authentication: Bearer token required

### Sample Files
Sample CSV files are provided in the repository:
- `sample_customers.csv`
- `sample_orders.csv`

## Notes
- Customers must be imported before orders if they don't already exist in the system
- For orders, the customer email must match an existing customer in the system
- The API will validate CSV data and return errors if any records don't meet requirements