const express = require("express");
const router = express.Router();
const articleModel = require("../models/article.model");
const categoryModel = require("../models/category.model");
const tagModel = require("../models/tag.model");

router.get("/bycate", async function (req, res) {
  try {
    const indexOfPage = 4;
    const page = req.query.page - 0 || 1;
    const start = (page - 1) * indexOfPage;
    const categorySub_id = req.query.id - 0 || -1;
    const tags_15 = await tagModel.tags_15();
    const allArticleByCategorySub = await articleModel.allArticleByCategorySub(
      categorySub_id,
      start,
      indexOfPage
    );
    for (let i in allArticleByCategorySub) {
      allArticleByCategorySub[i]["tags"] = await tagModel.allTagsByArticle(
        allArticleByCategorySub[i].id
      );
    }
    const n = await articleModel.countAllArticleByCategorySub(categorySub_id);
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
    const categoriesSubByID = await categoryModel.categoriesSubByID(
      categorySub_id
    );

    res.render("viewArticlesByCategory/list", {
      allArticleByCategorySub,
      categoriesSubByID,
      isEmpty: allArticleByCategorySub.length === 0,
      pageItems,
      categorySub_id,
      tags_15,
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
