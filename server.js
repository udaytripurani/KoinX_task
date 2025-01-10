// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Atlas connection
const mongoURI = 'mongodb+srv://uday:uday2acc@cluster0.uhds6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Replace with your MongoDB Atlas connection string
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
        'x-cg-demo-api-key': 'CG-TKqfbnVnUZ59mLcj8ZJf6oWg'
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

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
