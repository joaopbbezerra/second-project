const express = require("express");
const router = express.Router();

router.get("/movie", (req,res)=> {
    res.render("movie/movies-search");
})

module.exports = router;
