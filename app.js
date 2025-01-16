const express = require("express");
const ErrorHandler = require("./middleware/error");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import the cors middleware

const corsOptions = {
  origin: ['http://localhost:3001'], 
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization',
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); 
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// const path = require('path')
// app.use('/static', express.static(path.join(__dirname, 'public')))

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
    require("dotenv").config({
      path: "config/.env",
    });
}

// import routes
// Mount the userRouter at the desired base URL
const whatsappcontroller = require("./controller/whatsappcontroller");

// Mount the userRouter at the desired base URL
const api_url = '/api/v1/';
app.use(api_url+'whatsapp', whatsappcontroller);

// it's for ErrorHandling
app.use(ErrorHandler);

module.exports = app;
