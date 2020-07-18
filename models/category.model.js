const db = require("../utils/db");

const TABLE_CATEGORIESPARENT = "CategoriesParent";
const TABLE_CATEGORIESSUB = "CategoriesSub";
const TABLE_USER = "user";
const LIMIT_PAGE = 6;

module.exports = {
  allCategoriesSub: function () {
    return db.load(
      `select * 
             from ${TABLE_CATEGORIESSUB}`
    );
  },
  cateParentByCateSub: async function (categorySub_id) {
    const rows = await db.load(
      `select csub.name as 'subName', cparent.name as 'parentName' 
             from ${TABLE_CATEGORIESSUB} csub join 
                ${TABLE_CATEGORIESPARENT} cparent on csub.CategoriesParent_id = cparent.id 
             where csub.id = ${categorySub_id}`
    );
    return rows[0];
  },
  categoriesSubByID: async function (id) {
    const rows = await db.load(
      `select csub.name as 'subName', cparent.name as 'parentName' 
             from ${TABLE_CATEGORIESSUB} csub join 
                ${TABLE_CATEGORIESPARENT} cparent on csub.CategoriesParent_id = cparent.id 
             where csub.id = ${id}`
    );
    return rows[0];
  },
  categoriesSubByID: async function (id) {
    const rows = await db.load(
      `select csub.name as 'subName', cparent.name as 'parentName' 
        from ${TABLE_CATEGORIESSUB} csub join ${TABLE_CATEGORIESPARENT} cparent 
         on csub.CategoriesParent_id = cparent.id 
         where csub.id = ${id} `
    );
    return rows[0];
  },

  allCateSubByParent: function (id) {
    return db.load(
      `select * 
             from ${TABLE_CATEGORIESSUB} 
             where CategoriesParent_id = ${id}`
    );
  },
  allCateSubByParent: function (id) {
    return db.load(
      `select * from ${TABLE_CATEGORIESSUB} where CategoriesParent_id = ${id}`
    );
  },

  allCateParent: function () {
    return db.load(`select * 
                        from ${TABLE_CATEGORIESPARENT}`);
  },
  allCateParent: function () {
    return db.load(`select * from ${TABLE_CATEGORIESPARENT}`);
  },

  allCateParentByEditor: function (editor_id) {
    return db.load(`select * 
      from ${TABLE_CATEGORIESPARENT}
      where id_editor = ${editor_id}`);
  },

  isCateParentByEditor_Id: async function (cateParent_id, editor_id) {
    const rows = await db.load(
      `select * 
       from ${TABLE_CATEGORIESPARENT}
       where id = ${cateParent_id} and id_editor = ${editor_id}`
    );
    return rows.length >= 1;
  },

  allCate: function () {
    return db.load(
      `select csub.*, cparent.name as 'CateParentName' 
             from ${TABLE_CATEGORIESPARENT} cparent join 
                ${TABLE_CATEGORIESSUB} csub on cparent.id = csub.CategoriesParent_id`
    );
  },
  // allCate: function () {
  //   return db.load(
  //     `select csub.*, cparent.name as 'CateParentName' from ${TABLE_CATEGORIESPARENT} cparent join ${TABLE_CATEGORIESSUB} csub on cparent.id = csub.CategoriesParent_id`
  //   );
  // },
  loadCateWithManager: function (offset) {
    return db.load(
      `SELECT c.id, c.id_editor, c.name, u.name as Username FROM ${TABLE_CATEGORIESPARENT} c, ${TABLE_USER} u WHERE u.id = c.id_editor limit ${LIMIT_PAGE} offset ${offset}`
    );
  },
  addCateParent: (entity) => {
    return db.add("categoriesparent", entity);
  },
  getCateByName: (name) => {
    return db.load(
      `select id from ${TABLE_CATEGORIESPARENT} where name = '${name}'`
    );
  },
  getSubCateByName: (name) => {
    return db.load(
      `select id from ${TABLE_CATEGORIESSUB} where name = '${name}'`
    );
  },
  getCateByID: (id) => {
    return db.load(
      `select * from ${TABLE_CATEGORIESPARENT} where id = '${id}'`
    );
  },
  patchCateByID: (entity, id) => {
    return db.patch(`${TABLE_CATEGORIESPARENT}`, entity, id);
  },
  getCountPage: () => {
    return db.load(
      `SELECT count(*) / ${LIMIT_PAGE} from ${TABLE_CATEGORIESPARENT} where 1`
    );
  },
  getCountPageCateSub: (id) => {
    return db.load(
      `select count(*) / ${LIMIT_PAGE} from ${TABLE_CATEGORIESSUB} csub where csub.CategoriesParent_id = ${id}`
    );
  },
  allCateSubByParentPage: function (id, offset) {
    return db.load(
      `select csub.*, cparent.name as 'CateParentName' from ${TABLE_CATEGORIESPARENT} cparent, ${TABLE_CATEGORIESSUB} csub where cparent.id = csub.CategoriesParent_id and csub.CategoriesParent_id = ${id}  limit ${LIMIT_PAGE} offset ${offset}`
    );
  },
  getNameCateParentByID: (id) => {
    return db.load(
      `select * from ${TABLE_CATEGORIESPARENT} where id = ${id}`
    );
  },
  getCountSubCateByIDCateParent: (id) => {
    return db.load(
      `select count(*) from ${TABLE_CATEGORIESSUB} csub where csub.CategoriesParent_id = ${id}`
    );
  },
  getCateSubByID: function (id) {
    return db.load(`select * from ${TABLE_CATEGORIESSUB} where id = ${id}`);
  },
  updateCateSubByID: function (entity, condition) {
    return db.patch("categoriessub", entity, condition);
  },
  DeleteCateParentByID: (id) => {
    return db.delete(`${TABLE_CATEGORIESPARENT}`, id);
  },
  DeleteSubCateParentByID: (id) => {
    return db.delete(`${TABLE_CATEGORIESSUB}`, id);
  },
  addSubCate: (entity) => {
    return db.add(`${TABLE_CATEGORIESSUB}`, entity);
  },
  countCateByEditor: (id_editor) => {
    return db.load(
      `select count(*) as sum from ${TABLE_CATEGORIESPARENT} where id_editor = ${id_editor}`
    );
  },
  listCateByEditor: (id_editor, offset) => {
    return db.load(
      `SELECT c.id, c.id_editor, c.name, u.name as Username FROM ${TABLE_CATEGORIESPARENT} c, ${TABLE_USER} u WHERE u.id = c.id_editor and c.id_editor = ${id_editor} limit ${LIMIT_PAGE} offset ${offset}`
    );
  },
  getCheckInfo: (id, id_editor) => {
    return db.load(
      `select * from ${TABLE_CATEGORIESPARENT} where id = ${id} and id_editor = ${id_editor}`
    );
  },
  getCheckInfoCate: (id, id_cateParent) => {
    return db.load(
      `select * from ${TABLE_CATEGORIESSUB} where id = ${id} and CategoriesParent_id = ${id_cateParent}`
    );
  },
};
