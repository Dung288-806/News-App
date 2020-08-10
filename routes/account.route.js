const express = require("express");
const moment = require("moment");
const UserModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { authLogin, auth } = require("../middlewares/auth.mdw");
const userModel = require("../models/user.model");
const router = express.Router();

router.get("/login", auth, async (req, res) => {
  res.render("viewAccount/login", { layout: false });
});

router.post("/login", auth, async (req, res) => {
  try {
    const username = req.body.email;
    let user;
    if (username.includes("@")) {
      user = await UserModel.CheckEmailLogin(username);
    } else {
      user = await UserModel.CheckUserName(username);
    }
    if (user.length == 0) {
      return res.render("viewAccount/login", {
        layout: false,
        err: true,
        mes: "Not found user",
      });
    }
    const isMatch = await bcrypt.compare(req.body.password, user[0].password);
    if (!isMatch) {
      return res.render("viewAccount/login", {
        layout: false,
        err: true,
        mes: "Invalid password",
        email: user[0].email,
      });
    }
    delete user[0].password;
    req.session.isAuthenticated = true;
    req.session.authUser = user[0];
    const url = req.query.retUrl || "/";
    if (user[0].role == 3) {
      return res.redirect("/admin/dashboard");
    } else if (user[0].role == 1) {
      return res.redirect("/writer");
    } else if (user[0].role == 2) {
      return res.redirect("/editor");
    } else res.redirect(url);
  } catch (e) {
    res.render("viewAccount/login", {
      layout: false,
      err: true,
      mes: e + " ",
    });
  }
});

router.get("/register", auth, async (req, res) => {
  res.render("viewAccount/register", { layout: false });
});
router.post("/register", auth, async (req, res) => {
  try {
    const user = req.body;
    const date = new Date()
    user.dob = moment(user.dob, `DD/MM/YYYY`).format(`YYYY-MM-DD`);
    user.password = await bcrypt.hash(user.password, 8);
    user.date_register = `${moment().format("YYYY-MM-DD")} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    await UserModel.add(user);

    res.render("viewAccount/login", {
      layout: false,
      meg: true,
    });
  } catch (e) {
    console.log(e + "");
    res.render("viewAccount/register", {
      layout: false,
      meg: false,
    });
  }
});

router.get("/checkusername", async (req, res) => {
  const username = req.query.username;
  const email = req.query.email;
  const pseu = req.query.pseudonym;

  if (pseu) {
    const checkPseu = await UserModel.CheckPseudonym(pseu);
    if (checkPseu.length != 0) {
      return res.json("pseu");
    }
  }
  const checkUsername = await UserModel.CheckUserName(username);
  const checkEmail = await UserModel.GetUserByEmail(email);
  if (checkUsername.length != 0) {
    return res.json("user");
  } else if (checkEmail.length != 0) {
    return res.json("email");
  }
  return res.json(true);
});

router.get("/checkEmailUpdate", async (req, res) => {
  const email = req.query.email;
  const checkEmail = await UserModel.GetUserByEmail(email);
  if (checkEmail.length === 0) {
    return res.json(true);
  }
  const data = checkEmail[0]["id"] === req.session.authUser.id;
  res.json(data);
});

router.post("/logout", authLogin, (req, res) => {
  req.session.destroy((e) => {
    if (e) {
      console.log(e + " ");
      return res.redirect("/");
    }
    // res.clearCookie("sid");
    res.redirect(req.headers.referer || "/");
    // res.redirect("/");
  });
});

router.get("/forgot", async (req, res) => {
  res.render("viewAccount/ForgotPass", { layout: false });
});

router.post("/forgot", async (req, res) => {
  try {
    const user = await UserModel.GetUserByEmail(req.body.email);

    if (user.length == 0) {
      return res.render("viewAccount/ForgotPass", {
        layout: false,
        err: true,
        mes: "Not found user by email",
      });
    }
    if (user[0].type_login === 1) {
      return res.render("viewAccount/ForgotPass", {
        layout: false,
        err: true,
        mes: "Email được login bằng google. Không sử dụng được chức năng này",
      });
    }
    const OTP = Math.floor(Math.random() * 100) + 10000;
    res.cookie("OTP", OTP);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS_EMAIL,
      },
    });

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: `${user[0].email}`,
      subject: `Hello ${user[0].username}. Welcom to our App`,
      text: `Thank you ${user[0].username} used and join to our app`,
      html: `
            <h1>Please CONFIRM OTP to reset your password</h1><br/>
            <h1> OTP:  ${OTP}</h1>
            <p>This email may contain sensetive information</p>
            <p>and link will  expired in 60 minutes</p>
        `,
    };

    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        return res.render("viewAccount/ForgotPass", {
          layout: false,
          err: true,
          mes: err + " ",
        });
      } else {
        return res.render("viewAccount/confirmOTP", {
          layout: false,
          id: user[0].id,
        });
      }
    });
  } catch (e) {
    console.log(e + "  ");
    return res.render("viewAccount/ForgotPass", {
      layout: false,
      err: true,
      mes: e + " ",
    });
  }
});

router.post("/confirm", (req, res) => {
  if (req.cookies.OTP == req.body.otp) {
    res.clearCookie("OTP");
    return res.render("viewAccount/ChangePass", {
      layout: false,
      id: req.body.id_user,
    });
  }
  return res.render("viewAccount/confirmOTP", {
    layout: false,
    id: req.body.id_user,
    err: true,
  });
});

router.post("/changepass", async (req, res) => {
  try {
    const passHash = await bcrypt.hash(req.body.password, 8);
    const id_user = req.body.change
      ? req.session.authUser.id
      : req.body.id_user;
    const user = await UserModel.UpdatePass(passHash, id_user);
    if (req.body.change) {
      return res.redirect("/account/profile");
    }
    res.redirect("/account/login");
  } catch (e) {
    res.render("viewAccount/ChangePass", {
      layout: false,
      err: true,
      mes: e + " ",
    });
  }
});

router.get("/changepass", authLogin, async (req, res) => {
  const isForgot = req.query.isForgot == true;
  res.render("viewAccount/ChangePass", { layout: false, isForgot });
});

router.get("/compareOldPass/:pass", async (req, res) => {
  try {
    const oldPass = req.params.pass;
    console.log(oldPass);
    console.log(req.session.authUser);
    const user = await userModel.single(req.session.authUser.id);
    console.log(oldPass, user);

    const isMatch = await bcrypt.compare(oldPass, user[0].password);
    if (!isMatch) {
      return res.json(false);
    }
    return res.json(true);
  } catch (e) {
    console.log(e + " ");
    return res.json(false);
  }
});

router.post("/updateProfile", authLogin, async function (req, res) {
  const id = req.session.authUser.id;
  const name = req.body.name;
  const email = req.body.email;
  const dob = moment(req.body.dob, "DD/MM/YYYY").format("YYYY-MM-DD");
  const entity_user = {
    id,
    name,
    email,
    dob,
  };

  if (req.session.authUser.role === 1) {
    entity_user.pseudonym = req.body.pseudonym;
  }

  await userModel.patch(entity_user);
  req.session.authUser.name = name;
  req.session.authUser.email = email;
  req.session.authUser.dob = dob;

  if (req.session.authUser.role === 1) {
    req.session.authUser.pseudonym = req.body.pseudonym;
  }

  if (req.session.authUser.role === 0) {
    res.redirect("/");
  } else if (req.session.authUser.role === 1) {
    res.redirect("/writer");
  } else if (req.session.authUser.role === 2) {
    res.redirect("/editor");
  } else if (req.session.authUser.role === 3) {
    res.redirect("/admin/dashboard");
  }
});

router.get("/profile", authLogin, async function (req, res) {
  console.log(res.locals.user);
  res.locals.user.dob1 = moment(res.locals.user.dob).format("DD/MM/YYYY");
  console.log(res.locals.user.dob1);
  res.render("viewAccount/profile", {
    layout: false,
  });
});

router.post("/extension", authLogin, async (req, res) => {
  const date = new Date();

  await UserModel.UpdateTimeExpired(
    `${moment().format(
      "YYYY-MM-DD"
    )} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
    req.session.authUser.id
  );
  res.redirect(`/articles/detail/${req.body.article_id}`);
});


module.exports = router;
