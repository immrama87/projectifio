Projectifio.service("DocumentAlchemyFormatters", [function(){
  function wrapHTML(tag, id, innerHTML, config){
    var html = "<" + tag + " id=\"" + id + "\"";

    config.attrs = config.attrs || {};
    if(config.hasOwnProperty('style')){
      var styles = [];
      for(var style in config.style){
        styles.push(style + ": " + config.style[style]);
      }

      config.attrs.style = styles.join(";");
    }

    var attrs = [];
    for(var attr in config.attrs){
      attrs.push(attr + "=\"" + config.attrs[attr] + "\"");
    }

    html += " " + attrs.join(" ") + ">" + innerHTML + "</" + tag + ">";
    return html;
  }

  function writeMD(start, innerMD, end){
    return start + innerMD + end;
  }

  var formatters = {
    "p": {
      getHtml: function(id, innerHTML, config){return wrapHTML("p", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("", innerMD, "\n\n");}
    },
    "h1": {
      getHtml: function(id, innerHTML, config){return wrapHTML("h1", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("# ", innerMD, "\n\n");}
    },
    "h2": {
      getHtml: function(id, innerHTML, config){return wrapHTML("h2", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("## ", innerMD, "\n\n");}
    },
    "h3": {
      getHtml: function(id, innerHTML, config){return wrapHTML("h3", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("### ", innerMD, "\n\n");}
    },
    "h4": {
      getHtml: function(id, innerHTML, config){return wrapHTML("h4", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("#### ", innerMD, "\n\n");}
    },
    "h5": {
      getHtml: function(id, innerHTML, config){return wrapHTML("h5", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("##### ", innerMD, "\n\n");}
    },
    "h6": {
      getHtml: function(id, innerHTML, config){return wrapHTML("h6", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("###### ", innerMD, "\n\n");}
    },
    "strong": {
      getHtml: function(id, innerHTML, config){return wrapHTML("strong", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("**", innerMD, "**");}
    },
    "em": {
      getHtml: function(id, innerHTML, config){return wrapHTML("em", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("_", innerMD, "_");}
    },
    "strikethrough": {
      getHtml: function(id, innerHTML, config){
        config.style["text-decoration"] = "line-through";
        return wrapHTML("span", id, innerHTML, config);
      },
      getMd: function(innerMD, config){return writeMD("~~", innerMD, "~~");}
    },
    "underline": {
      getHtml: function(id, innerHTML, config){
        config.style["text-decoration"] = "underline";
        return wrapHTML("span", id, innerHTML, config);
      },
      getMd: function(innerMD, config){return writeMD("==", innerMD, "==");}
    },
    "code": {
      getHtml: function(id, innerHTML, config){return wrapHTML("code", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("`", innerMD, "`");}
    },
    "code-block": {
      getHtml: function(id, innerHTML, config){return wrapHTML("pre", "", wrapHTML("code", id, innerHTML, config), {});},
      getMd: function(innerMD, config){
        var start = "```";
        if(config.attrs.class != "nohighlight"){
          start += config.attrs.class;
        }
        return writeMD(start, innerMD, "```\n\n");
      }
    },
    "ul": {
      getHtml: function(id, innerHTML, config){return wrapHTML("ul", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("", innerMD, "");}
    },
    "ol": {
      getHtml: function(id, innerHTML, config){return wrapHTML("ol", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("", innerMD, "");}
    },
    "li": {
      getHtml: function(id, innerHTML, config){return wrapHTML("li", id, innerHTML, config);},
      getMd: function(innerMD, config){
        var start = "* ";
        if(config.attrs.list_type == "ol" && config.attrs.value){
          start = config.attrs.value + ". ";
        }
        return writeMD(start, innerMD, "\n");
      }
    },
    "a": {
      getHtml: function(id, innerHTML, config){return wrapHTML("a", id, innerHTML, config);},
      getMd: function(innerMD, config){
        var start = "[" + config.attrs.href + "](";
        return writeMD(start, innerMD, ")");
      }
    },
    "table": {
      getHtml: function(id, innerHTML, config){return wrapHTML("table", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("", innerMD, "\n\n");}
    },
    "thead": {
      getHtml: function(id, innerHTML, config){return wrapHTML("thead", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("", innerMD, "-|-\n");}
    },
    "tbody": {
      getHtml: function(id, innerHTML, config){return wrapHTML("tbody", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("", innerMD, "");}
    },
    "tr": {
      getHtml: function(id, innerHTML, config){return wrapHTML("tr", id, innerHTML, config);},
      getMd: function(innerMD, config){
        var line = innerMD.substring(1, innerMD.length-2);
        return writeMD("", line, "\n");
      }
    },
    "td": {
      getHtml: function(id, innerHTML, config){return wrapHTML("td", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD(" ", innerMD, " |");}
    },
    "th": {
      getHtml: function(id, innerHTML, config){return wrapHTML("th", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD(" ", innerMD, " |");}
    },
    "blockquote": {
      getHtml: function(id, innerHTML, config){return wrapHTML("blockquote", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("> ", innerMD, "\n\n");}
    },
    "columns": {
      getHtml: function(id, innerHTML, config){return wrapHTML("div", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("!{@columns:" + config.attrs.colspan + "}", innerMD, "!{/@columns}\n\n");}
    },
    "column": {
      getHtml: function(id, innerHTML, config){return wrapHTML("div", id, innerHTML, config);},
      getMd: function(innerMD, config){return writeMD("!{@col}", innerMD.replace(/\n/g, "\r"), "!{/@col}");}
    }
  };

  return {
    getFormatter: function(tag){
      return formatters[tag];
    }
  }
}]);
