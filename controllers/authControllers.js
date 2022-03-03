const User = require('../model/User');
const ControllersFunction = require('../controllerFunction/controllersFunction')
require('dotenv').config();
const path = require('path')
const UserVerification = require('../model/userVerification')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')



const maxAge = 60 * 60;
const { SECRET } = process.env
const createToken = (value) => {
    return jwt.sign({value}, SECRET, {expiresIn:maxAge}) 
}

module.exports.verified_get = (req, res)=> {
    res.sendFile(path.join(__dirname, '../views/verified.html',))
}
module.exports.verify_get = async(req, res)=>{
    const {userID, uniqueString} = req.params;
    try{
        const result = await UserVerification.find({userID})
        if(result.length > 0){
            const {expiresAt} = result[0];
            const uniqueStringHash = result[0].uniqueString;
            if(expiresAt < Date.now()){
                try{
                    await UserVerification.deleteOne({userID})
                    try{
                        await User.deleteOne({_id:userID})
                        let message = "The link as expired. Please sign up again"
                        res.redirect(`/api/user/verified/?error=true&message=${message}`)
                    }
                    catch(err){
                        let message = "Clearing user id with expired uniqueString failed"
                        res.redirect(`/api/user/verified/?error=true&message=${message}`)
                    }
                }
                catch(err){
                    console.log(err)
                    let message = "An error ocurred while clearing user verification record"
                    res.redirect(`/api/user/verified/?error=true&message=${message}`)
                }
            }else{
                try{
                    const result = await bcrypt.compare(uniqueString, uniqueStringHash);
                    if(result){
                        try{
                           await User.updateOne({_id:userID}, {verified:true}) 
                            try{
                                const del = await UserVerification.deleteOne({userID})
                                  if(del){
                                    res.sendFile(path.join(__dirname, "./../views/verified.html"))
                                    }else{
                                        console.log('error')
                                    }
                                }
                            catch(error){
                                let message = "An error ocurred while finalizing successful record."
                                res.redirect(`/api/user/verified/?error=true&message=${message}`)
                            }
                        }
                        catch(err){
                            let message = "An error ocurred while updating user record to show verified."
                            res.redirect(`/api/user/verified/?error=true&message=${message}`)
                        }
                    }else{
                        let message = "Invalid verification data passed. Please check inbox."
                        res.redirect(`/api/user/verified/?error=true&message=${message}`)
                    }
                }
                catch(err){
                    await User.deleteOne({_id:userID})
                    await UserVerification.deleteOne({userID})
                    let message = "An error ocurred while comparing unique string."
                    res.redirect(`/api/user/verified/?error=true&message=${message}`)
                }
            }
        }else{
            let message = "Account record does not exist or has been verified already. Please sign in or log in"
            res.redirect(`/api/user/verified/?error=true&message=${message}`)
        }
    }
    catch(err){
        console.log('lookfor', err)
        let message = "An error ocurred while checking for existing user verification record"
        res.redirect(`/api/user/verified/?error=true&message=${message}`)
    }
}
module.exports.redirect_get = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/pwdAuthenticate.html',))
}
module.exports.auth_get = (req, res) => {
    res.redirect('/api/user/pwdredirect')
}
module.exports.signup_post = async(req, res) => {
    try{
        const user = await User.create(req.body.signupValues)
       
        try{
            await ControllersFunction.sendVerificationEmail(user, res);
        }
        catch(err){
            res.status(400).json(err)
        }
    }
    catch(err){
        const errors = await ControllersFunction.handleError(err);
        res.status(400).json(errors)            
    }
}
module.exports.login_post = async (req, res) => { 
        const {email, pwd} = req.body.loginValues;
        console.log('login-session:', req.session.token)
        try{
            const user = await User.login(email, pwd);
            const token = createToken(user);
            if(req.session.token) {
                console.log('elichi')
                return res.status(200).json({verify:true})
            }else{
                console.log('tomoe')
                req.session.token = token
                res.status(200).json({user:user.email})
            }
        }
        catch(err){
            console.log(err)
            const errors = await ControllersFunction.handleError(err);
            res.status(400).json(errors)
        }
    }  
module.exports.orders_get = async(req, res) => {
    const token = req.session.token
    // console.log(req.session)
    // console.log(token)
    if(!token) return res.json({verify: false})            
        return res.json({verify:true})
}  
module.exports.logout_get = (req, res) => {
    res.clearCookie('jwt')
    res.json({data:true})
  }
module.exports.forgetpwd_post = async(req, res) => {
    const email = req.body.email;
        try{
            const user = await User.findOne({email});
            if(user){
                try{
                    ControllersFunction.sendForgetPwdEmail(user, res)
                }
                catch(error){
                    res.status(400).json(error)
                }
            }else{
                res.status(404).json("Email not found. Please sign up");
            }
}
catch(error){
    res.status(404).json(error);
}
}
module.exports.pwdReset_post = async(req, res) => {
    if(req.session.isAuthenticated){
        const {email, pwd} = req.body;
        const salt = await bcrypt.genSalt();
            try{
                await User.findOne({email})
                try{
                    const newPwd = await bcrypt.hash(pwd, salt)
                    const updated = await User.updateOne({email}, {pwd:newPwd});
                        if(updated){
                            res.json("Updated successfully")
                            return;
                        }
                }
                catch(error){
                    res.status(400).json("'Error:' unable to update")
                }
            }
            catch(error){
                res.status(404).json("user not found")
            }
    }else(
        res.status(400).json("!!! The resource you're trying to access is out of reach")
    )
}
module.exports.pwdAuthenticate_get = (req, res) => {
    req.session.isAuthenticated = true
    // console.log(req.session.isAuthenticated)
    res.redirect('api/pwdreset')
}
module.exports.load_get = async (req, res) =>{
    const token = req.session.token
    if(token){
        await jwt.verify(token, SECRET, (err, decodedToken) => {
            if(!err) return res.json({username: decodedToken.value.username})
            })
    }
}