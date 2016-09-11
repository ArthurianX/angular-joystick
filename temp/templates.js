angular.module('artJoystick').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('angular-joystick.html',
    "<div class=\"art-joystick-container\">\n" +
    "    <div class=\"art-pad\"></div>\n" +
    "    <div class=\"art-joystick\">\n" +
    "        <div class=\"art-button\"></div>\n" +
    "    </div>\n" +
    "\n" +
    "</div>"
  );

}]);
