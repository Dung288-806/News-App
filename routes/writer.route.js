const express = require("express");
const router = express.Router();
const categoryModel = require("../models/category.model");
const tagModel = require("../models/tag.model");
const articleModel = require("../models/article.model");
const tag_articleModel = require("../models/tags_articles.model");
const image_articleModel = require("../models/image_article.model");
const {
  authWriter,
  authWriterWithAdmin,
} = require("../middlewares/authWriter.mdw");
const { authLogin } = require("../middlewares/auth.mdw");
const multer = require("multer");
const fs = require("fs");
const moment = require("moment");
const userModel = require("../models/user.model");
const pathIMG = "/uploads/images";

const storage = multer.diskStorage({
  filename(req, file, cb) {
    let filename = Date.now() + "-" + file.originalname;
    cb(null, filename);
  },
  destination(req, file, cb) {
    cb(null, `./public${pathIMG}`);
  },
});
const upload = multer({ storage });

router.get("/", authWriterWithAdmin, async function (req, res) {
  res.render("viewWriter/dashboard", {
    isWriter: req.session.authUser.role == 1,
    layout: "writerLayout.hbs",
  });
});

router.post(
  "/upload-image-article",
  authWriterWithAdmin,
  upload.array("imgArticle", 30),
  async function (req, res) {
    try {
      const list_source = [];
      for (const i in req.files) {
        const source_item = {
          source_img: `${pathIMG}/${req.files[i].filename}`,
        };
        const inforAddImage_Article = await image_articleModel.addImage_Article(
          source_item
        );
        source_item.id = inforAddImage_Article.insertId;
        list_source.push(source_item);
      }

      res.json({ list_source });
    } catch (error) {
      console.log(error);
      res.render("500", { layout: false });
    }
  }
);
router.post("/delete-image-article", authWriterWithAdmin, async function (
  req,
  res
) {
  try {
    const condition_ImageArticle = {
      id: req.body.id_img,
    };
    await image_articleModel.deleteImage_Article(condition_ImageArticle);
    fs.unlink("./public" + req.body.source_img, (err) => {
      if (err) console.log(err);
      //console.log(`xóa ảnh /public${req.body.source_img} cũ thành công`);
    });
    res.json({ deleted: true });
  } catch (error) {
    console.log(error);
    res.render("500", { layout: false });
  }
});

router.get("/postArticle", authWriterWithAdmin, async function (req, res) {
  const allCategoriesSub = await categoryModel.allCategoriesSub();
  res.render("viewWriter/postArticle", {
    allCategoriesSub,
    isWriter: req.session.authUser.role == 1,
    layout: "writerLayout.hbs",
  });
});

router.post(
  "/postArticle/add",
  authWriterWithAdmin,
  upload.single("avt"),
  async function (req, res) {
    try {
      // return console.log(req.body);
      const write_date = new Date();
      const title = req.body.title;
      const sum_content = req.body.sum_content;
      const CategoriesSub_id = req.body.CategoriesSub_id;
      const content = req.body.content;
      const Writer_id = req.session.authUser.id;
      const small_avt = pathIMG + "/" + req.file.filename;
      const big_avt = pathIMG + "/" + req.file.filename;
      const type = req.body.typeArticle;
      const tags_name = req.body.tags_name;
      const listIdImg = req.body.listIdImg || [];
      const status = 1;
      const entity_article = {
        title,
        sum_content,
        content,
        small_avt,
        big_avt,
        write_date,
        Writer_id,
        type,
        status,
        CategoriesSub_id,
      };
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

      const infoAddArticle = await articleModel.addArticle(entity_article);
      const Articles_id = infoAddArticle.insertId;
      for (let i = 0; i < tags_id.length; i++) {
        const entity_tag_article = {
          Tags_id: tags_id[i],
          Articles_id,
        };
        await tag_articleModel.addTags_Articles(entity_tag_article);
      }

      for (const item of listIdImg) {
        const entity_imageArticle = {
          id: item,
          Articles_id,
        };
        await image_articleModel.updateImage_Article(entity_imageArticle);
      }

      if (req.session.authUser.role == 1) {
        res.redirect("/writer/postArticle");
      } else {
        res.redirect("/admin/articles");
      }
    } catch (error) {
      console.log(error);
      res.render("500", { layout: false });
    }
  }
);

// admin edit
router.get("/editArticle", authWriterWithAdmin, async function (req, res) {
  try {
    // not a admin
    if (req.session.authUser.role !== 3) {
      if (
        !(await articleModel.checkArEditByWri(
          req.query.Articles_id - 0 || -1,
          req.session.authUser.id
        ))
      ) {
        return res.redirect(
          req.headers.referer || "/writer/list-pending-approval"
        );
      }
    }
    const Articles_id = req.query.Articles_id - 0 || -1;
    const allCategoriesSub = await categoryModel.allCategoriesSub();
    const article = await articleModel.articleByID(Articles_id);

    const category = await categoryModel.categoriesSubByID(
      article.CategoriesSub_id
    );
    const tags = await tagModel.allTagsByArticle(Articles_id);
    const list_image = await image_articleModel.allImageByArticle(Articles_id);
    for (let i = 0; i < tags.length; i++) {
      tags[i].tailID = -i;
    }
    for (let i = 0; i < allCategoriesSub.length; i++) {
      if (allCategoriesSub[i].id === article.CategoriesSub_id)
        allCategoriesSub[i].isSelected = true;
    }

    res.render("viewWriter/editArticle", {
      Articles_id,
      Articles_avt: article.small_avt,
      allCategoriesSub,
      article,
      category,
      tags,
      list_image,
      normalIsSelected: article.type === 1,
      premiumIsSelected: article.type === 2,
      isWriter: req.session.authUser.role == 1,
      layout: "writerLayout.hbs",
    });
  } catch (error) {
    console.log(error + " ");
    res.render("500", { layout: false });
  }
});

router.post(
  "/editArticle/update",
  authWriterWithAdmin,
  upload.single("avt"),
  async function (req, res) {
    try {
      const write_date = new Date();
      const Articles_id = req.body.Articles_id;
      const title = req.body.title;
      const sum_content = req.body.sum_content;
      const CategoriesSub_id = req.body.CategoriesSub_id;
      const content = req.body.content;
      const Writer_id = req.session.authUser.id;
      const status = 1;
      const type = req.body.typeArticle;
      const tags_name = req.body.tags_name;
      const listIdImg = req.body.listIdImg || [];
      let entity_article = {};
      if (!(typeof req.file === "undefined")) {
        const small_avt = pathIMG + "/" + req.file.filename;
        const big_avt = pathIMG + "/" + req.file.filename;
        entity_article = {
          id: Articles_id,
          title,
          sum_content,
          content,
          small_avt,
          big_avt,
          status,
          Writer_id,
          type,
          write_date,
          CategoriesSub_id,
        };
        fs.unlink("./public" + req.body.article_avt, (err) => {
          if (err) console.log(err);
          console.log("xóa ảnh cũ thành công");
        });
      } else {
        entity_article = {
          id: Articles_id,
          title,
          sum_content,
          content,
          status,
          Writer_id,
          type,
          write_date,
          CategoriesSub_id,
        };
      }

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

      await articleModel.updateArticle(entity_article);

      for (let i = 0; i < tags_id.length; i++) {
        const entity_tag_article = {
          Tags_id: tags_id[i],
          Articles_id,
        };
        tag_articleModel.addTags_Articles(entity_tag_article);
      }

      for (const item of listIdImg) {
        const entity_imageArticle = {
          id: item,
          Articles_id,
        };
        await image_articleModel.updateImage_Article(entity_imageArticle);
      }

      // raw history edit art
      await articleModel.insertHistoryUpdateArt({
        who_update: req.session.authUser.id,
        id_art: Articles_id,
      });
      if (req.session.authUser.role === 3) {
        return res.redirect("/admin/articles");
      }
      res.redirect("/writer/list-pending-approval");
    } catch (error) {
      console.log(error);
      res.render("500", { layout: false });
    }
  }
);

router.get("/list-approved-unpublished", authWriter, async function (req, res) {
  try {
    const page = req.query.page - 0 || 1;
    const indexOfPage = 3;
    const start = (page - 1) * indexOfPage;
    const n = await articleModel.Count_arByWri_ApprovedUnpublished(
      req.session.authUser.id
    );
    const nPage = Math.ceil(n / 3);
    const rows = await articleModel.arByWri_ApprovedUnpublished(
      req.session.authUser.id,
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
    res.render("viewWriter/index", {
      rows,
      pageItems,
      prePage: page - 1,
      nextPage: page + 1,
      preDisable: nPage === 0 || page === 1,
      nextDisable: nPage === 0 || page === nPage,
      isEdited: false,
      isEmpty: rows.length === 0,
      hasPostDate: true,
      isWriter: req.session.authUser.role == 1,
      layout: "writerLayout.hbs",
    });
  } catch (error) {
    console.log(error);
    res.render("500", { layout: false });
  }
});

router.get("/list-published", authWriter, async function (req, res) {
  try {
    const page = req.query.page - 0 || 1;
    const indexOfPage = 3;
    const start = (page - 1) * indexOfPage;
    const n = await articleModel.Count_arByWri_Published(
      req.session.authUser.id
    );
    const nPage = Math.ceil(n / 3);
    const rows = await articleModel.arByWri_Published(
      req.session.authUser.id,
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

    res.render("viewWriter/index", {
      rows,
      pageItems,
      prePage: page - 1,
      nextPage: page + 1,
      preDisable: nPage === 0 || page === 1,
      nextDisable: nPage === 0 || page === nPage,
      isEdited: false,
      isEmpty: rows.length === 0,
      hasPostDate: true,
      isWriter: req.session.authUser.role == 1,
      layout: "writerLayout.hbs",
    });
  } catch (error) {
    console.log(error);
    res.render("500", { layout: false });
  }
});

router.get("/list-denied", authWriter, async function (req, res) {
  try {
    const page = req.query.page - 0 || 1;
    const indexOfPage = 3;
    const start = (page - 1) * indexOfPage;
    const n = await articleModel.Count_arByWri_Denied(req.session.authUser.id);
    const nPage = Math.ceil(n / 3);
    const rows = await articleModel.arByWri_Denied(
      req.session.authUser.id,
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

    res.render("viewWriter/index", {
      rows,
      pageItems,
      prePage: page - 1,
      nextPage: page + 1,
      preDisable: nPage === 0 || page === 1,
      nextDisable: nPage === 0 || page === nPage,
      isEdited: true,
      isEmpty: rows.length === 0,
      isDenied: true,
      isWriter: req.session.authUser.role == 1,
      layout: "writerLayout.hbs",
    });
  } catch (error) {
    console.log(error);
    res.render("500", { layout: false });
  }
});

router.get("/list-pending-approval", authWriter, async function (req, res) {
  try {
    const page = req.query.page - 0 || 1;
    const indexOfPage = 3;
    const start = (page - 1) * indexOfPage;
    const n = await articleModel.Count_arByWri_PendingApproval(
      req.session.authUser.id
    );
    const nPage = Math.ceil(n / 3);
    const rows = await articleModel.arByWri_PendingApproval(
      req.session.authUser.id,
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

    res.render("viewWriter/index", {
      rows,
      pageItems,
      prePage: page - 1,
      nextPage: page + 1,
      preDisable: nPage === 0 || page === 1,
      nextDisable: nPage === 0 || page === nPage,
      isEdited: true,
      isEmpty: rows.length === 0,
      isWriter: req.session.authUser.role == 1,
      layout: "writerLayout.hbs",
    });
  } catch (error) {
    console.log(error);
    res.render("500", { layout: false });
  }
});

module.exports = router;
