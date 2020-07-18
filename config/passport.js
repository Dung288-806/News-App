const GoogleStrategy = require("passport-google-oauth20").Strategy;




const passPortGoogle = (passport) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GoogleClientID,
        clientSecret: process.env.GoogleClientSecret,
        callbackURL: "/auth/google/callback",
        proxy: true,
      },
      async function (accessToken, refreshToken, profile, done) {
        // const user = await User.findOne({ email: profile.emails[0].value });
        // if (user) return done(null, user);
        // const newUser = new User({
        //   googleId: profile.id,
        //   username: profile.name.familyName,
        //   lastName: profile.name.givenName,
        //   email: profile.emails[0].value,
        // });

        // newUser.save().then((user) => {
        //   return done(null, user);
        // });
          
          console.log(profile);
          
      }
    )
  );

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(null, user);
    });
  });
};

module.exports = passPortGoogle;