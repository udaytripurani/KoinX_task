const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Base URL without the ids parameter
const url = 'https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&include_market_cap=true&include_24hr_change=true';


// New endpoint to get cryptocurrency data with dynamic 'ids'
app.get('/price', async (req, res) => {
  try {
    const { ids } = req.query;  // Get 'ids' from query parameters

    if (!ids) {
      return res.status(400).send('Missing "ids" query parameter');
    }

    // Construct the full URL with the 'ids' query parameter
    const apiUrl = `${url}&ids=${ids}`;

    const response = await fetch(apiUrl, { method: 'GET', headers: { accept: 'application/json', 'x-cg-demo-api-key': 'CG-TKqfbnVnUZ59mLcj8ZJf6oWg' } });

    if (response.ok) {
      const data = await response.json();
      res.json(data);  // Send the fetched data as the response
    } else {
      res.status(response.status).send('Error fetching data');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching data');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
