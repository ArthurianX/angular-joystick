angular.module('artJoystick',[]);

angular.module('artJoystick')
    .factory('artJoystickExternal', function(){
        /**
         * Service to manipulate the component from outside
         *  -
         * */

        return {};
    })
    .directive('artJoystick',['$parse', '$document', '$timeout', '$compile', 'artJoystickExternal',
        function(){
            return {
                restrict: 'E',
                scope: {
                    levels: "=artLevels", // the levels the component can go too, array of e.g.: {name: "Organisation", icon: "fa fa-users", color: "#fff", bColor: "#222"}
                    cordovaEnabled: "="
                },
                transclude: false,
                templateUrl: 'angular-joystick.html',
                controller: function($scope, $timeout, artJoystickExternal) {


                    // External Factory Component Controls

                    artJoystickExternal.goBackToLevel = function (direction) {

                        console.log('direction', direction);

                    };

                },
                link: function(scope, element, attrs, $timeout) {

                    //TODO: add fastClick library for no click delay. (ask Dorel about that first)

                    /**
                     * Angular Joystick - Consensus / Options
                     * - listens for mouse and touch events
                     * - a specific radius cannot be gotten past
                     * - after a set time of inactivity (no touch, mouseup event) retract the joystick
                     * - distance traveled from center to margin
                     * -
                     * -
                     * */





                    /* Push base64 image into canvas */

                    


                    element[0].querySelector('.levels.search-bar').addEventListener('keydown', function searchDown(event) {

                        console.log(event);

                    }, false);
                }
            };
        }
    ]);

angular.module('artJoystick').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('angular-joystick.html',
    "<div class=\"art-joystick-container\">\n" +
    "\n" +
    "</div>"
  );

}]);
