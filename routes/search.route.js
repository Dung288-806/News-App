const express = require("express");
const articleModel = require("../models/article.model");
const categoryModel = require("../models/category.model");
const tagModel = require("../models/tag.model");
const router = express.Router();

router.get("/", async function (req, res) {
  try {
    let textSearch = req.query.q;
    const tags_15 = await tagModel.tags_15();
    const page = typeof req.query.page === "undefined" ? 1 : req.query.page - 0;
    const indexOfPage = 4;
    const start = (page - 1) * indexOfPage;
    const n = (await articleModel.countSearch(textSearch)).countSearch;
    const nPage = Math.ceil(n / indexOfPage);
    const listSearch = await articleModel.search(
      textSearch,
      start,
      indexOfPage
    );
    for (let i in listSearch) {
      listSearch[i]["tags"] = await tagModel.allTagsByArticle(listSearch[i].id);
    }
    let pageItems = [];
    for (let i = 1; i <= nPage; i++) {
      if (
        i > nPage - 2 ||
        i <= 2 ||
        (i >= 2 && i >= page - 2 && i <= page + 2)
      ) {
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
      tags_15,
      isEmpty: listSearch.length === 0,
      pageItems,
      preDisable: nPage === 0 || page === 1,
      nextDisable: nPage === 0 || page === nPage,
      prePage: page - 1,
      nextPage: page + 1,
      len: n,
      textSearch,
    });
  } catch (e) {
    res.render("500", { layout: false });
  }
  //res.render("500", { layout: false });
});

module.exports = router;
