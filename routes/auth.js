const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Movies = require("../models/Movie.model");
const bcrypt = require("bcryptjs");
const fileUpload = require("../config/cloudinary");
const imdb = require('imdb-api')

function requireLogin(req, res, next){
    if (req.session.currentUser){
        next()
    }
    else {
        res.redirect("/login")
    }
}

router.get("/signup", (req, res)=>{
    res.redirect("/auth/login")
})

router.post("/signup", fileUpload.single("image"), async (req, res)=>{
    let fileUrlOnCloudinary = "";
    if (req.file) {
      fileUrlOnCloudinary = req.file.path;
    }
    const {username, name, password} = req.body
    
    if (username === "" || password === "") {
        alert("Username or password invalid")
        res.render("auth/login", { errorMessage: "Fill username and password" });
        return;
      }

        //Check for password strength
    // let myRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,12}/;
    // if (myRegex.test(password) === false) {
    //     res.render("auth/login", {
    //         errorMessage: "Password is too weak",
    // });
    //     return;
    // }

    const user = await User.findOne({ username: username }); //Lembrar de colocar o await sempre que chamar o mongodb
    if (user !== null) {
      res.render("auth/login", {
        errorMessage: `${username} already exists. Pick another one`,
      });
      return;
    }
    
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);
    await User.create({username, name, image:fileUrlOnCloudinary, password:hashedPassword})

    res.redirect("/auth/login")
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

router.get("/auth/:userId",requireLogin, async (req, res)=>{
    const userDetail = await User.findById(req.params.userId)
    const { date } = req.body;
    // console.log("Favorites:", req.session.currentUser.favorites[3])
    const newArray = []
    for (let i = 0; i<userDetail.favorites.length; i++){
        const movieDetails =  await imdb.get({id: userDetail.favorites[i]}, {apiKey: process.env.imdbKey, timeout: 30000})
        newArray.push(movieDetails)
    }
    console.log(newArray)
    if (userDetail.date){
        let userDate = await User.find({ username: date });
    }
    res.render("auth/user-detail", {userDetail, newArray})
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
        res.render("auth/user-detail", {userDetail, userDate, errorMessage: "Date is valid!"})
        // res.redirect(`/auth/${req.params.userId}`); //atualizar a página
    } else {
        res.render("auth/user-detail", {userDetail, userDate, errorMessage: "Date is not valid"})
    }   
})

router.get("/favorites/:userId", requireLogin, async (req, res)=>{
    const userDetail = await User.findById(req.params.userId)
    // console.log("Favorites:", req.session.currentUser.favorites[3])
    const newArray = []
    for (let i = 0; i<userDetail.favorites.length; i++){
        const movieDetails =  await imdb.get({id: userDetail.favorites[i]}, {apiKey: process.env.imdbKey, timeout: 30000})
        newArray.push(movieDetails)
    }
    res.render("auth/favorites-details", {userDetail, newArray})
})



router.get("/matches", requireLogin, async (req, res)=>{
    const arrayMoviesMatches = []
    const userDetail = await User.findById(req.session.currentUser)
    for (let i = 0; i<userDetail.matches.length; i++){
        const moviesMatches =  await imdb.get({id: userDetail.matches[i]}, {apiKey: process.env.imdbKey, timeout: 30000})
        arrayMoviesMatches.push(moviesMatches)
    }
    res.render("auth/matches", {userDetail, arrayMoviesMatches})
})
module.exports = router;





// router.post("/favorites/:userId", async (req, res) =>{
//     const {favorites} = req.body
//     await User.findByIdAndUpdate(req.params.userId, {
//         favorites: favorites
//     });
//     res.redirect(`/favorites/${req.params.userId}`)
// })

// router.post("/favorites/:userId/add", async (req, res)=>{
//     const {favorites} = req.body
//     console.log(favorites)
//     await User.findByIdAndUpdate(req.params.userId, {
//         $push: {favorites: favorites}
//     })
//     console.log(req.params.userId)
//     res.redirect(`/favorites/${req.session.currentUser._id}`)
// })