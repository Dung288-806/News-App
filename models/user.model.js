const db = require("../utils/db");

const TABLE_USER = 'user'
const TABLE_ART = 'articles'
const TABLE_CATEPARENT = "categoriesparent";
const LIMIT = 6

module.exports = {
  add: (entity) => {
    return db.add("user", entity);
  },
  patch: function (entity) {
    const condition = {
      id: entity.id
    }
    delete entity.id;
    return db.patch(TABLE_USER, entity, condition);
  },
  del: function (id) {
    const condition = {
      id: id
    }
    return db.del(TABLE_USER, condition);
  },
  single: function (id) {
    return db.load(`select * from ${TABLE_USER} where id = ${id}`);
  },
  CheckUserName: (username) => {
    return db.load(`SELECT * From user where username = '${username}'`);
  },
  CheckEmailLogin: (email) => {
    return db.load(`SELECT * From user where email = '${email}' and type_login = 0`);
  },
  CheckPseudonym: (pseu) => {
    return db.load(`SELECT pseudonym From user where pseudonym = '${pseu}'`);
  },
  GetUserByEmail: (email) => {
    return db.load(`SELECT * from user where email = '${email}'`);
  },
  UpdatePass: (pass, id) => {
    return db.load(`UPDATE user set password = '${pass}' where id = '${id}'`);
  },
  ListEditor: () => {
    return db.load(`SELECT id, name, username from User where role = ${2}`);
  },
  getUserByID: (id) => {
    return db.load(
      `Select name, dob, username, email, pseudonym from user where id = ${id}`
    );
  },
  countPageWriter: (id) => {
    return db.load(
      `select count(*) / ${LIMIT} as page from ${TABLE_USER} where role = 1`
    );
  },
  loadWriter: (offset) => {
    return db.load(
      `select id, name, pseudonym  from ${TABLE_USER} where role = 1 Limit ${LIMIT} offset ${offset}`
    );
  },
  findWriterById: (id) => {
    return db.load(
      `select id, username, pseudonym, name, dob, email from ${TABLE_USER} where role = 1 and id = ${id}`
    );
  },
  countArtByWriter: (id) => {
    return db.load(
      `select count(*) as sl from ${TABLE_ART} where Writer_id = ${id}`
    );
  },
  deleteUserById: (condition) => {
    return db.delete(`${TABLE_USER}`, condition);
  },
  loadEditor: (offset) => {
    return db.load(
      `SELECT u.id, u.username, u.name, u.email, u.dob FROM ${TABLE_USER} u WHERE u.role = 2 limit ${LIMIT} offset ${offset}`
    );
  },
  countPageEditor: () => {
    return db.load(
      `select count(*) / ${LIMIT} as page from ${TABLE_USER} where role = 2`
    );
  },
  countPageSub: () => {
    return db.load(
      `select count(*) / ${LIMIT} as page from ${TABLE_USER} where role = 0`
    );
  },
  loadSub: (offset) => {
    return db.load(
      `select id, name, email  from ${TABLE_USER} where role = 0 Limit ${LIMIT} offset ${offset}`
    );
  },
};
