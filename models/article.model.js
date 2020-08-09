const db = require("../utils/db");
const TABLE_ARTICLES = "articles";
const TABLE_CATEGORIESSUB = "categoriesSub";
const TABLE_CATEGORIESPARENT = "categoriesParent";
const TABLE_TYPEARTICLE = "typeArticle";
const TABLE_STATUSARTICLE = "statusarticle";
const TABLE_TAG_ARTICLE = "tag_article";
const TABLE_TAGS = "tags";
const TABLE_COMMENTS = "comments";
const TABLE_USER = "user";
const LIMIT = 6;

module.exports = {
  addArticle: function (entity) {
    return db.add(TABLE_ARTICLES, entity);
  },

  updateArticle: function (entity) {
    const condition = {
      id: entity.id,
    };
    delete entity.id;
    return db.patch(TABLE_ARTICLES, entity, condition);
  },

  articleByWrite_date: async function (write_date) {
    const rows = await db.load(
      `select * 
             from ${TABLE_ARTICLES} 
             where write_date = '${write_date}'`
    );
    return rows[0];
  },

  articleByID: async function (id) {
    const rows = await db.load(
      `select *, DATE_FORMAT(write_date, "%H:%i:%S %m/%d/%Y") as 'dateWrite'
             from ${TABLE_ARTICLES} 
             where id = ${id}`
    );
    return rows[0];
  },
  detailArticleByID: async function (id) {
    const rows = await db.load(
      `select a.*, FORMAT(a.views, 0) as 'views1', DATE_FORMAT(a.post_date, "%H:%i %d/%m/%Y") as 'datePost',
                if(a.type = 2, 1, 0) as isPremium, u.pseudonym
             from ${TABLE_ARTICLES} a join ${TABLE_USER} u
              on a.Writer_id = u.id
             where a.id = ${id} and a.status = 2 and a.post_date <= CURRENT_TIMESTAMP()`
    );
    return rows[0];
  },

  checkArEditByWri: async function (article_id, writer_id) {
    const rows = await db.load(
      `select * 
             from ${TABLE_ARTICLES} 
             where id = ${article_id} and (status = 1 or status = 3)
              and Writer_id = ${writer_id}`
    );
    return rows.length >= 1;
  },

  checkArManageByEditor: async function (article_id, editor_id) {
    const rows = await db.load(
      `select *
             from ${TABLE_ARTICLES} a join ${TABLE_CATEGORIESSUB} cs
              on a.CategoriesSub_id = cs.id join ${TABLE_CATEGORIESPARENT} cp
              on cs.CategoriesParent_id = cp.id
             where a.id = ${article_id} and a.status = 1
              and cp.id_editor = ${editor_id}`
    );
    return rows.length >= 1;
  },

  articleByCate_5: function (cateSub_id, articleCurrent_id) {
    return db.load(
      `select a.id, a.title, a.small_avt, a.views, if(a.type = 2, 1, 0) as isPremium,
              DATE_FORMAT(a.post_date, "%H:%i %d/%m/%Y") as 'datePost',
              cs.name as csName, cs.id as csId, count(c.id) as nCmt
            from ${TABLE_ARTICLES} a join ${TABLE_CATEGORIESSUB} cs 
              on a.CategoriesSub_id = cs.id left join ${TABLE_COMMENTS} c 
              on a.id = c.article_id
            where a.id <> ${articleCurrent_id}
              and status = 2 and post_date <= CURRENT_TIMESTAMP()
              and cs.CategoriesParent_id = (select cs1.CategoriesParent_id 
                                            from categoriessub cs1 
                                            where cs1.id = ${cateSub_id} limit 1)
            group by a.id
            order by rand() limit 5`
    );
  },

  search: (key, start, indexOfPage) => {
    let sql = `SELECT a.id, a.title, a.small_avt, a.sum_content, a.views,
                DATE_FORMAT(a.post_date, "%H:%i %d/%m/%Y") as 'datePost',
                if(a.type = 2, 1, 0) as isPremium, cs.name as csName, cs.id as csId, count(c.id) as nCmt
              FROM ${TABLE_ARTICLES} a join ${TABLE_CATEGORIESSUB} cs 
                on a.CategoriesSub_id = cs.id left join ${TABLE_COMMENTS} c 
                on a.id = c.article_id
              WHERE status = 2 and post_date <= CURRENT_TIMESTAMP() and
                (MATCH(title, sum_content, content) AGAINST ('${key}') || (title like '%${key}%') || (sum_content like '%${key}%') || (content like '%${key}%'))
              group by a.id
              order by a.type = 2 desc, a.post_date desc 
              limit ${start}, ${indexOfPage}`;
    return db.load(sql);
  },

  countSearch: async (key) => {
    let sql = `select count(*) as countSearch 
    FROM articles 
    WHERE (MATCH(title, sum_content) AGAINST ('${key}') || (title like '%${key}%') || (sum_content like '%${key}%') || (content like '%${key}%'))
    and status = 2 and post_date <= CURRENT_TIMESTAMP()`;
    const rows = await db.load(sql);
    return rows[0];
  },

  allArticleByCategorySub: function (categorySub_id, start, indexOfPage) {
    return db.load(
      `select a.id, a.title, a.small_avt, a.sum_content, a.views,
              DATE_FORMAT(a.post_date, "%H:%i %d/%m/%Y") as 'datePost',
              if(a.type = 2, 1, 0) as isPremium, cs.name as csName, cs.id as csId, count(c.id) as nCmt
            from ${TABLE_ARTICLES} a join ${TABLE_CATEGORIESSUB} cs 
              on a.CategoriesSub_id = cs.id left join ${TABLE_COMMENTS} c 
              on a.id = c.article_id
            where a.CategoriesSub_id = ${categorySub_id}
              and a.status = 2 and a.post_date <= CURRENT_TIMESTAMP()
            group by a.id
            order by a.type = 2 desc, a.post_date desc
            limit ${start}, ${indexOfPage}`
    );
  },
  countAllArticleByCategorySub: async function (categorySub_id) {
    const rows = await db.load(
      `select count(*) as amount
             from ${TABLE_ARTICLES} 
             where CategoriesSub_id = ${categorySub_id}
              and status = 2 and post_date <= CURRENT_TIMESTAMP()`
    );
    return rows[0].amount;
  },

  allArticleByTag: function (tag_id, start, indexOfPage) {
    return db.load(
      `select a.id, a.title, a.small_avt, a.sum_content, a.views,
              DATE_FORMAT(a.post_date, "%H:%i %d/%m/%Y") as 'datePost',
              if(a.type = 2, 1, 0) as isPremium, cs.name as csName, cs.id as csId, count(c.id) as nCmt
            from ${TABLE_TAG_ARTICLE} t_a join ${TABLE_ARTICLES} a 
            on t_a.Articles_id = a.id join ${TABLE_CATEGORIESSUB} cs 
            on a.CategoriesSub_id = cs.id left join ${TABLE_COMMENTS} c 
            on a.id = c.article_id
            where t_a.Tags_id = ${tag_id} and a.status = 2 
            and a.post_date <= CURRENT_TIMESTAMP()
            group by a.id
            order by a.type = 2 desc, a.post_date desc 
            limit ${start}, ${indexOfPage}`
    );
  },
  countAllArticleByTag: async function (tag_id) {
    const rows = await db.load(
      `select *
            from ${TABLE_TAG_ARTICLE} t_a join ${TABLE_ARTICLES} a 
            on t_a.Articles_id = a.id
            where t_a.Tags_id = ${tag_id} and status = 2 
            and a.post_date <= CURRENT_TIMESTAMP()
            order by post_date desc `
    );
    return rows.length;
  },

  articleMostView_10: function () {
    return db.load(
      `select a.id, a.title, a.small_avt, a.views, a.type, DATE_FORMAT(a.post_date, "%H:%i %d/%m/%Y") as 'datePost',
              count(c.id) as nCmt, if(a.type = 2, 1, 0) as isPremium, cs.id as csId, cs.name as csName,
              a.writer_id, u.pseudonym as writerPseudonym
             from ${TABLE_ARTICLES} a left join ${TABLE_COMMENTS} c 
              on a.id = c.article_id join ${TABLE_CATEGORIESSUB} cs 
              on cs.id = a.CategoriesSub_id join ${TABLE_USER} u 
              on u.id = a.writer_id
             where a.status = 2 and a.post_date <= CURRENT_TIMESTAMP()
             group by a.id
             order by views desc limit 10`
    );
  },

  articleNew_10: function () {
    return db.load(
      `select a.id, a.title, a.small_avt, a.views, DATE_FORMAT(a.post_date, "%H:%i %d/%m/%Y") as 'datePost',
                count(c.id) as nCmt, if(a.type = 2, 1, 0) as isPremium, cs.id as csId, cs.name as csName,
                a.writer_id, u.pseudonym as writerPseudonym
             from ${TABLE_ARTICLES} a left join ${TABLE_COMMENTS} c 
              on a.id = c.article_id join ${TABLE_CATEGORIESSUB} cs 
              on cs.id = a.CategoriesSub_id join ${TABLE_USER} u 
              on u.id = a.writer_id
             where status = 2 and post_date <= CURRENT_TIMESTAMP()
             group by a.id
             order by post_date desc 
             limit 10`
    );
  },

  articleByCategryMostNew_10: function (start, indexOfPage) {
    return db.load(
      `select ar.id, ar.title, ar.small_avt, ar.sum_content, ar.views,
              DATE_FORMAT(ar.post_date, "%H:%i %d/%m/%Y") as 'datePost', if(ar.type = 2, 1, 0) as isPremium,
                (select count(c.id)
                  from ${TABLE_ARTICLES} a 
                  left join ${TABLE_COMMENTS} c 
                  on a.id = c.article_id
                  where a.id = ar.id
                  group by a.id ) as nCmt, ar.csId, ar.csName,
                  ar.writer_id, ar.writerPseudonym
            from  
              ( select a1.*, csub.id as csId, csub.name as csName, u.pseudonym as writerPseudonym
                from ${TABLE_CATEGORIESSUB} csub join ${TABLE_ARTICLES} a1 
                  on csub.id = a1.CategoriesSub_id join ${TABLE_USER} u on u.id = a1.writer_id
                where a1.status = 2 and a1.post_date <= CURRENT_TIMESTAMP()
                  and a1.post_date >= all 
                    ( select a2.post_date 
                      from ${TABLE_ARTICLES} a2 
                      where a2.CategoriesSub_id = a1.CategoriesSub_id)
                ) ar 
            group by ar.CategoriesSub_id
            order by sum(ar.views) desc
            limit ${start}, ${indexOfPage}`
    );
  },
  countArticleByCategryMostNew_10: async function () {
    const rows = await db.load(
      `select *
              from ${TABLE_CATEGORIESSUB} csub join
                ${TABLE_ARTICLES} ar on csub.id = ar.CategoriesSub_id
             where ar.status = 2 and ar.post_date <= CURRENT_TIMESTAMP()
             group by csub.id
             order by ar.views desc
             limit 10`
    );
    return rows.length;
  },

  articleMostOutstanding_5: function () {
    return db.load(
      `select a.id, a.title, a.small_avt, a.views, DATE_FORMAT(a.post_date, "%H:%i %d/%m/%Y") as 'datePost',
              count(c.id) as nCmt, if(a.type = 2, 1, 0) as isPremium, cs.id as csId, cs.name as csName,
              a.writer_id, u.pseudonym as writerPseudonym
             from ${TABLE_ARTICLES} a left join ${TABLE_COMMENTS} c on a.id = c.article_id
              join ${TABLE_CATEGORIESSUB} cs on cs.id = a.CategoriesSub_id
              join ${TABLE_USER} u on u.id = a.writer_id
             where status = 2 and post_date <= CURRENT_TIMESTAMP()
              and DATEDIFF(CURRENT_TIMESTAMP(), post_date) <= 21
             GROUP by a.id
            order by count(c.id) DESC
             limit 5`
    );
  },

  arByWri_ApprovedUnpublished: function (writer_id, start, indexOfPage) {
    return db.load(
      `select a.*, cs.name as csName, cp.name as cpName, ta.name as typeName, 
        DATE_FORMAT(a.write_date, "%H:%i:%S %m/%d/%Y") as 'dateWrite',
        DATE_FORMAT(a.post_date, "%H:%i:%S %m/%d/%Y") as 'datePost'
             from ${TABLE_ARTICLES} a join ${TABLE_CATEGORIESSUB} cs 
              on a.CategoriesSub_id = cs.id join ${TABLE_CATEGORIESPARENT} cp
              on cs.CategoriesParent_id = cp.id join ${TABLE_TYPEARTICLE} ta
              on a.type = ta.id 
             where Writer_id = ${writer_id} and status = 2 
              and timestampdiff(second, post_date,current_timestamp()) < 0
             order by write_date desc
             limit ${start}, ${indexOfPage}`
    );
  },
  Count_arByWri_ApprovedUnpublished: async function (writer_id) {
    const rows = await db.load(
      `select count(*) as c
             from ${TABLE_ARTICLES} 
             where Writer_id = ${writer_id} and status = 2 
              and timestampdiff(second, post_date,current_timestamp()) < 0`
    );
    return rows[0].c;
  },

  arByWri_Published: function (writer_id, start, indexOfPage) {
    return db.load(
      `select a.*, cs.name as csName, cp.name as cpName, ta.name as typeName, 
        DATE_FORMAT(a.write_date, "%H:%i:%S %m/%d/%Y") as 'dateWrite',
        DATE_FORMAT(a.post_date, "%H:%i:%S %m/%d/%Y") as 'datePost'
             from ${TABLE_ARTICLES} a join ${TABLE_CATEGORIESSUB} cs 
              on a.CategoriesSub_id = cs.id join ${TABLE_CATEGORIESPARENT} cp
              on cs.CategoriesParent_id = cp.id join ${TABLE_TYPEARTICLE} ta
              on a.type = ta.id 
             where Writer_id = ${writer_id} and status = 2 
              and timestampdiff(second, post_date,current_timestamp()) > 0
             order by write_date desc
             limit ${start}, ${indexOfPage}`
    );
  },
  Count_arByWri_Published: async function (writer_id) {
    const rows = await db.load(
      `select count(*) as c
             from ${TABLE_ARTICLES} 
             where Writer_id = ${writer_id} and status = 2 
              and timestampdiff(second, post_date,current_timestamp()) > 0`
    );
    return rows[0].c;
  },

  arByWri_Denied: function (writer_id, start, indexOfPage) {
    return db.load(
      `select a.*, cs.name as csName, cp.name as cpName, ta.name as typeName, 
        DATE_FORMAT(a.write_date, "%H:%i:%S %m/%d/%Y") as 'dateWrite'
             from ${TABLE_ARTICLES} a join ${TABLE_CATEGORIESSUB} cs 
              on a.CategoriesSub_id = cs.id join ${TABLE_CATEGORIESPARENT} cp
              on cs.CategoriesParent_id = cp.id join ${TABLE_TYPEARTICLE} ta
              on a.type = ta.id 
             where Writer_id = ${writer_id} and status = 3 
             order by write_date desc
             limit ${start}, ${indexOfPage}`
    );
  },
  Count_arByWri_Denied: async function (writer_id) {
    const rows = await db.load(
      `select count(*) as c 
             from ${TABLE_ARTICLES} 
             where Writer_id = ${writer_id} and status = 3 `
    );
    return rows[0].c;
  },

  arByWri_PendingApproval: function (writer_id, start, indexOfPage) {
    return db.load(
      `select a.*, cs.name as csName, cp.name as cpName, ta.name as typeName, 
        DATE_FORMAT(a.write_date, "%H:%i:%S %m/%d/%Y") as 'dateWrite'
             from ${TABLE_ARTICLES} a join ${TABLE_CATEGORIESSUB} cs 
              on a.CategoriesSub_id = cs.id join ${TABLE_CATEGORIESPARENT} cp
              on cs.CategoriesParent_id = cp.id join ${TABLE_TYPEARTICLE} ta
              on a.type = ta.id 
             where Writer_id = ${writer_id} and status = 1
             order by write_date desc
             limit ${start}, ${indexOfPage}`
    );
  },
  Count_arByWri_PendingApproval: async function (writer_id) {
    const rows = await db.load(
      `select count(*) as c
             from ${TABLE_ARTICLES} 
             where Writer_id = ${writer_id} and status = 1`
    );
    return rows[0].c;
  },

  arByCateParent: function (categoryParent_id, start, indexOfPage) {
    return db.load(
      `select a.*, cs.name as csName, cp.name as cpName, ta.name as typeName, sa.name as statusName,
        DATE_FORMAT(a.write_date, "%H:%i:%S %m/%d/%Y") as 'dateWrite'
             from ${TABLE_ARTICLES} a join ${TABLE_CATEGORIESSUB} cs 
              on a.CategoriesSub_id = cs.id join ${TABLE_CATEGORIESPARENT} cp
              on cs.CategoriesParent_id = cp.id join ${TABLE_TYPEARTICLE} ta
              on a.type = ta.id join ${TABLE_STATUSARTICLE} sa
              on sa.id = a.status
             where cp.id = ${categoryParent_id} and status = 1
             order by write_date desc
             limit ${start}, ${indexOfPage}`
    );
  },
  Count_arByCateParent: async function (categoryParent_id) {
    const rows = await db.load(
      `select count(*) as c
             from ${TABLE_ARTICLES} a join ${TABLE_CATEGORIESSUB} cs
              on a.CategoriesSub_id = cs.id
             where cs.CategoriesParent_id = ${categoryParent_id} and status = 1`
    );
    return rows[0].c;
  },
  getCountArticleByIDCateSub: (id) => {
    return db.load(
      `select count(*) as page from ${TABLE_ARTICLES}  where CategoriesSub_id = ${id}`
    );
  },
  getArticleByID: (id) => {
    return db.load(`select *  from ${TABLE_ARTICLES}  where id = ${id}`);
  },
  getArtNotByTag: (id_tag) => {
    return db.load(
      `SELECT a.id, a.title as nameart, c.name namecate from articles a, categoriessub c where a.id NOT in (SELECT Articles_id from tag_article WHERE Tags_id = ${id_tag}) and a.CategoriesSub_id = c.id`
    );
  },
  getListArtByWriter: (id_writer, offset) => {
    return db.load(
      `SELECT id, title, write_date, post_date, views, status from articles  where Writer_id = ${id_writer} limit ${LIMIT} offset ${offset}`
    );
  },
  getListArt: (offset) => {
    return db.load(
      `SELECT id, title, write_date, post_date, views, status, Writer_id from articles limit ${LIMIT} offset ${offset}`
    );
  },
  getListArtByStt: (offset, id_stt) => {
    return db.load(
      `SELECT id, title, write_date, post_date, views, status, Writer_id from articles where status = ${id_stt} limit ${LIMIT} offset ${offset}`
    );
  },
  getListArtByType: (offset, id_type) => {
    return db.load(
      `SELECT id, title, write_date, post_date, views, status, Writer_id from articles where type = ${id_type} limit ${LIMIT} offset ${offset}`
    );
  },
  getListArtByCateSub: (offset, id_cate) => {
    return db.load(
      `SELECT id, title, write_date, post_date, views, status, Writer_id from articles where CategoriesSub_id = ${id_cate} limit ${LIMIT} offset ${offset}`
    );
  },
  deletedArt: (condition) => {
    return db.delete(`${TABLE_ARTICLES}`, condition);
  },
  countPageOfArtByWriterId: (writer_id) => {
    return db.load(
      `SELECT count(*) / ${LIMIT} as page from ${TABLE_ARTICLES} where Writer_id = ${writer_id}`
    );
  },
  countPageOfArt: () => {
    return db.load(
      `SELECT count(*) / ${LIMIT} as page from ${TABLE_ARTICLES} where 1`
    );
  },
  countPageOfArtByStt: (stt) => {
    return db.load(
      `SELECT count(*) / ${LIMIT} as page from ${TABLE_ARTICLES} where status = ${stt}`
    );
  },
  countPageOfArtByType: (idType) => {
    return db.load(
      `SELECT count(*) / ${LIMIT} as page from ${TABLE_ARTICLES} where type = ${idType}`
    );
  },
  loadAllTypeArt: () => {
    return db.load(`SELECT name, id FROM  typearticle `);
  },
  loadAllStatus: () => {
    return db.load(`SELECT name, id FROM  statusarticle `);
  },
  getTypeArtByName: (name) => {
    return db.load(`SELECT * from typearticle where name = '${name}' `);
  },
  getStatusByName: (name) => {
    return db.load(`SELECT * from statusarticle where name = '${name}' `);
  },
  updateTypeArt: (entity, condition) => {
    return db.patch("typearticle", entity, condition);
  },
  updateStatusArt: (entity, condition) => {
    return db.patch("statusarticle", entity, condition);
  },
  addTypeOfArt: (entity) => {
    return db.add("typearticle", entity);
  },
  addStatusOfArt: (entity) => {
    return db.add("statusarticle", entity);
  },
  getSumArtByType: (type) => {
    return db.load(`SELECT COUNT(*) as sl FROM articles WHERE type = ${type} `);
  },
  countAllArticle: () => {
    return db.load(`SELECT COUNT(*) as sl FROM ${TABLE_ARTICLES}`);
  },
  getSumArtByStt: (stt) => {
    return db.load(
      `SELECT COUNT(*) as sl FROM articles WHERE status = ${stt} `
    );
  },
  delTypeArtById: (type) => {
    return db.delete("typearticle", type);
  },
  delStatusArtById: (stt) => {
    return db.delete("statusarticle", stt);
  },
  insertHistoryUpdateArt: (entity) => {
    return db.add("history_update_art", entity);
  },
  updateRejectApprovedArt: (entity, condition) => {
    return db.patch(`${TABLE_ARTICLES}`, entity, condition);
  },
  getArtWithDate: () => {
    return db.load(
      `SELECT COUNT(*) as SL, write_date FROM ${TABLE_ARTICLES} GROUP BY date(write_date) LIMIT 5`
    );
  },
};
