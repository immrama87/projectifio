var through = require('through2');
const { StringDecoder } = require('string_decoder');

var HtmlProcessor = (function(){
  var manifestStart = String("<!--BEGIN-MANIFEST");
  var manifestEnd = String("<!--END-MANIFEST-->");
  var manifestJSRE = /src=\"(.*.js)\"/g;
  var manifestCSSRE = /href=\"(.*.css|.*.scss)\"/g;

  var manifests = {
    "js": {},
    "css": {},
    "scss": {}
  };

  return {
    write: function(){
      return through.obj(function(file, encoding, next){
        var decoder = new StringDecoder(encoding);
        var contents = decoder.write(file.contents);

        while(contents.indexOf(manifestStart) > -1){
          var start = contents.indexOf(manifestStart);
          var end = contents.indexOf(manifestEnd, start);

          var startDec = start + manifestStart.length;
          endDec = contents.indexOf("-->", startDec);
          dec = contents.substring(startDec, endDec).trim().split(" ");
          dec[0] = dec[0].toLowerCase();
          endDec = endDec + ("-->").length;

          var manifestContents = contents.substring(endDec, end);
          end += manifestEnd.length;

          var replace = "";

          if(manifests.hasOwnProperty(dec[0])){
            if(!manifests[dec[0]].hasOwnProperty(dec[1])){
              var fileList = [];
              if(dec[0] == "js"){
                var match = manifestJSRE.exec(manifestContents);
                while(match != null){
                  fileList.push(match[1]);
                  match = manifestJSRE.exec(manifestContents);
                }
                manifests["js"][dec[1]] = fileList;
                replace = "<script type=\"application/javascript\" src=\"js/" + dec[1] + ".min.js\"></script>";
              }
              else {
                var match = manifestCSSRE.exec(manifestContents);
                var scss = [];
                while(match != null){
                  if(match[1].indexOf(".scss") > -1){
                    scss.push(match[1]);
                    fileList.push(match[1].replace(".scss", ".css"));
                  }
                  else {
                    fileList.push(match[1]);
                  }

                  match = manifestCSSRE.exec(manifestContents);
                }
                manifests["css"][dec[1]] = fileList;
                manifests["scss"][dec[1]] = scss;
              }
            }
          }

          contents = contents.substring(0, start) + replace + contents.substring(end);
        }

        file.contents = Buffer.from(contents, encoding);

        next(null, file);
      });
    },

    getJSManifests: function(){
      return manifests["js"];
    },

    getSCSSManifests: function(){
      return manifests["scss"];
    },

    addToCSSManifest: function(manifest, file){
      if(!manifests["css"].hasOwnProperty(manifest)){
        manifests["css"][manifest] = [];
      }

      manifests["css"][manifest].push(file);
    },

    getCSSManifests: function(){
      return manifests["css"];
    }
  }
});

module.exports = HtmlProcessor;
