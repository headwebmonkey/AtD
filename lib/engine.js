exports.nlp = require("./nlp.js");

exports.processDocument = function(input){
    //STEP 1 - Split into paragraphs
    return exports.nlp.splitIntoSentences(input);
};