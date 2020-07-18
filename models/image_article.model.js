const db = require("../utils/db");

const TABLE_IMAGE_ARTICLE = "image_article";

module.exports = {
  addImage_Article: function (entity) {
    return db.add(TABLE_IMAGE_ARTICLE, entity);
  },

  deleteImage_Article: function (condition) {
    db.delete(TABLE_IMAGE_ARTICLE, condition);
  },

  updateImage_Article: function (entity) {
    const condition = {
      id: entity.id,
    };
    delete entity.id;
    db.patch(TABLE_IMAGE_ARTICLE, entity, condition);
  },

  allImageByArticle: function (Articles_id) {
    return db.load(`select * 
                    from ${TABLE_IMAGE_ARTICLE}
                    where Articles_id = ${Articles_id}
                    order by id DESC`);
  },
};
