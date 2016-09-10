# angular-joystick [![Build Status](https://travis-ci.org/arthurianx/angular-joystick.png?branch=master)](https://travis-ci.org/arthurianx/angular-joystick)

> Angular Joystick component for hybrid games.

## Demo

[Live Demo](http://arthurianx.github.io/angular-joystick/demo)

## Getting Started

Install with Bower or download the files directly from the dist folder in the repo.

```bash
bower install angular-joystick --save
```

Add `dist/angular-joystick.js` and `dist/angular-joystick.css` to your index.html.


Add `artJoystick` as a module dependency for your module.

```js
angular.module('your_app', ['artJoystick']);
```

## Options


You can use it like this:

```html
<div art-joystick ></div>
```

There's also a full set of options:



* `art-joystick` - The main directive declaration. Example usage `<art-joystick levels="tiers" pagination="true" trigger="callbackID(id, type)" source="dataEndpoint"></art-joystick>`

## Release History
 * v0.1.1 - Launch gh-pages.
 * v0.1.0 - Initial release.

## TODO
 
