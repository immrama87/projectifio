Projectifio.controller("navController", ['$scope', '$http', '$location', '$rootScope',
  function($scope, $http, $location, $rootScope){
    $scope.menus = [
      {
        name: "File",
        link: "#",
        menus: [
          {
            name: "New Document",
            link: "/file/new",
            hotkey: $rootScope.registerKeyboardEvent([18, 192], "ALT+N", function(){
              $location.url("/file/new");
              $scope.$apply();
            })
          },
          {
            name: "Open Document",
            link: "/file",
            hotkey: $rootScope.registerKeyboardEvent(79, "O", function(){
              $location.url("/file");
              $scope.$apply();
            })
          }
        ]
      }
    ];

    $rootScope.extendMenus = function(newItems, scope){
      
    }

    $scope.$on("$destroy", function(){
      $rootScope.deregisterKeyboardEvent(79);
    })

    if($location.url() != "/"){
      $("#nav-file-menu").addClass("collapse");
      $("button[data-target='#nav-file-menu']").removeClass("hide");
    }
  }
]);
