const authWriter = (req, res, next) => {
  if (req.session.isAuthenticated) {
    if (req.session.authUser.role !== 1) return res.redirect(`/`);
  } else {
    return res.redirect(`/account/login`);
  }
  next();
};


const authWriterWithAdmin = (req, res, next) => {
  if (req.session.isAuthenticated) {
    if (req.session.authUser.role !== 1 && req.session.authUser.role !== 3)
      return res.redirect(`/`);
  } else {
    return res.redirect(`/account/login`);
  }
  next();
};

module.exports = {
  authWriter,
  authWriterWithAdmin
};
