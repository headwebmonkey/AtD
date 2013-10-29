exports.nlp = require("./nlp.js");
exports.tagger = require("./tagger.js");

exports.spell = require('./spell.js');

exports.processDocument = function(input, checkSpelling){
    //STEP 1 - Split into paragraphs
    var paragraphs = exports.nlp.splitByParagraph(input);
    for(var key in paragraphs){
        for(var id in paragraphs[key]){
            if(paragraphs[key][id] !== ""){
                //NOW PROCESS THE SENTENCE
                return exports.processSentence(paragraphs[key][id], checkSpelling);
            }
        }
    }
};

exports.processSentence = function(sentence, checkSpelling){
    var results = [];
    var list = exports.nlp.splitIntoWords(sentence);
    var words = list.slice(0);

    if(checkSpelling){
        results = results.concat(exports.checkSentenceSpelling(words));
    }else{
        results = results.concat(exports.checkRepeatedWords(words));
    }

    //Run the various checkers against the sentence
    // var fileContents = require("fs").readFileSync("models/rules.bin").toString();

    // console.log(fileContents);

    var fs = require('fs');
    var Buffer = require('buffer').Buffer;
    var constants = require('constants');

    fs.readFile("models/rules.bin", {encoding:'base64'},function(err, data){
            console.log(data);
        });

    // fs.open("models/rules.bin", 'r', function(status, fd) {
    //     if (status) {
    //         console.log(status.message);
    //         return;
    //     }
    //     var buffer = new Buffer(100);
    //     // fs.read(fd, buffer, 0, 100, 0, function(err, num) {
    //     //     console.log(buffer.toString('utf-8', 0, num));
    //     // });
    //     fs.readFile("models/rules.bin", {encoding:'utf-8'},function(err, data){
    //         console.log(data);
    //     });
    // });


    return results;
};

exports.checkSentenceSpelling = function(words){
    var previous = "",
        next = "",
        dict = exports.spell.dict,
        results = [];

    for(var key in words){
        if(words[parseInt(key) + 1] !== undefined){
            next = words[parseInt(key) + 1];
        }else{
            next = "";
        }
        var word = words[key];
        var suggestions = dict.suggest(word);

        if(Object.keys(suggestions).length !== 0 && !exports.suggestionContains(word.toLowerCase(), suggestions)){
            if(word[0] == "'"){
                previous = "";
            }
            word = exports.fixWord(word);
            suggestions = dict.suggest(word);
            if(exports.suggestionContains(word.toLowerCase(), suggestions) || word.substring(0, 6) == "http//" || word.substring(0, 7) == "https//"){
                // make sure previous doesn't get set to the modified $word in these cases
                // 1. if the word was changed then the previous tag won't match up
                // 2. if the word is a URL then it won't match because my NLP stack mangled the : and .'s in the string
                word = "";
            }else if(
                //word.match(/\d+(\'{0,1}s{0,1}|[aApP][mM])/g) ||
                word.match(/([0-9][x-][0-9])|(\$[0-9]+[.][0-9][0-9])|([0-9]+(KB|GB|MB|TB))/g)
            ){
                //skip time and year values, ranges like 9-5, dimensions like 2x4, monetary values $1.99, and disk sizes like 3GB
            }else if(word.match(/[0-9]*(st|nd|rd|th)/g)){
                // Handle Numbers
                if (!word.match(/^((1st)|(2nd)|(3rd)|(4th)|(5th)|(6th)|(7th)|(8th)|(9th)|(0th))/g) && !word.match(/1[0-9]*th/g)){
                    var number = word.match(/(st|nd|rd|th)/g);
                    number = word.replace(number[0], "");
                    var check = number % 10;

                    if(number >= 11 && number < 20){
                        suggestions = number+"th";
                    }else if(check == 1){
                        suggestions = number+"st";
                    }else if(check == 2){
                        suggestions = number+"nd";
                    }else if(check == 3){
                        suggestions = number+"rd";
                    }else{
                        suggestions = number+"th";
                    }

                    res = {
                        word: suggestions,
                        rule: "Spelling",
                        style: "red",
                        category: "Spelling",
                        filter: "none"
                    };
                    results.push(exports.filterSuggestion(res));
                }
            }else if(word.slice(-2) == "'s"){
                //WORD ENDS WITH 's
                var word2 = word.substring(0, (word.length - 2));
                word2Suggestions = dict.suggest(word2);

                if(Object.keys(word2Suggestions).length === 0 || exports.suggestionContains(word2.toLowerCase(), word2Suggestions)){
                    //word2 is in dictionary
                    if(word2.slice(-1) == "s" && (word2[0] == word2[0].toLowerCase())){
                        //The last letter of word2 is 's' AND the first letter of word2 is lowercase
                        res = {
                            word: word2+"'",
                            rule: "Possessive Ending",
                            style: "red",
                            category: "Spelling",
                            filter: "none",
                            view: "view/rules/empty.slp",
                            info: "none"
                        };
                        results.push(exports.filterSuggestion(res));
                    }
                }
            }else{
                //THE WORD IS MIS-SPELLED
                res = {
                    word: suggestions,
                    rule: "Spelling",
                    style: "red",
                    category: "Spelling",
                    filter: "none"
                };
                results.push(exports.filterSuggestion(res));
            }
        }else if(word.match(/\w+(-\w+)+/g)){
            //handles hyphenated words (twenty-one)
            var tempx = word.split("-");
            var tempw = [];
            for(key in tempx){
                //WE WANT TO KEEP MISSPELLED WORDS
                if(!IsNumeric(tempx[key])){
                    suggestions = dict.suggest(tempx[key]);
                    if(Object.keys(suggestions).length !== 0 && !exports.suggestionContains(word.toLowerCase(), suggestions)){
                        tempw.push(tempx[key]);
                    }
                }
            }
            if(tempw.length === 0){
                //if none of the words are mispelled then suggest all the words as is
                if(word.match(/.*[ly]-.*/)){
                    // If an adverb ends in -ly, you shouldn't use a hyphen between it and the adjective it modifies.
                    res = {
                        word: tempx.join(" "),
                        rule: "No Hyphen",
                        style: "red",
                        category: "Spelling",
                        info: "none",
                        filter: "none"
                    };
                    results.push(exports.filterSuggestion(res));
                }else if(
                    !word.match(/.*-based/) &&
                    !word.match(/over-.*/) &&
                    !word.match(/pre-.*/) &&
                    !word.match(/anti-.*/) &&
                    !word.match(/non-.*/) &&
                    !word.match(/.*-sharing/)
                ){
                    res = {
                        word: tempx.join(" "),
                        rule: "Spelling",
                        style: "red",
                        category: "Spelling",
                        info: "none",
                        filter: "none"
                    };
                    //For now, we are not going to flag hyphenated words as misspelled... wait until we have a better scheme
                    //results.push(exports.filterSuggestion(res));
                }
            }else{
                // Words are misspelled do normal flagging
                for(key in tempw){
                    suggestions = dict.suggest(tempw[key]);
                    res = {
                        word: suggestions,
                        rule: "Spelling",
                        style: "red",
                        category: "Spelling",
                        filter: "none"
                    };
                    results.push(exports.filterSuggestion(res));
                }
            }
        }else if(word.match(/(,)|(-)|(\()|(\))|(\[)|(\])|(\:)|(;)|(\/)|(-)/)){
            // TinyMCE isn't aware of commas so make the previous word ""
            word = "";
        }else if(word == next && word != 'Boing' && word != "Johnson" && word != "Mahi"){
            res = {
                word: word,
                rule: "Repeated Word",
                style: "green",
                category: "Grammar",
                filter: "none",
                info: "none"
            };
            results.push(exports.filterSuggestion(res));
        }

        previous = word;
    }

    return results;
};

exports.checkRepeatedWords = function(words){
    var previous = "",
        next = "",
        results = [];

    for(var key in words){
        if(words[parseInt(key) + 1] !== undefined){
            next = words[parseInt(key) + 1];
        }else{
            next = "";
        }
        var word = words[key];

        if(word.match(/(,)|(-)|(\()|(\))|(\[)|(\])|(\:)|(;)|(\/)|(-)/)){
            // TinyMCE isn't aware of commas so make the previous word ""
            word = "";
        }else if(word == next && word != 'Boing' && word != "Johnson" && word != "Mahi"){
            res = {
                word: word,
                rule: "Repeated Word",
                style: "green",
                category: "Grammar",
                filter: "none",
                info: "none"
            };
            results.push(exports.filterSuggestion(res));
        }

        previous = word;
    }

    return results;
};

exports.suggestionContains = function(a, obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop) && obj[prop].word === a) {
            return true;
        }
    }
    return false;
};

exports.filterSuggestion = function(rule, word, previous){
    var error = {};
    error[4] = exports.suggestions(rule.word);

    return error;
};

exports.suggestions = function(suggestions){
    var ret = [];
    if(typeof suggestions !== "string"){
        for(var key in suggestions){
            ret.push(suggestions[key].word);
        }
    }else{
        ret.push(suggestions);
    }
    return ret;
};

exports.fixWord = function(word){
    if(word.length > 0){
        if(word[0] == "'"){
            return exports.fixWord(word.substr(1));
        }
        if(word[word.length] == "'"){
            return exports.fixWord(word.substr(0, (word.length - 1)));
        }
    }
    // return word.replace(/[\W&&[^\'-\/\p{Ll}\p{Lu}]+/g, "");
    return word;
};

