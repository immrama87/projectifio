Projectifio.directive("highlightAfterBind", [function(){
  var link = function(scope, element, attrs){
    scope.$watch(attrs.ngBind, function(newValue){
      $(element).find("pre:has(code)").each(function(index, el){
        hljs.highlightBlock(el);
      });
    });
  }

  return {
    restrict: 'A',
    link: link
  };
}]);
