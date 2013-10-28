exports.taggerWithTrigrams = function(words){
    var pre1 = "",
        pre2 = "",
        results = [];

    for(var key in words){
        var word = words[key];

        if(word.length === 0){
            console.warn("Broken: "+word+" @ "+key+" of "+words);
        }

        var last = "";

        if(pre1 !== ""){
            last = results.slice(-1)[0];
        }

        word = exports.tagSingle(pre2, pre1, last, word);
    }
};

exports.tagSingle = function(pre2, pre1, last, word){
    
};