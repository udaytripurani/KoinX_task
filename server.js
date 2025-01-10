// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();  // Load environment variables

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Atlas connection from environment variable
const mongoURI = process.env.MONGODB_URI;  // Use the URI from the .env file
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB Atlas');
});

// Define a schema for cryptocurrency data
const cryptoSchema = new mongoose.Schema({
  name: String,
  price: Number,
  market_cap: Number,
  change_24hr: Number,
  fetched_at: { type: Date, default: Date.now }
});

const Crypto = mongoose.model('Crypto', cryptoSchema);

// Base URL for CoinGecko API
const url = 'https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&include_market_cap=true&include_24hr_change=true';

// Function to fetch cryptocurrency data and store it in the database
async function fetchAndStoreCryptoData() {
  try {
    const ids = 'bitcoin,ethereum,matic-network';
    const apiUrl = `${url}&ids=${ids}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-cg-demo-api-key': 'CG-TKqfbnVnUZ59mLcj8ZJf6oWg'  // Replace with your actual CoinGecko API key if needed
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // Map the response data to an array of Crypto documents
      const cryptoData = Object.keys(data).map(key => ({
        name: key,
        price: data[key].usd,
        market_cap: data[key].usd_market_cap,
        change_24hr: data[key].usd_24h_change,
        fetched_at: new Date()
      }));

      // Store in the database
      await Crypto.insertMany(cryptoData);
      console.log('Data fetched and stored successfully');
    } else {
      console.error('Error fetching data:', response.status);
    }
  } catch (err) {
    console.error('Error fetching and storing data:', err);
  }
}

// Schedule the job to run every 2 hours
cron.schedule('0 */2 * * *', fetchAndStoreCryptoData);

// Endpoint to manually trigger the fetch
app.get('/fetch', async (req, res) => {
  try {
    await fetchAndStoreCryptoData();
    res.send('Data fetched and stored successfully');
  } catch (err) {
    res.status(500).send('Error fetching and storing data');
  }
});

// Implement the /stats endpoint to return the latest data about the requested cryptocurrency
app.get('/stats', async (req, res) => {
  const { coin } = req.query;

  if (!coin) {
    return res.status(400).send('Query parameter "coin" is required');
  }

  try {
    // Fetch the latest data for the requested cryptocurrency from the database
    const crypto = await Crypto.findOne({ name: coin.toLowerCase() }).sort({ fetched_at: -1 });

    if (!crypto) {
      return res.status(404).send(`No data found for ${coin}`);
    }

    // Return the latest data in the required format
    res.json({
      price: crypto.price,
      marketCap: crypto.market_cap,
      "24hChange": crypto.change_24hr
    });
  } catch (err) {
    res.status(500).send('Error retrieving cryptocurrency data');
  }
});

// Implement the /deviation endpoint to calculate and return the standard deviation
app.get('/deviation', async (req, res) => {
  const { coin } = req.query;

  if (!coin) {
    return res.status(400).send('Query parameter "coin" is required');
  }

  try {
    // Fetch the last 100 records for the requested cryptocurrency
    const records = await Crypto.find({ name: coin.toLowerCase() })
                                .sort({ fetched_at: -1 })
                                .limit(100);

    if (records.length === 0) {
      return res.status(404).send(`No data found for ${coin}`);
    }

    // Extract the prices from the records
    const prices = records.map(record => record.price);

    // Calculate the mean (average) price
    const mean = prices.reduce((acc, price) => acc + price, 0) / prices.length;

    // Calculate the variance
    const variance = prices.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / prices.length;

    // Calculate the standard deviation
    const standardDeviation = Math.sqrt(variance);

    // Return the standard deviation in the required format
    res.json({
      deviation: standardDeviation.toFixed(6)
    });
  } catch (err) {
    res.status(500).send('Error calculating standard deviation');
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
