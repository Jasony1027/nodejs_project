const express = require('express');
const session = require('express-session');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
//firebase
const firebase = require('firebase/app');
let date = require('date-and-time');
let now = new Date();
require('firebase/firestore');
require('firebase/auth');
const myscript = require('./views/myscript');
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');
var serviceAccount = require('./group-12-acit-2911-firebase-adminsdk-440z7-f264be7e57');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


var port = process.env.PORT || 8080;
var app = express();

app.use(expressValidator());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: 'krunal',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 600000
    }
}));

app.post('/review', async(request, response) => {
    let id = request.body.itemid;
    if (request.session.email) {
        response.locals.user = true;
        response.render('review.hbs', {
            id: id
        })
    }
});


//Needed to use partials folder
hbs.registerPartials(__dirname + '/views/partials');

hbs.registerHelper('getStars', (stars) => {
    var stars_array = [];
    for (var i = 0; i < parseInt(stars); i++) {
        stars_array.push("&#11088;")
    }
    return stars_array
});

//Helpers
hbs.registerHelper('getCurrentYear', () => {
    return new Date().getFullYear();
});


//Helpers End
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/views'));

app.get('/', (request, response) => {

    response.status(200).render('home.hbs', {
        title: "AJZ Shoe shop",
        message: `Welcome to AJZ Shoe shop`,
        user: request.session.email
    })


});

app.get('/my_cart', async(request, response) => {
    if (request.session.email) {
        var email = request.session.email
        response.status(200).render('my_cart', {
            products: await myscript.getItems(email),
            user: request.session.email
        })
    } else {
        response.render('login.hbs', {
            message: 'Please Log In to see your cart.'
        })
    }
});

//
//Shop page
app.get('/shop', async(request, response) => {
    //firebase

    var db = admin.firestore();
    var productChunks = [];
    var chunkSize = 3;
    var shoes = [];
    var snapshot = await db.collection('Shoes').get();
    snapshot.forEach(async(doc) => {
        shoes.push(doc.data())
    });
    for (var i = 0; i < shoes.length; i += chunkSize) {
        productChunks.push(shoes.slice(i, i + chunkSize));
    }
    response.status(200).render('shop.hbs', {
        products: productChunks,
        user: request.session.email
    })
});



//
//Shop page end

// Edit Profile Page
app.get('/profile', async(request, response) => {

    if (request.session.email) {
        var email = request.session.email
        var info = await myscript.getInfo(email);
        response.render('profile.hbs', {
            fname: info.fname,
            lname: info.lname,
            address: info.address,
            gender: info.gender,
            month: info.month,
            day: info.day,
            year: info.year,
            user: request.session.email
        });
    } else {
        response.render('login.hbs', {
            message: 'Please Log In to see your profile'
        })
    }

});

app.get('/login', (request, response) => {
    response.status(200).render('login.hbs', { errors: request.session.errors });
    request.session.errors = null;
});

app.get('/insert', (request, response) => {
    response.status(200).render('sign_up.hbs', {
        message: null,
    })
});

app.get('/logout', (request, response) => {
    request.session.destroy((err) => {
        if (err) {
            console.log(err)
        } else {
            myscript.signOut();
            response.status(304).redirect('/')
        }
    });
});

app.get('/popup', (request, response) => {
    response.status(200).render('popup.hbs')
});


app.post('/insert', async(request, response) => {
    var email = request.body.email;
    var pwd = request.body.pwd;
    var msg = await myscript.adduser(email, pwd);
    if (msg === `Account ${email} created`) {
        var signInmsg = await myscript.signIn(email, pwd);
        if (signInmsg === "") {
            let sess = request.session;
            sess.email = request.body.email;
            response.redirect('/shop')
        } else {
            response.render('login.hbs', {
                message: signInmsg
            })
        }
    } else {
        response.status(201).render('sign_up.hbs', {
            message: msg
        })
    }
});


const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 2 mins
    max: 5, // number of attempts
    onLimitReached: function(req, res, options) {
        let date = new Date();
        req.rateLimit.resetTime = add_minutes(date, 5);
    },
    handler: function(req, res) { // renders the login.hbs file with the message if it goes over the max attempts
        res.render('login.hbs', {
            message: `Too many failed login attempts. Try again at ${getTimeStr(req.rateLimit.resetTime)}`
        })
    }
});

function add_minutes(dt, min) {
    return new Date(dt.getTime() + min * 60000);
}

function getTimeStr(DTString) {
    var dt = DTString;
    var t = dt.toLocaleTimeString();
    t = t.replace(/\u200E/g, '');
    t = t.replace(/^([^\d]*\d{1,2}:\d{1,2}):\d{1,2}([^\d]*)$/, '$1$2');
    var result = t;
    return result;
}

app.post('/insert_login', loginLimiter, async(request, response) => {
    var email = request.body.email;
    var pwd = request.body.pwd;
    var atmpt = request.rateLimit.remaining;
    var msg = await myscript.signIn(email, pwd, atmpt);
    if (msg === "") {
        let sess = request.session;
        sess.email = email;
        response.redirect('/shop')
    } else {
        response.render('login.hbs', {
            message: msg,
        })
    }
});


app.get('/404', (request, response) => {
    response.status(404).render('404', {
        error: "Page not found"
    })
});


//Route to add to cart
app.post('/add-to-cart', async(request, response) => {
    if (request.session.email) {
        var email = request.session.email
        var db = admin.firestore();
        var snapshot = await db.collection('Shoes').get();
        snapshot.forEach((doc) => {
            if (doc.data()._id === request.body._id) {
                myscript.addCart(doc.data(), email)
                response.status(304).redirect('/shop');
            }
        });
    }
});



app.post('/delete-item', (request, response) => {
    if (request.session.email) {
        var email = request.session.email
        myscript.removeItem(request.body._id, response, email);
    } else {
        response.render('login.hbs', {
            message: 'Please Log In to delete items from cart.'
        })
    }
});

app.post('/edit-profile', async(request, response) => {
    if (request.session.email) {
        var email = request.session.email
        var fname = request.body.first_name;
        var lname = request.body.last_name;
        var address = request.body.address;
        var gender = request.body.gender;
        var month = request.body.month;
        var day = request.body.day;
        var year = request.body.year;

        await myscript.editProfile(fname, lname, address, gender, month, day, year, email);
        response.redirect('/profile')
    } else {
        response.render('login.hbs', {
            message: 'Please Log In to edit profile.'
        })
    }
});

app.get('/change-pass', (request, response) => {
    if (request.session.email) {
        response.locals.user = true;
        response.render('change_pass.hbs', {
            user: request.session.email
        })
    } else {
        response.render('login.hbs', {
            message: 'Please Login to change password'
        })
    }
});

app.post('/change-password', async(request, response) => {
    if (request.session.email) {
        let email = request.session.email
        let current_pass = request.body.curr_pass;
        let new_password = request.body.new_pass;
        let confirm_password = request.body.confirm_pass;
        let msg = await myscript.changePass(current_pass, new_password, confirm_password, email);
        if (msg === '') {
            response.render('change_pass.hbs', {
                message: 'Password has been changed',
                user: request.session.email,
                err: false
            });
        } else {
            response.render('change_pass.hbs', {
                message: msg,
                user: request.session.email,
                err: true
            });

        }
    }
});

app.post('/delete-profile', (request, response) => {

    if (request.session.email) {
        var email = request.session.email
        myscript.deleteProfile(email);
        myscript.signOut();
        request.session.destroy((err) => {
            if (err) {
                console.log('Error: ' + err)
            } else {
                response.status(304).redirect('/');
                console.log(request.session)
            }
        })
    } else {
        response.render('login.hbs', {
            message: 'Please Log In to delete account'
        })
    }

});

//Route to add review
app.post('/add-review', async(request, response) => {
    if (request.session.email) {
        let email = request.session.email
        let currentdate = date.format(now, 'YYYY/MM/DD HH:mm:ss');
        var db = admin.firestore();
        var title = request.body.title;
        var body = request.body.body;
        var stars = request.body.stars;
        var snapshot = await db.collection('Shoes').get();
        snapshot.forEach((doc) => {
            if (doc.data()._id == request.body._id) {
                myscript.reviewupload(doc.id, currentdate, title, body, stars, email)
            } else {}
        });
        response.redirect('/shop')
    } else {
        response.rename('login.hbs', {
            message: 'Please Log In to add reviews.'
        })
    }
});

app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});

module.exports = app;