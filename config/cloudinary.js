const cloudinary = require("cloudinary").v2

//Requests for type form-data (allows to send files on my requests)
const multer = require("multer")

//connect multer with cloudinary
const {CloudinaryStorage} = require("multer-storage-cloudinary") //O curly braces é pq o require tá retornando muita coisa, por isso usamos o {} pra especificar


//Connects the cloudinary library to our subscription
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
})

//storage configuration on cloudinary
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "matchflix", //Pasta que está sendo criada na cloud do Cloudinary
                        //Tipos permitidos, caso sejam todos é só tirar o allowed_formats
    },
    filename: function(red, file, cb){
        cb(null, file.originalname)
    }
})

const uploadCloud = multer({storage})

module.exports = uploadCloud