const formidable =require ('formidable');
const validator = require('validator');
const registerModel= require('../models/authmodel');
const fs = require('fs');
const bcrypt = require ('bcrypt');
const jwt = require ('jsonwebtoken');

const cloudinary = require('cloudinary').v2;


module.exports.userRegister = (req,res)=>{

    const form =formidable();
    form.parse(req,async (err,fields,files)=>{
        const {userName,email,password,confirmPassword} = fields;
        const {image} = files;
            //console.log(files)
            const error = [];

        if(!userName){
            error.push('username field is required')
        }
       
        if(!email){
            error.push('email field is required');
        }
        if(email && !validator.isEmail(email)){
            error.push('provide your vaild email');
        }
        
        if(!password){
            error.push('password field is required');
        }
        if(!confirmPassword){
            error.push('confirmPassword field is required');
        }
        if(password && confirmPassword &&password!== confirmPassword){
            error.push('password doesnot match');
        }
        if(password && password.length<6){
            error.push('password must be 6 charecter');
        }
        if(Object.keys(files).length === 0){
            error.push('provide user image')
        }
        if(Object.keys(files).length !== 0){
            const {originalFilename,size,mimetype} = files.image;
            // console.log(originalFilename)
            // console.log(mimetype)

            const imageSize = (size/1000)/1000;
            const imageType = mimetype.split('/')[1];
            if(imageType !== 'png' && imageType !== 'jpg' && imageType !== 'jpeg'){
                error.push('provide user image')
            }
            if(imageSize>8){
                error.push('provide your image less then 8MB')
            }
        }
        if(error.length>0){
            res.status(400).json({error:{errorMessage:error}})
        }
        else{

            cloudinary.config({
                cloud_name: process.env.cloud_name, 
                api_key: process.env.api_key, 
                api_secret: process.env.api_secret,
                secure: true
            });

            try {
                const checkUser = await registerModel.findOne({email:email});
                if (checkUser){
                    res.status(404).json({error:{errorMessage:['your Email allready exited']}})
                }
                else{
                    try {
                        const result = await cloudinary.uploader.upload(files.image.filepath);
                        
                        const userCreate = await registerModel.create({
                            userName,
                            email,
                            password: await bcrypt.hash(password, 10),
                            image: result.url
                        });

                        const token = jwt.sign({
                            id : userCreate._id,
                            email : userCreate.email,
                            userName : userCreate.userName,
                            image : userCreate.image,
                            registerTime : userCreate.createAt
                        },process.env.SECRET,{expiresIn : process.env.TOKEN_EXP});

                        const options= {
                            expires : new Date(Date.now() + process.env.COOKIE_EXP*24*60*60*1000)
                        }
                        
                        res.status(201).cookie('authToken',token,options).json({
                            successMessage : 'your Register Successfull',token
                        })
                    } catch (error) {
                        res.status(404).json({error:{errorMessage:['image upload failed']}})
                        // console.log()
                    }
                }
            } catch (error) {
                res.status(500).json({error:{errorMessage:['internal server error']}});
            }
            
        }
    }) 
}

module.exports.userLogin = async (req,res)=>{

const error = [];

const {email,password}= req.body;
if(!email){
    error.push('provide your email')

}
if(!password){
    error.push('provide your valid password')
}
if(email && !validator.isEmail(email)){
    error.push('please provide your valid email');
}
if(error.length>0){
    res.status(400).json({error:{errorMessage:error}});
}
else{
    try {
        const checkUser =await registerModel.findOne({email:email}).select('+password');
        if(checkUser){
            const matchPassword = await bcrypt.compare(password,checkUser.password);
                
             if(matchPassword){
                const token = jwt.sign({
                    id : checkUser._id,
                    email : checkUser.email,
                    userName : checkUser.userName,
                    image : checkUser.image,
                    registerTime : checkUser.createAt
                },process.env.SECRET,{expiresIn : process.env.TOKEN_EXP});

                const options= {
                    expires : new Date(Date.now() + process.env.COOKIE_EXP*24*60*60*1000)
                }
                
                res.status(200).cookie('authToken',token,options).json({
                    successMessage : 'your Login Successfull',token
                })
               
            }else{
                res.status(400).json({
                    error:{errorMessage:['your password not valid']
                }}); 
            }
        
        }else{
            res.status(400).json({error:{errorMessage:['your email not found']}}); 
        }
       

        
    } catch (error) {
        res.status(500).json({error:{errorMessage:['Internal server error']}}); 
    
   }
    }
}

module.exports.userLogout = (req,res)=>{
    res.status(200).cookie('authToken','').json({
        success : true 
    })
}




