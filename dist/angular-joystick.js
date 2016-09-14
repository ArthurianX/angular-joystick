angular.module('artJoystick',[]);

angular.module('artJoystick')
    .factory('artJoystickExternal', function(){
        /**
         * Service to manipulate the component from outside
         *  -
         * */

        return {};
    })
    .factory('artDifferentialControl', function(){


        /** Differential Direction Control (Differential Drive/Differential wheel) **/

        //TODO: This will definitely have to change when I change the pxToCarthesian function!

        // Differential Steering inspiration / copy / paste from: https://github.com/dlindahl/diff-steer
        // Lodash Clamp from https://github.com/lodash


        var baseClamp = function baseClamp(number, lower, upper) {
            if (number === number) {
                if (upper !== undefined) {
                    number = number <= upper ? number : upper;
                }
                if (lower !== undefined) {
                    number = number >= lower ? number : lower;
                }
            }
            return number;
        };

        var clamp = function clamp(number, lower, upper) {
            if (upper === undefined) {
                upper = lower;
                lower = undefined;
            }
            if (upper !== undefined) {
                upper = parseFloat(upper);
                upper = upper === upper ? upper : 0;
            }
            if (lower !== undefined) {
                lower = parseFloat(lower);
                lower = lower === lower ? lower : 0;
            }
            return baseClamp(parseFloat(number), lower, upper);
        };


        var diffSteer = function diffSteer(leftRightAxis, upDownAxis, maxAxis, minAxis, maxSpeed, axisFlip) {
            var direction = 0;
            var leftMotorNoThrottleScale = 0;
            var leftMotorOutput = 0;
            var leftMotorScale = 0;
            var rightMotorNoThrottleTurnScale = 0;
            var rightMotorOutput = 0;
            var rightMotorScale = 0;
            var throttle;
            if(typeof axisFlip === 'undefined') {
                axisFlip = diffSteer.axisFlip;
            }
            if(typeof maxAxis === 'undefined') {
                maxAxis = diffSteer.maxAxis;
            }
            if(typeof minAxis === 'undefined') {
                minAxis = diffSteer.minAxis;
            }
            if(typeof maxSpeed === 'undefined') {
                maxSpeed = diffSteer.maxSpeed;
            }

            //console.log(leftRightAxis, upDownAxis, maxAxis, minAxis, maxSpeed, axisFlip);

            // Calculate Throttled Steering Motor values
            direction = leftRightAxis / maxAxis;

            // Turn with with throttle
            leftMotorScale = upDownAxis * (1 + direction);
            leftMotorScale = clamp(leftMotorScale, minAxis, maxAxis); // Govern Axis to Minimum and Maximum range
            rightMotorScale = upDownAxis * (1 - direction);
            rightMotorScale = clamp(rightMotorScale, minAxis, maxAxis); // Govern Axis to Minimum and Maximum range

            // Calculate No Throttle Steering Motors values (Turn with little to no throttle)
            throttle = 1 - Math.abs(upDownAxis / maxAxis); // Throttle inverse magnitude (1 = min, 0 = max)
            leftMotorNoThrottleScale = -leftRightAxis * throttle;
            rightMotorNoThrottleTurnScale = leftRightAxis * throttle;

            // Calculate final motor output values
            leftMotorOutput = (leftMotorScale + leftMotorNoThrottleScale) * axisFlip;
            leftMotorOutput = clamp(leftMotorOutput, minAxis, maxAxis);
            rightMotorOutput = (rightMotorScale + rightMotorNoThrottleTurnScale) * axisFlip;
            rightMotorOutput = clamp(rightMotorOutput, minAxis, maxAxis);

            //console.log('l', leftMotorOutput, 'r', rightMotorOutput);
            //console.log([maxSpeed * leftMotorOutput, maxSpeed * rightMotorOutput]);
            return [maxSpeed * leftMotorOutput, maxSpeed * rightMotorOutput];
        };
        diffSteer.axisFlip = -1;
        diffSteer.maxAxis = 1;
        diffSteer.maxSpeed = 255;
        diffSteer.minAxis = -1;


        return {
            calculate: function(leftRightAxis, upDownAxis, maxAxis, minAxis, maxSpeed, axisFlip) {
                return diffSteer(leftRightAxis, upDownAxis, maxAxis, minAxis, maxSpeed, axisFlip);
            }
        };

    })
    .directive('artJoystick',['$parse', '$document', '$timeout', '$compile', 'artJoystickExternal', 'artDifferentialControl',
        function($parse, $document, $timeout, $compile, artJoystickExternal, artDifferentialControl){
            return {
                restrict: 'E',
                scope: {
                    sendMovement: '&',          // will callback one of: {response: {left: speed, right: speed}}, {response: {angle: 27, speed: speed}}. {response: {direction: 'up-left', speed: speed}}

                    cordovaEnabled: "=",        // If enabled, find the cordova extension and run the events through that

                    vibrationEnabled: "=",      // If enabled, try to find some vibration controls and run then

                    speedIncrease: "=",         // 'linear', 'exponential'

                    maxPositiveSpeed: "=",      // Maximum positive (forward) speed

                    maxNegativeSpeed: "=",      // Maximum negative (backward) speed

                    directionManagement: "=",   // 'differential' - means we send acceleration for each wheel through the callback (real devices)
                                                // 'angle' - we send the angle of movement and acceleration through the callback (real / on-screen interactive element)
                                                // 'directions': - we send 'up', 'up-left', 'up-right', 'left', 'right', 'down-left', (on-screen interactive element)
                                                //                  'down-right' and acceleration through the callback **/
                    controlSize: "=", // The size in pixels of the control on page, max 300.
                    speedDebug: "=" // The size in pixels of the control on page, max 300.
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
                        touchedCenter: [],
                        elementPosition: element[0].getBoundingClientRect(),
                        cordova: function(){if (scope.cordovaEnabled) {return true;} else {return false;}},
                        debug: function(){if (scope.speedDebug) {return true;} else {return false;}},
                        vibrationEnabled: function(){if (scope.vibrationEnabled) {return true;} else {return false;}},
                        speedIncrease: function(){if (scope.speedIncrease === 'exponential') {return 'exponential';} else {return 'linear';}}, //Linear by default
                        maxPositiveSpeed: scope.maxPositiveSpeed || 255, // Shouldn't be undefined, but still ...
                        maxNegativeSpeed: scope.maxNegativeSpeed || -255,// Shouldn't be undefined, but still ...
                        directionManagement: function(){
                            if (scope.directionManagement === 'angle') {
                                return 'angle';
                            } else if (scope.directionManagement === 'directions') {
                                return 'directions';
                            } else {
                                return 'differential';
                            }
                        },
                        controlSize: function(){if (scope.controlSize && parseInt(scope.controlSize)) {return parseInt(scope.controlSize);} else {return false;}},
                        pixelToSpeedRatio: 0,
                        radius: 0,
                        timeoutToStop: 700,
                        singleButton: false
                    };
                    
                    scope.debug = settings.debug();

                    scope.actual = {
                        x: 0,
                        y: 0,
                        speed: 0,
                        arrows: {
                            up: 0,
                            down: 0,
                            left: 0,
                            right: 0
                        },
                        finalWheelSpeedLeft: 0,
                        finalWheelSpeedRight: 0
                    };

                    /** Movement / UI / Positioning **/
                    
                    //// Control Size

                        if (settings.controlSize()) {
                            angular.element(element.children()).css({width: settings.controlSize() + 'px', height: settings.controlSize() + 'px'});
                        }


                    $timeout(function(){
                        settings.center = [button[0].offsetLeft, button[0].offsetTop];
                        button.css({'left': settings.center[0] + 'px'});
                        button.css({'top': settings.center[1] + 'px'});
                    }, 500);



                    //// Hooking Up Events

                    var stopMovement = 0;

                    //Touch

                    var touchEventPresent = 0;
                    var touchMove = function(event) {
                        var touch = event[touchEventPresent][0];
                        moveJoystick(touch.clientX, touch.clientY);
                    };

                    button.on('touchstart', function touchstart(event){
                        settings.moving = 1;
                        $timeout.cancel(stopMovement);
                        //console.log('touchstart', event);
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
                        angular.element(window).on('touchmove', touchMove);
                    });

                    angular.element(window).on('touchend', function touchend(event){
                        //console.log('touchend', event);
                        stopMovement = $timeout(function(){
                            settings.moving = 0;
                        }, settings.timeoutToStop);

                        returnJoystick(button);
                        angular.element(window).off('touchmove', touchMove);
                    });



                    //Mouse
                    var mouseMove = function(event) {
                        moveJoystick(event.clientX, event.clientY);
                    };

                    button.on('mousedown', function mousedown(event){
                        //console.log('mousedown', event);
                        settings.moving = 1;
                        $timeout.cancel(stopMovement);
                        //Calculate the center of touch from the moment the user clicks on the button
                        settings.touchedCenter = [event.clientX, event.clientY];
                        angular.element(window).on('mousemove', mouseMove);
                    });

                    //button.on('mouseup', function mouseup(event){
                    angular.element(window).on('mouseup', function mouseup(event){
                        //console.log('mouseup', event);
                        stopMovement = $timeout(function(){
                            settings.moving = 0;
                        }, settings.timeoutToStop);

                        returnJoystick(button);
                        angular.element(window).off('mousemove', mouseMove);
                    });



                    // Watching joystick actions

                    // Animation Frame is a much more smoother experience
                    function step(timestamp) {
                        if (settings.moving) {
                            scope.actual.x = button[0].offsetLeft;
                            scope.actual.y = button[0].offsetTop;
                            calculateDirectionAndSpeed(scope.actual.x, scope.actual.y);
                        }
                        if (settings.singleButton) {
                            //TODO: As long as the button is pressed, run this function
                            calculateSingleMovement(settings.singleButton, timestamp);
                        }
                        window.requestAnimationFrame(step);
                    }

                    window.requestAnimationFrame(step);


                    // Moving the joystick & utilities

                    var limit = function limit(x, y, cenx, ceny, r) {
                        var dist = distance([x, y], [cenx, ceny]);
                        if (dist <= r) {
                            return {
                                x: x,
                                y: y
                            };
                        } else {
                            x = x - cenx;
                            y = y - ceny;
                            var radians = Math.atan2(y, x);
                            return {
                                x: Math.cos(radians) * r + cenx,
                                y: Math.sin(radians) * r + ceny
                            };
                        }
                    };

                    var distance = function distance(dot1, dot2) {
                        var x1 = dot1[0],
                            y1 = dot1[1],
                            x2 = dot2[0],
                            y2 = dot2[1];
                        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
                    };

                    var moveJoystick = function moveJoystick(x,y) {
                        var center = settings.center[0];
                        var circle_cenx = center;
                        var circle_ceny = center;
                        var circle_radius = center - 20;
                        settings.radius = circle_radius;

                        var moveX = x - settings.touchedCenter[0];
                        var moveY = y - settings.touchedCenter[1];

                        var result = limit(
                            settings.center[0] + moveX,
                            settings.center[1] + moveY,
                            circle_cenx,
                            circle_ceny,
                            circle_radius
                        );

                        button.css({'left': result.x + 'px'}).css({'top': result.y + 'px'});
                        scope.$apply();
                    };

                    // Return the joystick to its default position
                    var returnJoystick = function returnJoystick(button){
                        // If no other action has been taken, return the joystick to its initial position
                        button.addClass('returning');

                        $timeout(function(){
                            button.css({'left': settings.center[0] + 'px', 'top': settings.center[1] + 'px'});
                        }, settings.timeoutToStop - 500);

                        $timeout(function(){
                            button.removeClass('returning');
                        }, settings.timeoutToStop);
                    };

                    /** Math for speed / direction **/

                    //// Utilities

                    var pxToCarthesian = function pxToCarthesian(x,y){

                        var divider = 100;
                        if (settings.center[0] > 100) {
                            divider = 1000;
                        }

                        var centerX = settings.center[0];
                        var centerY = settings.center[1];


                        // This is not carthesian, at all ... f**k it.
                        //Make all the number in the range of 1 <> -1, otherwise the algorithm returns gibberish ... //TODO: <<<<
                        return [-(x - centerX)/divider, -(y - centerY)/divider];

                    };

                    // This should run only once
                    var pxToSpeedRatio = function(){

                        var pixels = settings.radius;

                        if (settings.speedIncrease() === 'linear') {

                            var ratio = settings.maxPositiveSpeed / pixels;
                            settings.pixelToSpeedRatio = ratio;
                            return ratio;

                        } else {

                            //TODO: Make the logic for this
                            console.log('Exponential');

                        }

                    };

                    var calculateDirectionAndSpeed = function calculateDirectionAndSpeed(x,y) {

                        var position = pxToCarthesian(x,y); // Returns and array [x,y]
                        var speedRatio = settings.pixelToSpeedRatio || pxToSpeedRatio();

                        if (settings.directionManagement() === 'differential') {
                            differentialControl(position, speedRatio);
                        }
                        //TODO: The other direction management options

                    };

                    // Single Button press movement
                    var initialDelta = 0;
                    var stopSingleMovement = 0;
                    var calculateSingleMovement = function calculatSingleMovement(direction, delta) {
                        $timeout.cancel(stopSingleMovement);

                        if (!initialDelta) {
                            initialDelta = delta;
                        }

                        //TODO: Increase to max speed in 2 seconds

                        stopSingleMovement = $timeout(function(){
                            //TODO: Decrease to 0 in 2 seconds
                         }, 2000);



                        console.log(direction);
                    };



                    /** Direction management options **/

                    var differentialControl = function(pos,ratio) {

                        /** Adjustments by adaptorel
                         *
                         *  I won't dwell much on this at the moment, I'll need to refine/test the differential calculation algorithm.
                         * */

                        var wheels = artDifferentialControl.calculate(pos[0], pos[1], undefined, undefined, settings.maxPositiveSpeed);

                        var l = wheels[0];
                        if (l > 50) {
                            l = 50 + l;
                        } else if (l < -50) {
                            l = l - 50;
                        } else {
                            l = 0;
                        }

                        var r = wheels[1];
                        if (r > 50) {
                            r = 50 + r;
                        } else if (r < -50) {
                            r = r - 50;
                        } else {
                            r = 0;
                        }

                        // Curve / Corner Case

                        // Smoother curves
                        /*if (l - r > 200) {
                            r += 70
                        } else if (l - r < -200) {
                            l += 70
                        }*/

                        scope.actual.finalWheelSpeedLeft = parseInt(0 - l);
                        scope.actual.finalWheelSpeedRight = parseInt(0 - r);

                        scope.sendMovement({response: {left: 0 - l, right: 0 - r}});
                        /*console.log('Sent Params', 'x', pos[0], 'y', pos[1], 'maxAxis', settings.radius || (settings.center[0] - 20), 'minAxis', - (settings.radius || (settings.center[0] -20)), 'maxSpeed', settings.maxPositiveSpeed, 1);
                        console.info('artDifferentialControl', artDifferentialControl.calculate(pos[0], pos[1], settings.radius || (settings.center[0] -20), - (settings.radius || (settings.center[0] - 20)), settings.maxPositiveSpeed, 1));*/
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
    "    <div class=\"art-joystick-area\">\n" +
    "        <div class=\"art-joystick\">\n" +
    "            <div class=\"art-button\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"art-arrow-up art-arrow\" ng-mousedown=\"simpleDirection.up()\"></div>\n" +
    "    <div class=\"art-arrow-down art-arrow\" ng-mousedown=\"simpleDirection.up()\"></div>\n" +
    "    <div class=\"art-arrow-left art-arrow\" ng-mousedown=\"simpleDirection.up()\"></div>\n" +
    "    <div class=\"art-arrow-right art-arrow\" ng-mousedown=\"simpleDirection.up()\"></div>\n" +
    "    <div ng-if=\"debug\" class=\"art-debug\">\n" +
    "        <p><small>L:</small> {{actual.finalWheelSpeedLeft}}</p>\n" +
    "        <p><small>R:</small> {{actual.finalWheelSpeedRight}}</p>\n" +
    "    </div>\n" +
    "</div>"
  );

}]);
