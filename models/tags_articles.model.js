const db = require("../utils/db");

const TABLE_TAG_ARTICLE = "tag_article";

module.exports = {
  addTags_Articles: function (entity) {
    db.add(TABLE_TAG_ARTICLE, entity);
  },

  deleteTags_Articles: function (condition) {
    db.delete(TABLE_TAG_ARTICLE, condition);
  },
};
