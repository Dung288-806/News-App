const {
  checkLoginOth,
  add,
  single,
  CheckEmailLogin,
} = require("../models/user.model");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const passPortGoogle = (passport) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GoogleClientID || 1,
        clientSecret: process.env.GoogleClientSecret || 1,
        callbackURL: "/auth/google/callback",
        proxy: true,
      },
      async function (accessToken, refreshToken, profile, done) {
        try {
          let userExist = await checkLoginOth(1, profile.id, profile.emails[0].value);
          let user = null
          if (userExist.length !== 0) {
            user = userExist[0]
            return done(null, user)
          }
            const newUser = {
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              username: profile.name.familyName,
              type_login: 1
            };

          user = await add(newUser);
          user = (await single(user.insertId))[0]
          return done(null, user)
          
        } catch (e) {
          return done (e, false)
        }
      }
    )
  );

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(async function (id, done) {
    
    const user = (await single(id))[0]
    done(null, user)

  });
};

module.exports = passPortGoogle;
