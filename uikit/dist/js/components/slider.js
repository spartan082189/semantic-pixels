/*! UIkit 3.0.0-beta.35 | http://www.getuikit.com | (c) 2014 - 2017 YOOtheme | MIT License */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('uikitslider', factory) :
	(global.UIkitSlider = factory());
}(this, (function () { 'use strict';

function AnimationsPlugin (UIkit) {

    var ref = UIkit.util;
    var css = ref.css;

    var Animations = {

        slide: {

            show: function show(dir) {
                return [
                    {transform: translate(dir * -100)},
                    {transform: translate()}
                ];
            },

            percent: function percent(current) {
                return Animations.translated(current);
            },

            translate: function translate$1(percent, dir) {
                return [
                    {transform: translate(dir * -100 * percent)},
                    {transform: translate(dir * 100 * (1 - percent))}
                ];
            }

        },

        translated: function translated(el) {
            return Math.abs(css(el, 'transform').split(',')[4] / el.offsetWidth) || 0;
        }

    };

    return Animations;

}

function translate(value, unit) {
    if ( value === void 0 ) value = 0;
    if ( unit === void 0 ) unit = '%';

    return ("translate(" + value + (value ? unit : '') + ", 0)"); // currently not translate3d to support IE, translate3d within translate3d does not work while transitioning
}

function TransitionerPlugin (UIkit) {

    var ref = UIkit.util;
    var createEvent = ref.createEvent;
    var clamp = ref.clamp;
    var css = ref.css;
    var Deferred = ref.Deferred;
    var noop = ref.noop;
    var Promise = ref.Promise;
    var Transition = ref.Transition;
    var trigger = ref.trigger;

    function Transitioner(prev, next, dir, ref) {
        var animation = ref.animation;
        var easing = ref.easing;


        var percent = animation.percent;
        var translate = animation.translate;
        var show = animation.show; if ( show === void 0 ) show = noop;
        var props = show(dir),
            deferred = new Deferred();

        return {

            dir: dir,

            show: function show(duration, percent, linear) {
                var this$1 = this;
                if ( percent === void 0 ) percent = 0;


                var timing = linear ? 'linear' : easing;
                duration -= Math.round(duration * clamp(percent, -1, 1));

                this.translate(percent);

                triggerUpdate(next, 'itemin', {percent: percent, duration: duration, timing: timing, dir: dir});
                triggerUpdate(prev, 'itemout', {percent: 1 - percent, duration: duration, timing: timing, dir: dir});

                Promise.all([
                    Transition.start(next, props[1], duration, timing),
                    Transition.start(prev, props[0], duration, timing)
                ]).then(function () {
                    this$1.reset();
                    deferred.resolve();
                }, noop);

                return deferred.promise;
            },

            stop: function stop() {
                return Transition.stop([next, prev]);
            },

            cancel: function cancel() {
                Transition.cancel([next, prev]);
            },

            reset: function reset() {
                for (var prop in props[0]) {
                    css([next, prev], prop, '');
                }
            },

            forward: function forward(duration, percent) {
                if ( percent === void 0 ) percent = this.percent();

                Transition.cancel([next, prev]);
                return this.show(duration, percent, true);

            },

            translate: function translate$1(percent) {

                var props = translate(percent, dir);
                css(next, props[1]);
                css(prev, props[0]);
                triggerUpdate(next, 'itemtranslatein', {percent: percent, dir: dir});
                triggerUpdate(prev, 'itemtranslateout', {percent: 1 - percent, dir: dir});

            },

            percent: function percent$1() {
                return percent(prev || next, next, dir);
            },

            getDistance: function getDistance() {
                return prev.offsetWidth;
            }

        };

    }

    function triggerUpdate(el, type, data) {
        trigger(el, createEvent(type, false, false, data));
    }

    return Transitioner;

}

function plugin$2(UIkit) {

    if (plugin$2.installed) {
        return;
    }

    var ref = UIkit.util;
    var $ = ref.$;
    var $$ = ref.$$;
    var addClass = ref.addClass;
    var assign = ref.assign;
    var clamp = ref.clamp;
    var data = ref.data;
    var doc = ref.doc;
    var fastdom = ref.fastdom;
    var getIndex = ref.getIndex;
    var getPos = ref.getPos;
    var hasClass = ref.hasClass;
    var html = ref.html;
    var includes = ref.includes;
    var index = ref.index;
    var isNumber = ref.isNumber;
    var isRtl = ref.isRtl;
    var isTouch = ref.isTouch;
    var off = ref.off;
    var on = ref.on;
    var pointerDown = ref.pointerDown;
    var pointerMove = ref.pointerMove;
    var pointerUp = ref.pointerUp;
    var preventClick = ref.preventClick;
    var Promise = ref.Promise;
    var removeClass = ref.removeClass;
    var toggleClass = ref.toggleClass;
    var toNodes = ref.toNodes;
    var trigger = ref.trigger;
    var win = ref.win;

    var Animations = AnimationsPlugin(UIkit),
        Transitioner = TransitionerPlugin(UIkit);

    UIkit.mixin.slideshow = {

        attrs: true,

        props: {
            animation: String,
            autoplay: Boolean,
            autoplayInterval: Number,
            easing: String,
            index: Number,
            finite: Boolean,
            pauseOnHover: Boolean,
            velocity: Number
        },

        defaults: {
            animation: 'slide',
            autoplay: false,
            autoplayInterval: 7000,
            easing: 'ease',
            finite: false,
            pauseOnHover: true,
            velocity: 1,
            index: 0,
            stack: [],
            threshold: 10,
            percent: 0,
            clsActive: 'uk-active',
            clsActivated: 'uk-transition-active',
            selNav: false,
            easingOut: 'cubic-bezier(0.250, 0.460, 0.450, 0.940)', /* easeOutQuad */
            Animations: Animations,
            Transitioner: Transitioner,
            transitionOptions: {},
            preventCatch: false
        },

        computed: {

            animation: function animation(ref) {
                var animation = ref.animation;
                var Animations = ref.Animations;

                return assign(animation in Animations ? Animations[animation] : Animations.slide, {name: animation});
            },

            duration: function duration(ref, $el) {
                var velocity = ref.velocity;

                return speedUp($el.offsetWidth / velocity);
            },

            length: function length() {
                return this.slides.length;
            },

            list: function list(ref, $el) {
                var selList = ref.selList;

                return $(selList, $el);
            },

            maxIndex: function maxIndex() {
                return this.length - 1;
            },

            nav: function nav(ref, $el) {
                var selNav = ref.selNav;

                return $(selNav, $el);
            },

            navItemSelector: function navItemSelector(ref) {
                var attrItem = ref.attrItem;

                return ("[" + attrItem + "],[data-" + attrItem + "]");
            },

            navItems: function navItems(_, $el) {
                return $$(this.navItemSelector, $el);
            },

            slidesSelector: function slidesSelector(ref) {
                var selList = ref.selList;

                return (selList + " > *");
            },

            slides: function slides() {
                return toNodes(this.list.children);
            },

            transitionOptions: function transitionOptions() {
                return {animation: this.animation};
            }

        },

        init: function init() {
            var this$1 = this;

            ['start', 'move', 'end'].forEach(function (key) {
                var fn = this$1[key];
                this$1[key] = function (e) {

                    var pos = getPos(e).x * (isRtl ? -1 : 1);

                    this$1.prevPos = pos !== this$1.pos ? this$1.pos : this$1.prevPos;
                    this$1.pos = pos;

                    fn(e);
                };
            });
        },

        connected: function connected() {
            this.startAutoplay();
        },

        disconnected: function disconnected() {
            this.stopAutoplay();
        },

        update: [

            {

                read: function read() {
                    delete this._computeds.duration;
                },

                write: function write() {
                    var this$1 = this;


                    if (this.nav && this.length !== this.nav.children.length) {
                        html(this.nav, this.slides.map(function (_, i) { return ("<li " + (this$1.attrItem) + "=\"" + i + "\"><a href=\"#\"></a></li>"); }).join(''));
                    }

                    toggleClass($$(("[" + (this.attrItem) + "],[data-" + (this.attrItem) + "]"), this.$el).concat(this.nav), 'uk-hidden', !this.maxIndex);

                    var index = this.getValidIndex();
                    delete this.index;
                    removeClass(this.slides, this.clsActive, this.clsActivated);
                    this.show(index);

                },

                events: ['load', 'resize']

            }

        ],

        events: [

            {

                name: 'click',

                delegate: function delegate() {
                    return this.navItemSelector;
                },

                handler: function handler(e) {
                    e.preventDefault();
                    e.current.blur();
                    this.show(data(e.current, this.attrItem));
                }

            },

            {

                name: 'itemshow',

                self: true,

                delegate: function delegate() {
                    return this.slidesSelector;
                },

                handler: function handler() {
                    var this$1 = this;

                    var i = this.getValidIndex();
                    this.navItems.forEach(function (item) { return toggleClass(item, this$1.clsActive, index(item) === i); });
                }

            },

            {

                name: pointerDown,

                delegate: function delegate() {
                    return this.slidesSelector;
                },

                handler: function handler(e) {
                    if (isTouch(e) || !hasTextNodesOnly(e.target)) {
                        this.start(e);
                    }
                }

            },

            {

                name: 'visibilitychange',

                el: doc,

                handler: function handler() {
                    if (doc.hidden) {
                        this.stopAutoplay();
                    } else {
                        this.startAutoplay();
                    }
                }

            },

            {

                name: pointerDown,
                handler: 'stopAutoplay'

            },

            {

                name: 'mouseenter',

                filter: function filter() {
                    return this.autoplay;
                },

                handler: function handler() {
                    this.isHovering = true;
                }

            },

            {

                name: 'mouseleave',

                filter: function filter() {
                    return this.autoplay;
                },

                handler: function handler() {
                    this.isHovering = false;
                }

            },

            {

                name: 'beforeitemshow',

                self: true,

                delegate: function delegate() {
                    return this.slidesSelector;
                },

                handler: function handler(ref) {
                    var target = ref.target;

                    addClass(target, this.clsActive);
                }

            },

            {

                name: 'itemshown',

                self: true,

                delegate: function delegate() {
                    return this.slidesSelector;
                },

                handler: function handler(ref) {
                    var target = ref.target;

                    addClass(target, this.clsActivated);
                }

            },

            {

                name: 'itemhidden',

                self: true,

                delegate: function delegate() {
                    return this.slidesSelector;
                },

                handler: function handler(ref) {
                    var target = ref.target;

                    removeClass(target, this.clsActive, this.clsActivated);
                }

            },

            {

                name: 'itemshow itemhide itemshown itemhidden',

                self: true,

                delegate: function delegate() {
                    return this.slidesSelector;
                },

                handler: function handler(ref) {
                    var target = ref.target;

                    UIkit.update(null, target);
                }

            },

            {
                name: 'dragstart',

                handler: function handler(e) {
                    e.preventDefault();
                }
            }

        ],

        methods: {

            start: function start(e) {

                if (e.button > 0 || this.length < 2) {
                    return;
                }

                if (this.preventCatch) {
                    return;
                }

                this.drag = this.pos;

                if (this._transitioner) {

                    this.percent = this._transitioner.percent();
                    this.drag += this._transitioner.getDistance() * this.percent * this.dir;

                    this._transitioner.translate(this.percent);
                    this._transitioner.cancel();

                    this.dragging = true;

                    this.stack = [];

                } else {
                    this.prevIndex = this.index;
                }

                this.unbindMove = on(doc, pointerMove, this.move, {capture: true, passive: false});
                on(win, 'scroll', this.unbindMove);
                on(doc, pointerUp, this.end, true);

            },

            move: function move(e) {
                var this$1 = this;


                var distance = this.pos - this.drag;

                if (distance === 0 || this.prevPos === this.pos || !this.dragging && Math.abs(distance) < this.threshold) {
                    return;
                }

                e.cancelable && e.preventDefault();

                this.dragging = true;
                this.dir = (distance < 0 ? 1 : -1);

                var slides = this.slides,
                    prevIndex = this.prevIndex,
                    dis = Math.abs(distance),
                    nextIndex = this.getIndex(prevIndex + this.dir, prevIndex),
                    width = this._getDistance(prevIndex, nextIndex) || slides[prevIndex].offsetWidth;

                while (nextIndex !== prevIndex && dis > width) {

                    this$1.drag -= width * this$1.dir;

                    prevIndex = nextIndex;
                    dis -= width;
                    nextIndex = this$1.getIndex(prevIndex + this$1.dir, prevIndex);
                    width = this$1._getDistance(prevIndex, nextIndex) || slides[prevIndex].offsetWidth;

                }

                this.percent = dis / width;

                var prev = slides[prevIndex],
                    next = slides[nextIndex],
                    changed = this.index !== nextIndex,
                    edge = prevIndex === nextIndex;

                [this.index, this.prevIndex].filter(function (i) { return !includes([nextIndex, prevIndex], i); }).forEach(function (i) {
                    trigger(slides[i], 'itemhidden', [this$1]);

                    this$1._transitioner && this$1._transitioner.reset();

                    if (edge) {
                        this$1.prevIndex = prevIndex;
                    }

                });

                if (this.index === prevIndex && this.prevIndex !== prevIndex) {
                    trigger(slides[this.index], 'itemshown', [this]);
                }

                if (changed) {
                    this.prevIndex = prevIndex;
                    this.index = nextIndex;

                    !edge && trigger(prev, 'beforeitemhide', [this]);
                    trigger(next, 'beforeitemshow', [this]);
                }

                this._transitioner = this._translate(Math.abs(this.percent), prev, !edge && next);

                if (changed) {
                    !edge && trigger(prev, 'itemhide', [this]);
                    trigger(next, 'itemshow', [this]);
                }

            },

            end: function end() {

                off(win, 'scroll', this.unbindMove);
                this.unbindMove();
                off(doc, pointerUp, this.end, true);

                if (this.dragging) {

                    this.dragging = null;

                    if (this.index === this.prevIndex) {
                        this.percent = 1 - this.percent;
                        this.dir *= -1;
                        this._show(false, this.index, true);
                        this._transitioner = null;
                    } else {

                        var dirChange = (isRtl ? this.dir * (isRtl ? 1 : -1) : this.dir) < 0 === this.prevPos > this.pos;
                        this.index = dirChange ? this.index : this.prevIndex;

                        if (dirChange) {
                            this.percent = 1 - this.percent;
                        }

                        this.show(this.dir > 0 && !dirChange || this.dir < 0 && dirChange ? 'next' : 'previous', true);
                    }

                    preventClick();

                }

                this.drag
                    = this.percent
                    = null;

            },

            show: function show(index, force) {
                var this$1 = this;
                if ( force === void 0 ) force = false;


                if (this.dragging || !this.length) {
                    return;
                }

                var stack = this.stack,
                    queueIndex = force ? 0 : stack.length,
                    reset = function () {
                        stack.splice(queueIndex, 1);

                        if (stack.length) {
                            this$1.show(stack.shift(), true);
                        }
                    };

                stack[force ? 'unshift' : 'push'](index);

                if (!force && stack.length > 1) {

                    if (stack.length === 2) {
                        this._transitioner.forward(200);
                    }

                    return;
                }

                var prevIndex = this.index,
                    prev = hasClass(this.slides, this.clsActive) && this.slides[prevIndex],
                    nextIndex = this.getIndex(index, this.index),
                    next = this.slides[nextIndex];

                if (prev === next) {
                    reset();
                    return;
                }

                this.dir = getDirection(index, prevIndex);
                this.prevIndex = prevIndex;
                this.index = nextIndex;

                prev && trigger(prev, 'beforeitemhide', [this]);
                if (!trigger(next, 'beforeitemshow', [this, prev])) {
                    this.index = this.prevIndex;
                    reset();
                    return;
                }

                var promise = this._show(prev, next, force).then(function () {

                    prev && trigger(prev, 'itemhidden', [this$1]);
                    trigger(next, 'itemshown', [this$1]);

                    return new Promise(function (resolve) {
                        fastdom.write(function () {
                            stack.shift();
                            if (stack.length) {
                                this$1.show(stack.shift(), true);
                            } else {
                                this$1._transitioner = null;
                            }
                            resolve();
                        });
                    });

                });

                prev && trigger(prev, 'itemhide', [this]);
                trigger(next, 'itemshow', [this]);

                prev && fastdom.flush(); // iOS 10+ will honor the video.play only if called from a gesture handler

                return promise;

            },

            getIndex: function getIndex$1(index, prev) {
                if ( index === void 0 ) index = this.index;
                if ( prev === void 0 ) prev = this.index;

                return clamp(getIndex(index, this.slides, prev, this.finite), 0, this.maxIndex);
            },

            getValidIndex: function getValidIndex(index, prevIndex) {
                if ( index === void 0 ) index = this.index;
                if ( prevIndex === void 0 ) prevIndex = this.prevIndex;

                return this.getIndex(index, prevIndex);
            },

            startAutoplay: function startAutoplay() {
                var this$1 = this;


                this.stopAutoplay();

                if (this.autoplay) {
                    this.interval = setInterval(function () {
                        if (!(this$1.isHovering && this$1.pauseOnHover) && !this$1.stack.length) {
                            this$1.show('next');
                        }
                    }, this.autoplayInterval);
                }

            },

            stopAutoplay: function stopAutoplay() {
                if (this.interval) {
                    clearInterval(this.interval);
                }
            },

            _show: function _show(prev, next, force) {

                this._transitioner = this._getTransitioner(
                    prev,
                    next,
                    this.dir,
                    assign({easing: force ? this.easingOut : this.easing}, this.transitionOptions)
                );

                if (!force && !prev) {
                    this._transitioner.translate(1);
                    return Promise.resolve();
                }

                var length = this.stack.length;

                return this._transitioner[length > 1 ? 'forward' : 'show'](length > 1 ? 75 + 75 / (length - 1) : this.duration, this.percent);

            },

            _getDistance: function _getDistance(prev, next) {
                return new this._getTransitioner(prev, prev !== next && next).getDistance();
            },

            _translate: function _translate(percent, prev, next) {
                if ( prev === void 0 ) prev = this.prevIndex;
                if ( next === void 0 ) next = this.index;

                var transitioner = this._getTransitioner(prev !== next ? prev : false, next);
                transitioner.translate(percent);
                return transitioner;
            },

            _getTransitioner: function _getTransitioner(prev, next, dir, options) {
                if ( dir === void 0 ) dir = this.dir || 1;
                if ( options === void 0 ) options = this.transitionOptions;

                return new this.Transitioner(
                    isNumber(prev) ? this.slides[prev] : prev,
                    isNumber(next) ? this.slides[next] : next,
                    dir * (isRtl ? -1 : 1),
                    options
                );
            }

        }

    };

    function getDirection(index, prevIndex) {
        return index === 'next'
            ? 1
            : index === 'previous'
                ? -1
                : index < prevIndex
                    ? -1
                    : 1;
    }

    function hasTextNodesOnly(el) {
        return !el.children.length && el.childNodes.length;
    }

}

function speedUp(x) {
    return .5 * x + 300; // parabola through (400,500; 600,600; 1800,1200)
}

function TransitionerPlugin$1 (UIkit) {

    var ref = UIkit.util;
    var clamp = ref.clamp;
    var css = ref.css;
    var Deferred = ref.Deferred;
    var isRtl = ref.isRtl;
    var noop = ref.noop;
    var toNodes = ref.toNodes;
    var Transition = ref.Transition;

    function Transitioner(prev, next, dir, ref) {
        var center = ref.center;
        var easing = ref.easing;
        var list = ref.list;


        var deferred = new Deferred();

        var from = prev
                ? Transitioner.getLeft(prev, list, center)
                : Transitioner.getLeft(next, list, center) + next.offsetWidth * dir,
            to = next
                ? Transitioner.getLeft(next, list, center)
                : from + prev.offsetWidth * dir * (isRtl ? -1 : 1);

        return {

            dir: dir,

            show: function show(duration, percent, linear) {
                if ( percent === void 0 ) percent = 0;


                duration -= Math.round(duration * clamp(percent, -1, 1));

                this.translate(percent);

                Transition
                    .start(list, {transform: translate(-to * (isRtl ? -1 : 1), 'px')}, duration, linear ? 'linear' : easing)
                    .then(deferred.resolve, noop);

                return deferred.promise;

            },

            stop: function stop() {
                return Transition.stop(list);
            },

            cancel: function cancel() {
                Transition.cancel(list);
            },

            reset: function reset() {
                css(list, 'transform', '');
            },

            forward: function forward(duration, percent) {
                if ( percent === void 0 ) percent = this.percent();

                Transition.cancel(list);
                return this.show(duration, percent, true);
            },

            translate: function translate$1(percent) {

                var distance = this.getDistance() * dir * (isRtl ? -1 : 1);

                css(list, 'transform', translate(clamp(
                    -to + (distance - distance * percent),
                    -Transitioner.getWidth(list),
                    list.offsetWidth
                ) * (isRtl ? -1 : 1), 'px'));

            },

            percent: function percent() {
                return Math.abs((css(list, 'transform').split(',')[4] * (isRtl ? -1 : 1) + from) / (to - from));
            },

            getDistance: function getDistance() {
                return Math.abs(to - from);
            }

        };

    }

    Transitioner.getLeft = function (el, list, center) {

        var left = Transitioner.getElLeft(el, list);

        return center
            ? left - Transitioner.center(el, list)
            : Math.min(left, Transitioner.getMax(list));

    };

    Transitioner.getMax = function (list) {
        return Math.max(0, Transitioner.getWidth(list) - list.offsetWidth);
    };

    Transitioner.getWidth = function (list) {
        return toNodes(list.children).reduce(function (right, el) { return el.offsetWidth + right; }, 0);
    };

    Transitioner.getMaxWidth = function (list) {
        return toNodes(list.children).reduce(function (right, el) { return Math.max(right, el.offsetWidth); }, 0);
    };

    Transitioner.center = function (el, list) {
        return list.offsetWidth / 2 - el.offsetWidth / 2;
    };

    Transitioner.getElLeft = function (el, list) {
        return (el.offsetLeft + (isRtl ? el.offsetWidth - list.offsetWidth : 0)) * (isRtl ? -1 : 1);
    };

    return Transitioner;

}

function plugin(UIkit) {

    if (plugin.installed) {
        return;
    }

    UIkit.use(plugin$2);

    var mixin = UIkit.mixin;
    var ref = UIkit.util;
    var $$ = ref.$$;
    var css = ref.css;
    var data = ref.data;
    var fastdom = ref.fastdom;
    var includes = ref.includes;
    var isNumeric = ref.isNumeric;
    var toggleClass = ref.toggleClass;
    var toFloat = ref.toFloat;
    var Transitioner = TransitionerPlugin$1(UIkit);

    UIkit.component('slider', {

        mixins: [mixin.class, mixin.slideshow],

        props: {
            center: Boolean,
            sets: Boolean,
        },

        defaults: {
            center: false,
            sets: false,
            attrItem: 'uk-slider-item',
            selList: '.uk-slider-items',
            selNav: '.uk-slider-nav',
            Transitioner: Transitioner
        },

        computed: {

            finite: function finite(ref) {
                var finite = ref.finite;

                return finite || Transitioner.getWidth(this.list) < this.list.offsetWidth + Transitioner.getMaxWidth(this.list) + this.center;
            },

            maxIndex: function maxIndex() {
                var this$1 = this;


                if (!this.finite || this.center && !this.sets) {
                    return this.length - 1;
                }

                if (this.center) {
                    return this.sets[this.sets.length - 1];
                }

                css(this.slides, 'order', '');

                var max = Transitioner.getMax(this.list), i = this.length;

                while (i--) {
                    if (Transitioner.getElLeft(this$1.list.children[i], this$1.list) < max) {
                        return Math.min(i + 1, this$1.length - 1);
                    }
                }

                return 0;
            },

            sets: function sets(ref) {
                var this$1 = this;
                var sets = ref.sets;


                var width = this.list.offsetWidth / (this.center ? 2 : 1),
                    left = 0, leftCenter = width;

                css(this.slides, 'order', '');

                return sets && this.slides.reduce(function (sets, slide, i) {

                    var slideWidth = slide.offsetWidth,
                        slideLeft = Transitioner.getElLeft(slide, this$1.list),
                        slideRight = slideLeft + slideWidth;

                    if (slideRight > left) {

                        if (!this$1.center && i > this$1.maxIndex) {
                            i = this$1.maxIndex;
                        }

                        if (!includes(sets, i)) {

                            var cmp = this$1.slides[i + 1];
                            if (!(this$1.center && cmp && slideWidth < leftCenter - cmp.offsetWidth / 2)) {
                                leftCenter = width;
                                sets.push(i);
                                left = slideLeft + width + (this$1.center ? slideWidth / 2 : 0);
                            } else {
                                leftCenter -= slideWidth;
                            }

                        }
                    }

                    return sets;

                }, []);

            },

            transitionOptions: function transitionOptions() {
                return {
                    center: this.center,
                    list: this.list
                };
            }

        },

        ready: function ready() {
            var this$1 = this;

            fastdom.write(function () { return this$1.show(this$1.getValidIndex()); });
        },

        update: {

            read: function read() {
                this._resetComputeds();
            },

            write: function write() {
                var this$1 = this;


                $$(("[" + (this.attrItem) + "],[data-" + (this.attrItem) + "]"), this.$el).forEach(function (el) {
                    var index = data(el, this$1.attrItem);
                    this$1.maxIndex && toggleClass(el, 'uk-hidden', isNumeric(index) && (this$1.sets && !includes(this$1.sets, toFloat(index)) || index > this$1.maxIndex));
                });

            },

            events: ['load', 'resize']

        },

        events: [

            {

                name: 'beforeitemshow',

                self: true,

                delegate: function delegate() {
                    return ((this.selList) + " > *");
                },

                handler: function handler(e) {
                    var this$1 = this;


                    if (!this.dragging && this.sets && this.stack.length < 2 && !includes(this.sets, this.index)) {
                        this.index = this.getValidIndex();
                    }

                    var diff = Math.abs(this.index + (this.dir > 0
                        ? this.index < this.prevIndex ? this.maxIndex + 1 : 0
                        : this.index > this.prevIndex ? -this.maxIndex : 0
                    ) - this.prevIndex);

                    if (!this.dragging && diff > 1) {

                        for (var i = 0; i < diff; i++) {
                            this$1.stack.splice(1, 0, this$1.dir > 0 ? 'next' : 'previous');
                        }

                        e.preventDefault();
                        return;
                    }

                    this.duration = speedUp((this.dir < 0 || !this.slides[this.prevIndex] ? this.slides[this.index] : this.slides[this.prevIndex]).offsetWidth / this.velocity);

                    this.reorder();

                }

            }

        ],

        methods: {

            reorder: function reorder() {
                var this$1 = this;


                css(this.slides, 'order', '');

                if (this.finite) {
                    return;
                }

                this.slides.forEach(function (slide, i) { return css(slide, 'order', this$1.dir > 0 && i < this$1.prevIndex
                        ? 1
                        : this$1.dir < 0 && i >= this$1.index
                            ? -1
                            : ''
                    ); }
                );

                if (!this.center) {
                    return;
                }

                var index = this.dir > 0 && this.slides[this.prevIndex] ? this.prevIndex : this.index,
                    next = this.slides[index],
                    width = this.list.offsetWidth / 2 - next.offsetWidth / 2,
                    j = 0;

                while (width >= 0) {
                    var slideIndex = this$1.getIndex(--j + index, index),
                        slide = this$1.slides[slideIndex];

                    css(slide, 'order', slideIndex > index ? -2 : -1);
                    width -= slide.offsetWidth;
                }

            },

            getValidIndex: function getValidIndex(index, prevIndex) {
                var this$1 = this;
                if ( index === void 0 ) index = this.index;
                if ( prevIndex === void 0 ) prevIndex = this.prevIndex;


                index = this.getIndex(index, prevIndex);

                if (!this.sets) {
                    return index;
                }

                var prev;

                do {

                    if (includes(this$1.sets, index)) {
                        return index;
                    }

                    prev = index;
                    index = this$1.getIndex(index + this$1.dir, prevIndex);

                } while (index !== prev);

                return index;
            }

        }

    });

}

if (!false && typeof window !== 'undefined' && window.UIkit) {
    window.UIkit.use(plugin);
}

return plugin;

})));
