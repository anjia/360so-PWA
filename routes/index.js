var express = require('express');
var router = express.Router();
var path = require('path');
var option = { root: path.join(__dirname, '../views') };


/* GET home page. */
router.get('/', function(req, res, next) {
	res.sendFile('index.html', option);
});
router.get('/index.html', function(req, res, next) {
	res.sendFile('index.html', option);
});


// Controller
var controller = require('./../server/server');
router.get('/issues/:id', controller.issues_get);

module.exports = router;