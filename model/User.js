const mongoose = require('mongoose');
const {isEmail} = require('validator');
const bcrypt = require('bcrypt'); 

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required:[true, 'Please Username cannot be empty'],
        minlength:[10, 'Minimum length is 10 characters'],
        maxlength:[30, 'Maximum length is 30 characters']
    },
    email:{
        type:String,
        required: [true, 'Please Email cannot be empty'],
        unique:true,
        lowercase:true,
        validate:[isEmail, 'Please enter a valid email']
    },
    pwd:{
        type:String,
        required:[true, 'Please Password cannot be empty'],
        minlength:[6, 'Minimum length is 10 characters'],
        maxlength:[30, 'Maximum length is 30 characters']

    },
    verified: Boolean
});

userSchema.pre('save', async function(next){
    const salt = await bcrypt.genSalt();
    this.pwd = await bcrypt.hash(this.pwd, salt);
    this.verified = false; 
    next();
});
userSchema.statics.login = async function(email, pwd){
    const user = await this.findOne({email});
    if(user){
        const auth = await bcrypt.compare(pwd, user.pwd);
        if(auth){
            return user;
        }
        throw Error('incorrect password')
    }
    throw Error('incorrect email')

}

const User = mongoose.model('user', userSchema);

module.exports = User;