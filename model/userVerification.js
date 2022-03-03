const mongoose = require('mongoose');

const userVerificationSchema = new mongoose.Schema({
    userID:String,
    uniqueString:String,
    createdAt:Date,
    expiresAt:Date,
});

const UserVerification = mongoose.model('userVerification', userVerificationSchema);

module.exports = UserVerification;