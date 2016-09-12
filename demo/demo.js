angular.module('app', ['ngAnimate','artJoystick']);

angular.module('app').controller('DemoCtrl',function($scope,$http, $q, artJoystickExternal, $timeout){

    $scope.getWheelsSpeed = function(response) {
        $scope.wLeft = response.left;
        $scope.wRight = response.right;
    };
});