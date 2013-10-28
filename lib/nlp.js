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
    //SPLIT INTO PARAGRAPHS
    input = input.split(/(\n\s*)+/g);
    //RUN splitIntoSentences ON EACH PARAGRAPH
    return input.map(function(paragraph){
        return exports.splitIntoSentences(paragraph);
    });
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

    //STEP 4 - SPECIAL CASES
    //    a. ... - not a new sentence
    //    b. [ap].m.\s+[A-Z0-9] - legit end of sentence
    //    c. [ap].m.\s+[a-z] - not end of sentence
        //A
        pattern = new RegExp("["+exports.config.eos+"]{3}", "g");
        input = input.replace(pattern, "...");

        //B
        pattern = new RegExp("([ap])"+exports.config.eos+"m"+exports.config.eos+"([ ]+)([A-Z0-9])", "g");
        input = input.replace(pattern, "$1.m."+exports.config.eos+"$2$3");

        //C
        pattern = new RegExp("([ap])"+exports.config.eos+"m"+exports.config.eos+"([ ]+)([a-z])", "g");
        input = input.replace(pattern, "$1.m.$2$3");

    // Return the sentences as and object
    return input.split(exports.config.eos);
};

exports.splitIntoWords = function(input){
    input = input.replace(/([,\(\)\[\]\:\;\/]|https{0,1}\:\/\/[0-9a-zA-Z\/\:\~\-\.\_\?\%\&\=]*|-{2})/g, " $1 ");
    input = input.replace(/[^0-9a-zA-Z\p{Ll}\p{Lu}\\,\(\)\[\]\;\:\'\\\\\\-\\\/ ]/g, "");
    input = input.split(/\s/g);

    if(input.length > 0 && input[0].length === 0){
        input.shift();
    }

    return input;
};




