const authLogin = (req, res, next) => {
  if (req.session.authUser) {
    next();
  } else {
    req.session.setUrl = req.originalUrl;
    res.redirect(`/account/login`);
  }
};

const authRole = (role) => {
  return (req, res, next) => {
    if (req.session.authUser.role != role) {
      return res.redirect(req.headers.referer || "/");
    }
    next();
  };
};
const auth = (req, res, next) => {
  if (!req.session.authUser) {
    next();
  } else {
    res.redirect(req.headers.referer || "/");
  }
};
module.exports = {
  authLogin,
  authRole,
  auth,
};
