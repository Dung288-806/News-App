const express = require("express");
const router = express.Router();
const articleModel = require("../models/article.model");
const categoryModel = require("../models/category.model");
const tagModel = require("../models/tag.model");
const commentModel = require("../models/comment.model");
const moment = require("moment");
const { authLogin } = require("../middlewares/auth.mdw");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const userModel = require("../models/user.model");

router.get("/download/:id", authLogin, async function (req, res, next) {
  const article_id = req.params.id - 0;
  const fileName = "24News_" + String(article_id) + ".pdf";
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const files = fs.readdirSync("public/pdf");

  for (let i = 0; i < files.length; i++) {
    if (files[i] == fileName) {
      return res.download(`public/pdf/${fileName}`);
    }
  }
// http://localhost:3000
  await page.goto(`/articles/view?id=${article_id}`, {
    waitUntil: "networkidle2",
  });
  await page.setViewport({ width: 0, height: 2000 });

  await page.pdf({
    path: `public/pdf/${fileName}`,
    format: "A2",
    printBackground: true,
  });
  return res.download(`public/pdf/${fileName}`);
});

router.get("/view", async function (req, res) {
  try {
    const article_id = req.query.id - 0 || -1;
    const articleByID = await articleModel.detailArticleByID(article_id);
    res.render("viewArticles/viewArticlePDF", {
      articleByID,
      layout: "viewArticleLayout.hbs",
    });
  } catch (e) {
    console.log(e);
    res.render("500", { layout: false });
  }
});

router.get("/detail/:id", async function (req, res) {
  try {
    const article_id = req.params.id - 0 || -1;
    const articleByID = await articleModel.detailArticleByID(article_id);
    const categoriesSubByID = await categoryModel.categoriesSubByID(
      articleByID.CategoriesSub_id
    );

    if (articleByID.isPremium && !req.session.isAuthenticated) {
      return res.redirect("/");
    }

    if (articleByID.isPremium) {
      const data = (await userModel.getTimeExpired(req.session.authUser.id))[0];

      if (req.session.authUser.role == 0) {
        const expired =
          new Date(Date.now()) >
          new Date(
            Date.parse(data["date_register"]) + 1000 * data["duration"] * 60
          );
        if (expired) {
          return res.render("notification", {
            layout: false,
            article_id,
          });
        }
      }
    }
    const allTagsByArticle = await tagModel.allTagsByArticle(articleByID.id);
    const articleByCate_5 = await articleModel.articleByCate_5(
      articleByID.CategoriesSub_id,
      articleByID.id
    );

    const page = 1;
    const indexOfValue = 4;
    const start = (page - 1) * indexOfValue;
    const allComByArticle = await commentModel.allCommentByArticle(
      article_id,
      start,
      indexOfValue
    );
    const idUser = req.session.authUser ? req.session.authUser.id : -1;
    const allCommentByArticle = allComByArticle.map((item) => {
      return {
        ...item,
        isShowDelete: item.user_id == idUser,
      };
    });

    const nCmt = await commentModel.countCommentByArticle(article_id);

    const nPage = Math.ceil(nCmt / indexOfValue);
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
    res.render("viewArticles/detailArticle", {
      articleByID,
      categoriesSubByID,
      allTagsByArticle,
      articleByCate_5,
      article_id,
      allCommentByArticle,
      nCmt,
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
router.post("/update-views", async function (req, res) {
  try {
    const { articles_id, views } = req.body;
    const entityArticle = {
      id: articles_id,
      views: +views + 1,
    };
    let isUpdateView = false;
    if (await articleModel.updateArticle(entityArticle)) {
      isUpdateView = true;
    }
    res.json({ isUpdateView });
  } catch (error) {
    console.log(e);
    res.render("500", { layout: false });
  }
});

router.post("/detail/:id/addComment", authLogin, async function (req, res) {
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

    const page = 1;
    const indexOfValue = 3;
    const start = (page - 1) * indexOfValue;
    const allComByArticle = await commentModel.allCommentByArticle(
      article_id,
      start,
      indexOfValue
    );
    const idUser = req.session.authUser ? req.session.authUser.id : -1;
    let allCommentByArticle = allComByArticle.map((item) => {
      return {
        ...item,
        isShowDelete: item.user_id == idUser,
      };
    });

    const nCmt = (await commentModel.countCommentByArticle(article_id)) + 1;
    const nPage = Math.ceil(nCmt / 4);
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

    const infoAddComment = await commentModel.addComment(entity);

    const inforCmtNow = {};
    Object.assign(
      inforCmtNow,
      entity,
      { name: res.locals.user.name },
      { dateComment: moment(com_date).format("HH:mm:ss DD/MM/YYYY") },
      { isShowDelete: true },
      { id: infoAddComment.insertId }
    );

    allCommentByArticle = [inforCmtNow].concat(allCommentByArticle);

    res.render(
      "partials/comments",
      {
        article_id,
        allCommentByArticle,
        nCmt,
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

router.post("/detail/remove-comment", async function (req, res) {
  try {
    const { idComment, article_id, nCmt } = req.body;
    const conditionRemoveComment = {
      id: idComment,
    };

    await commentModel.deletedComment(conditionRemoveComment);

    const page = 1;
    const indexOfValue = 4;
    const start = (page - 1) * indexOfValue;
    const allComByArticle = await commentModel.allCommentByArticle(
      article_id,
      start,
      indexOfValue
    );
    const idUser = req.session.authUser ? req.session.authUser.id : -1;
    const allCommentByArticle = allComByArticle.map((item) => {
      return {
        ...item,
        isShowDelete: item.user_id == idUser,
      };
    });

    const nPage = Math.ceil(nCmt / indexOfValue);
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
        nCmt,
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
    const nCmt = await commentModel.countCommentByArticle(article_id);
    const nPage = Math.ceil(nCmt / indexOfValue);
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
    const allComByArticle = await commentModel.allCommentByArticle(
      article_id,
      start,
      indexOfValue
    );
    const idUser = req.session.authUser ? req.session.authUser.id : -1;
    const allCommentByArticle = allComByArticle.map((item) => {
      return {
        ...item,
        isShowDelete: item.user_id == idUser,
      };
    });
    res.render(
      "partials/comments",
      {
        article_id,
        allCommentByArticle,
        nCmt,
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
