exports.nlp = require("./nlp.js");
exports.tagger = require("./tagger.js");

exports.processDocument = function(input){
    //STEP 1 - Split into paragraphs
    var paragraphs = exports.nlp.splitByParagraph(input);
    for(var key in paragraphs){
        for(var id in paragraphs[key]){
            if(paragraphs[key][id] !== ""){
                //NOW PROCESS THE SENTENCE
                return exports.processSentence(paragraphs[key][id]);
            }
        }
    }
};

exports.processSentence = function(sentence){
    var list = exports.nlp.splitIntoWords(sentence);
    var words = list.slice(0);
    var tags = exports.tagger.taggerWithTrigrams(list);

    return tags;
};