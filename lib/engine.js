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
    }

    return results;
};

exports.checkSentenceSpelling = function(words){
    var previous = "",
        next = "",
        dict = exports.spell.dict,
        results = [];

    for(var key in words){
        var word = words[key];
        var suggestions = dict.suggest(word);

        if(Object.keys(suggestions).length !== 0 && !exports.suggestionContains(word.toLowerCase(), suggestions)){
            if(word[0] = "'"){
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
                word.match(/\d+(\'{0,1}s{0,1}|[aApP][mM])/g) ||
                word.match(/(\d+[-\/|x]\d+)+/g) ||
                word.match(/\\${0,1}-{0,1}[0-9,]*(\\.\d+){0,1}(x|[MGT]{0,1}Hz|k|K|GB|TB|MB|KB|M|MM|[mkc]m|m){0,1}/g)
            ){
                
            }


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

    }

    return results;
};

exports.suggestionContains = function(a, obj) {
    for(var prop in obj) {
        console.log(obj[prop].word+" == "+a);
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
    for(var key in suggestions){
        ret.push(suggestions[key].word);
    }
    return ret;
};

exports.fixWord = function(word){
    if(word.length > 0){
        if(word[0] == "'"){
            return exports.fixWord(word.substr(1));
        }
        if(word[word.length - 1] == "'"){
            return exports.fixWord(word.substr(0, (word.length - 1)));
        }
    }
    return word.replace(/[\W&&[^\'-\/\p{Ll}\p{Lu}]+/g, "");
};

