Projectifio.controller("loginFormController", ['$scope', '$http', '$location', '$rootScope',
  function($scope, $http, $location, $rootScope){
    $scope.username = "";
    $scope.password = "";

    $scope.sendRequest = function(){
      var req = {
        method: 'POST',
        url: window.location.href,
        data: {
          username: $scope.username,
          password: $scope.password
        }
      };

      $http(req)
        .then(
          function(response){
            $location.url($rootScope.lastPath || "/");
            $location.replace();
          },
          function(response){
            if(response.data.message){
              alert(response.data.message);
            }
            else {
              alert("An error occurred trying to authenticate your account.");
            }
          }
        );
    }
  }
]);
