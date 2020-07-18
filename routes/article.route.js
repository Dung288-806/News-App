const express = require("express");
const router = express.Router();
const articleModel = require("../models/article.model");
const categoryModel = require("../models/category.model");
const tagModel = require("../models/tag.model");
const commentModel = require("../models/comment.model");
const moment = require("moment");

router.get("/detail/:id", async function (req, res) {
  try {
    const article_id = req.params.id - 0;
    const articleByID = await articleModel.detailArticleByID(article_id);
    const categoriesSubByID = await categoryModel.categoriesSubByID(
      articleByID.CategoriesSub_id
    );
    const allTagsByArticle = await tagModel.allTagsByArticle(articleByID.id);
    const articleByCate_5 = await articleModel.articleByCate_5(
      articleByID.CategoriesSub_id,
      articleByID.id
    );

    const page = 1;
    const indexOfValue = 4;
    const start = (page - 1) * indexOfValue;
    const allCommentByArticle = await commentModel.allCommentByArticle(
      article_id,
      start,
      indexOfValue
    );
    const nPage = Math.ceil(
      (await commentModel.countCommentByArticle(article_id)) / indexOfValue
    );
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
          article_id,
        };
        pageItems.push(item);
      }
    }

    res.render("viewArticles/detailActicle", {
      articleByID,
      categoriesSubByID,
      allTagsByArticle,
      articleByCate_5,
      article_id,
      allCommentByArticle,
      comIsEmpty: allCommentByArticle.length === 0,
      pageItems,
      preDisable: nPage === 0 || page === 1,
      nextDisable: nPage === 0 || page === nPage,
      pagePre: page - 1,
      pageNext: page + 1,
      articleByCate_5_IsEmpty: articleByCate_5.length === 0,
    });
  } catch (e) {
    console.log(e);
    res.render("500", { layout: false });
  }
});

router.post("/detail/:id/addComment", async function (req, res) {
  try {
    const com_date = new Date();
    const user_id = res.locals.user.id - 0;
    const article_id = req.params.id - 0;
    const com_content = req.body.com_content;
    const entity = {
      user_id,
      article_id,
      com_date,
      com_content,
    };

    await commentModel.addComment(entity);
    const page = 1;
    const indexOfValue = 3;
    const start = (page - 1) * indexOfValue;
    let allCommentByArticle = await commentModel.allCommentByArticle(
      article_id,
      start,
      indexOfValue
    );
    entity.name = res.locals.user.name;
    entity.dateComment = moment(com_date).format("HH:mm:ss DD/MM/YYYY");
    allCommentByArticle = [entity].concat(allCommentByArticle);
    const nPage = Math.ceil(
      (await commentModel.countCommentByArticle(article_id)) / 4
    );
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
          article_id,
        };
        pageItems.push(item);
      }
    }

    res.render(
      "partials/comments",
      {
        article_id,
        allCommentByArticle,
        pageItems,
        preDisable: nPage === 0 || page === 1,
        nextDisable: nPage === 0 || page === nPage,
        pagePre: page - 1,
        pageNext: page + 1,
        layout: false,
      },
      (e, html) => {
        res.json({ html });
      }
    );
  } catch (e) {
    console.log(e);
    res.render("500", { layout: false });
  }
});

router.get("/detail/:id/pagingComment", async function (req, res) {
  try {
    const indexOfValue = 4;
    const article_id = req.params.id - 0;
    const page = req.query.page - 0;
    const start = (page - 1) * indexOfValue;
    const nPage = Math.ceil(
      (await commentModel.countCommentByArticle(article_id)) / indexOfValue
    );
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
          article_id,
        };
        pageItems.push(item);
      }
    }
    const allCommentByArticle = await commentModel.allCommentByArticle(
      article_id,
      start,
      indexOfValue
    );
    res.render(
      "partials/comments",
      {
        article_id,
        allCommentByArticle,
        pageItems,
        preDisable: nPage === 0 || page === 1,
        nextDisable: nPage === 0 || page === nPage,
        pagePre: page - 1,
        pageNext: page + 1,
        layout: false,
      },
      (e, html) => {
        res.json({ html });
      }
    );
  } catch (e) {
    console.log(e);
    res.render("500", { layout: false });
  }
});

module.exports = router;
