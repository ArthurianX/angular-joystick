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
        function($parse, $document, $timeout, $compile, artJoystickExternal){
            return {
                restrict: 'E',
                scope: {
                    sendMovement: '&',          // will callback one of: {response: {left: speed, right: speed}}, {response: {angle: 27, speed: speed}}. {response: {direction: 'up-left', speed: speed}}

                    cordovaEnabled: "=",        // If enabled, find the cordova extension and run the events through that

                    vibrationEnabled: "=",      // If enabled, try to find some vibration controls and run then

                    speedIncrease: "=",         // 'linear', 'exponential'

                    maxPositiveSpeed: "=",      // Maximum positive (forward) speed

                    maxNegativeSpeed: "=",      // Maximum negative (backward) speed

                    directionManagement: "=",   // 'direct' - means we send acceleration for each wheel through the callback (real devices)
                                                // 'angle' - we send the angle of movement and acceleration through the callback (real / on-screen interactive element)
                                                // 'directions': - we send 'up', 'up-left', 'up-right', 'left', 'right', 'down-left', (on-screen interactive element)
                                                //                  'down-right' and acceleration through the callback **/
                    controlSize: "=" // The size in pixels of the control on page, max 300.
                },
                transclude: false,
                templateUrl: 'angular-joystick.html',
                controller: function($scope, $timeout, artJoystickExternal) {


                    // External Factory Component Controls

                    artJoystickExternal.goBackToLevel = function (direction) {

                        console.log('direction', direction);

                    };



                },
                link: function(scope, element, attrs) {

                    //TODO: add fastClick library for no click delay. (ask Dorel about that first)

                    /**
                     * Angular Joystick - Consensus / Options
                     * - listens for mouse and touch events
                     * - a specific radius cannot be gotten past on the ui interface
                     * - after a set time of inactivity (no touch, mouseup event) retract the joystick
                     * - distance traveled from center to margin
                     * */

                    // Defining elements

                    var button = angular.element(element[0].querySelector('.art-joystick'));

                    var pad = element[0].querySelector('.art-pad');

                    // Settings

                    var settings = {
                        center: [button[0].offsetLeft, button[0].offsetTop],
                        moving: 0,
                        directiveOffset: [element[0].offsetLeft, element[0].offsetTop],
                        touchedCenter: []
                    };

                    button.css({'left': settings.center[0] + 'px'});
                    button.css({'top': settings.center[1] + 'px'});

                    // Utilities

                    var convertPosition = function getCarthesianPosition(element, button){

                    };


                    //// Hooking Up Events

                    //Touch

                    var touchEventPresent = 0;
                    var touchMove = function(event) {
                        var touch = event[touchEventPresent][0];
                        moveJoystick(touch.clientX, touch.clientY);
                    };

                    button.on('touchstart', function touchstart(event){
                        settings.moving = 1;
                        console.log('touchstart', event);

                        var touch = [];
                        if (event.originalEvent) {
                            touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
                            touchEventPresent = 'originalEvent';
                        } else if (event.targetTouches){
                            touch = event.targetTouches[0];
                            touchEventPresent = 'targetTouches';
                        } else if (event.changedTouches) {
                            touch = event.changedTouches[0];
                            touchEventPresent = 'changedTouches';
                        }

                        //Calculate the center of touch from the moment the user clicks on the button
                        settings.touchedCenter = [touch.clientX, touch.clientY];
                        button.on('touchmove', touchMove);
                    });

                    angular.element(window).on('touchend', function touchend(event){
                        console.log('touchend', event);
                        settings.moving = 0;
                        returnJoystick(button);
                        button.off('touchmove', touchMove);
                    });



                    //Mouse
                    var mouseMove = function(event) {
                        moveJoystick(event.clientX, event.clientY);
                    };

                    button.on('mousedown', function mousedown(event){
                        console.log('mousedown', event);
                        settings.moving = 1;

                        //Calculate the center of touch from the moment the user clicks on the button
                        settings.touchedCenter = [event.clientX, event.clientY];
                        button.on('mousemove', mouseMove);
                    });

                    //button.on('mouseup', function mouseup(event){
                    angular.element(window).on('mouseup', function mouseup(event){
                        console.log('mouseup', event);
                        settings.moving = 0;
                        returnJoystick(button);
                        button.off('mousemove', mouseMove);
                    });



                    // Watching joystick actions

                    scope.$watch(
                        function () { return button[0].offsetLeft; },
                        function (newValue, oldValue) {
                            /*if (newValue !== oldValue) {
                                console.log('new', newValue);
                            }*/
                        }
                    );

                    scope.$watch(
                        function () { return button[0].offsetTop; },
                        function (newValue, oldValue) {
                            /*if (newValue !== oldValue) {
                                console.log('new', newValue);
                            }*/
                        }
                    );

                    // Moving the joystick & utilities

                    var joystickBoundaries = function joystickBoundaries(center, joystick){

                        var radius = center[0] / 1.5;
                        var xlim = Math.sqrt(radius * radius - joystick[0] * joystick[0]);
                        var ylim = Math.sqrt(radius * radius - joystick[1] * joystick[1]);
                        console.log('xlim', xlim, 'ylim', ylim);
                        if (xlim > 0 && ylim > 0) {
                            return true;
                        } else {
                            return false;
                        }
                        //x = Math.random() * 2 * ylim - ylim;

                    };

                    var moveJoystick = function moveJoystick(x,y) {
                        var coords = {
                            x: parseInt(button.css('left').replace('px', '')) - settings.center[0],
                            y: parseInt(button.css('top').replace('px', '')) - settings.center[1]
                        };

                        if (joystickBoundaries(settings.center, [coords.x, coords.y])) {

                            var moveX = x - settings.touchedCenter[0];
                            var moveY = y - settings.touchedCenter[1];

                            button.css({'left': settings.center[0] + moveX + 'px'});
                            button.css({'top': settings.center[1] + moveY + 'px'});
                            scope.$apply();
                        } else {
                            console.log('outside :( ');
                            button[0].blur();
                            //It must've gotten outside, bring it back ? TODO: <<<
                        }


                    };

                    var returnJoystick = function returnJoystick(button){
                        // If no other action has been taken, return the joystic to it's initial position
                        button.addClass('returning');
                        $timeout(function(){
                            if (!settings.moving) {
                                button.css({'left': settings.center[0] + 'px', 'top': settings.center[1] + 'px'});
                            } else {
                                button.removeClass('returning');
                            }
                        }, 500);
                        $timeout(function(){
                            button.removeClass('returning');
                        }, 1000);
                    };



                }
            };
        }
    ]);

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
