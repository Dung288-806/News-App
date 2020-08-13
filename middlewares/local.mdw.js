const categoryModel = require("../models/category.model");
const LRU = require("lru-cache");

const options = {
  max: 500,
  maxAge: 1000 * 60 * 2,
};
const cache = new LRU(options);

const GLOBAL_CATEGOERIES = "globalCategories";

module.exports = function (app) {
  app.use(async function (req, res, next) {
    const data = cache.get(GLOBAL_CATEGOERIES);
    if (!data) {
      const rowsParent = await categoryModel.allCateParent();
      for (let i = 0; i < rowsParent.length; i++) {
        rowsParent[i]["sub"] = await categoryModel.allCateSubByParent(
          rowsParent[i].id
        );
      }
      res.locals.localCategories = rowsParent;
      cache.set(GLOBAL_CATEGOERIES, rowsParent);
    } else {
      res.locals.localCategories = cache.get(GLOBAL_CATEGOERIES);
    }
    next();
  });

  app.use((req, res, next) => {
    if (req.session.authUser) {
      res.locals.user = req.session.authUser;
      res.locals.isSubcriber = req.session.authUser.role == 0;
      res.locals.isWriter = req.session.authUser.role == 1;
      res.locals.isEditor = req.session.authUser.role == 2;
      res.locals.isAdmin = req.session.role == 3;
      res.locals.isLogin = true;
    } else {
      res.locals.isLogin = false;
      res.locals.setUrl = req.session.setUrl
    }
    next();
  });
};
