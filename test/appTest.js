'use strict';
const chai = require('chai');
const expect = require('chai').expect;
const assert = require('chai').assert;
const express = require('express');
const myscript = require('../views/myscript');
const supertest = require('supertest');
chai.use(require('chai-http'));
const server = require('../server.js'); // our server
const date = require('date-and-time');
let now = new Date();
chai.should();
var app = express();
describe('API endpoint /', function() {
    this.timeout(10000); // How long to wait for a response (ms)
    //Test home page
    it('should render home page', function() {
        return chai.request(server)
            .get('/')
            .then(function(res) {
                expect(res).to.have.status(200);
            });
    });
})

describe('API endpoint /shop', function() {
    //Test shop page 
    this.timeout(10000);
    it('should render shop page', function() {
        return chai.request(server)
            .get('/shop')
            .then(function(res) {
                expect(res).to.have.status(200);
            });
    });
})

describe('API endpoint /login', function() {
    it('should render login page', function() {
        return chai.request(server)
            .get('/login')
            .then(function(res) {
                expect(res).to.have.status(200);
            });
    });
})

//Test signup with username unit@test.com
describe('API endpoint /insert', function() {
    it('should signup as unit@test.com ', () => {
        return chai.request(server)
            .post('/insert')
            .send({
                email: "unit@test.com",
                pwd: "Test1234",
            })
            .then(async(res) => {
                expect(res).to.have.status(200);
            })
    });
})


//Test Login with user unit@test.com
describe('API endpoint /insert_login', function() {
    it('should login as unit@test.com and redirect to /shop', () => {
        return chai.request(server)
            .post('/insert_login')
            .send({
                email: "unit@test.com",
                pwd: "Test1234"

            })
            .then(function(res) {
                expect(res).to.have.status(200);
            })
    });
})

describe('API endpoint /my_cart', function() {
    this.timeout(10000);
    myscript.signIn("unit@test.com", "Test1234")
    it('should render my_cart page', function() {
        return chai.request(server)
            .get('/my_cart')
            .then(function(res) {
                expect(res).to.have.status(200);
            });
    });
})


//test getItem
describe('myscript function getItems', function() {
    it('should return true', async() => {
        var len = (await myscript.getItems("unit@test.com")).length
        assert.equal(len, 0)
    });
});

//test addCart
describe('myscript function addCart', function() {
    it('should return true', async() => {
        var item = {
            _id: "001",
            color: "Red",
            name: "Retro Steel",
            path: "images/jordan_retro_steel_red.PNG",
            price: 130,
            type: "Jordan"
        }
        assert.isTrue(await myscript.addCart(item, "unit@test.com"))
    });
});

//test editProfile
describe('myscript function editProfile', function() {
    it('should return true', async() => {

        assert.isTrue(await myscript.editProfile('unit', 'test', '555 seymour', 'male', 'May', '24', '2019', "unit@test.com"))
    })
})

//test getInfo
describe('myscript function getInfo', function() {
    it('should return an object', async() => {
        var info = await myscript.getInfo("unit@test.com");
        assert.isObject(info)
        assert.equal(info.fname, 'unit')
        assert.equal(info.lname, 'test')
        assert.equal(info.address, '555 seymour')
        assert.equal(info.month, 'May')
        assert.equal(info.day, '24')
        assert.equal(info.year, '2019')
    });
});


//test reviewupload
describe('myscript function getInfo', function() {
    it('should return an object', async() => {
        myscript.signIn("unit@test.com", "Test1234")
        let currentdate = date.format(now, 'YYYY/MM/DD HH:mm:ss');
        var status = await myscript.reviewupload('7FrT6hcWt6WD3AzHibkt', currentdate, "Unit Test", "Test", "5", "unit@test.com");
        assert.isTrue(status)
    });
});


//test signOut
describe('API endpoint /signOut', function() {
    this.timeout(10000);
    it('should sign the current user out', function() {
        assert.equal(myscript.signOut(), "Signed out!")
    })
})

//test getItems when no user signed in
describe('myscript function getItems', function() {
    it('should return false', async() => {
        assert.isFalse(await myscript.getItems())
    });
});

//test addCart when no user signed in
describe('myscript function addCart', function() {
    it('should return false', async() => {
        var item = {
            _id: "001",
            color: "Red",
            name: "Retro Steel",
            path: "images/jordan_retro_steel_red.PNG",
            price: 130,
            type: "Jordan"
        }
        assert.isFalse(await myscript.addCart(item))
    });
});


//Test addUser
describe('myscript function adduser', function() {
    it('should return account already exists', async() => {
        var msg = await myscript.adduser("mocha@gmail.com", "Test1234", "Test1234");
        assert.equal(msg, "Account mocha@gmail.com already exists")
    });
})



describe('myscript function signIn', function() {
    it('should return Invalid account', async() => {
        var msg = await myscript.signIn("mochatest@gmail.com", "Test1234");
        assert.equal(msg, "Invalid account")
    });
})

describe('myscript function signIn', function() {
    it('should return Incorrect password. Remaining Attempts:', async() => {
        var msg = await myscript.signIn("unit@test.com", "123");
        assert.equal(msg, "Incorrect Password. Remaining Attempts: undefined")
    });
});

//Test deleteProfile
describe('myscript function deleteProfile', function() {
    it('should return true ', async() => {
        assert.isTrue(await myscript.deleteProfile("unit@test.com"))
    });
})