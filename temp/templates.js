angular.module('artJoystick').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('angular-joystick.html',
    "<div class=\"art-joystick-container\">\n" +
    "    <div class=\"art-pad\"></div>\n" +
    "    <div class=\"art-joystick-area\">\n" +
    "        <div class=\"art-joystick\">\n" +
    "            <div class=\"art-button\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"art-arrow-up art-arrow\" ng-mousedown=\"simpleDirection.up()\"></div>\n" +
    "    <div class=\"art-arrow-down art-arrow\" ng-mousedown=\"simpleDirection.up()\"></div>\n" +
    "    <div class=\"art-arrow-left art-arrow\" ng-mousedown=\"simpleDirection.up()\"></div>\n" +
    "    <div class=\"art-arrow-right art-arrow\" ng-mousedown=\"simpleDirection.up()\"></div>\n" +
    "</div>"
  );

}]);
