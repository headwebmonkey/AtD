exports.nlp = require("../lib/nlp.js");
exports.engine = require("../lib/engine.js");

exports.index = function(req, res){
    res.send(200, "AtD is running!");
};

exports.checkDocument = function(req, res){
    // STEP 1 - STRIP HTML:
    var input = exports.nlp.stripHTML("Helo 11st he's boys's the the World! Kody J. Peterson!\nHello! 1.00 is Due! Mr. Kody");
    //STEP 2 - PROCESS DOCUMENT
    res.send(exports.engine.processDocument(input, true));
};