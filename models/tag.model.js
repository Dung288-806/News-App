const db = require("../utils/db");

const TABLE_TAGS = "tags";
const TABLE_TAG_ARTICLE = "tag_article";
const TABLE_ARTICLES = "articles";
const LIMIT_PAGE = 6;

module.exports = {
  addTag: function (entity) {
    return db.add(TABLE_TAGS, entity);
  },

  isExistTagName: async function (tagName) {
    const rows = await db.load(
      `SELECT count(*) as amount FROM ${TABLE_TAGS} WHERE tag_name = '${tagName}'`
    );
    return rows[0].amount >= 1;
  },

  getTagByName: async function (tagName) {
    const rows = await db.load(
      `SELECT * FROM ${TABLE_TAGS} WHERE tag_name = '${tagName}'`
    );
    return rows[0];
  },

  getTagById: async function (tag_id) {
    const rows = await db.load(
      `SELECT * 
        FROM ${TABLE_TAGS} 
        WHERE id = ${tag_id} `
    );
    return rows[0];
  },

  allTag: function () {
    return db.load(`select * 
                        from ${TABLE_TAGS} `);
  },

  tags_15: function () {
    return db.load(`select t.*
                        from ${TABLE_TAGS} t join ${TABLE_TAG_ARTICLE} ta
                          on t.id = ta.Tags_id
                        order by rand()
                        limit 15`);
  },

  allTagsByArticle: function (id) {
    return db.load(
      `select t.* from ${TABLE_TAGS} t join ${TABLE_TAG_ARTICLE} t_a on t.id = t_a.tags_id join ${TABLE_ARTICLES} a on t_a.articles_id = a.id where a.id = ${id}`
    );
  },

  getCountPageTagArt: (id) => {
    return db.load(
      `SELECT count(*) / ${LIMIT_PAGE} as page from ${TABLE_TAG_ARTICLE} where Tags_id = ${id} `
    );
  },
  loadAllTags: (offset) => {
    return db.load(
      `SELECT * from ${TABLE_TAGS} limit ${LIMIT_PAGE} offset ${offset}`
    );
  },

  getCountTagsWithArticle: (id_tag) => {
    return db.load(
      `SELECT count(*) FROM ${TABLE_TAG_ARTICLE} WHERE Tags_id = ${id_tag}`
    );
  },

  tagArticlesByID: async function (id) {
    const rows = await db.load(
      `select t.tag_name from ${TABLE_TAGS} ta join ${TABLE_TAG_ARTICLE} tar on ta.id = tar.Tags_id where ta.id = ${id}`
    );
    return rows[0];
  },

  loadAllTagArtByIDTag: (id_tag, offset) => {
    return db.load(
      `SELECT ta.*, t.tag_name, a.title FROM ${TABLE_TAG_ARTICLE} ta, ${TABLE_TAGS} t, ${TABLE_ARTICLES} a WHERE ta.Tags_id = t.id and ta.Tags_id = ${id_tag} and ta.Articles_id = a.id limit ${LIMIT_PAGE} offset ${offset}`
    );
  },
  deleteTagsByID: (condition) => {
    return db.delete(`${TABLE_TAGS}`, condition);
  },
  findTagByID: (id) => {
    return db.load(`select * from ${TABLE_TAGS} where id = ${id}`);
  },
  updateTagByID: (entity, condition) => {
    return db.patch(`${TABLE_TAGS}`, entity, condition);
  },
  addTagArt: (entity) => {
    return db.add(`${TABLE_TAG_ARTICLE}`, entity);
  },
  getTagNameById: (id) => {
    return db.load(`SELECT * from ${TABLE_TAGS} where tag_name = '${name}'`);
  },
  delTagWithArt: (condition) => {
    return db.deleteManyCondition(
      `Delete from ${TABLE_TAG_ARTICLE} where Tags_id = ${condition.Tags_id} and Articles_id = ${condition.Articles_id}`
    );
  },
  addTag: (entity) => {
    return db.add(`${TABLE_TAGS}`, entity);
  },
  getCountPageTags: () => {
    return db.load(
      `SELECT count(*) / ${LIMIT_PAGE} from ${TABLE_TAGS} where 1`
    );
  },
};
