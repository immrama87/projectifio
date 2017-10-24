Projectifio.controller("fileEditorController", ["$scope", "$rootScope", "$sce", "ActionBarState", "DocumentAlchemy",
function($scope, $rootScope, $sce, ActionBarState, DocumentAlchemy){
  var test_md = "# Heading 1\n\n" +
    "## Heading 2\n\n"+
    "### Heading 3\n\n"+
    "#### Heading 4\n\n"+
    "##### Heading 5\n\n"+
    "###### Heading 6\n\n"+
    "Test Paragraph with formatting:\n"+
    "Some **bold** text\n"+
    "Some _italic_ text\n"+
    "Some ~~struckthrough~~ text\n"+
    "Some ==underlined== text\n"+
    "Some **bold text with _italics_, ~~strikethroughs~~ and ==underlines== and even _italic, ==underlined and ~~struckthrough~~==_** text.\n\n" +
    "* Testing\n"+
    "* An\n"+
    "* Unordered\n"+
    "* List\n\n"+
    "1. Testing\n"+
    "2. An\n"+
    "3. Ordered\n"+
    "4. List\n"+
    "5. With\n"+
    "10. Manual\n"+
    "400. Numbering\n\n"+
    "Here's some text with inline `code`.\n\n"+
    "```\n"+
    "var text = \"No Format Provided. Unformatted code block.\";\n"+
    "```\n\n"+
    "```javascript\n"+
    "var text = \"This one is formatted to look like Javascript.\";\n"+
    "```\n\n"+
    "[https://www.reddit.com/](Reddit!)\n\n"+
    "![Image of Yaktocat](https://octodex.github.com/images/yaktocat.png)\n\n"+
    "First Column | Second Column\n"+
    "-------------|--------------\n"+
    "Content in the first row, first column | Content in the first row, second column\n"+
    "Second Row, First Column | Second Row, Second Column\n\n"+
    "> This is a quote.\n\n"+
    "> This is a quote with **bold**, _italic_, ==underlined== and ~~struckthrough~~ text.\n\n"+
    "!{@align:center}This is centered text.\n\n"+
    "!{@align:right}This is right-aligned text.\n\n"+
    "!{@align:justify}This is justified text. This is justified text. This is justified text. This is justified text. This is justified text. This is justified text. This is justified text. This is justified text. This is justified text. This is justified text. This is justified text.\n\n"+
    "!{@columns:2}\n"+
    "!{@col}This is the column text for the left column!{/@col}\n"+
    "!{@col}This is the column text for the ~~left~~ **_==right==_** column!{/@col}\n"+
    "!{/@columns}\n\n"+
    "!{@columns:3}\n"+
    "!{@col}This is a slightly bigger column.\r\r"+
    "With a whole lot more text\r\r"+
    "# Even a Header!{/@col}\n"+
    "!{@col}This is the middle column!{/@col}\n"+
    "!{@col}This is the right column!{/@col}\n"+
    "!{/@columns}";

  $scope.file = {
    title: "Test",
    contents: {
      md: test_md,
      html: ""
    }
  };

  var fileContentsStore = {
    doc_root: {}
  };

  function generateHTML(storeObj, id){
    storeObj = storeObj || fileContentsStore.doc_root;
    var response = "";

    var text = storeObj.text.replace(/\n/g, "<br />");

    var start = -1;
    while((start = text.indexOf("!{@cid:")) > -1){
      var end = text.indexOf("}", start + 2);
      var cid = text.substring(start, end).split(":")[1];

      var replace = "";
      if(storeObj.hasOwnProperty("children")){
        if(storeObj.children.hasOwnProperty(cid)){
          replace = generateHTML(storeObj.children[cid], cid);
        }
      }

      text = text.substring(0, start) + replace + text.substring(end+1);
    }

    if(storeObj.hasOwnProperty("tag")){
      var html = "<" + storeObj.tag + " id=\"" + id + "\"";

      if(storeObj.style != undefined){
        var styles = [];
        for(var style in storeObj.style){
          styles.push(style + ": " + storeObj.style[style]);
        }

        html += " style=\"" + styles.join(";") + "\"";
      }

      if(storeObj.attrs != undefined){
        var attrs = [];
        for(var attr in storeObj.attrs){
          attrs.push(attr + "=\"" + storeObj.attrs[attr] + "\"");
        }

        html += " " + attrs.join(" ");
      }

      html += ">" + text + "</" + storeObj.tag + ">";
      text = html;
    }

    return text;
  }

  /*function prepareFileContentsFromMD(md, prefix){
    md = md || $scope.file.contents.md;
    prefix = prefix || "doc";

    var element = {
      text: "",
      children: {}
    };

    var contentElements = {};

    var lines = md.split("\n\n");

    for(var i=0;i<lines.length;i++){
      var tag = "p";
      var styles = {};
      var attrs = {};

      if(lines[i].charAt(0) == "#"){
        var num = lines[i].indexOf(" ");
        lines[i] = lines[i].substring(lines[i].indexOf(" ") + 1);
        tag = "h" + num;
      }
      else if(lines[i].indexOf("```") == 0){
        var lang = lines[i].substring(3, lines[i].indexOf("\n")) || "nohighlight";
        var tag = "<code class=\"" + lang + "\">";

        lines[i] = tag + lines[i].substring(lines[i].indexOf("\n") + 1, lines[i].indexOf("```", 3)) + "</code>";
        tag = "pre";
      }
      else if(lines[i].indexOf("> ") == 0){
        lines[i] = lines[i].substring(2);
        tag = "blockquote";
      }
      else if(lines[i].indexOf("!{@columns:") == 0){
        var columns = lines[i].charAt(("!{@columns:").length);
        if(columns == "2" || columns == "3"){
          attrs.class = "col-xs-" + 12/parseInt(columns);
          lines[i] = lines[i].substring(lines[i].indexOf("}", lines[i].indexOf("!{@columns:"))+1, lines[i].indexOf("!{/@columns}"));
          tag = "div";
        }
        else {
          lines[i] = "";
        }
      }

      var el_prefix = prefix + "-" + tag;
      if(contentElements.hasOwnProperty(tag)){
        el_prefix += "-" + contentElements[tag];
        contentElements[tag] = parseInt(contentElements[tag]) + 1;
      }
      else {
        el_prefix += "-0";
        contentElements[tag] = 1;
      }

      element.text += "!{@cid:" + el_prefix + "}";

      if(tag == "div"){
        element.children[el_prefix] = prepareColumnsFromMD(lines[i], el_prefix, attrs);
      }
      else {
        element.children[el_prefix] = prepareFileLineFromMD(lines[i], tag, el_prefix);
      }
    }

    return element;
  }

  function prepareColumnsFromMD(line, prefix, attrs){
    var element = {
      tag: "div",
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
      element.children[col_prefix] = prepareFileContentsFromMD(match[1].replace(/\r/g, "\n"), col_prefix);
      element.children[col_prefix].tag = "div";
      element.children[col_prefix].attrs = attrs;
      element.text += "!{@cid:" + col_prefix + "}";
      columns++;
    }

    return element;
  }

  function prepareFileLineFromMD(line, tag, prefix, style, attrs){
    var element = {
      tag: tag,
      style: style,
      attrs: attrs || {},
      children: {}
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
        tag: "span",
        style: {"text-decoration": "line-through"},
        prefix: "st"
      },
      "==": {
        tag: "span",
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

    var contentElements = {};

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

        if(contentElements.hasOwnProperty(tagDetails.prefix)){
          sub_prefix += "-" + contentElements[tagDetails.prefix];
          contentElements[tagDetails.prefix] = parseInt(contentElements[tagDetails.prefix]) + 1;
        }
        else {
          sub_prefix += "-0";
          contentElements[tagDetails.prefix] = 1;
        }


        if(match[1] == match[0] && (tagDetails.tag == "ul" || tagDetails.tag == "ol")){
          element = prepareListFromMD(match[1], prefix);
          element.tag = tagDetails.tag;
        }
        else if(match[13] == match[0] && tagDetails.tag == "table"){
          element = prepareTableFromMD(match[13], prefix);
          element.tag = tagDetails.tag;
        }
        else {
          line = line.substring(0, match.index) + "!{@cid:" + sub_prefix + "}" + line.substring(match.index + match[0].length);
          element.children[sub_prefix] = prepareFileLineFromMD(text, tagDetails.tag, sub_prefix, tagDetails.style, attrs);
        }
      }
    }

    if(element.text == undefined)
      element.text = line;

    return element;
  }

  function prepareListFromMD(text, prefix){
    var element = {
      children: {}
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

      element.children[sub_prefix] = prepareFileLineFromMD(match[4], "li", sub_prefix, undefined, attr);

      text = text.substring(0, match.index) + "!{@cid:" + sub_prefix + "}" + text.substring(match[0].length + match.index);
      count++;
    }

    element.text = text;

    return element;
  }

  function prepareTableFromMD(text, prefix){
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
        head_row_element.children[head_cell_prefix] = prepareFileLineFromMD(head_row_cells[j], "th",head_cell_prefix);
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
        body_row_element.children[body_cell_prefix] = prepareFileLineFromMD(body_row_cells[j], "td", body_cell_prefix);
      }

      body_element.children[body_row_prefix] = body_row_element;
    }

    element.children[body_prefix] = body_element;

    element.text = "!{@cid:" + head_prefix + "}!{@cid:" + body_prefix + "}";

    return element;
  }*/

  fileContents = DocumentAlchemy.transmuteFromMD($scope.file.contents.md);

  //fileContentsStore.doc_root = prepareFileContentsFromMD();
  //console.log(fileContentsStore);
  $scope.file.contents.html = $sce.trustAsHtml(fileContents.transmuteToHTML());

  var md = fileContents.transmuteToMD();
  fileContents = DocumentAlchemy.transmuteFromMD(md);
  $scope.file.contents.html = $sce.trustAsHtml(fileContents.transmuteToHTML());

  $scope.updateStyleInfo = function(evt){
    if(window.getSelection()){
      var range = window.getSelection().getRangeAt(0);
      var deepestEl = range.startContainer.parentNode;
      while(!deepestEl.id){
        deepestEl = deepestEl.parentNode;
      }

      var deepest = deepestEl.id;

      var parent = "doc";
      var parentStore = fileContentsStore.doc_root;

      var tagStyleMap = {
        "H1": "Heading 1",
        "H2": "Heading 2",
        "H3": "Heading 3",
        "H4": "Heading 4",
        "H5": "Heading 5",
        "H6": "Heading 6",
        "P": "Paragraph"
      };

      var TAG_BOLD = "STRONG";
      var TAG_CODE = "CODE";
      var TAG_CODE_PRE = "PRE";
      var TAG_COLUMN = "DIV";
      var TAG_ITALIC = "EM";
      var TAG_IMG = "IMG";
      var TAG_LINK = "A";
      var TAG_TABLE = "TABLE";
      var TAG_OL = "OL";
      var TAG_QUOTE = "BLOCKQUOTE";
      var TAG_UL = "UL";

      //Set to default styles before parsing
      var styles = {
        style: "Paragraph",
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        align: "left",
        "ordered-list": false,
        "unordered-list": false,
        "external-link": false,
        image: false,
        code: false,
        table: false,
        quote: false,
        columns: false
      };

      var child_re = /\w+-\d+/g;
      var match;
      while((match = child_re.exec(deepest)) != null){
        var child = deepest.substring(0, match.index + match[0].length);
        var child_el = document.getElementById(child);
        if(tagStyleMap.hasOwnProperty(child_el.tagName)){
          styles.style = tagStyleMap[child_el.tagName];
        }

        if(child_el.tagName == TAG_BOLD){
          styles.bold = true;
        }
        else if(child_el.tagName == TAG_CODE || child_el.tagName == TAG_CODE_PRE){
          styles.code = true;
        }
        else if(child_el.tagName == TAG_COLUMN){
          styles.columns = true;
        }
        else if(child_el.tagName == TAG_ITALIC){
          styles.italic = true;
        }
        else if(child_el.tagName == TAG_IMG){
          styles.image = true;
        }
        else if(child_el.tagName == TAG_LINK){
          styles["external-link"] = true;
        }
        else if(child_el.tagName == TAG_TABLE){
          styles.table = true;
        }
        else if(child_el.tagName == TAG_OL){
          styles["ordered-list"] = true;
        }
        else if(child_el.tagName == TAG_QUOTE){
          styles.quote = true;
        }
        else if(child_el.tagName == TAG_UL){
          styles["unordered-list"] = true;
        }

        if($(child_el).hasClass("text-center")){
          styles.align = "center";
        }
        else if($(child_el).hasClass("text-right")){
          styles.align = "right";
        }
        else if($(child_el).hasClass("text-justify")){
          styles.align = "justify";
        }

        if(child_el.style.textDecoration == "underline"){
          styles.underline = true;
        }
        else if(child_el.style.textDecoration == "line-through"){
          styles.strikethrough = true;
        }
      }

      ActionBarState.setState(styles);
    }
  }

  /*$rootScope.$on('file-editor-action-bar:update-props', function(evt, data){
    var state = JSON.stringify(ActionBarState);

    $scope.file.contents.html = $sce.trustAsHtml(generateHTML());

    switch(data){
      case "bold":
        if(ActionBarState.bold){
          var range = window.getSelection().getRangeAt(0);
          console.log(range);
          var contents = range.cloneContents().textContent;

          if(range.startContainer.parentElement.tagName != "STRONG" && range.endContainer.parentElement.tagName != "STRONG"){
            contents = "<strong>" + contents + "</strong>";
          }
          else if(range.startContainer.parentElement.tagName == "STRONG"){
            var text = range.startContainer.parentNode.innerText.substring(0, range.startOffset) +
              contents;

            if(range.startContainer == range.endContainer){
              text += range.startContainer.parentNode.innerText.substring(range.endOffset);
            }
            else {
              range.endContainer.parentNode.innerText = range.endContainer.wholeText.substring(range.endOffset);
            }

            range.startContainer.parentNode.innerText = text;
          }
          else if(range.endContainer.parentNode.tagName == "STRONG"){
            contents = "<strong>" + contents + range.endContainer.parentNode.innerText.substring(range.endOffset) + "</strong>";
          }

          range.startContainer.parentNode.innerHTML = range.startContainer.parentNode.innerText.substring(0, range.startOffset)
            + contents;

          console.log(contents);
        }
        break;
    }
  });*/
}]);
