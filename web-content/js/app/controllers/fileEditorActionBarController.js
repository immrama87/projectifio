Projectifio.controller("fileEditorActionBarController", function($scope, $rootScope, ActionBarState){
  $scope.actions = [
    [
      {
        name: "Bold",
        icon: "fa-bold",
        prop: "bold",
        click: function(){
          ActionBarState.toggleProperty("bold");
        },
        hotKey: $rootScope.registerKeyboardEvent(66, "B", function(){
          ActionBarState.toggleProperty("bold");
          $scope.$apply();
        })
      },
      {
        name: "Italic",
        icon: "fa-italic",
        prop: "italic",
        click: function(){
          ActionBarState.toggleProperty("italic");
        },
        hotKey: $rootScope.registerKeyboardEvent(73, "I", function(){
          ActionBarState.toggleProperty("italic");
          $scope.$apply();
        })
      },
      {
        name: "Underline",
        icon: "fa-underline",
        prop: "underline",
        click: function(){
          ActionBarState.toggleProperty("underline");
        },
        hotKey: $rootScope.registerKeyboardEvent(85, "U", function(){
          ActionBarState.toggleProperty("underline");
          $scope.$apply();
        })
      },
      {
        name: "Strikethrough",
        icon: "fa-strikethrough",
        prop: "strikethrough",
        click: function(){
          ActionBarState.toggleProperty("strikethrough");
        },
        hotKey: $rootScope.registerKeyboardEvent([18, 83], "ALT+S", function(){
          ActionBarState.toggleProperty("strikethrough");
          $scope.$apply();
        })
      }
    ],
    [
      {
        name: "Align Left",
        icon: "fa-align-left",
        prop: "align",
        expect: "left",
        click: function(){
          ActionBarState.setProperty("align", "left");
        },
        hotKey: $rootScope.registerKeyboardEvent([18, 76], "ALT+L", function(){
          ActionBarState.setProperty("align", "left");
          $scope.$apply();
        })
      },
      {
        name: "Align Center",
        icon: "fa-align-center",
        prop: "align",
        expect: "center",
        click: function(){
          ActionBarState.setProperty("align", "center");
        },
        hotKey: $rootScope.registerKeyboardEvent([18, 67], "ALT+C", function(){
          ActionBarState.setProperty("align", "center");
          $scope.$apply();
        })
      },
      {
        name: "Align Right",
        icon: "fa-align-right",
        prop: "align",
        expect: "right",
        click: function(){
          ActionBarState.setProperty("align", "right");
        },
        hotKey: $rootScope.registerKeyboardEvent([18, 82], "ALT+R", function(){
          ActionBarState.setProperty("align", "right");
          $scope.$apply();
        })
      },
      {
        name: "Justify",
        icon: "fa-align-justify",
        prop: "align",
        expect: "justify",
        click: function(){
          ActionBarState.setProperty("align", "justify");
        },
        hotKey: $rootScope.registerKeyboardEvent([18, 74], "ALT+J", function(){
          ActionBarState.setProperty("align", "justify");
          $scope.$apply();
        })
      }
    ],
    [
      {
        name: "Text Style",
        icon: "",
        prop: "style",
        locked: {
          image: true,
          code: true,
          table: true,
          quote: true
        },
        options: [
          "Heading 1",
          "Heading 2",
          "Heading 3",
          "Heading 4",
          "Heading 5",
          "Heading 6",
          "Paragraph",
        ]
      }
    ],
    [
      {
        name: "Insert Ordered List",
        icon: "fa-list-ol",
        prop: "ordered-list",
        click: function(){
          ActionBarState.toggleProperty("ordered-list");
        }
      },
      {
        name: "Insert Unordered List",
        icon: "fa-list-ul",
        prop: "unordered-list",
        click: function(){
          ActionBarState.toggleProperty("unordered-list");
        }
      }
    ],
    [
      {
        name: "Insert Hyperlink",
        icon: "fa-link",
        prop: "external-link",
        click: function(){
          ActionBarState.toggleProperty("external-link");
        }
      },
      {
        name: "Insert Image",
        icon: "fa-picture-o",
        prop: "image",
        click: function(){
          ActionBarState.toggleProperty("image");
        }
      },
      {
        name: "Insert Code Block",
        icon: "fa-code",
        prop: "code",
        click: function(){
          ActionBarState.toggleProperty("code");
        }
      },
      {
        name: "Insert Table",
        icon: "fa-table",
        prop: "table",
        click: function(){
          ActionBarState.toggleProperty("table");
        }
      },
      {
        name: "Insert Blockquote",
        icon: "fa-quote-left",
        prop: "quote",
        click: function(){
          ActionBarState.toggleProperty("quote");
        }
      },
      {
        name: "Insert Columns",
        icon: "fa-columns",
        prop: "columns",
        click: function(){
          ActionBarState.toggleProperty("columns");
        }
      }
    ]
  ];

  $scope.isLocked = function(lock){
    if(lock){
      for(var prop in lock){
        if(typeof lock[prop] == "object"){

        }
        else {
          if($scope.state[prop] == lock[prop]){
            return true;
          }
        }
      }
    }

    return false;
  }

  $scope.state = ActionBarState;
});
