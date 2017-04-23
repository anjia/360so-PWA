var data = require('./data');

module.exports.issues_get = function(req, res){
	var id = req.params.id;
	res.json(data.issues[id]);
};