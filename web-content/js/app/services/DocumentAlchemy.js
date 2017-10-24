Projectifio.service("DocumentAlchemy", ["DocumentAlchemyFormatters", function(DocumentAlchemyFormatters){
  var PrimaMateria = (function(initial, state){
    var pm = {};
    var documentContents = {
      doc_root: {}
    };

    function processMarkdown(md, parent){
      parent = parent || {prefix: "doc"};
      var prefix = parent.prefix;

      var element = {
        text: "",
        children: {},
        elements: {}
      };

      var lines = md.split("\n\n");
      for(var i=0;i<lines.length;i++){
        var tag = "p";
        var attrs = {};

        if(lines[i].charAt(0) == "#"){
          var num = lines[i].indexOf(" ");
          if(num < 7){
            lines[i] = lines[i].substring(num+1);
            tag = "h" + num;
          }
        }
        else if(lines[i].indexOf("```") == 0){
          var lang = lines[i].substring(3, lines[i].indexOf("\n")) || "nohighlight";
          var code_tag = "<code class=\"" + lang + "\">";
          lines[i] = code_tag +
            lines[i].substring(lines[i].indexOf("\n") + 1, lines[i].indexOf("```", 3)) +
            "</code>";

          tag = "code-block";
        }
        else if(lines[i].indexOf("> ") == 0){
          tag = "blockquote";
          lines[i] = lines[i].substring(2);
        }
        else if(lines[i].indexOf("!{@columns:") == 0){
          var columns = lines[i].charAt(("!{@columns:").length);
          if(columns == "2" || columns == "3"){
            attrs.colspan = columns;
            attrs.class = "col-xs-" + 12/parseInt(columns);
            lines[i] = lines[i].substring(lines[i].indexOf("}", lines[i].indexOf("!{@columns:"))+1, lines[i].indexOf("!{/@columns}"));
            tag = "columns";
          }
        }

        var el_prefix = prefix + "-" + tag;
        if(element.elements.hasOwnProperty(tag)){
          el_prefix += "-" + element.elements[tag];
          element.elements[tag] = parseInt(element.elements[tag]) + 1;
        }
        else {
          el_prefix += "-0";
          element.elements[tag] = 1;
        }

        element.text += "!{@cid:" + el_prefix + "}";
        if(tag == "columns"){
          element.children[el_prefix] = processMarkdownColumns(lines[i], el_prefix, attrs, parent);
          element.children[el_prefix].attrs.colspan = attrs.colspan;
        }
        else {
          element.children[el_prefix] = processMarkdownLine(lines[i], tag, el_prefix);
        }
      }

      return element;
    }

    function processMarkdownColumns(line, prefix, attrs){
      var element = {
        tag: "columns",
        attrs: {class: "row"},
        children: {},
        text: ""
      };

      var columns = 0;

      //https://regex101.com/r/13x5ee/1/
      var column_re = /!{@col}((?:.*|\r)*?)!{\/@col}/g;
      var match;

      while((match = column_re.exec(line)) != null){
        var col_prefix = prefix + "-col-" + columns;
        element.children[col_prefix] = processMarkdown(match[1].replace(/\r/g, "\n"), {prefix: col_prefix});
        element.children[col_prefix].tag = "column";
        element.children[col_prefix].attrs = attrs;
        element.text += "!{@cid:" + col_prefix + "}";
        columns++;
      }

      return element;
    }

    function processMarkdownLine(line, tag, prefix, style, attrs){
      var element = {
        tag: tag,
        style: style,
        attrs: attrs || {},
        children: {},
        elements: {}
      };

      var tags = {
        "**": {
          tag: "strong",
          style: undefined,
          prefix: "b"
        },
        "_": {
          tag: "em",
          style: undefined,
          prefix: "i"
        },
        "~~": {
          tag: "strikethrough",
          style: {"text-decoration": "line-through"},
          prefix: "st"
        },
        "==": {
          tag: "underline",
          style: {"text-decoration": "underline"},
          prefix: "u"
        },
        "`": {
          tag: "code",
          style: undefined,
          prefix: "ic"
        },
        "ul": {
          tag: "ul",
          style: undefined,
          prefix: "ul"
        },
        "ol": {
          tag: "ol",
          style: undefined,
          prefix: "ol"
        },
        "a": {
          tag: "a",
          style: undefined,
          prefix: "a"
        },
        "img": {
          tag: "img",
          style: undefined,
          prefix: "img"
        },
        "table": {
          tag: "table",
          style: undefined,
          prefix: "tbl"
        }
      };

      //https://regex101.com/r/xAe5WJ/2
      var re = /((\*\*|_|~~|==|`)(.*?)\2|(((\*|\d+\.)\s)(.*)(\n|$))+|\[(http(?:s?):\/\/[\w\.\/]+)\]\((.*?)\)|\!\[(.*?)\]\((.*?)\)|((?:[\w\d\ ]+(?:\s\|\s|\n))+-+\|-+\n(?:[\w\d\ \,]+(?:\s\|\s|\n|$))+))|!{@align:(.+)}/g;
      var match;

      while((match = re.exec(line)) != null){
        var type = match[2];
        var text = match[3];

        var attrs = {};

        var tagDetails = tags[type];
        if(tagDetails == undefined && match[5] != undefined){
          if(match[5] == "* "){
            tagDetails = tags.ul;
          }
          else {
            tagDetails = tags.ol;
          }

          text = match[1];
        }
        else if(tagDetails == undefined && match[9] != undefined){
          text = match[10] || match[9];
          attrs.href = match[9];
          tagDetails = tags.a;
        }
        else if(tagDetails == undefined && match[11] != undefined){
          attrs.src = match[12];
          attrs.title = match[11];
          text = "";
          tagDetails = tags.img;
        }
        else if(tagDetails == undefined && match[13] != undefined){
          text = match[13];
          tagDetails = tags.table;
        }

        if(match[14] != undefined){
          element.attrs.class = element.attrs.class || "";
          element.attrs.class += " text-" + match[14];
          line = line.substring(0, match.index) + line.substring(match.index + match[0].length);
        }

        if(text != undefined){
          var sub_prefix = prefix + "-" + tagDetails.prefix;

          if(element.elements.hasOwnProperty(tagDetails.prefix)){
            sub_prefix += "-" + element.elements[tagDetails.prefix];
            element.elements[tagDetails.prefix] = parseInt(element.elements[tagDetails.prefix]) + 1;
          }
          else {
            sub_prefix += "-0";
            element.elements[tagDetails.prefix] = 1;
          }


          if(match[1] == match[0] && (tagDetails.tag == "ul" || tagDetails.tag == "ol")){
            element.children[sub_prefix] = processMarkdownList(match[1], tagDetails.tag, sub_prefix);
            line = line.substring(0, match.index) + "!{@cid:" + sub_prefix + "}" + line.substring(match.index + match[0].length);
            console.log(element);
          }
          else if(match[13] == match[0] && tagDetails.tag == "table"){
            element = processMarkdownTable(match[13], prefix);
            element.tag = tagDetails.tag;
          }
          else {
            line = line.substring(0, match.index) + "!{@cid:" + sub_prefix + "}" + line.substring(match.index + match[0].length);
            element.children[sub_prefix] = processMarkdownLine(text, tagDetails.tag, sub_prefix, tagDetails.style, attrs);
          }
        }
      }

      if(element.text == undefined)
        element.text = line;

      return element;
    }

    function processMarkdownList(text, tag, prefix){
      var element = {
        children: {},
        tag: tag
      };

      var re = new RegExp('((\\*|(\\d+)\\.)\\s)(.*)(\\n|$)', 'g');
      var match;

      var count = 0;

      while((match = re.exec(text)) != null){
        var sub_prefix = prefix + "-li-" + count;
        var attr;
        if(match[3]){
          attr = {};
          attr.value = match[3];
        }

        element.children[sub_prefix] = processMarkdownLine(match[4], "li", sub_prefix, undefined, attr);
        element.children[sub_prefix].attrs.list_type = tag;

        text = text.substring(0, match.index) + "!{@cid:" + sub_prefix + "}" + text.substring(match[0].length + match.index);
        count++;
      }

      element.text = text;

      return element;
    }

    function processMarkdownTable(text, prefix){
      var element = {
        children: {},
        attrs: {
          class: "table"
        }
      };

      var sections = text.split(/-+\|-+/);
      var head = sections[0];

      var head_prefix = prefix + "-thead-0";
      var head_element = {
        children: {},
        text: "",
        tag: "thead"
      };

      var head_rows = head.trim().split("\n");
      for(var i=0;i<head_rows.length;i++){
        var head_row_prefix = head_prefix + "-tr-" + i;
        var head_row_element = {
          children: {},
          text: "",
          tag: "tr"
        };
        head_element.text += "!{@cid:" + head_row_prefix + "}";


        var head_row_cells = head_rows[i].split(/\s\|\s/);
        for(var j=0;j<head_row_cells.length;j++){
          var head_cell_prefix = head_row_prefix + "-th-" + j;
          head_row_element.text += "!{@cid:" + head_cell_prefix + "}";
          head_row_element.children[head_cell_prefix] = processMarkdownLine(head_row_cells[j], "th",head_cell_prefix);
        }

        head_element.children[head_row_prefix] = head_row_element;
      }

      element.children[head_prefix] = head_element;

      var body = sections[1];
      var body_prefix = prefix + "-tbody-0";
      var body_element = {
        children: {},
        text: "",
        tag: "tbody"
      };

      var body_rows = body.trim().split("\n");
      for(var i=0;i<body_rows.length;i++){
        var body_row_prefix = body_prefix + "-tr-" + i;
        var body_row_element = {
          children: {},
          text: "",
          tag: "tr"
        };
        body_element.text += "!{@cid:" + body_row_prefix + "}";

        var body_row_cells = body_rows[i].split(/\s\|\s/);
        for(var j=0;j<body_row_cells.length;j++){
          var body_cell_prefix = body_row_prefix + "-td-" + j;
          body_row_element.text += "!{@cid:" + body_cell_prefix + "}";
          body_row_element.children[body_cell_prefix] = processMarkdownLine(body_row_cells[j], "td", body_cell_prefix);
        }

        body_element.children[body_row_prefix] = body_row_element;
      }

      element.children[body_prefix] = body_element;

      element.text = "!{@cid:" + head_prefix + "}!{@cid:" + body_prefix + "}";

      return element;
    }

    function generateHTML(contents, id){
      contents = contents || documentContents.doc_root;

      var text = contents.text.replace(/\n/g, "<br />");

      var start = -1;
      while((start = text.indexOf("!{@cid:")) > -1){
        var end = text.indexOf("}", start);
        var cid = text.substring(start, end).split(":")[1];

        var replace = "";
        if(contents.hasOwnProperty('children')){
          if(contents.children.hasOwnProperty(cid)){
            replace = generateHTML(contents.children[cid], cid);
          }
        }

        text = text.substring(0, start) + replace + text.substring(end+1);
      }

      if(contents.hasOwnProperty('tag')){
        var formatter;
        if((formatter = DocumentAlchemyFormatters.getFormatter(contents.tag)) != undefined){
          text = formatter.getHtml(id, text, {style: contents.style, attrs: contents.attrs});
        }
      }

      return text.replace(/\n\n\n/g, "\n\n");
    }

    function generateMD(contents, id){
      contents = contents || documentContents.doc_root;
      var text = contents.text;

      var start = -1;
      while((start = text.indexOf("!{@cid:")) > -1){
        var end = text.indexOf("}", start);
        var cid = text.substring(start, end).split(":")[1];

        var replace = "";
        if(contents.hasOwnProperty('children')){
          if(contents.children.hasOwnProperty(cid)){
            replace = generateMD(contents.children[cid], cid);
          }
        }

        text = text.substring(0, start) + replace + text.substring(end+1);
      }

      if(contents.hasOwnProperty('tag')){
        var formatter;
        if((formatter = DocumentAlchemyFormatters.getFormatter(contents.tag)) != undefined){
          text = formatter.getMd(text, {style: contents.style, attrs: contents.attrs});
        }
      }

      return text;
    }

    switch(state){
      case "md":
        documentContents.doc_root = processMarkdown(initial);
        break;
      case "html":
        processHTML();
        break;
      default:
        break;
    }

    pm.transmuteToHTML = function(){
      return generateHTML();
    }

    pm.transmuteToMD = function(){
      return generateMD();
    }

    return pm;
  });

  return {
    transmuteFromMD: function(md){
      return new PrimaMateria(md, "md");
    },
    transmuteFromHTML: function(html){
      return new PrimaMateria(html, "html");
    }
  };
}]);
