const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB Atlas');
});

const cryptoSchema = new mongoose.Schema({
  name: String,
  price: Number,
  market_cap: Number,
  change_24hr: Number,
  fetched_at: { type: Date, default: Date.now }
});

const Crypto = mongoose.model('Crypto', cryptoSchema);

const coinGeckoUrl = 'https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&include_market_cap=true&include_24hr_change=true';

async function fetchAndStoreCryptoData() {
  try {
    const ids = 'bitcoin,ethereum,matic-network';
    const apiUrl = `${coinGeckoUrl}&ids=${ids}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-cg-demo-api-key': 'CG-TKqfbnVnUZ59mLcj8ZJf6oWg'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      const cryptoData = Object.keys(data).map(key => ({
        name: key,
        price: data[key].usd,
        market_cap: data[key].usd_market_cap,
        change_24hr: data[key].usd_24h_change,
        fetched_at: new Date()
      }));

      await Crypto.insertMany(cryptoData);
      console.log('Data fetched and stored successfully');
    } else {
      console.error('Error fetching data:', response.status);
    }
  } catch (err) {
    console.error('Error fetching and storing data:', err);
  }
}

cron.schedule('0 */2 * * *', fetchAndStoreCryptoData);

app.get('/fetch', async (req, res) => {
  try {
    await fetchAndStoreCryptoData();
    res.send('Data fetched and stored successfully');
  } catch (err) {
    res.status(500).send('Error fetching and storing data');
  }
});

app.get('/stats', async (req, res) => {
  const { coin } = req.query;

  if (!coin) {
    return res.status(400).send('Query parameter "coin" is required');
  }

  try {
    const crypto = await Crypto.findOne({ name: coin.toLowerCase() }).sort({ fetched_at: -1 });

    if (!crypto) {
      return res.status(404).send(`No data found for ${coin}`);
    }

    res.json({
      price: crypto.price,
      marketCap: crypto.market_cap,
      "24hChange": crypto.change_24hr
    });
  } catch (err) {
    res.status(500).send('Error retrieving cryptocurrency data');
  }
});

app.get('/deviation', async (req, res) => {
  const { coin } = req.query;

  if (!coin) {
    return res.status(400).send('Query parameter "coin" is required');
  }

  try {
    const records = await Crypto.find({ name: coin.toLowerCase() })
                                .sort({ fetched_at: -1 })
                                .limit(100);

    if (records.length === 0) {
      return res.status(404).send(`No data found for ${coin}`);
    }

    const prices = records.map(record => record.price);

    const mean = prices.reduce((acc, price) => acc + price, 0) / prices.length;

    const variance = prices.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / prices.length;

    const standardDeviation = Math.sqrt(variance);

    res.json({
      deviation: standardDeviation.toFixed(6)
    });
  } catch (err) {
    res.status(500).send('Error calculating standard deviation');
  }
});

app.get('/coin-data', async (req, res) => {
  const { coin } = req.query;

  if (!coin) {
    return res.status(400).send('Query parameter "coin" is required');
  }

  try {
    const apiUrl = `${coinGeckoUrl}&ids=${coin.toLowerCase()}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-cg-demo-api-key': 'CG-TKqfbnVnUZ59mLcj8ZJf6oWg'
      }
    });

    if (response.ok) {
      const data = await response.json();

      if (!data[coin.toLowerCase()]) {
        return res.status(404).send(`No data found for ${coin}`);
      }

      const coinData = data[coin.toLowerCase()];
      res.json({
        price: coinData.usd,
        marketCap: coinData.usd_market_cap,
        "24hChange": coinData.usd_24h_change
      });
    } else {
      return res.status(500).send('Error fetching data from CoinGecko API');
    }
  } catch (err) {
    return res.status(500).send('Error fetching data from CoinGecko API');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
