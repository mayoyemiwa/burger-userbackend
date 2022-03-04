require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes')
const session = require('express-session')
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const cors = require('cors');


// process.env.CLIENT_URLL
const app = express();
// app.use(express.static(path.join(__dirname, 'build')))
app.set('trust-proxy', 1)
app.use(cors({domain:process.env.CURRENT_URL, origin: process.env.CLIENT_URL, credentials:true}));
// app.use(cors({credentials:true, origin: process.env.CLIENT_URLA}));
app.use(express.json());
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SECRET,
  name: 'myJwt',
  proxy:true,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge:1000*60*60,
    sameSite: 'none',
    secure:true,
    httpOnly:true,
    domain: process.env.CURRENT_URL,
  },
  store: MongoStore.create({
    mongoUrl:process.env.MONGODB_URI,
    collectionName:"sessions"
  }),
}))
app.use(authRoutes);

mongoose.connect(process.env.MONGODB_URI,{
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  }, err => {
    if(err) throw err;
    console.log("connected to mongodb")
  })

// app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'))
// })

const PORT = process.env.PORT || 5000
app.listen(PORT, () => { console.log(`Server is running on port`, PORT)})