const express = require("express");
const router = express.Router();
const articleModel = require("../models/article.model");
const tagModel = require("../models/tag.model");

router.get("/bytag", async function (req, res) {
  try {
    const indexOfPage = 4;
    const page = req.query.page - 0 || 1;
    const start = (page - 1) * indexOfPage;
    const tag_id = req.query.id - 0 || 1;
    const tags_15 = await tagModel.tags_15();
    const allArticleByTag = await articleModel.allArticleByTag(
      tag_id,
      start,
      indexOfPage
    );
    for (let i in allArticleByTag) {
      allArticleByTag[i]["tags"] = await tagModel.allTagsByArticle(
        allArticleByTag[i].id
      );
    }
    const n = articleModel.countAllArticleByTag(tag_id);
    const nPage = Math.ceil(n / indexOfPage);
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
        };
        pageItems.push(item);
      }
    }

    const getTagById = await tagModel.getTagById(tag_id);

    res.render("viewArticlesByTag/list", {
      allArticleByTag,
      getTagById,
      tags_15,
      isEmpty: allArticleByTag.length === 0,
      pageItems,
      preDisable: nPage === 0 || page === 1,
      nextDisable: nPage === 0 || page === nPage,
      prePage: page - 1,
      nextPage: page + 1,
    });
  } catch (error) {
    console.log(error);
    res.render("500", { layout: false });
  }
});
module.exports = router;
