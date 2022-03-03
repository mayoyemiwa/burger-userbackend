require('dotenv').config();
const {v4:uuidv4} = require('uuid');
const bcrypt = require('bcrypt');
const User = require('../model/User');
const UserVerification = require('../model/userVerification');
const nodemailer = require('nodemailer');
const {google} = require('googleapis')
const {OAuth2} = google.auth;


const  {
    MAILING_SERVICE_CLIENT_ID,
    MAILING_SERVICE_CLIENT_SECRET,
    MAILING_SERVICE_REFRESH_TOKEN,
    SENDER_EMAIL_ADDRESS,
    CURRENT_URL,
    OAUTH_PLAYGROUND
} = process.env

const oauth2Client = new OAuth2(
    MAILING_SERVICE_CLIENT_ID,
    MAILING_SERVICE_CLIENT_SECRET,
    MAILING_SERVICE_REFRESH_TOKEN,
    SENDER_EMAIL_ADDRESS,
    OAUTH_PLAYGROUND 
)

oauth2Client.setCredentials({
    refresh_token: MAILING_SERVICE_REFRESH_TOKEN
})
const accessToken = oauth2Client.getAccessToken()
const smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: { 
        type: "OAuth2",
        user: SENDER_EMAIL_ADDRESS,
        clientId :MAILING_SERVICE_CLIENT_ID,
        clientSecret: MAILING_SERVICE_CLIENT_SECRET,
        refreshToken: MAILING_SERVICE_REFRESH_TOKEN,
        accessToken 
    }
})

module.exports.sendVerificationEmail = async({_id, email}, res)=>{
    const currentUrl = CURRENT_URL;
    // const currentUrl = "http://localhost:3000/"
    const uniqueString = uuidv4() + _id;
    const mailOptions = {
        from:SENDER_EMAIL_ADDRESS,
        to:email,
        subject:"Please verify your account",
        html:`<p>Veify your email to complete your signup and login into your account.</><p>This link 
        <b>expires in 6 hours</b>.</p><p>press <a href=${
            currentUrl + '/user/verify/' + _id + '/' + uniqueString
         }>here</a> to proceed</p>`,
    }
    const salt = await bcrypt.genSalt();
    try{
        const uniqueStringHash = await bcrypt.hash(uniqueString, salt) 
        try{
            await UserVerification.create({
                userID:_id, uniqueString:uniqueStringHash, createdAt:Date.now(), expiresAt:Date.now() + 21000000});
            try{
                const result = await smtpTransport.sendMail(mailOptions);
                // console.log('transport', result)
                res.json({status:"PENDING", message:"Signup successfull, check your email to verify"})
            }
            catch(err){
                await User.deleteOne({email})
                await UserVerification.deleteOne({email});
                // console.log('daleted')
                res.json({status:"FAILED", message:"Verification email not sent, check your connection and try again"})
            }
        }
        catch(err){
            res.json({status:"FAILED", message:"Could'nt save email data!" })
        }
    }
    catch(err){
        res.json({status:"FAILED", message:"An error occured while hashing email data!" })
    }
}
module.exports.sendForgetPwdEmail = async({email}, res)=>{
    const currentUrl = CURRENT_URL;
    // const currentUrl = "http://localhost:3000/"
    const mailOptions = {
        from:SENDER_EMAIL_ADDRESS,
        to:email,
        subject:"Change your password",
        html:`<p>Please click the link below to authenticate that this is you trying to change your password.</><p>This link 
        </p><p><b>press.</b><a href=${
            currentUrl + 'api/user/pwdAuth'}>here</a> to proceed</p>`,
    }
            try{
                await smtpTransport.sendMail(mailOptions);
                res.json({
                    status:"PENDING",
                    message:"Verification message sent successfully, check your email to change your password"
                })
            }
            catch(err){
                res.json({
                    status:"FAILED",
                    message:"Verification message sent: Not successfull, please reload to try again"
                })
            }
}

module.exports.handleError = (err) => {
    let errors = {username:'', email:'', pwd:''};


    if(err.message === 'incorrect email'){
        errors.email = 'Please enter a valid email'
        return errors;
    }
    if(err.message === 'incorrect password'){
        errors.pwd = 'Please enter a valid password'
        return errors;
    }

    if(err.message.includes('user validation failed')){
        Object.values(err.errors).forEach(({properties}) => {
            errors[properties.path] = properties.message
        })
        return errors;
    }
    if(err.code === 11000){
        errors.email = 'Email already exist';
        return errors;
    }
}