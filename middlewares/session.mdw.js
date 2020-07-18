const session = require("express-session");

module.exports = function (app) {
  app.set("trust proxy", 1); // trust first proxy
  app.use(
    session({
      name: "sid",
      secret: "keyboard cat",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        
      },
    })
  );
};
