(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self , global.Avvimo = factory());
})(this, (function(){
  'use strict';
  const eventList = "abort canplay canplaythrough durationchange emptied ended error loadeddata loadedmetadata loadstart mediaerror pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting blur change focus formdata input invalid reset search select submit touchcancel touchend touchenter touchleave touchmove touchstart auxclick click contextmenu dblclick mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup mousewheel compositionend compositionstart compositionupdate keydown keypress keyup animationcancel animationend animationiteration animationstart transitioncancel transitionend transitionrun transitionstart beforeunload hashchange load message offline online pagehide pageshow popstate resize scroll unload wheel".split(" ");
  const htmlTags = 'a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup command data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hr html i iframe img input ins kbd label legend li link main map mark menu menuitem meta meter nav noscript object ol optgroup option output p param picture pre progress q rb rp rt rtc ruby s samp script section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var video wbr'.split(" ");

  /**
   * Check if the given value is an object.
   * @param {*} value - The value to check.
   * @returns {boolean} Returns `true` if the given value is an object, else `false`.
   */
  function isObject(value) {
    return typeof value === "object" && !Array.isArray(value) && value !== null;
  }
   /*
   * Check if the given value is a number.
   * @param {*} value - The value to check.
   * @returns {boolean} Returns `true` if the given value is a number, else `false`.
   */
  function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
  }
  
  /**
   * Check if the given value is a function.
   * @param {*} value - The value to check.
   * @returns {boolean} Returns `true` if the given value is a function, else `false`.
   */
  function isFunction(value) {
    return typeof value === 'function';
  }
  
  function isElement(value){
    return value && value.nodeType === Node.ELEMENT_NODE;
  }
  
  function isNodeList(value){
    return Object.prototype.toString.call(value) === '[object NodeList]' || Object.prototype.toString.call(value) === '[object HTMLCollection]';
  }
  
  function isEvent(value){
    return value && eventList.includes(value);
  }
  function throwError(massage){
    throw new Error (massage);
  }
  
  var Avvimo = function(){
    return {
      /**
      * add or remove className on the element.
      * @param {element} the document element child.
      * @param {value} the className to add or remove in classList.
      * @param {child} if element is any nodeList.
      */
      setClass: function(element, value, operation){
        if(!element || !value){return;}
        if(isNumber(element.length)){
          element.forEach((child)=>{
            this.setClass(child, value);
          });
        }
        if(element.classList){
          if(value.indexOf(" ") !==-1){
            element.classList = value;
          }else if(isFunction(element.classList[operation])){
            element.classList[operation](value);
          }
        }
      },
      /**
      * add event listener to element.
      * @param {type} the event type.
      * @param {callback} the handler funcion.
      * @example: element.addListener("clic", mayfunction).
      */
      addListener: function(element, type, callback, index){
        if(!element){throwError("Can not addEventListener on element "+element);}
        if(!isEvent(type)){throwError("event must be a type of eventListener, ("+type+") din't match any, or not supported");}
        if(element.length && !element.tagName){
          for(let i = 0; i < element.length; i++){
            this.addListener(element[i], type, callback, i);
          }
          return;
        }
        if(isFunction(callback) && isElement(element)){
          element.addEventListener(type, function(event){
            callback.call(this, event, index);
          });
        }
      },
      /**
       * Define style to element.
       * @param {element} element to receive the given style.
       * @param {style} the object style to set to the element style.
       * @param {callback} the function to call if exists.
      */
      setStyle: function (element, style, callback){
        if(!element){throwError("Can not add style on element of undefined");}
        if(!isObject(style)){throwError("Style should be a object");}
        if(isNumber(element.length)){
          for(let i = 0; i < element.length; i++){
            this.setStyle(element[i], style, callback);
          }
        }
        if(element.style){
          Object.entries(style).forEach(([key, value])=>{
            if (key.indexOf('-') !== -1) {
              element.style.setProperty(key, value);
            }else{element.style[key] = value;}
          });
          if(callback && isFunction(callback)){callback.call();}
        }
      },
     
      /**
       * Set content to element.
       * @param {element} the html element.
       * @param {content} the given content to element.
       * @param {callback} the callback function if exists.
       */
      setContent: function (element, content, callback){
        if(!element) {throwError("Can't set content in element of null");}
        if(isNodeList(element)){
          element.forEach((child)=>{
            this.setContent(child,content,callback);
          });
        }
        if(isElement(element)){
          if(isElement(content)){
            element.appendChild(content);
          }else{element.textContent = content;}
        }
        if(isFunction(callback)){
          callback.call(this, event);
        }
      },
      /**
       * Set attributes list to the element.
       * @param {element} the element html.
       * @param {attributes} the attributes list to set in element.
       */
      setAttributes: function (element, attributes) {
        if(!element && !isObject(element)){return;}
        if(isNodeList(element || isObject(element))){
          element.forEach((child)=>{
            this.setAttributes(child,attributes);
          });
        }
        if(isObject(attributes)){
          Object.entries(attributes).forEach(([key,value])=>{
            if(isFunction(element.setAttribute)){
              element.setAttribute(key, value);
            }
          });
        }
      },
      /**
       * Create new element.
       * @param {tag} the element node name.
       * @param {attributes} the attributes to set into the element.
       * @param {style} the style list to set in the element.
       * @param {content} the content to set in element if exists.
       */
      createElement: function (tag, attributes, style, content){
        if(!htmlTags.includes(tag)){throwError(tag+" tag is not supported");}
        tag = document.createElement(tag);
        if(isObject(attributes)){
          this.setAttributes(tag, attributes);
        }
        if(isObject(style)){this.setStyle(tag, style);}
        if(content){ this.setContent(tag, content);}
        return tag;
      },
      isNodeList: function(value){
        return isNodeList(value);
      }
    }
  }
  return Avvimo;
}));