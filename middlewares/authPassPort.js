const express = require("express");
const passport = require("passport");

const AuthRoute = express.Router();

AuthRoute.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

AuthRoute.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    req.session.isAuthenticated = true;
    req.session.authUser = req.user;
    res.redirect("/");
  }
);
module.exports = AuthRoute;
