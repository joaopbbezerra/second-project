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


module.exports = router;