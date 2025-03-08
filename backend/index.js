import express from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import fileupload from 'express-fileupload'
import helmet from 'helmet'
import cors from 'cors'
import createError from 'http-errors'
import routes from '#api/routes/index.js'
import config from '#src/config/config.js'
import morgan from 'morgan'
import path from 'path';

const __dirname = path.resolve();
console.log(__dirname);
const app = express();

// middlewares
const allowedOrigins = [
  "http://localhost:3000",
  config.mlServiceAddr,
  config.webServiceAddr,
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.options("*", cors());

app.use(express.static("public"));
console.log("static", path.join(__dirname, "public"));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, X-Auth-Token, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  //res.header('Access-Control-Allow-Origin', "http://localhost:3000")
  res.header(
    "Access-Control-Allow-Origin",
    allowedOrigins.includes(req.header("Origin")) ? req.header("Origin") : false
  );
  next();
});

app.use(express.static("public"));
console.log("static", path.join(__dirname, "public"));

app.use(helmet());
app.use(cookieParser());
app.use(bodyParser.json({ limit: "30mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "30mb" }));
app.use(fileupload());
app.use(morgan("tiny"));

app.use(routes);
app.use((req, res, next) => {
  next(createError(404, "This route does not exist"));
});

app.use((err, req, res, next) => {
  res.json({
    status: err.status || 500,
    message: err.message,
  });
});

console.log(config.databaseURL);
mongoose.set("strictQuery", true);
mongoose
  .connect(config.databaseURL)
  .then(() => {
    console.log('Connected to DB')
    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`)
    })
  })
  .catch((err) => {
    console.error(err)
  })
