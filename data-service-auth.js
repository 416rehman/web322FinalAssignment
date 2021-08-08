/*** I declare that this assignment is my own work in accordance with
 * Seneca Academic Policy. No part of this assignment has been copied
 * manually or electronically from any other source (including web sites)
 * or distributed to other students. *
 *
 *      Name: Hayaturehman Ahmadzai
 *      Student ID: hahmadzai3
 *      Creation Date: 2021-08-07
 */

const mongoose = require("mongoose")
const bcrypt = require('bcryptjs');

var Schema = mongoose.Schema;

var userSchema = new Schema({
    "userName":  {
        type: String,
        unique: true
    },
    "password": String,
    "email": String,
    "loginHistory": [ { dateTime: Date, userAgent: String } ],
});

let User; // to be defined on new connection (see initialize)

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(process.env.DB_Mongo_URI);
        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
            User = db.model("users", userSchema);
            resolve();
        });
    });
}

module.exports.registerUser = function (userData) {
    return new Promise(function (resolve, reject) {

        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        }

        bcrypt.genSalt(10).then(salt=>bcrypt.hash(userData.password, salt))
            .then(hash=>{
                userData.password = hash;
                let newUser = new User(userData);
                newUser.save((err) => {
                    if(err) {
                        if(err.code == '11000') reject("User Name already taken");
                        reject("There was an error creating the user: " + err);
                    }
                    resolve();
                })
            })
            .catch(err=>{
                return reject("There was an error encrypting the password " + err); // Show any errors that occurred during the process
            });
    })
}

module.exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) {
        User.find({ userName: userData.userName }).exec().then(users=>{
            if (!users.length) reject("Unable to find user: " + userData.userName);
            bcrypt.compare(userData.password, users[0].password).then((result) => {
                if (result) {
                    try {
                        users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                        User.update({userName: users[0].userName},
                            { $set: { loginHistory: users[0].loginHistory } })
                        resolve(users[0]);
                    }
                    catch (e) { reject("There was an error verifying the user: " + e) }
                }
                else reject("Incorrect Password for user: " + userData.userName);
            });
        }).catch(e => {
            reject("Unable to find user: " + userData.userName)
        })
    })
}