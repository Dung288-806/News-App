const mysql = require("mysql");
const config = require("../config/default.json");

const pool = mysql.createPool(config.mysql);

module.exports = {
  load: function (sql) {
    return new Promise(function (fn_done, fn_fail) {
      pool.query(sql, function (error, results, fields) {
        if (error) {
          return fn_fail(error);
        }
        return fn_done(results);
      });
    });
  },

  add: function (table, entity) {
    return new Promise(function (fn_done, fn_fail) {
      sql = `insert into ${table} set ?`;
      pool.query(sql, entity, function (error, results, fields) {
        if (error) {
          return fn_fail(error);
        }

        return fn_done(results);
      });
    });
  },

  patch: function (table, entity, condition) {
    return new Promise(function (fn_done, fn_fail) {
      sql = `update ${table} set ? where ?`;
      pool.query(sql, [entity, condition], function (error, results, fields) {
        if (error) {
          return fn_fail(error);
        }
        return fn_done(results);
      });
    });
  },

  delete: function (table, condition) {
    return new Promise(function (fn_done, fn_fail) {
      sql = `delete from ${table} where ?`;
      pool.query(sql, condition, function (error, results, fields) {
        if (error) {
          return fn_fail(error);
        }
        return fn_done(results);
      });
    });
  },
  deleteManyCondition: function (sql) {
    return new Promise(function (fn_done, fn_fail) {
      pool.query(sql, function (
        error,
        results,
        fields
      ) {
        if (error) {
          return fn_fail(error);
        }
        return fn_done(results);
      });
    });
  },
};
