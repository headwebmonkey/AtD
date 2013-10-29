exports.spell = require("spell");
exports.fs = require("fs");
exports.config = require("../config.js");
exports.dict = exports.spell.spell();

exports.walk = function (dir, done) {
    exports.fs.readdir(dir, function (error, list) {
        if (error) {
            return done(error);
        }
 
        var i = 0;
 
        (function next () {
            var file = list[i++];
 
            if (!file) {
                return done(null);
            }
            
            file = dir + '/' + file;
            
            exports.fs.stat(file, function (error, stat) {
        
                if (stat && stat.isDirectory()) {
                    walk(file, function (error) {
                        next();
                    });
                } else {
                    // do stuff to file here
                    exports.addFileToDict(file);
 
 
                    next();
                }
            });
        })();
    });
};

exports.checkDictionary = function(){
    var corpus = exports.dict.export().corpus;
    if(Object.keys(corpus).length === 0){
        for(var key in exports.config.spellingDataFolders){
            exports.walk("data/"+exports.config.spellingDataFolders[key], function(done){});
        }
    }
};

exports.addFileToDict = function(file){
    if(file.indexOf("txt") !== -1){
        //console.log("Loading File Into Dictionary: "+file);
        var fileContents = exports.fs.readFileSync(file).toString();
        exports.dict.load(fileContents, { reset: false });
    }
};