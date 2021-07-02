const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Movies = require("../models/Movie.model");
const bcrypt = require("bcryptjs");

function requireLogin(req, res, next){
    if (req.session.currentUser){
        next()
    }
    else {
        res.redirect("/login")
    }
}

router.get("/signup", (req, res)=>{
    res.render("auth/signup")
})

router.post("/signup", async (req, res)=>{
    const {username, image, password} = req.body
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);
    await User.create({username, image, password:hashedPassword})

    res.redirect("/")
})

router.get("/login", (req, res) => {
    res.render("auth/login");
  });

router.post("/login", async (req, res)=>{
    const {username, password} = req.body
    if (!username || !password){
        res.render("auth/login", {errorMessage: "Fill username and password"})
        return
    }
    const user = await User.findOne({username})
    if (!user){
        res.render("auth/login", {
            errorMessage: `${username} does not exist`
        })
        return
    }
    if (bcrypt.compareSync(password, user.password)){
        req.session.currentUser = user
        res.redirect(`/auth/${user._id}`)
    } else {
        res.render("auth/login", {
            errorMessage: `Invalid login`
        })
    }
    res.render("auth/private")
})

router.get("/private", requireLogin, (req, res)=>{
    res.render("auth/private")
})

router.get("/main", (req, res)=>{
    res.render("auth/main")
})

router.post("/logout", (req, res)=>{
    req.session.destroy()
    res.redirect("/")
})

router.get("/auth/:userId", async (req, res)=>{
    const userDetail = await User.findById(req.params.userId)
    res.render("auth/user-detail", {userDetail})
})

router.post("/auth/:userId", async (req, res) =>{ //Código rodado depois de clicar no botão do form no user details
    const { date } = req.body; //Add o date por update
    console.log("date", date);
    console.log("id", req.params.userId);
    const userDetail = await User.findById(req.params.userId)
    let userDate = await User.find({ username: date });
    console.log("userDate", userDate.length)
    if (userDate.length !== 0) {
        await User.findByIdAndUpdate(req.params.userId, {
            date
        });
        res.redirect(`/${req.params.userId}`); //atualizar a página
    } else {
        res.render("auth/user-detail", {userDetail, errorMessage: "Date is not valid, try another one"})
    }   
})



module.exports = router;