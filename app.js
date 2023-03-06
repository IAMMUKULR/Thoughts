require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
//const encrypt = require("mongoose-encryption");
//const bcrypt = require("bcrypt");
//const saltRounds = 10;
//const md5 = require("md5");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/secretDB", {
  useNewUrlParser: true,
});
mongoose.set("strictQuery", true);
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: Array,
});

//passportLocalMongoose is used to saltRound and Hash the password
userSchema.plugin(passportLocalMongoose);

/*userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  encryptedFields: ["password"],
});  */

const User = new mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (User, done) {
  done(null, User);
});

passport.deserializeUser(function (User, done) {
  done(null, User);
});

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/thought", function (req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user._id, function (err, foundUser) {
      res.render("thought", { user: foundUser });
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", function (req, res) {
  const loginUser = new User({
    email: req.body.username,
    password: req.body.password,
  });

  req.login(loginUser, function (err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/thought");
      });
    }
  });

  /*  User.findOne({ email: username }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else if (foundUser) {
      bcrypt.compare(password, foundUser.password, function (err, result) {
        if (result === true) {
          res.render("thought");
        } else {
          console.log(err);
        }
      });
    } else {
      console.log("User Not Found");
    }
  }); */
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/thought");
        });
      }
    }
  );
  /*  bcrypt.hash(req.body.password, saltRounds, function (err, hashPassword) {
    const newUser = new User({
      email: req.body.username,
      password: hashPassword,
    });

    newUser.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        res.render("thought");
      }
    });
  }); */
});

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function (req, res) {
  const submittedSecret = req.body.secret;
  User.findById(req.user._id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret.push(submittedSecret);
        foundUser.save(function (err) {
          if (!err) {
            res.redirect("/thought");
          } else {
            console.log(err);
          }
        });
      }
    }
  });
});

app.listen(3000, function () {
  console.log("Server is running on PORT 3000");
});
