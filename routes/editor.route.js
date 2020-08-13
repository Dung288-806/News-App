const express = require("express");
const router = express.Router();
const categoryModel = require("../models/category.model");
const tagModel = require("../models/tag.model");
const articleModel = require("../models/article.model");
const tag_articleModel = require("../models/tags_articles.model");
const moment = require("moment");
const userModel = require("../models/user.model");

const authEditor = require("../middlewares/authEditor.mdw");

require("../middlewares/localEditor.mdw")(router);

router.get("/", authEditor, async function (req, res) {
  res.render("viewEditor/dashboard", { layout: "editorLayout.hbs" });
});

router.get("/list-article", authEditor, async function (req, res) {
  try {
    const cateParent_id = req.query.cateParent_id - 0 || -1;
    const isCateParentByEditor_Id = await categoryModel.isCateParentByEditor_Id(
      cateParent_id,
      req.session.authUser.id
    );
    if (isCateParentByEditor_Id) {
      const page = req.query.page - 0 || 1;
      const indexOfPage = 3;
      const start = (page - 1) * indexOfPage;
      const n = await articleModel.Count_arByCateParent(cateParent_id);
      const nPage = Math.ceil(n / 3);
      const rows = await articleModel.arByCateParent(
        cateParent_id,
        start,
        indexOfPage
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
          };
          pageItems.push(item);
        }
      }

      for (i = 0; i < rows.length; i++) {
        rows[i].tags = await tagModel.allTagsByArticle(rows[i].id);
      }
      res.render("viewEditor/index", {
        rows,
        pageItems,
        cateParent_id,
        prePage: page - 1,
        nextPage: page + 1,
        preDisable: nPage === 0 || page === 1,
        nextDisable: nPage === 0 || page === nPage,
        isEmpty: rows.length === 0,
        layout: "editorLayout.hbs",
      });
    } else {
      res.render("viewEditor/index", {
        isEmpty: true,
        layout: "editorLayout.hbs",
      });
    }
  } catch (error) {
    console.log(error);
    res.render("500", { layout: false });
  }
});

router.get("/detail", authEditor, async function (req, res) {
  try {
    const Articles_id = req.query.Articles_id - 0 || -1;
    const idEditor = req.session.authUser.id;
    const checkArManageByEditor = await articleModel.checkArManageByEditor(
      Articles_id,
      req.session.authUser.id
    );
    if (checkArManageByEditor) {
      const allCategoriesSubByEditor = await categoryModel.allCategoriesSubByEditor(
        idEditor
      );
      const article = await articleModel.articleByID(Articles_id);
      const tags = await tagModel.allTagsByArticle(Articles_id);

      for (let i = 0; i < tags.length; i++) {
        tags[i].tailID = -i;
      }
      for (let i = 0; i < allCategoriesSubByEditor.length; i++) {
        if (allCategoriesSubByEditor[i].id === article.CategoriesSub_id)
          allCategoriesSubByEditor[i].isSelected = true;
      }
      res.render("viewEditor/detail", {
        Articles_id,
        Articles_avt: article.small_avt,
        allCategoriesSubByEditor,
        article,
        tags,
        normalIsSelected: article.type === 1,
        premiumIsSelected: article.type === 2,
        articleIsNotManageByEditor: false,
        layout: "editorLayout.hbs",
      });
    } else {
      res.render("viewEditor/detail", {
        articleIsNotManageByEditor: true,
        layout: "editorLayout.hbs",
      });
    }
  } catch (error) {
    console.log(error);
    res.render("500", { layout: false });
  }
});

router.post("/approved", authEditor, async function (req, res) {
  try {
    Date.prototype.isValid = function () {
      return this.getTime() === this.getTime();
    };
    const Articles_id = req.body.Articles_id;
    const post_date = new Date(req.body.post_date).isValid()
      ? new Date(req.body.post_date)
      : new Date();
    const CategoriesSub_id = req.body.CategoriesSub_id;
    const status = 2;
    const tags_name = req.body.tags_name;
    const entity_article = {
      id: Articles_id,
      post_date,
      status,
      CategoriesSub_id,
    };
    await articleModel.updateArticle(entity_article);

    const condition_TagArticle = { Articles_id };
    await tag_articleModel.deleteTags_Articles(condition_TagArticle);
    const tags_id = [];
    for (let i = 0; i < tags_name.length; i++) {
      if (!(await tagModel.isExistTagName(tags_name[i]))) {
        const entity_tagName = {
          tag_name: tags_name[i],
        };
        const infoAddTag = await tagModel.addTag(entity_tagName);
        tags_id.push(infoAddTag.insertId);
      } else {
        const tag_id = (await tagModel.getTagByName(tags_name[i])).id;
        tags_id.push(tag_id);
      }
    }
    for (let i = 0; i < tags_id.length; i++) {
      const entity_tag_article = {
        Tags_id: tags_id[i],
        Articles_id,
      };
      tag_articleModel.addTags_Articles(entity_tag_article);
    }

    res.redirect("/editor");
  } catch (error) {
    console.log(error);
    res.render("500", { layout: false });
  }
});

router.post("/denied", authEditor, async function (req, res) {
  try {
    const Articles_id = req.body.Articles_id;
    const reason_reject = req.body.reason_reject;
    const status = 3;
    const entity_article = {
      id: Articles_id,
      status,
      reason_reject,
    };
    await articleModel.updateArticle(entity_article);
    res.redirect("/editor");
  } catch (error) {
    console.log(error);
    res.render("500", { layout: false });
  }
});

module.exports = router;
