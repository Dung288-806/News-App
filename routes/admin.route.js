const express = require("express");
const moment = require("moment");
const bcrypt = require("bcryptjs");
const UserModel = require("../models/user.model");
const { authLogin, authRole } = require("../middlewares/auth.mdw");
const {
  loadCateWithManager,
  addCateParent,
  getCateByName,
  getSubCateByName,
  getCateByID,
  patchCateByID,
  getCountPage,
  allCateSubByParentPage,
  getCountPageCateSub,
  getNameCateParentByID,
  getCountSubCateByIDCateParent,
  getCateSubByID,
  allCateParent,
  updateCateSubByID,
  DeleteCateParentByID,
  DeleteSubCateParentByID,
  addSubCate,
  countCateByEditor,
  listCateByEditor,
  countAllCate,
} = require("../models/category.model");

const {
  loadAllTags,
  getCountTagsWithArticle,
  getCountPageTags,
  deleteTagsByID,
  findTagByID,
  updateTagByID,
  addTagArt,
  getTagByName,
  loadAllTagArtByIDTag,
  delTagWithArt,
  getCountPageTagArt,
  addTag,
} = require("../models/tag.model");

const {
  getCountArticleByIDCateSub,
  getArtNotByTag,
  getListArtByWriter,
  deletedArt,
  countPageOfArtByWriterId,
  getListArt,
  countPageOfArt,
  countPageOfArtByStt,
  loadAllTypeArt,
  getTypeArtByName,
  updateTypeArt,
  addTypeOfArt,
  getSumArtByType,
  delTypeArtById,
  loadAllStatus,
  getSumArtByStt,
  getStatusByName,
  updateStatusArt,
  addStatusOfArt,
  delStatusArtById,
  getListArtByStt,
  getListArtByType,
  countPageOfArtByType,
  getListArtByCateSub,
  getArticleByID,
  updateRejectApprovedArt,
  countAllArticle,
  getArtWithDate,
} = require("../models/article.model");
const {
  ListEditor,
  getUserByID,
  loadWriter,
  countPageWriter,
  countArtByWriter,
  deleteUserById,
  findWriterById,
  loadEditor,
  countPageEditor,
  loadSub,
  countPageSub,
  countAllUser,
  changeTimeExpired,
  getTimeExpired,
  UpdateTimeExpired,
} = require("../models/user.model");

const { deletedComment } = require("../models/comment.model");
const { deleteTags_Articles } = require("../models/tags_articles.model");
const { deleteImage_Article } = require("../models/image_article.model");

const LIMIT = 6;

const AdminRoute = express.Router();

AdminRoute.get("/categories", authLogin, authRole(3), async (req, res) => {
  try {
    const page = +req.query.page || 1;
    let countPage = await getCountPage();
    countPage = Math.ceil(countPage[0]["count(*) / 6"]);
    const numPage = [];
    for (let i = 1; i <= countPage; i++) {
      if (page == i) {
        numPage.push({ val: i, isActive: true });
      } else {
        numPage.push({ val: i, isActive: false });
      }
    }

    const offset = (page - 1) * LIMIT;
    const allCate = await loadCateWithManager(offset);
    allCate.forEach(async (cate) => {
      let sum = await getCountSubCateByIDCateParent(cate.id);
      sum = sum[0]["count(*)"];
      if (sum == 0) {
        cate.sum = sum;
        cate.isDel = false;
      } else {
        cate.sum = sum;
        cate.isDel = true;
      }
    });

    res.render("viewAdmin/Cate/category", {
      isCategory: true,
      layout: "adminLayout",
      allCate,
      preDis: page == 1,
      nextDis: page == countPage,
      numPage,
      nextPage: page + 1,
      prePage: page - 1,
      isHas: allCate.length === 0,
    });
  } catch (e) {
    res.render("viewAdmin/Cate/category", {
      layout: false,
      err: true,
      mes: e + " ",
    });
  }
});

AdminRoute.get("/categories/add", authLogin, authRole(3), async (req, res) => {
  const listEditor = await ListEditor();
  res.render("viewAdmin/Cate/AddCate", {
    layout: false,
    listEditor,
  });
});

AdminRoute.post("/categories/add", authLogin, authRole(3), async (req, res) => {
  try {
    await addCateParent(req.body);
    res.redirect("/admin/categories");
  } catch (e) {
    const listEditor = await ListEditor();
    res.render("viewAdmin/Cate/AddCate", {
      layout: false,
      listEditor,
      err: true,
      mes: e + " ",
    });
  }
});

AdminRoute.get(
  "/categories/edit/:id",
  authLogin,
  authRole(3),
  async (req, res) => {
    try {
      const id = req.params.id;
      const cate = await getCateByID(id);
      let listEditor = await ListEditor();
      listEditor.forEach((e) => {
        if (e.id == cate[0]["id_editor"]) {
          e.isCheck = true;
        } else {
          e.isCheck = false;
        }
      });
      res.render("viewAdmin/Cate/updateCate", {
        layout: false,
        cate: cate[0],
        listEditor,
      });
    } catch (e) {
      res.render("viewAdmin/Cate/updateCate", {
        layout: false,
        err: true,
        mes: e + " ",
        listEditor,
      });
    }
  }
);

AdminRoute.post(
  "/categories/edit",
  authLogin,
  authRole(3),
  async (req, res) => {
    try {
      let cateNeedUpdate = {};
      cateNeedUpdate.name = req.body.name;
      cateNeedUpdate.id_editor = req.body.id_editor;
      const condition = { id: req.body.id };
      const updated = await patchCateByID(cateNeedUpdate, condition);
      res.redirect("/admin/categories");
    } catch (e) {
      const listEditor = await ListEditor();
      res.render("viewAdmin/Cate/updateCate", {
        layout: false,
        err: true,
        mes: e + " ",
        listEditor,
      });
    }
  }
);

AdminRoute.post("/categories/del", authLogin, authRole(3), async (req, res) => {
  try {
    const id = req.body.id;
    await DeleteCateParentByID({ id });
    res.redirect(req.headers.referer || "/admin/categories");
  } catch (e) {
    res.render("500", { layout: false });
  }
});

AdminRoute.get("/categories/check", async (req, res) => {
  try {
    const cate_id = req.query.cate_id;
    const id_editor = req.query.id_editor;
    const newName = req.query.name;
    if (req.query.type == "edit") {
      const cate = await getNameCateParentByID(cate_id);
      if (cate[0]["name"] != newName) {
        const cate = await getCateByName(newName);
        if (cate.length != 0) return res.json(false);
      } else {
        if (cate[0]["id_editor"] == id_editor) return res.json(false);
      }
    } else {
      const cate = await getCateByName(newName);
      if (cate.length != 0) return res.json(false);
    }
    return res.json(true);
  } catch (e) {
    console.log(e + " ");
    return res.json(false);
  }
});

AdminRoute.get("/categories/:id", authLogin, authRole(3), async (req, res) => {
  try {
    const id = +req.params.id;
    const page = +req.query.page || 1;
    let countPage = await getCountPageCateSub(id);

    countPage = Math.ceil(countPage[0]["count(*) / 6"]);
    const numPage = [];
    for (let i = 1; i <= countPage; i++) {
      if (page == i) {
        numPage.push({ val: i, isActive: true, id: id });
      } else {
        numPage.push({ val: i, isActive: false, id: id });
      }
    }
    const cateNameParent = await getNameCateParentByID(id);

    const offset = (page - 1) * LIMIT;
    const cateSub = await allCateSubByParentPage(id, offset);

    cateSub.forEach(async (cate) => {
      let sum = await getCountArticleByIDCateSub(cate.id);
      sum = sum[0]["page"];
      if (sum === 0) {
        cate.isDel = false;
      } else {
        cate.isDel = true;
      }
      cate.sum = sum;
    });

    res.render("viewAdmin/Cate/cateSub", {
      layout: "adminLayout",
      cateSub,
      isHas: cateSub.length == 0,
      cateNameParent: cateNameParent[0].name,
      preDis: page == 1,
      nextDis: page == countPage,
      numPage,
      nextPage: page + 1,
      prePage: page - 1,
      id,
    });
  } catch (e) {
    res.render("500", { layout: false });
  }
});

AdminRoute.get(
  "/categoriesSub/edit/:id",
  authLogin,
  authRole(3),
  async (req, res) => {
    const id = req.params.id;
    const SubCate = await getCateSubByID(id);
    let listCateParent = await allCateParent();
    listCateParent.forEach((c) => {
      if (c.id == SubCate[0]["CategoriesParent_id"]) {
        c.isCheck = true;
      } else {
        c.isCheck = false;
      }
    });
    res.render("viewAdmin/Cate/updateSubCate", {
      layout: false,
      SubCate: SubCate[0],
      listCateParent,
    });
  }
);

AdminRoute.post(
  "/categoriesSub/edit",
  authLogin,
  authRole(3),
  async (req, res) => {
    try {
      let entity = {};
      entity.name = req.body.name;
      entity.CategoriesParent_id = req.body.CategoriesParent_id;
      const condition = { id: req.body.id };
      await updateCateSubByID(entity, condition);

      res.redirect(`/admin/categories/${req.body.CategoriesParent_id}`);
    } catch (e) {
      res.render("500", { layout: false });
    }
  }
);

AdminRoute.post(
  "/categoriesSub/del",
  authLogin,
  authRole(3),
  async (req, res) => {
    try {
      const id = req.body.id;
      await DeleteSubCateParentByID({ id });
      res.redirect(req.headers.referer || "/admin/categories");
    } catch (e) {
      res.render("500", { layout: false });
    }
  }
);

AdminRoute.get(
  "/categoriesSub/add/:id",
  authLogin,
  authRole(3),
  async (req, res) => {
    const idCate = req.params.id;
    let listCateParent = await allCateParent();
    listCateParent.forEach((c) => {
      if (c.id == idCate) {
        c.selected = true;
      } else {
        c.selected = false;
      }
    });
    res.render("viewAdmin/Cate/addSubCate", {
      layout: false,
      listCateParent,
    });
  }
);
AdminRoute.post(
  "/categoriesSub/add",
  authLogin,
  authRole(3),
  async (req, res) => {
    try {
      const entity = req.body;
      await addSubCate(entity);
      res.redirect(`/admin/categories/${req.body.CategoriesParent_id}`);
    } catch (e) {
      const listCateParent = await allCateParent();
      res.render("viewAdmin/Cate/addSubCate", {
        layout: false,
        listCateParent,
        err: true,
        mes: e + " ",
      });
    }
  }
);

AdminRoute.get("/categoriesSub/check", async (req, res) => {
  try {
    const newName = req.query.name;
    const cate = await getSubCateByName(newName);

    if (req.query.type == "add") {
      if (cate.length != 0) return res.json(false);
    } else {
      const cate_id = req.query.cate_id;
      const cateSub_id = req.query.cateSub_id;
      const cateSub = await getCateSubByID(cateSub_id);

      if (cateSub[0]["name"] != newName) {
        if (cate.length != 0) return res.json(false);
      } else {
        if (cate_id == cateSub[0]["CategoriesParent_id"])
          return res.json(false);
      }
      return res.json(true);
    }
    return res.json(true);
  } catch (e) {
    return res.json(false);
  }
});

AdminRoute.get("/tags", authLogin, authRole(3), async (req, res) => {
  try {
    const page = +req.query.page || 1;
    let countPage = await getCountPageTags();
    countPage = Math.ceil(countPage[0]["count(*) / 6"]);

    const listTags = await loadAllTags((page - 1) * LIMIT);
    const numPage = [];
    for (let i = 1; i <= countPage; i++) {
      if (
        i > countPage - 3 ||
        i <= 3 ||
        (i >= 3 && i >= page - 3 && i <= page + 3)
      ) {
        const item = {
          val: i,
          isActive: i == page,
        };
        numPage.push(item);
      }
    }

    listTags.forEach(async (tag) => {
      let sum = await getCountTagsWithArticle(tag.id);
      sum = sum[0]["count(*)"];
      if (sum == 0) {
        tag.sum = sum;
        tag.isDel = false;
      } else {
        tag.sum = sum;
        tag.isDel = true;
      }
    });

    res.render("viewAdmin/tags/tags", {
      layout: "adminLayout",
      listTags,
      preDis: page == 0 || page == 1,
      nextDis: page == 0 || page == countPage,
      numPage,
      nextPage: page + 1,
      prePage: page - 1,
      isTag: true,
      isHas: listTags.length == 0,
    });
  } catch (e) {
    console.log(e + " ");
    res.render("500", { layout: false });
  }
});

AdminRoute.post("/tags/del", authLogin, authRole(3), async (req, res) => {
  try {
    await deleteTagsByID({ id: req.body.id });
    await deleteTags_Articles({ Tags_id: req.body.id });
    res.redirect(req.headers.referer || "/admin/tags");
  } catch (e) {
    console.log(e + " ");
    res.render("500", { layout: false });
  }
});

AdminRoute.get("/tags/edit/:id", authLogin, authRole(3), async (req, res) => {
  try {
    const [tagNeedUpdate, listArtNotTag] = await Promise.all([
      findTagByID(+req.params.id),
      getArtNotByTag(+req.params.id),
    ]);
    res.render("viewAdmin/tags/updateTag", {
      layout: false,
      tagNeedUpdate: tagNeedUpdate[0],
      listArtNotTag,
    });
  } catch (e) {
    res.render("400", {
      layout: false,
      err: true,
      mes: e + " ",
    });
  }
});

AdminRoute.post("/tags/edit", authLogin, authRole(3), async (req, res) => {
  try {
    const { tag_name, Tags_id } = req.body;
    let { listArtCheck } = req.body;
    await updateTagByID({ tag_name }, { id: Tags_id });
    if (typeof listArtCheck == "string") {
      await addTagArt({ Tags_id, Articles_id: listArtCheck });
    } else {
      if (listArtCheck) {
        listArtCheck.forEach(async (id) => {
          await addTagArt({ Tags_id, Articles_id: id });
        });
      }
    }
    res.redirect("/admin/tags");
  } catch (e) {
    res.render("404", {
      layout: false,
      err: true,
      mes: e + " ",
    });
  }
});

AdminRoute.post(
  "/tags/detail/del",
  authLogin,
  authRole(3),
  async (req, res) => {
    try {
      const condition = {
        Articles_id: +req.body.Articles_id,
        Tags_id: +req.body.Tags_id,
      };
      await delTagWithArt(condition);
      res.redirect(`/admin/tags/detail/${req.body.Tags_id}`);
    } catch (e) {
      console.log(e + " ");
      res.render("404", {
        layout: false,
        err: true,
        mes: e + " ",
      });
    }
  }
);

AdminRoute.get("/tags/detail/:id", authLogin, authRole(3), async (req, res) => {
  try {
    const page = +req.query.page || 1;
    const id = +req.params.id;
    const [detailTag, nameOfTag] = await Promise.all([
      loadAllTagArtByIDTag(id, (page - 1) * LIMIT),
      findTagByID(id),
    ]);
    let countPage = await getCountPageTagArt(id);
    countPage = Math.ceil(countPage[0]["page"]);

    const numPage = [];
    for (let i = 1; i <= countPage; i++) {
      if (page == i) {
        numPage.push({ val: i, isActive: true, id });
      } else {
        numPage.push({ val: i, isActive: false, id });
      }
    }
    res.render("viewAdmin/tags/detailTags", {
      layout: "adminLayout",
      isHas: detailTag.length === 0,
      tagName: nameOfTag[0]["tag_name"],
      detailTag,
      preDis: page == 1,
      nextDis: page == countPage ? true : detailTag.length == 0,
      numPage,
      nextPage: page + 1,
      prePage: page - 1,
      id,
    });
  } catch (e) {
    console.log(e + " ");
    res.render("404", {
      layout: false,
      err: true,
      mes: e + " ",
    });
  }
});

AdminRoute.get("/tags/add", authLogin, authRole(3), async (req, res) => {
  res.render("viewAdmin/tags/addTags", {
    layout: false,
  });
});
AdminRoute.post("/tags/add", authLogin, authRole(3), async (req, res) => {
  try {
    await addTag(req.body);
    res.redirect("/admin/tags");
  } catch (e) {
    res.render("viewAdmin/tags/addTags", {
      layout: false,
      err: true,
      mes: e + " ",
    });
  }
});

AdminRoute.get("/tags/check", async (req, res) => {
  try {
    const newName = req.query.name;
    const id_tag = +req.query.id_tag;
    const isCheck = +req.query.check;
    const nameOldOfTag = (await findTagByID(id_tag))[0]["tag_name"];

    if (newName != nameOldOfTag) {
      const tag = await getTagByName(newName);
      if (tag) return res.json(false);
    } else {
      if (isCheck == 0) {
        const tag = await getTagByName(newName);
        if (tag) return res.json(false);
      } else {
        return res.json(true);
      }
    }
    return res.json(true);
  } catch (e) {
    return res.json(false);
  }
});

AdminRoute.get("/writer", authLogin, authRole(3), async (req, res) => {
  try {
    const page = +req.query.page || 1;
    let listWriter = await loadWriter((page - 1) * LIMIT);
    let countPage = await countPageWriter();
    countPage = Math.ceil(countPage[0]["page"]);
    const numPage = [];
    for (let i = 1; i <= countPage; i++) {
      if (page == i) {
        numPage.push({ val: i, isActive: true });
      } else {
        numPage.push({ val: i, isActive: false });
      }
    }
    listWriter.forEach(async (w) => {
      let sum = await countArtByWriter(w.id);
      sum = sum[0]["sl"];
      if (sum == 0) {
        w.sum = sum;
        w.isDel = false;
      } else {
        w.sum = sum;
        w.isDel = true;
      }
    });

    res.render("viewAdmin/people/writer/showWriter", {
      layout: "adminLayout",
      listWriter,
      preDis: page == 1,
      nextDis: page == countPage,
      numPage,
      nextPage: page + 1,
      prePage: page - 1,
      isHas: listWriter.length === 0,
    });
  } catch (e) {
    res.render("404", {
      layout: false,
      err: true,
      mes: e + " ",
    });
  }
});

AdminRoute.get("/writer/add", authLogin, authRole(3), async (req, res) => {
  res.render("viewAdmin/people/addPeople", {
    layout: false,
    writer: true,
  });
});
AdminRoute.post("/writer/add", authLogin, authRole(3), async (req, res) => {
  try {
    const user = req.body;
    user.password = await bcrypt.hash(user.password, 8);
    user.role = 1;
    await UserModel.add(user);
    res.redirect("/admin/writer");
  } catch (e) {
    res.render("viewAdmin/people/writer/addWriter", {
      layout: false,
      err: true,
      mes: e + " ",
      writer: true,
    });
  }
});

AdminRoute.post("/writer/del", authLogin, authRole(3), async (req, res) => {
  try {
    const { id } = req.body;
    await deleteUserById({ id });
    res.redirect("/admin/writer");
  } catch (e) {
    res.render("500", {
      layout: false,
      err: true,
      mes: e + " ",
    });
  }
});

AdminRoute.get("/writer/view/:id", authLogin, authRole(3), async (req, res) => {
  try {
    const writer = (await getUserByID(req.params.id))[0];
    writer.dob = moment(writer.dob).format("L");
    res.render("viewAdmin/people/viewProfile", {
      layout: false,
      info: writer,
      writer: true,
    });
  } catch (e) {
    res.render("500", {
      layout: false,
      err: true,
      mes: e + " ",
    });
  }
});

AdminRoute.get(
  "/writer/art/id/:id",
  authLogin,
  authRole(3),
  async (req, res) => {
    try {
      const page = +req.query.page || 1;
      const id_writer = req.params.id;
      let listArt = await getListArtByWriter(id_writer, (page - 1) * LIMIT);
      const nameWriter = await findWriterById(id_writer);
      let countPage = await countPageOfArtByWriterId(id_writer);
      countPage = Math.ceil(countPage[0]["page"]);
      listArt.forEach((a) => {
        a.id_writer = id_writer;
      });
      const numPage = [];
      for (let i = 1; i <= countPage; i++) {
        if (page == i) {
          numPage.push({ val: i, isActive: true, id: id_writer });
        } else {
          numPage.push({ val: i, isActive: false, id: id_writer });
        }
      }
      res.render("viewAdmin/people/writer/writerArt", {
        layout: "adminLayout",
        listArt,
        id_writer,
        nameWriter: nameWriter[0]["name"],
        helpers: {
          formatDate: function (date) {
            return moment(date).format("L");
          },
        },
        preDis: page == 1,
        nextDis: page == countPage,
        numPage,
        nextPage: page + 1,
        prePage: page - 1,
        id: id_writer,
        isWriter: true,
      });
    } catch (e) {
      res.render("404", {
        layout: false,
        err: true,
        mes: e + " ",
      });
    }
  }
);

AdminRoute.get("/editor", authLogin, authRole(3), async (req, res) => {
  try {
    const page = +req.query.page || 1;
    let listEditor = await loadEditor((page - 1) * LIMIT);
    let countPage = await countPageEditor();
    countPage = Math.ceil(countPage[0]["page"]);
    const numPage = [];
    for (let i = 1; i <= countPage; i++) {
      if (page == i) {
        numPage.push({ val: i, isActive: true });
      } else {
        numPage.push({ val: i, isActive: false });
      }
    }
    listEditor.forEach(async (e) => {
      const sum = (await countCateByEditor(e.id))[0]["sum"];
      if (sum == 0) {
        e.isDel = false;
      } else {
        e.isDel = true;
      }
      e.sum = sum;
    });

    res.render("viewAdmin/people/editor/showEditor", {
      layout: "adminLayout",
      listEditor,
      preDis: page == 1,
      nextDis: page == countPage,
      numPage,
      nextPage: page + 1,
      prePage: page - 1,
      helpers: {
        formatDate: function (date) {
          return moment(date).format("L");
        },
      },
    });
  } catch (e) {
    res.render("404", {
      layout: false,
      err: true,
      mes: e + " ",
    });
  }
});

AdminRoute.get(
  "/editor/register/add",
  authLogin,
  authRole(3),
  async (req, res) => {
    res.render("viewAdmin/people/addPeople", {
      layout: false,
      editor: true,
    });
  }
);

AdminRoute.post("/editor/add", authLogin, authRole(3), async (req, res) => {
  try {
    const user = req.body;
    user.password = await bcrypt.hash(user.password, 8);
    user.role = 2;
    await UserModel.add(user);
    res.redirect("/admin/editor");
  } catch (e) {
    res.render("viewAdmin/people/addPeople", {
      layout: false,
      editor: true,
      err: true,
      mes: e + " ",
    });
  }
});

AdminRoute.get("/editor/view/:id", authLogin, authRole(3), async (req, res) => {
  try {
    const page = +req.query.page || 1;
    const id = req.params.id;
    const nameEditor = (await getUserByID(id))[0]["name"];
    const sum = (await countCateByEditor(id))[0]["sum"];
    let countPage = sum / LIMIT;
    countPage = Math.ceil(countPage);

    const numPage = [];
    for (let i = 1; i <= countPage; i++) {
      if (page == i) {
        numPage.push({ val: i, isActive: true, id_editor: id });
      } else {
        numPage.push({ val: i, isActive: false, id_editor: id });
      }
    }
    const allCate = await listCateByEditor(id, (page - 1) * LIMIT);

    allCate.forEach(async (cate) => {
      let sum = await getCountSubCateByIDCateParent(cate.id);
      sum = sum[0]["count(*)"];
      if (sum == 0) {
        cate.sum = sum;
        cate.isDel = false;
      } else {
        cate.sum = sum;
        cate.isDel = true;
      }
    });

    res.render("viewAdmin/people/editor/showCateByEditor", {
      layout: "adminLayout",
      allCate,
      preDis: page == 1,
      nextDis: page == countPage,
      numPage,
      nextPage: page + 1,
      prePage: page - 1,
      id_editor: id,
      isHas: allCate.length == 0,
      nameEditor,
    });
  } catch (e) {
    res.render("viewAdmin/people/editor/showCateByEditor", {
      layout: false,
      err: true,
      mes: e + " ",
    });
  }
});

AdminRoute.post("/editor/del", authLogin, authRole(3), async (req, res) => {
  try {
    await deleteUserById({ id: req.body.id });
    res.redirect("/admin/editor");
  } catch (e) {
    res.render("500", {
      layout: false,
    });
  }
});

AdminRoute.get("/editor/:id", authLogin, authRole(3), async (req, res) => {
  try {
    const id = req.params.id;
    const ListEditor = await getUserByID(id);
    const editor = ListEditor[0];
    editor.dob = moment(editor.dob).format("L");
    res.render("viewAdmin/people/viewProfile", {
      layout: false,
      info: editor,
    });
  } catch (e) {
    res.render("500", { layout: false });
  }
});

AdminRoute.get("/subscriber", authLogin, authRole(3), async (req, res) => {
  try {
    const page = +req.query.page || 1;
    let listSub = await loadSub((page - 1) * LIMIT);
    let countPage = await countPageSub();
    countPage = Math.ceil(countPage[0]["page"]);
    const numPage = [];
    for (let i = 1; i <= countPage; i++) {
      if (page == i) {
        numPage.push({ val: i, isActive: true });
      } else {
        numPage.push({ val: i, isActive: false });
      }
    }

    listSub.forEach((i) => {
      i.duration = Math.round(
        i["duration"] -
          (new Date(Date.now()) - new Date(i["date_register"])) / (1000 * 60)
      );
      i.duration = i.duration <= 0 ? 0 : i.duration;
      i.page = page
    });

    res.render("viewAdmin/people/subscriber/showSub", {
      layout: "adminLayout",
      listSub,
      preDis: page == 1,
      nextDis: page == countPage,
      numPage,
      nextPage: page + 1,
      prePage: page - 1,
    });
  } catch (e) {
    res.render("500", {
      layout: false,
    });
  }
});

AdminRoute.get(
  "/subscriber/view/:id",
  authLogin,
  authRole(3),
  async (req, res) => {
    try {
      const subscriber = (await getUserByID(req.params.id))[0];
      subscriber.dob = moment(subscriber.dob).format("L");
      res.render("viewAdmin/people/viewProfile", {
        layout: false,
        info: subscriber,
        subscriber: true,
      });
    } catch (e) {
      res.render("500", {
        layout: false,
      });
    }
  }
);

AdminRoute.post("/subscriber/del", authLogin, authRole(3), async (req, res) => {
  try {
    const id = req.body.id;
    await Promise.all([
      deleteUserById({ id: id }),
      deletedComment({ user_id: id }),
    ]);
    res.redirect(`/admin/subscriber`);
  } catch (e) {
    console.log(e + " ");

    res.render("500", {
      layout: false,
    });
  }
});

AdminRoute.get("/articles", authLogin, authRole(3), async (req, res) => {
  try {
    const id_cate = req.query.id_cate;
    const id_type = req.query.id_type;
    const page = +req.query.page || 1;
    var listArt = null;
    var countPage = 0;
    const isIdType = id_type === undefined ? false : true;
    const isIdCate = id_cate === undefined ? false : true;

    if (id_type === undefined && id_cate === undefined) {
      listArt = await getListArt((page - 1) * LIMIT);
      countPage = await countPageOfArt();
    } else if (id_type !== undefined) {
      listArt = await getListArtByType((page - 1) * LIMIT, id_type);
      countPage = await countPageOfArtByType(id_type);
    } else {
      listArt = await getListArtByCateSub((page - 1) * LIMIT, id_cate);
      countPage = await getCountArticleByIDCateSub(id_cate);
    }
    countPage = Math.ceil(countPage[0]["page"]);
    const numPage = [];
    for (let i = 1; i <= countPage; i++) {
      if (page == i) {
        numPage.push({
          val: i,
          isActive: true,
          id_type,
          isIdType,
          isIdCate,
          id_cate,
        });
      } else {
        numPage.push({
          val: i,
          isActive: false,
          id_type,
          isIdType,
          isIdCate,
          id_cate,
        });
      }
    }
    res.render("viewAdmin/people/writer/writerArt", {
      layout: "adminLayout",
      listArt,
      isHasSub: listArt.length == 0,
      helpers: {
        formatDate: function (date) {
          return moment(date).format("L");
        },
      },
      preDis: page == 1,
      nextDis: page == countPage,
      numPage,
      nextPage: page + 1,
      prePage: page - 1,
      isArt: true,
      isIdType,
      id_type,
      isIdCate,
      id_cate,
    });
  } catch (e) {
    res.render("404", {
      layout: false,
      err: true,
      mes: e + " ",
    });
  }
});

AdminRoute.get("/articles/status", authLogin, authRole(3), async (req, res) => {
  try {
    const id_stt = req.query.id;
    const page = +req.query.page || 1;

    let [listArt, countPage] = await Promise.all([
      getListArtByStt((page - 1) * LIMIT, id_stt),
      countPageOfArtByStt(id_stt),
    ]);

    if (listArt.length === 0) {
      return res.render("viewAdmin/articles/articlesStatus", {
        isHasSub: true,
        layout: "adminLayout",
      });
    }
    countPage = Math.ceil(countPage[0]["page"]);
    const numPage = [];
    for (let i = 1; i <= countPage; i++) {
      if (page == i) {
        numPage.push({
          val: i,
          isActive: true,
          id_stt,
        });
      } else {
        numPage.push({
          val: i,
          isActive: false,
          id_stt,
        });
      }
    }

    listArt.forEach((e) => {
      if (e.status === 1) {
        e.action = "Xác NHận Duyệt";
        e.isReject = false;
        e.id_stt = id_stt;
      } else if (e.status === 2) {
        e.isReject = true;
        e.action = "Từ Chối";
        e.id_stt = id_stt;
      } else {
        e.isReject = false;
        e.action = "Xác Nhận Duyệt";
        e.id_stt = id_stt;
      }
    });

    res.render("viewAdmin/articles/articlesStatus", {
      layout: "adminLayout",
      listArt,
      helpers: {
        formatDate: function (date) {
          return moment(date).format("L");
        },
      },
      preDis: page === 1,
      nextDis: page === countPage,
      numPage,
      nextPage: page + 1,
      prePage: page - 1,
      id_stt,
      isStatus: true,
      isApproved: listArt[0].status === 2,
      status:
        listArt[0].status === 2
          ? "Đã Được Duyệt"
          : listArt[0].status === 1
          ? "Chưa Được Duyệt"
          : "Bị Từ Chối",
    });
  } catch (e) {
    console.log(e + " ");
    res.render("500", { layout: false });
  }
});

AdminRoute.get(
  "/article/checkDatePost",
  authLogin,
  authRole(3),
  async (req, res) => {
    try {
      const date = req.query.date;
      const id = req.query.id;
      const art = await getArticleByID(id);
      if (new Date(date) < new Date(art[0].write_date)) return res.json(false);
      return res.json(true);
    } catch (e) {
      return res.json(false);
    }
  }
);

AdminRoute.post(
  "/articles/approved",
  authLogin,
  authRole(3),
  async (req, res) => {
    const { id, post_date, id_stt } = req.body;
    try {
      await updateRejectApprovedArt({ post_date, status: 2 }, { id });
      res.redirect(`/admin/articles/status?id=${id_stt}`);
    } catch (e) {
      console.log(e + " ");
      res.render("500", { layout: false });
    }
  }
);
AdminRoute.post(
  "/articles/reject",
  authLogin,
  authRole(3),
  async (req, res) => {
    const { id, reason_reject, id_stt } = req.body;
    try {
      await updateRejectApprovedArt(
        { reason_reject, status: 3, post_date: null },
        { id }
      );
      res.redirect(`/admin/articles/status?id=${id_stt}`);
    } catch (e) {
      console.log(e + " ");
      res.render("500", { layout: false });
    }
  }
);

AdminRoute.post("/articles/del", authLogin, authRole(3), async (req, res) => {
  try {
    const id = req.body.id;
    await deleteTags_Articles({ Articles_id: id });
    await deletedComment({ article_id: id });
    await deleteImage_Article({ Articles_id: id });
    await setTimeout(() => deletedArt({ id }), 0);

    if (!req.body.id_writer) {
      return res.redirect(`/admin/articles`);
    }
    res.redirect(`/admin/writer/art/id/${req.body.id_writer}`);
  } catch (e) {
    console.log(e + " ");
    res.render("500", {
      layout: false,
    });
  }
});

AdminRoute.get("/typeArt", authLogin, authRole(3), async (req, res) => {
  try {
    const allType = await loadAllTypeArt();
    allType.forEach(async (t) => {
      const sl = (await getSumArtByType(t.id))[0]["sl"];
      if (sl < 1) {
        t.isDel = false;
      } else {
        t.isDel = true;
      }
      t.sl = sl;
    });
    res.render("viewAdmin/typeArt/showTypeArt", {
      layout: "adminLayout",
      allType,
      isTypeArt: true,
    });
  } catch (e) {
    res.render("500", {
      layout: false,
    });
  }
});

AdminRoute.get("/status", authLogin, authRole(3), async (req, res) => {
  try {
    const allStt = await loadAllStatus();
    allStt.forEach(async (t) => {
      const sl = (await getSumArtByStt(t.id))[0]["sl"];
      if (sl < 1) {
        t.isDel = false;
      } else {
        t.isDel = true;
      }
      t.sl = sl;
    });
    res.render("viewAdmin/statusArt/showStatusArt", {
      layout: "adminLayout",
      allStt,
      isStatus: true,
    });
  } catch (e) {
    res.render("500", {
      layout: false,
    });
  }
});

AdminRoute.get(
  "/typeArt/edit/:name",
  authLogin,
  authRole(3),
  async (req, res) => {
    const name = req.params.name;
    const typeArt = (await getTypeArtByName(name))[0];
    res.render("viewAdmin/typeArt/updateTypeArt", {
      layout: false,
      typeArt,
    });
  }
);
AdminRoute.get(
  "/status/edit/:name",
  authLogin,
  authRole(3),
  async (req, res) => {
    const name = req.params.name;
    const status = (await getStatusByName(name))[0];
    res.render("viewAdmin/statusArt/updateStatusArt", {
      layout: false,
      status,
    });
  }
);
AdminRoute.post("/typeArt/edit", authLogin, authRole(3), async (req, res) => {
  try {
    await updateTypeArt({ name: req.body.name }, { id: req.body.id });
    res.redirect("/admin/typeArt");
  } catch (e) {
    res.render("500", {
      layout: false,
    });
  }
});
AdminRoute.post("/status/edit", authLogin, authRole(3), async (req, res) => {
  try {
    await updateStatusArt({ name: req.body.name }, { id: req.body.id });
    res.redirect("/admin/status");
  } catch (e) {
    res.render("500", {
      layout: false,
    });
  }
});

AdminRoute.get("/typeArt/check", authLogin, authRole(3), async (req, res) => {
  const name = req.query.name;
  const typeArt = await getTypeArtByName(name);
  if (typeArt.length != 0) {
    return res.json(false);
  }
  res.json(true);
});
AdminRoute.get("/status/check", authLogin, authRole(3), async (req, res) => {
  const name = req.query.name;
  const status = await getStatusByName(name);

  if (status.length != 0) {
    return res.json(false);
  }
  res.json(true);
});

AdminRoute.get("/typeArt/add", authLogin, authRole(3), async (req, res) => {
  res.render("viewAdmin/typeArt/updateTypeArt", {
    layout: false,
    isAdd: true,
  });
});
AdminRoute.get("/status/add", authLogin, authRole(3), async (req, res) => {
  res.render("viewAdmin/statusArt/updateStatusArt", {
    layout: false,
    isAdd: true,
  });
});

AdminRoute.post("/typeArt/add", authLogin, authRole(3), async (req, res) => {
  try {
    await addTypeOfArt({ name: req.body.name });
    res.redirect("/admin/typeArt");
  } catch (e) {
    console.log(e);
    res.render("500", { layout: false });
  }
});
AdminRoute.post("/status/add", authLogin, authRole(3), async (req, res) => {
  try {
    await addStatusOfArt({ name: req.body.name });
    res.redirect("/admin/status");
  } catch (e) {
    console.log(e);
    res.render("500", { layout: false });
  }
});
AdminRoute.post("/typeArt/del", authLogin, authRole(3), async (req, res) => {
  try {
    await delTypeArtById({ id: req.body.id });
    res.redirect("/admin/typeArt");
  } catch (e) {
    console.log(e);
    res.render("500", { layout: false });
  }
});
AdminRoute.post("/status/del", authLogin, authRole(3), async (req, res) => {
  try {
    await delStatusArtById({ id: req.body.id });
    res.redirect("/admin/status");
  } catch (e) {
    console.log(e);
    res.render("500", { layout: false });
  }
});

AdminRoute.get("/dashboard", authLogin, authRole(3), async (req, res) => {
  const sumUser = (await countAllUser())[0]["sl"];
  const sumCate = (await countAllCate())[0]["sl"];
  const sumArt = (await countAllArticle())[0]["sl"];

  res.render("viewAdmin/home", {
    layout: "adminLayout",
    sumUser,
    sumCate,
    sumArt,
  });
});

AdminRoute.get("/dashboard/data", authLogin, authRole(3), async (req, res) => {
  const dataArtByDate = await getArtWithDate();

  const arrSl = dataArtByDate.reduce((preVal, val) => {
    preVal.push(val.SL);
    return preVal;
  }, []);

  const arrDate = dataArtByDate.reduce((preVal, val) => {
    preVal.push(moment(val.write_date).format("L"));
    return preVal;
  }, []);

  return res.json({
    arrSl,
    arrDate,
  });
});

AdminRoute.post("/changeTimeExpired", authLogin, authRole(3), async (req, res) => {
  try {
    const timeNeedChange = +(await getTimeExpired(req.body.id))[0]["duration"];
    const date = new Date();
    
    const timeRemain = Math.round(
        timeNeedChange - (new Date(Date.now()) - new Date((await getTimeExpired(req.body.id))[0]["date_register"])) / (1000 * 60)
      );
    if (timeRemain <= 0) {
      await Promise.all([
        changeTimeExpired(+req.body.timeChange, req.body.id),
        UpdateTimeExpired(
          `${moment().format(
            "YYYY-MM-DD"
          )} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
          req.body.id
        ),
      ]);
    } else {
      const timeToChange = +req.body.timeChange + timeNeedChange;
      await changeTimeExpired(timeToChange, req.body.id);
    }
    res.redirect(`/admin/subscriber?page=${req.body.page}`);
  } catch (e) {
    console.log(e + ' ');
    res.render('500', {
      layout: false
    })
  }
});

module.exports = AdminRoute;
