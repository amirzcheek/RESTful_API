const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const path = require('path');
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'main.html'));
});

app.get("/weather", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'weatherAPI.html'));
});

app.get("/advice", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'advice.html'));
})

app.get("/quotes", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'quotes.html'));
})

app.post("/weather", (req, res) => {
  const city = req.body.city;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=dc959d51d4a8608805987ebdb97b95f6&units=metric`;

  https.get(url, (response) => {
      response.on("data", (data) => {
          const weatherData = JSON.parse(data);
          const lat = weatherData.coord.lat;
          const lon = weatherData.coord.lon;
          const temperature = weatherData.main.temp;
          const description = weatherData.weather[0].description;
          const icon = weatherData.weather[0].icon;
          const imageURL = `https://openweathermap.org/img/wn/${icon}@2x.png`;
          const feelsLikeTemp = weatherData.main.feels_like;
          const humidity = weatherData.main.humidity;
          const pressure = weatherData.main.pressure;
          const windSpeed = weatherData.wind.speed;
          const countryCode = weatherData.id;

          res.render('mapTemplates', { lat, lon, city, temperature, description, imageURL, humidity, feelsLikeTemp, pressure, windSpeed, countryCode});
      });
  });
});

app.post("/advice", (req, res) => {
  const url = `https://api.adviceslip.com/advice`

  https.get(url, (response) => {
    response.on("data", (data) => {
      const adviceData = JSON.parse(data);
      const id = adviceData.slip.id;
      const advice = adviceData.slip.advice;

      res.render('adviceTmpl', { id, advice });
    })
  })
})

app.post("/quotes", (req, res) => {
  const quote = req.body.quoteType;
  const urlDay = `https://zenquotes.io/api/today`;
  const urlRand = `https://zenquotes.io/api/random`;

  if (quote === "dayQuote") {
    https.get(urlDay, (response) => {
      response.on("data", (data) => {
        const quoteData = JSON.parse(data);
        const author = quoteData[0].a;
        const value = quoteData[0].q;
        
        res.render('quoteTmpl', { author, value});
      })
    })
  }
  else if (quote === "randQuote") {
    https.get(urlRand, (response) => {
      response.on("data", (data) => {
        const quoteData = JSON.parse(data);
        const author = quoteData[0].a;
        const value = quoteData[0].q;
        res.render('quoteTmpl', { author, value});
      })
    })
  }
})



app.listen(PORT, () => {
  console.log(`Server is working on: localhost:${PORT}`);
});
