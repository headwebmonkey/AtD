exports.config = require("../config.js");
exports.fs = require("fs");


exports.abbr = (function(){
    var abbr = exports.fs.readFileSync("data/rules/abbr.txt").toString();
    abbr = "("+abbr.split("\n").join("|")+")";
    return abbr;
})();

exports.stripHTML = function(input){
    // certain tags (like bold) are replaced by newlines to force AtD
    // to treat them as new sentences.  This is important to make sure
    // they don't carry context information with them
    var replaceArr = {
        "&nbsp;": " ",
        "&quote;":'"',
        "&amp;":'&',
        "&acute;":"\xe9",
        "&egrave;":"\xe8"
    };
    for(var key in replaceArr){
        var pattern = new RegExp(key, "g");
        input = input.replace(pattern, replaceArr[key]);
    }
    input = input.replace(/<[\/]?(p|b|br|span|strong|u|li|em|i|a|h\d|div)[\/]?>/g, "\n"). //REPLACE THESE TAGS WITH NEWLINE
        replace(/<.*?>/g, ""); //REPLACE ALL OTHER TAGS WITH NOTHING ""
    return input;
};

exports.splitByParagraph = function(input){
    return exports.splitIntoSentences(input);
};

exports.splitIntoSentences = function(input){
    //STEP 1 - KILL ALL EXTRA WHITESPACE
    input = input.replace(/\s/g, " ");

    //STEP 2 - Replace all punctuation characters with end-of-sentence marker
    // <punct> [A-Z][0-9] - likely a start of sentence
    input = input.replace(/([!?\.])(\s+\w)/g, exports.config.eos+"$2");

    //STEP 3 - Look for all words that preceed our end-of-sentence marker - invalidate if:
    //    a. number<EOS>number  - means we have a double or something
    //    b. abbreviation<EOS>  - means we have an abbreviation
    //    c. <white space>LETTER<EOS> - potentially an abbreviation (pretty generic)
    // A
    var pattern = new RegExp("([0-9])"+exports.config.eos+"([0-9])", "g");
    input = input.replace(pattern, "$1.$2");

    //B
    pattern = new RegExp("([ ]*)"+exports.abbr+exports.config.eos, "g");
    input = input.replace(pattern, "$1$2.");

    // C
    pattern = new RegExp("([ ]+[A-Z])"+exports.config.eos, "g");
    input = input.replace(pattern, "$1.");

    return input;
};