module.exports = function (req, res, next) {
  if (req.session.isAuthenticated) {
    if (req.session.authUser.role !== 2) return res.redirect(`/`);
  } else {
    return res.redirect(`/account/login`);
  }

  next();
};
