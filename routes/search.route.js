const express = require("express");
const articleModel = require("../models/article.model");
const categoryModel = require("../models/category.model");

const router = express.Router();

router.get("/", async function (req, res) {
  let textSearch = req.query.q;

  const page = typeof req.query.page === "undefined" ? 1 : req.query.page - 0;
  const indexOfPage = 4;
  const start = (page - 1) * indexOfPage;
  const n = (await articleModel.countSearch(textSearch)).countSearch;
  const nPage = n / indexOfPage;
  const listSearch = await articleModel.search(textSearch, start, indexOfPage);

  let pageItems = [];
  for (let i = 1; i <= nPage; i++) {
    if (i > nPage - 2 || i <= 2 || (i >= 2 && i >= page - 1 && i <= page + 1)) {
      const item = {
        value: i,
        isActive: i === page,
        textSearch,
      };
      pageItems.push(item);
    }
  }
  res.render("viewSearch/index", {
    listSearch,
    isEmpty: listSearch.length === 0,
    pageItems,
    preDisable: page === 1,
    nextDisable: page === nPage,
    prePage: page - 1,
    nextPage: page + 1,
    len: n,
    textSearch,
  });
  //res.render("500", { layout: false });
});

module.exports = router;
