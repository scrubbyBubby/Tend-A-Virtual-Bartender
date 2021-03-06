const { config } = require("dotenv");

const express = require("express");
const session = require("express-session");
//const MongoStore = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");
const MongoStore = require('connect-mongo');
const cors = require("cors");

const passport = require("./passport/setup");
const auth = require("./routes/auth");
const userRouter = require("./routes/user");

const app = express();
const PORT = process.env.NODE_ENV === "production" ? (process.env.PORT || 80) : 5000;

config();
const { NODE_ENV, DEV_DB } = process.env;   

mongoose
    .connect(DEV_DB, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(console.log(`MongoDB connected ${DEV_DB}`))
    .catch(err => console.log(err));

// Bodyparser middleware, extended false does not allow nested payloads
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (NODE_ENV === "production") {
    app.use(cors());
}

// Express Session
app.use(
    session({
        secret: "very secret this is",
        resave: false,
        saveUninitialized: true,
        store: MongoStore.create({
            mongoUrl: DEV_DB
        })
        //store: new MongoStore({ mongooseConnection: mongoose.connection })
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", auth);
app.use("/update", userRouter);
app.get("/", (req, res) => res.send("Good monring sunshine!"));

app.listen(PORT, () => console.log(`Backend listening on port ${PORT}!`));