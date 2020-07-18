const express = require("express");
const router = express.Router();
const articleModel = require("../models/article.model");
const tagModel = require("../models/tag.model");

router.get("/bytag", async function (req, res) {
    try {
      const indexOfPage = 4;
      const page = req.query.page - 0;
      const start = (page - 1) * indexOfPage;
      const Articles_id = req.query.Articles_id - 0;

      const allArticleByTag = await articleModel.allArticleByTag(
        Articles_id,
        start,
        indexOfPage
      );

      const nPage = Math.ceil(allArticleByTag.length / 3);
      let pageItems = [];
      for (let i = 1; i <= nPage; i++) {
        if (
          i > nPage - 2 ||
          i <= 2 ||
          (i >= 2 && i >= page - 1 && i <= page + 1)
        ) {
          const item = {
            value: i,
            isActive: i === page,
            Articles_id,
          };
          pageItems.push(item);
        }
      }
      const tagArticlesByID = await tagModel.tagArticlesByID(
        Articles_id
      );

      res.render("viewArticlesByTag/list", {
        allArticleByTag,
        tagArticlesByID,
        isEmpty: allArticleByTag.length === 0,
        pageItems,
        preDisable: nPage === 0 || page === 1,
        nextDisable: nPage === 0 || page === nPage,
        prePage: page - 1,
        nextPage: page + 1,
      });
    } catch (error) {
      res.render("500", { layout: false });
    }
  });

  module.exports = router;
