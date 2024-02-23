const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./connectionDB')
const userModule = require("./userModule");
const weatherDataMod = require("./weatherModule")
const adviceModule = require("./adviceModule")
const quoteModule = require("./quotesModule")
const isAdmin = require('./isAdminMiddleware');
const isAdminUser = require('./isAdminUserMiddleware');
const Item = require('./itemModule')
const {translateText} = require('./translateMiddleware')

db.connectToMongoDB()

const app = express();
const PORT = 3000;
const secretKey = 'amirzcheek666';
const defaultLang = 'en';

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  res.locals.lang = req.cookies.lang || defaultLang;
  next();
});

const ifAuthenticated = (req, res, next) => {
  if (req.cookies && req.cookies.userAuthenticated === 'true') {
    res.redirect('/');
  } else {
    next();
  }
};

const isAuthenticated = (req, res, next) => {
  if (req.cookies && req.cookies.userAuthenticated === 'true') {
    next();
  } else {
    res.redirect('/login');
  }
};

app.get("/", isAdminUser, async (req, res) => {
  try {
    const items = await Item.find({ "timestamps.deletedAt": { $eq: null } });
    res.render('main', { authenticated: req.cookies.userAuthenticated ? true : false, items });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).send("Internal server error");
  }
});

app.get("/weather", isAdminUser, isAuthenticated, (req, res) => {
  res.render('weatherAPI', {message: ''});
});

app.get("/advice", isAdminUser, isAuthenticated, (req, res) => {
  res.render('advice');
})

app.get("/quotes", isAdminUser, isAuthenticated, (req, res) => {
  res.render('quotes');
})

app.post("/weather", isAdminUser, isAuthenticated, (req, res) => {
  const city = req.body.city;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=dc959d51d4a8608805987ebdb97b95f6&units=metric`;

  https.get(url, (response) => {
    response.on("data", async (data) => {
      const weatherData = JSON.parse(data);
      
      if (weatherData.cod !== 200) {
        res.render('weatherApi', { message: 'City not found. Please enter a valid city name.' });
        return;
      }

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

      try {
        const jwtToken = req.cookies.jwt;
        const decoded = jwt.verify(jwtToken, secretKey);
        const username = decoded.username;

        const newWeatherData = {
          city: city,
          temperature: temperature,
          description: description,
          feelsLikeTemp: feelsLikeTemp,
          humidity: humidity,
          pressure: pressure,
          windSpeed: windSpeed,
          countryCode: countryCode,
          username: username,
          createdAt: new Date()
        };

        const weather = await weatherDataMod.insertMany(newWeatherData);
        console.log(newWeatherData);
        const lang = req.cookies.lang || defaultLang;

        if (lang === 'ru') {
          const translatedCity = await translateText(city, 'ru')
          const translatedDesc = await translateText(description, 'ru')
          res.render('weatherAPI', { lat, lon, city: translatedCity, temperature, description: translatedDesc, imageURL, humidity, feelsLikeTemp, pressure, windSpeed, countryCode });
          return;
        }

        res.render('weatherAPI', { lat, lon, city, temperature, description, imageURL, humidity, feelsLikeTemp, pressure, windSpeed, countryCode });
      } catch (error) {
        console.error("Error storing weather data:", error);
        res.status(500).send("Internal server error");
      }
    });
  });
});

app.post("/advice", isAdminUser, isAuthenticated, (req, res) => {
  const url = `https://api.adviceslip.com/advice`

  https.get(url, (response) => {
    response.on("data", async (data) => {
      const adviceData = JSON.parse(data);
      const id = adviceData.slip.id;
      const advice = adviceData.slip.advice;

      try {
        const jwtToken = req.cookies.jwt;
        const decoded = jwt.verify(jwtToken, secretKey);
        const username = decoded.username;

        const newAdviceData = {
          advice_id: id,
          advice: advice,
          createdAt: new Date(),
          username: username
        };
        
        const adviceData = await adviceModule.insertMany(newAdviceData);
        console.log(newAdviceData);
        const lang = req.cookies.lang || defaultLang;
        if (lang === 'ru') {
          const translatedAdvice = await translateText(advice, 'ru');
          console.log(translatedAdvice)
          res.render('adviceTmpl', { id, advice: translatedAdvice });
          return;
        }
        res.render('adviceTmpl', { id, advice });
      } catch (error) {
        console.error("Error storing advice data:", error);
        res.status(500).send("Internal server error");
      }
    })
  })
})

app.post("/quotes", isAdminUser, isAuthenticated, (req, res) => {
  const quote = req.body.quoteType;
  const urlDay = `https://zenquotes.io/api/today`;
  const urlRand = `https://zenquotes.io/api/random`;

  if (quote === "dayQuote") {
    https.get(urlDay, (response) => {
      response.on("data", async (data) => {
        const quoteData = JSON.parse(data);
        const author = quoteData[0].a;
        const value = quoteData[0].q;

        try {
          const jwtToken = req.cookies.jwt;
          const decoded = jwt.verify(jwtToken, secretKey);
          const username = decoded.username;
  
          const newQuoteData = {
            quoteType: quote,
            author: author,
            quote: value,
            username: username,
            createdAt: new Date()
          };
  
          const quoteData = await quoteModule.insertMany(newQuoteData);
          console.log(newQuoteData);
          const lang = req.cookies.lang || defaultLang;
          if (lang === 'ru') {
            const translatedQuote = await translateText(value, 'ru')
            res.render('quoteTmpl', { author, value: translatedQuote });
            return
          }
          res.render('quoteTmpl', { author, value});
        } catch (error) {
          console.error("Error storing quote data:", error);
          res.status(500).send("Internal server error");
        }
      })
    })
  }
  else if (quote === "randQuote") {
    https.get(urlRand, (response) => {
      response.on("data", async (data) => {
        const quoteData = JSON.parse(data);
        const author = quoteData[0].a;
        const value = quoteData[0].q;

        try {
          const jwtToken = req.cookies.jwt;
          const decoded = jwt.verify(jwtToken, secretKey);
          const username = decoded.username;
  
          const newQuoteData = {
            quoteType: quote,
            author: author,
            quote: value,
            username: username,
            createdAt: new Date()
          };
  
          const quoteData = await quoteModule.insertMany(newQuoteData);
          console.log(newQuoteData);
          const lang = req.cookies.lang || defaultLang;
          if (lang === 'ru') {
            const translatedQuote = await translateText(value, 'ru')
            const translatedAuthor = await translateText(author, 'ru')
            res.render('quoteTmpl', { author: translatedAuthor, value: translatedQuote });
            return
          }
          res.render('quoteTmpl', { author, value});
        } catch (error) {
          console.error("Error storing quote data:", error);
          res.status(500).send("Internal server error");
        }
      })
    })
  }
})

app.get('/register',ifAuthenticated , (req, res) => {
  res.render('register', {message: ''});
});

app.post('/register',async (req, res) => {
  const pageData = {
    name: req.body.username,
    password: req.body.password
  }
  
  const findUser = await userModule.findOne({ name: pageData.name });
  if (findUser) {
    res.render('register', {message: 'User already exists, try another name'});
    return;
  } else {
    let userID = await generateUserId();
    const hashedPassword = await bcrypt.hash(pageData.password, 10);
    const newUser = new userModule({
      user_Id: userID,
      name: pageData.name,
      password: hashedPassword
    })
    const userData = await userModule.insertMany(newUser);
    console.log(userData);
    res.redirect('login')
  }
});

app.get('/login',ifAuthenticated,  (req, res) => {
  res.render('login', {message: ''}); 
});

app.post('/login',async (req, res) => {
  const enteredUsername = req.body.username;
  const enteredPassword = req.body.password;

  try {
    const user = await userModule.findOne({ name: enteredUsername })
    if (!user) {
      res.render('login', {message: 'User name cannot found'});
      return;
    }
    const passwordMatch = await bcrypt.compare(enteredPassword, user.password);
    if (passwordMatch) {
      console.log('You have successfully logged in')
      const token = jwt.sign({ username: enteredUsername }, secretKey);
      res.cookie('jwt', token, { httpOnly: true });
      res.cookie('userAuthenticated', 'true'); 
      res.redirect('/');
    } else {
      res.render('login', { message: 'Incorrect password' });
      return;
    }

  }
  catch(error) {
    console.error("Error during login:", error);
    res.status(500).send("Internal server error");
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('userAuthenticated');
  console.log("You logged out!")
  res.redirect('/login');
});

app.get("/profile", isAdminUser, isAuthenticated, (req, res) => {
  const jwtToken = req.cookies.jwt;
  const decoded = jwt.verify(jwtToken, secretKey);
  const username = decoded.username;
  res.render('profile', {username});
});

app.get("/weather/history", isAdminUser, isAuthenticated, async (req, res) => {
  try {
    const jwtToken = req.cookies.jwt;
    const decoded = jwt.verify(jwtToken, secretKey);
    const username = decoded.username;

    const weatherHistory = await weatherDataMod.find({ username });

    const lang = req.cookies.lang || defaultLang;
    if (lang === 'ru') {
      const translatedWeatherHistory = await Promise.all(weatherHistory.map(async (entry) => {
        return {
          ...entry,
          city: await translateText(entry.city, 'ru'),
          description: await translateText(entry.description, 'ru'),
          createdAt: await translateText(formatDate(entry.createdAt), 'ru')
        };
      }));

      res.render('weatherHistory', { username, weatherHistory:translatedWeatherHistory, formatDate });
      return
    }
    res.render('weatherHistory', { username, weatherHistory, formatDate });
  } catch (error) {
    console.error("Error retrieving weather history:", error);
    res.status(500).send("Internal server error");
  }
});

app.get("/advice/history", isAdminUser, isAuthenticated, async (req, res) => {
  try {
    const jwtToken = req.cookies.jwt;
    const decoded = jwt.verify(jwtToken, secretKey);
    const username = decoded.username;

    const adviceHistory = await adviceModule.find({ username });

    const lang = req.cookies.lang || defaultLang;
    if (lang === 'ru') {
      const translatedAdviceHistory = await Promise.all(adviceHistory.map(async (entry) => {
        return {
          advice_id: entry.advice_id,
          advice: await translateText(entry.advice, 'ru'),
          createdAt: await translateText(formatDate(entry.createdAt), 'ru')
        };
      }));

      res.render('adviceHistory', { username, adviceHistory:translatedAdviceHistory, formatDate });
      return
    }

    res.render('adviceHistory', { username, adviceHistory, formatDate });
  } catch (error) {
    console.error("Error retrieving advice history:", error);
    res.status(500).send("Internal server error");
  }
});

app.get("/quotes/history", isAdminUser, isAuthenticated, async (req, res) => {
  try {
    const jwtToken = req.cookies.jwt;
    const decoded = jwt.verify(jwtToken, secretKey);
    const username = decoded.username;

    const quotesHistory = await quoteModule.find({ username });

    const lang = req.cookies.lang || defaultLang;
    if (lang === 'ru') {
      if (quotesHistory.quoteType === "randQuote") {
        quotesHistory.quoteType = "случЦитата";
      }

      const translatedQuoteHistory = await Promise.all(quotesHistory.map(async (entry) => {
        return {
          quoteType: await translateText(entry.quoteType,'ru'),
          author: await translateText(entry.author, 'ru'),
          quote: await translateText(entry.quote, 'ru'),
          createdAt: await translateText(formatDate(entry.createdAt), 'ru')
        };
      }));

      res.render('quotesHistory', { username, quotesHistory: translatedQuoteHistory, formatDate });
      return
    }

    res.render('quotesHistory', { username, quotesHistory, formatDate });
  } catch (error) {
    console.error("Error retrieving quote history:", error);
    res.status(500).send("Internal server error");
  }
});

app.get('/admin',isAdminUser, isAuthenticated, isAdmin, async (req, res) => {
  const users = await userModule.find({})
  const items = await Item.find({})
  res.render('admin', { message: '', formatDate, users, items  });
});

app.post('/admin/addUser', isAuthenticated, isAdmin,isAdminUser, async (req, res) => {
  const { username, password, isAdmin } = req.body;
  try {
    const findUser = await userModule.findOne({ name: username });
    if (findUser) {
      const users = await userModule.find({})
      res.render('admin', { message: 'User already exists.', formatDate, users });
      return
    }
    let userID = await generateUserId();
    const newUser = new userModule({
      user_Id: userID,
      name: username,
      password: password,
      isAdmin: isAdmin === 'true' ? true : false
    });

    const userData = await userModule.insertMany(newUser);
    console.log("admin created user: " + userData);
    const users = await userModule.find({})
    res.render('admin', { message: 'User created successfully.', formatDate, users });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).send("Internal server error");
  }
});

app.post('/admin/editUser', isAuthenticated, isAdmin,isAdminUser, async (req, res) => {
  const { editUsername, editPassword, editIsAdmin } = req.body;

    try {
        const user = await userModule.findOne({ name: editUsername });
      if (!user) {
        const users = await userModule.find({})
          res.render('admin', { messageEdit: 'User not found.', formatDate, users });
          return;
        }

        user.password = editPassword;
        user.isAdmin = editIsAdmin === 'true';
        user.updateDate = new Date();

        await user.save();
        const users = await userModule.find({})
        res.render('admin', { messageEdit: 'User updated successfully.', formatDate, users });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).send("Internal server error.");
    }
});

app.post('/admin/deleteUser', isAuthenticated, isAdmin,isAdminUser,async (req, res) => {
  const { deleteUsername } = req.body;
    try {
        const userToDelete = await userModule.findOne({ name: deleteUsername });
        if (!userToDelete) {
          const users = await userModule.find({})
          res.render('admin', { messageDelete: 'User not found.', formatDate, users });
          return;
        }

        await userModule.deleteOne({ name: deleteUsername });

        const users = await userModule.find({});
        res.render('admin', { messageDelete: 'User deleted successfully.', formatDate, users });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).send("Internal server error.");
    }
});

app.get('/weather/RequestsHistory', isAuthenticated, isAdmin,isAdminUser, async (req, res) => {
  try {
      const weatherRequests = await weatherDataMod.find({});
      res.render('weatherRequestsHistory', { weatherRequests, formatDate });
  } catch (error) {
      console.error('Error retrieving weather requests:', error);
      res.status(500).send("Internal server error");
  }
})

app.get('/advice/RequestsHistory', isAuthenticated, isAdmin,isAdminUser, async (req, res) => {
  try {
      const adviceRequests = await adviceModule.find({});
      res.render('adviceRequestsHistory', { adviceRequests, formatDate });
  } catch (error) {
      console.error('Error retrieving weather requests:', error);
      res.status(500).send("Internal server error");
  }
})

app.get('/quotes/RequestsHistory', isAuthenticated, isAdmin, isAdminUser, async (req, res) => {
  try {
      const quoteRequests = await quoteModule.find({});
      res.render('quoteRequestsHistory', { quoteRequests, formatDate });
  } catch (error) {
      console.error('Error retrieving weather requests:', error);
      res.status(500).send("Internal server error");
  }
})

app.get('/setLanguage', (req, res) => {
  const lang = req.query.lang || defaultLang;
  res.cookie('lang', lang);
  res.redirect('back');
});

app.post('/admin/addItem', isAuthenticated, isAdmin, isAdminUser, async (req, res) => {
  const { nameEN, nameRU, descriptionEN, descriptionRU, picture1, picture2, picture3 } = req.body;

  try {
    let item_Id = await generateItemId()
    const newItem = new Item({
          item_Id: item_Id,
          names: { nameEN: nameEN, nameRU: nameRU },
          descriptions: { descriptionEN: descriptionEN, descriptionRU: descriptionRU },
          pictures: {picture1: picture1, picture2: picture2, picture3: picture3}
      });

      await newItem.save();

      const users = await userModule.find({});
      const items = await Item.find({});
      res.render('admin', { messageItem: 'Item added successfully.', formatDate, users, items });
  } catch (error) {
      console.error('Error adding item:', error);
      res.status(500).send('Internal server error');
  }
});

app.post('/admin/editItem', isAuthenticated, isAdmin,isAdminUser, async (req, res) => {
  const { editItemId, editItemNameEN, editItemNameRU, editItemDescEN, editItemDescRU, editPictureSelect, editPicture} = req.body;

  try {
      const item = await Item.findOne({ item_Id: editItemId });
      if (!item) {
          const users = await userModule.find({});
          const items = await Item.find({});
          return res.render('admin', { messageEditItem: 'Item not found.', formatDate, users, items });
      }
    
      if (editItemNameEN !== '') {
        item.names.nameEN = editItemNameEN;
      }
      if (editItemNameRU !== '') {
        item.names.nameRU = editItemNameRU;
      }

      if (editItemDescEN !== '') {
          item.descriptions.descriptionEN = editItemDescEN;
      }
      if (editItemDescRU !== '') {
            item.descriptions.descriptionRU = editItemDescRU;
        }

      if (editPicture !== '') {
        if (editPictureSelect === 'editPicture1') {
          item.pictures.picture1 = editPicture;
        } else if (editPictureSelect === 'editPicture2') {
          item.pictures.picture2 = editPicture;
        } else if (editPictureSelect === 'editPicture3') {
          item.pictures.picture3 = editPicture;
        }
      }

      await item.save();

      const users = await userModule.find({});
      const items = await Item.find({});
      res.render('admin', { messageEditItem: 'Item updated successfully.', formatDate, users, items });
  } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).send('Internal server error.');
  }
});


app.post('/admin/deleteItem', isAuthenticated, isAdmin,isAdminUser, async (req, res) => {
  const { deleteItemId } = req.body;

  try {
    const itemToDelete = await Item.find({ item_Id: deleteItemId });
      if (!itemToDelete) {
          const users = await userModule.find({});
          const items = await Item.find({});
          res.render('admin', { messageDeleteItem: 'Item not found.', formatDate, users, items });
          return;
      }

      await Item.deleteOne({ item_Id: deleteItemId });

      const users = await userModule.find({});
      const items = await Item.find({});
      res.render('admin', { messageDeleteItem: 'Item deleted successfully.', formatDate, users, items });
  } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).send('Internal server error.');
  }
});
  
app.listen(PORT, () => {
  console.log(`Server is working on: localhost:${PORT}`);
});

process.on("SIGINT", () => {
  db.closeDB();
  process.exit(0);
});

async function generateUserId() {
  try {
      const lastUser = await userModule.findOne().sort({ user_Id: -1 });
      console.log("Last User:", lastUser);
      let newUserId;
      if (lastUser) {
          newUserId = parseInt(lastUser.user_Id) + 1;
      } else {
          newUserId = 1;
      }
      console.log("New User ID:", newUserId);
      return newUserId;
  } catch (error) {
      console.error("Error generating user ID:", error);
      throw error;
  }
}

async function generateItemId() {
  try {
    const lastItem = await Item.findOne().sort({ item_Id: -1 });
      let newItemId;
      if (lastItem) {
          newItemId = parseInt(lastItem.item_Id) + 1;
      } else {
          newItemId = 1;
      }
      console.log("New Item ID:", newItemId);
      return newItemId;
  } catch (error) {
      console.error("Error generating user ID:", error);
      throw error;
  }
}
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric', 
      second: 'numeric',
      hour12: true
  };
  return date.toLocaleString('en-US', options);
}