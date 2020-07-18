const categoryModel = require("../models/category.model");
const authEditor = require("../middlewares/authEditor.mdw");
const LRU = require("lru-cache");

const options = {
  max: 500,
  maxAge: 1000 * 60 * 2,
};
const cache = new LRU(options);

const GLOBAL_CATEGOERIESEDITOR = "globalCategoriesEditor";

module.exports = function (app) {
  app.use(authEditor, async function (req, res, next) {
    const data = cache.get(GLOBAL_CATEGOERIESEDITOR);
    if (!data) {
      const rowsParentEditor = await categoryModel.allCateParentByEditor(
        req.session.authUser.id
      );
      res.locals.localCategoriesEditor = rowsParentEditor;
      cache.set(GLOBAL_CATEGOERIESEDITOR, rowsParentEditor);
    } else {
      res.locals.localCategoriesEditor = cache.get(GLOBAL_CATEGOERIESEDITOR);
    }

    next();
  });
};
