var fs  = require('fs');
var argv = require('minimist')(process.argv.slice(2));
var async = require('async');
var _   = require('underscore');
_.str   = require('underscore.string');

var path = argv.path || '/home/martijn/Project/livind/adl-monitor/adl-frontend/app/';
var find = argv.find || 'ui_';
var outputFileName = argv. output || 'labels.txt';

var options = {
    encoding: 'utf8'
};

var regex = /\"/

var foundStrings = [];

function walkDir(path, callback){
    var results = [];
    fs.readdir(path, function(err, files){
        if(err){
            console.log(err);
            callback(err)
        } else {
            var pending = files.length;
            if(!pending) {
                return callback(null, results);
            }

            //console.log(files)
            files.forEach(function(file){
                if(path.slice(-1) == '/'){
                    file = path + file;
                } else {
                    file = path +'/'+ file;
                }

                //get stat
                fs.stat(file, function(err, stat){
                    if(err){
                        callback(err);
                    }

                    if(stat && stat.isDirectory()){
                        walkDir(file, function(err, res){
                            results = results.concat(res);
                            if(!--pending){
                                callback(null, results);
                            }
                        });
                    } else {
                        results.push(file);
                        if(!--pending){
                            //console.log('done: ', results)
                            callback(null, results);
                        }
                    }
                });
            });            
            
        }
    });
}

function extractFromFile(file, callback){
    var results = [];
    fs.readFile(file, options, function(err, data){
        if(err){
            console.log(err);
            process.exit(1);
        }

        var words = _.str.words(data);
        //console.log(words.length+' results: ', words);
        words.forEach(function(word){
            var parts = _.str.words(word, regex);
            parts.forEach(function(part){
                if(part.substr(0,3) == find){
                    //console.log(part);
                    results.push(part);;
                }                        
            });
        });                
        callback(null, results);
    });
}

//initial call
console.log('path: '+path)
walkDir(path, function(err, fileNames){
    if(err){
        console.log(err);
    } else {
        async.mapSeries(fileNames, extractFromFile, function(err, results){
            results = _.flatten(results);
            results = _.uniq(results);
            results.sort();
            console.log(results.length +' results');

            //write
            var str = '';
            results.forEach(function(label){
                str += label+'\n\r';
            });



            fs.writeFile(outputFileName, str, options, function(err){
                if(err){
                    console.log(err);
                } else {
                    console.log('file written');
                }
            })
            
        });
    }

});