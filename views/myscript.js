// Initialize Firebase
const firebase = require('firebase/app');
require('firebase/firestore');
require('firebase/auth');

var config = {
    apiKey: "AIzaSyBRh1eH7USRE5WQoQA8MWJ1x1ocJfDd_BY",
    authDomain: "group-12-acit-2911.firebaseapp.com",
    databaseURL: "https://group-12-acit-2911.firebaseio.com",
    projectId: "group-12-acit-2911",
    storageBucket: "group-12-acit-2911.appspot.com",
    messagingSenderId: "734569697851"
};
firebase.initializeApp(config);
var firebasedb = firebase.firestore();


//signup
var adduser = async(email, pwd) => {
    var msg = "";
    var user = await firebasedb.collection('Account').doc(email).get();
    if (user.data() != null) {
        msg = `Account ${email} already exists`
    } else {
        firebasedb.collection(`Account`).doc(email).set({
            email: email,
            pwd: pwd,
            shoes: [],
        });
        msg = `Account ${email} created`;
    }
    firebase.auth().createUserWithEmailAndPassword(email, pwd)
        .catch(function(error) {
            // Handle Errors here
            var errorCode = error.code;
            var errorMessage = error.message;
            // ...
        });

    return msg
};


var signIn = async(email, password, attempts) => {
    //console.log("Signing In");
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
    });
    var msg = "";
    var user = await firebasedb.collection(`Account`).doc(email).get();
    if (user.data() == null) {
        msg = "Invalid account"
    } else if (password != user.data().pwd) {
        msg = `Incorrect Password. Remaining Attempts: ${attempts}`
    }
    return msg
};

function signOut() {
    firebase.auth().signOut().then(function() {}).catch(function(error) {});
    return 'Signed out!'
}


function uploadImg(e) {
    var file = e.target.files[0];
    firebase.storage().ref('profile/' + file.name).put(file);
}

function getImageForPath(p, g) {
    var holder = document.getElementById(g);
    var storageRef = firebase.storage().ref();
    var spaceRef = storageRef.child(p);
    storageRef.child(p).getDownloadURL().then(function(url) {
        var fullurl = url;
        //console.log(fullurl);
        holder.src = fullurl;
    }).catch(function(error) {
        //catch error here
    });
}


var getItems = async(email) => {
    let user = await firebase.auth().currentUser;
    if (user) {
        var cur_user = await firebasedb.collection(`Account`).doc(email).get();
        return cur_user.data().shoes
    } else {
        return false
    }
};

var addCart = async(item, email) => {
    let user = await firebase.auth().currentUser;
    if (user) {
        var cur_user = await firebasedb.collection(`Account`).doc(email).get();
        item["_id"] = cur_user.data().shoes.length.toString();
        var update_obj = {
            shoes: cur_user.data().shoes
        };
        // console.log(cart.data().shoes["0"])
        update_obj["shoes"].push(item);
        firebasedb.collection(`Account`).doc(email).update(update_obj);

        return true
    } else {
        return false
    }
};



var removeItem = async(id, response, email) => {
    let user = await firebase.auth().currentUser;
    if (user) {
        var cur_user = await firebasedb.collection(`Account`).doc(email).get();
        cart_list = cur_user.data().shoes;
        for (var i = 0; i < cart_list.length; i++) {
            if (cart_list[i]._id == id) {
                cart_list.splice(i, 1);
            }
        }
        var update_obj = {
            shoes: cart_list
        };
        firebasedb.collection(`Account`).doc(email).update(update_obj);
        response.status(201).render('my_cart', {
            products: cart_list,
            user: true
        });
        return true
    } else {
        return false
    }

};

var changePass = async(curr_pass, new_pass, confirm_pass, email) => {
    let msg = "";
    let docRef = await firebasedb.collection(`Account`).doc(email);
    let user = await firebasedb.collection(`Account`).doc(email).get();
    if (user.data() !== null) {
        if (curr_pass == user.data().pwd) {
            if (confirm_pass == new_pass) {
                msg = 'Password has been changed';
                docRef.update({
                    pwd: new_pass
                });
            } else {
                msg = 'Confirm Password does not equal New password'
            }
        } else {
            msg = 'Wrong Current Password'
        }
    } else {
        msg = 'Invalid Account';
    }
    return msg
}

var editProfile = async(fname, lname, address, gender, month, day, year, email) => {
    let user = await firebase.auth().currentUser;
    if (user) {
        firebasedb.collection(`Account`).doc(email).update({
            fname: fname,
            lname: lname,
            address: address,
            gender: gender,
            month: month,
            day: day,
            year: year
        });
        return true
    } else {
        return false
    }
};

var deleteProfile = async(email) => {
    // let user = await firebase.auth().currentUser;
    let docRef = await firebasedb.collection(`Account`).doc(email);
    let user = await firebasedb.collection(`Account`).doc(email).get();

    if (user.data() !== null) {
        let user = await firebasedb.collection(`Account`).doc(email).delete();
        return true
    } else {
        return false
    }
};

var reviewupload = async(item, date, title, body, stars) => {
    let user = await firebase.auth().currentUser;
    if (user) {
        var cur_shoes = await firebasedb.collection(`Shoes`).doc(item).get();
        var update_obj = {
            reviews: cur_shoes.data().reviews
        };
        // console.log(cart.data().shoes["0"])
        update_obj["reviews"].push({
            username: `${user.email}`,
            title: `${title}`,
            review: `${body}`,
            timestamp: `${date}`,
            stars: stars
        });
        firebasedb.collection(`Shoes`).doc(item).update(update_obj);
        return true
    } else {
        return 'User not functioning'
    }
};

var getInfo = async(email) => {
    let user = await firebase.auth().currentUser;
    if (user) {
        info = {};
        var cur_user = await firebasedb.collection(`Account`).doc(email).get();
        info["fname"] = cur_user.data().fname;
        info["lname"] = cur_user.data().lname;
        info["address"] = cur_user.data().address;
        info["gender"] = cur_user.data().gender;
        info["month"] = cur_user.data().month;
        info["day"] = cur_user.data().day;
        info["year"] = cur_user.data().year;
        return info
    } else {
        return false
    }
};


module.exports = {
    adduser,
    signIn,
    signOut,
    addCart,
    getItems,
    removeItem,
    editProfile,
    getInfo,
    reviewupload,
    deleteProfile,
    changePass
};