


# Cryptocurrency Data Fetcher API

This project provides a Node.js application that connects to MongoDB Atlas to fetch and store cryptocurrency data from the CoinGecko API at regular intervals. It also exposes various endpoints to retrieve the cryptocurrency data, including price, market cap, 24-hour price change, and standard deviation calculations.

## Access Deployed Application

You can access the deployed API on Railway at the following link:

- **[KoinX Task API (Deployed)](https://koinxtask-production.up.railway.app)**


## Features

- **Periodic Data Fetching**: Fetch cryptocurrency data every 2 hours using a cron job.
- **API Endpoints**:
  - `/fetch`: Manually fetch and store the latest cryptocurrency data.
  - `/stats`: Get the most recent data for a specified cryptocurrency.
  - `/deviation`: Calculate the standard deviation of the prices of a specified cryptocurrency over the last 100 data points.
  - `/coin-data`: Get real-time data for a specified cryptocurrency.

## Requirements

- Node.js (v14 or higher)
- MongoDB Atlas account and URI for connection
- `dotenv` for environment variables

## Setup

1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/your-username/crypto-data-fetcher.git
   ```

2. Install the required dependencies:
   ```bash
    npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```dotenv
   PORT=3000
   MONGODB_URI=your-mongodb-atlas-uri
   ```

4. Replace the `x-cg-demo-api-key` in the code with your actual CoinGecko API key for authenticating requests. Alternatively, use your environment variables for API keys if you wish.

5. Start the server:
   ```bash
   npm start
   ```

   The server will now be running on the specified `PORT` (default 3000).



## API Endpoints

### 1. `/fetch`
Manually fetch and store the latest cryptocurrency data. This is useful for testing or updating the data without waiting for the cron job to trigger.

- **Method**: `GET`
- **Response**: `Data fetched and stored successfully` if the operation succeeds.

### 2. `/stats`
Get the most recent data (price, market cap, 24-hour change) for a specified cryptocurrency.

- **Method**: `GET`
- **Query Parameters**: 
  - `coin`: The name of the cryptocurrency (e.g., `bitcoin`, `ethereum`).
  
- **Example Request**: 
  ```bash
  GET /stats?coin=bitcoin
  ```

- **Response**: 
  ```json
  {
    "price": 45000,
    "marketCap": 840000000000,
    "24hChange": -1.23
  }
  ```

### 3. `/deviation`
Calculate the standard deviation of the cryptocurrency prices over the last 100 data points.

- **Method**: `GET`
- **Query Parameters**: 
  - `coin`: The name of the cryptocurrency (e.g., `bitcoin`, `ethereum`).
  
- **Example Request**:
  ```bash
  GET /deviation?coin=bitcoin
  ```

- **Response**:
  ```json
  {
    "deviation": "123.456789"
  }
  ```

### 4. `/coin-data`
Get the real-time data (price, market cap, 24-hour change) for a specified cryptocurrency from CoinGecko.

- **Method**: `GET`
- **Query Parameters**: 
  - `coin`: The name of the cryptocurrency (e.g., `bitcoin`, `ethereum`).
  
- **Example Request**:
  ```bash
  GET /coin-data?coin=bitcoin
  ```

- **Response**:
  ```json
  {
    "price": 45000,
    "marketCap": 840000000000,
    "24hChange": -1.23
  }
  ```

## Scheduled Task

The server uses a cron job (`node-cron`) to fetch and store cryptocurrency data every 2 hours automatically. The cron job is configured to run at the start of every 2nd hour.

## Technologies Used

- **Node.js**: JavaScript runtime for building the server.
- **Express.js**: Web framework for Node.js to handle routing.
- **MongoDB**: NoSQL database to store cryptocurrency data.
- **Mongoose**: ODM for MongoDB to interact with the database.
- **CoinGecko API**: Free API to fetch cryptocurrency data.
- **node-cron**: A cron job scheduler for Node.js to fetch data periodically.
- **dotenv**: Loads environment variables from `.env` file.

