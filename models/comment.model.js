const db = require("../utils/db");

const TABLE_COMMENTS = "comments";
const TABLE_USER = "user";

module.exports = {
  addComment: function (entity) {
    return db.add(TABLE_COMMENTS, entity);
  },

  allCommentByArticle: function (article_id, start, indexOfPage) {
    return db.load(`select c.*, u.name, DATE_FORMAT(c.com_date, "%H:%i:%S %d/%m/%Y") as 'dateComment' 
                        from ${TABLE_COMMENTS} c join ${TABLE_USER} u on c.user_id = u.id 
                        where c.article_id = ${article_id}
                        order by com_date desc
                        limit ${start}, ${indexOfPage}`);
  },

  countCommentByArticle: async function (article_id) {
    const rows = await db.load(
      `select count(*) as count 
             from ${TABLE_COMMENTS} 
             where article_id = ${article_id}`
    );
    return rows[0].count;
  },
  deletedComment: (condition) => {
    return db.delete(`${TABLE_COMMENTS}`, condition);
  },
};
