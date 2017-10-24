var Projectifio = angular.module('projectifio', ["ngRoute"]);
Projectifio.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider){
    $routeProvider
      .when("/login", {
        templateUrl: "/html/templates/login.html"
      })
      .when("/file/new", {
        templateUrl: "/html/templates/file-editor.html"
      })
      .otherwise({
        templateUrl: "/html/templates/main.html"
      });

    $locationProvider.html5Mode(true);
  }
]);

Projectifio.run(['$rootScope', '$http', '$location',
  function($rootScope, $http, $location){
    $rootScope.navigator = {
      hasKeyboard: true,
      ctrlCode: "CTRL"
    };

    if(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase())){
      $rootScope.navigator.hasKeyboard = false;
    }
    else {
      $rootScope.keyboardEvents = {};

      $rootScope.registerKeyboardEvent = function(keyCode, keySequence, action){
        keySequence = $rootScope.navigator.ctrlCode + "+" + keySequence;
        if(typeof keyCode != "number" && typeof keyCode != "string"){
          var keys = [];
          for(var i=0;i<keyCode.length;i++){
            keys.push(keyCode[i].toString());
          }

          keyCode = keys.join("");
        }


        $rootScope.keyboardEvents[keyCode] = action;

        return keySequence;
      }

      $rootScope.deregisterKeyboardEvent = function(keyCode){
        if($rootScope.keyboardEvents.hasOwnProperty(keyCode)){
          $rootScope.keyboardEvents[keyCode] = undefined;
        }
      }

      $(document).on("keydown", function(evt){
        var trigger;

        if(evt.altKey){
          var extendedKeyCode = "18" + evt.keyCode;
          trigger = $rootScope.keyboardEvents[extendedKeyCode];
        }
        else {
          trigger = $rootScope.keyboardEvents[evt.keyCode];
        }

        if((evt.ctrlKey || evt.metaKey) && trigger != undefined){
          evt.preventDefault();
          trigger();
        }
      });
    }

    if(navigator.appVersion.indexOf("Mac") > -1)
      $rootScope.navigator.ctrlCode = "\u2318";

    $rootScope.$on('$locationChangeSuccess', function(){
      if($location.url() != "/login"){
        $http.get("/api/users/me")
          .then(
            function(response){
              $rootScope.user = response.data.user;
            },
            function(response){
              if(response.status == 401){
                $rootScope.lastPath = $location.url();
                $location.url("/login");
                $location.replace();
              }
            }
          );
      }
    });

    $rootScope.logout = function(){
      $http.post("/logout")
        .then(
          function(response){
            window.location.reload();
          },
          function(response){

          }
        )
    };
  }
]);
