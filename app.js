require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const categoryRouter = require("./routes/articleByCategory.route");
const accountRouter = require("./routes/account.route");
const articleRouter = require("./routes/article.route");
const writerRouter = require("./routes/writer.route");
const editorRouter = require("./routes/editor.route");
const articleModel = require("./models/article.model");
const tagModel = require("./models/tag.model");
const AdminRoute = require("./routes/admin.route");
const searchRouter = require("./routes/search.route");
const AuthRouter = require('./middlewares/authPassPort')
const passPortGoogle = require('./config/passport')
const passport = require('passport')
const app = express();

require("./middlewares/view.mdw")(app);
require("./middlewares/session.mdw")(app);
require("./middlewares/local.mdw")(app);
app.use("/public", express.static("public"));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
passPortGoogle(passport)

app.use("/articles", categoryRouter);
app.use("/articles", articleRouter);
app.use("/account", accountRouter);
app.use("/writer", writerRouter);
app.use("/editor", editorRouter);
app.use("/search", searchRouter);
app.use("/auth", AuthRouter);

/**
 * /admin
 * /editor
 * /writer
 */

app.use("/admin", AdminRoute);

app.get("/articleByCategoryMostView-paging/:page", async function (req, res) {
  try {
    const indexOfPage = 2;
    const page = req.params.page - 0 || 1;
    const start = (page - 1) * indexOfPage;
    const articleByCategoryMostView_10 = await articleModel.articleByCategryMostView_10(
      start,
      indexOfPage
    );

    const n = await articleModel.countArticleByCategryMostView_10();
    const nPage = Math.ceil(n / indexOfPage);
    let pageItems = [];
    for (let i = 1; i <= nPage; i++) {
      const item = {
        value: i,
        isActive: i === page,
      };
      pageItems.push(item);
    }

    res.render(
      "partials/articleByCategoryMostView",
      {
        pageItems,
        articleByCategoryMostView_10,
        preDisable: nPage === 0 || page === 1,
        nextDisable: nPage === 0 || page === nPage,
        pagePre: page - 1,
        pageNext: page + 1,
        layout: false,
      },
      (e, html) => {
        res.json({ html });
      }
    );
  } catch (error) {
    res.render("500", { layout: false });
  }
});

app.get("/", async function (req, res) {
  try {
    const indexOfPage = 2;
    const articleMostView_10 = await articleModel.articleMostView_10();
    const articleNew_10 = await articleModel.articleNew_10();
    const articleByCategoryMostView_10 = await articleModel.articleByCategryMostView_10(
      0,
      indexOfPage
    );
    const articleMostOutstanding_5 = await articleModel.articleMostOutstanding_5();
    const articleMostOutstanding_1 = articleMostOutstanding_5[0];
    delete articleMostOutstanding_5[0];
    const articleMostOutstanding_4 = articleMostOutstanding_5;
    const tags_15 = await tagModel.tags_15();

    const n = await articleModel.countArticleByCategryMostView_10();
    const nPage = Math.ceil(n / indexOfPage);
    let page = 1;
    let pageItems = [];
    for (let i = 1; i <= nPage; i++) {
      const item = {
        value: i,
        isActive: i === page,
      };
      pageItems.push(item);
    }

    res.render("home", {
      articleMostView_10,
      articleNew_10,
      articleByCategoryMostView_10,
      articleMostOutstanding_1,
      articleMostOutstanding_4,
      tags_15,
      pageItems,
      preDisable: nPage === 0 || page === 1,
      nextDisable: nPage === 0 || page === nPage,
      pagePre: page - 1,
      pageNext: page + 1,
    });
  } catch (error) {
    console.log(error);
    res.render("500", { layout: false });
  }
});

app.get("/test", (req, res) => {
  res.json({
    maxAge: req.session.cookie.maxAge,
    expire: req.session.cookie.expires.getMinutes(),
    user: req.session.authUser,
  });
});

app.use(function (req, res) {
  res.render("404", { layout: false });
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).render("500", { layout: false });
});

const PORT = 3000;
app.listen(PORT, function () {
  console.log(`server is running at http://localhost:${PORT}`);
});
