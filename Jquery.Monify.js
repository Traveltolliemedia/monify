/**
* Monify
* Copyrighted Traveltollie Media
* Dependencies: JQuery 1.9+
*
* @class Monify
* @param {String} ad_types      comma seperated list: product, holiday, financial
*/
;(function($){
    
    Monify = function(el, options) {
    	
    	this.$el = $(el);
    	
    	this.options = $.extend({
            amazon_id: false,
            language: 'EN',
            popup: true,
            color_scheme: 'default',
            style_tooltip: {
            	'background-color': '#333',
            	'color': '#fff',
            	'border-radius': '10px',
            	'border': '2px solid #333',
            },
            style_a: 'text-decoration: underline;',
            max_word_length: 3,
            account: false,
            ad_types: 'products',
            api_url: 'http://localhost:8888/api/get/text?text',
            /*api_url: 'http://www.adsminion.com/api/get/text?text',*/
        }, options );
    	         	
	    this.init();
	};
	
	Monify.prototype = {
		
		/**
		* Start the monify process
		*
		* @memberOf monify
		* @type {Function}
		* @param {String} listener 		element to listen to
		*/
	    init: function(){
	    	var that = this;
	    		
	        this.loadDependencies();
	
	        var txt = this.txtGet();
	        txt = this.txtClean(txt);
	        
	        // get ads from server
	        data = this.adsMinionGet(txt, function(response){
	            if(response){
	                that.txtMonify(response['data']);
	            } 
	        });
	    },
		
	    txtGet: function(){
	    	var that = this,	        
	        	txt = '';
	        	
	        if(that.$el){
	        	that.$el.each(function(){
	        		txt += $(this).visibleText();
	        	});
	        }
	        else{
	            txt = $('body').visibleText();
	        }
	        return txt;
	    },
	
	    /**
	    * Remove tags and unrelevant info between tags
	    * Removes everything between a href
	    *
	    * @memberOf monify
	    * @type {Function}
	    * @param {String}   txt   text to clean
	    */
	    txtClean: function(txt){
	        txt = txt.replace(/<a(\s[^>]*)?>.*?<\/a>/ig,"");
	        var div = document.createElement('div');
	        div.innerHTML = txt;
	        txt = div.textContent || div.innerText || '';
	        txt = txt.replace(/\s{2,}/g, ' ');
	        return txt;
	    },
	
	    /**
	    * Send to Api and receive urls
	    *
	    * @memberOf monify
	    * @type {Function}
	    * @param {String}   txt   text to send
	    */
	    adsMinionGet: function(str, fn){
	        var that = this;
	
	        $.ajax({
	            type: 'POST',
	            url: that.options.api_url,
	            data: {
	                text: str,
	                amazon_id: that.options.amazon_id,
	            },
	            xhrFields: {
	              withCredentials: false
	            },
	            headers: {
	            },
	            
	        }).always(function(response, statusText, xhr){
	            
	            console.log(response);
	
	            if(xhr.status == 200){  
	                try
	                {
	                   return fn(JSON.parse(response));
	                }
	                catch(e)
	                {
	                }
	            }
	            return fn(false);
	        });
		},
	
	    /**
	    * Insert monify links into the text
	    *
	    * @memberOf monify
	    * @type {Function}
	    */
	    txtMonify: function(data){
	        
	        var that = this,
	       		search_words = [],
	           	repl = '',
	           	pattern = '',
	           	data_results = data.results,
	           	data_results_length = data_results.length,
	           	matches = [],
	           	matches_length = 0,
	           	product = false,
	           	product_merchants = false,
	           	product_merchants_length = 0,
	           	fragment = false,
	           	a = 0;
	           	
	        // each parent element   	
			this.$el.each(function(){
				replaceFragments($(this));	
			});
			
			// activate tool tips
			$('.monify-tooltip').tooltipsy({
				css: that.options.style_tooltip,
			});
			
			function replaceFragments($el){
				
				// each child element in the parent element
				$el.contents().each(function() { 
					
					// the element node type is text
					if(this.nodeType === 3) {
						
						// each fragment result
						for ( a = 0; a < data_results_length; a++ ) {							
							fragment = data_results[a];
			    			repl = '<a href="'+ fragment['url'] +'" target="_blank" class="monify-tooltip" title="' + createPopup(fragment) + '">$1</a>';
							
							// we only replace the first match
							this.nodeValue = this.nodeValue.replace(new RegExp('(' + fragment['match'] + ')', 'i'), repl);
						}
						$(this).replaceWith(this.nodeValue);
					}
					
					// nodetype is element but not if already an url 
					else if(this.nodeType === 1 && !$(this).is( 'a' )) {
						replaceFragments($(this));
					}
				});
			}
			
			function createPopup(fragment){
				
				var merchants = fragment['merchants'],
					merchants_length = merchants.length,
					merchants_list = [],
					merchant = false,
					a = 0;
			
				// create merchant list
				for ( a = 0; a < merchants_length; a++){ 
					merchant = merchants[a];
					merchants_list.push('<li><img src="' + merchant['img'] + '" style="height:40px;width:40px;border-radius:10px;margin-right:10px"/> <a href="'+merchant['url']+'" target="_blank">' + ' &#36;' + merchant['price']/100 + ' at ' + merchant['name'] + '</a></li>');
				}			
				return htmlEncode('<a href="' + fragment['url'] + '" target="_blank" style="text-decoration: none;color:#fff"><div style="display:block;height:75px;width:100%;background:url(' + fragment['img'] + ');background-position:center;background-size:cover;background-repeat: no-repeat;border-top-left-radius:10px;border-top-right-radius:10px"></div><div style="padding:10px"><h6>' +  trunc(fragment['name'], 50) + '</h6><ul style="list-style:none;margin:0;padding:0">' + merchants_list.join('') + '</ul></div></a>');
			}
			
			function htmlEncode(str){
				return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			}
			
			function trunc(str, n){
				return str.length>n ? str.substr(0,n-1)+'&hellip;' : str;
			};     
		},
	
	    /**
	    * Add these functions to the prototype when not available
	    * Fixes for IE < 9 etc
	    *
	    * @memberOf monify
	    * @type {Function}
	    */
	    loadDependencies: function(){
	        var that = this;
	
	        if (! String.prototype.trim) {
	            String.prototype.trim = function() {
	                return this.replace(/^\s+|\s+$/mg, '');
	            };
	        }
	        String.prototype.replaceAll = function(strReplace, strWith) {
	            var reg = new RegExp(strReplace, 'ig');
	            return this.replace(reg, strWith);
	        };
	        
	        String.prototype.htmlEncode = function(){
				return String(this)
				            .replace(/&/g, '&amp;')
				            .replace(/"/g, '&quot;')
				            .replace(/'/g, '&#39;')
				            .replace(/</g, '&lt;')
				            .replace(/>/g, '&gt;');
	        }
	        
	        String.prototype.htmlDecode = function(){
				return $('<div/>').html(this).text();
	        }
	    },
	};
	
	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn.monify = function(options){
        if (!$.data(this, 'plugin_monify')) {
            $.data(this, 'plugin_monify', 
            new Monify( this, options ));
        }
	}
	
	function trunc(n){
		return this.length>n ? this.substr(0,n-1)+'&hellip;' : this;
	};
	
   
})(jQuery);

// visibleText
$.fn.visibleText = function() {
  return $.map(this.contents(), function(el) {
    if (el.nodeType === 3) {
      return $(el).text();
    }
    if ($(el).is(':visible')) {
      return $(el).visibleText();
    }
  }).join('');
};

// tooltipsy
;(function($){
    
    $.tooltipsy = function (el, options) {
        this.options = options;
        this.$el = $(el);
        this.title = this.$el.attr('title') || '';
        this.$el.attr('title', '');
        this.random = parseInt(Math.random()*10000);
        this.ready = false;
        this.shown = false;
        this.width = 0;
        this.height = 0;
        this.delaytimer = null;

        this.$el.data("tooltipsy", this);
        this.init();
    };

    $.tooltipsy.prototype = {
        init: function () {
            var base = this,
                settings,
                $el = base.$el,
                el = $el[0];

            base.settings = settings = $.extend({}, base.defaults, base.options);
            settings.delay = +settings.delay;

            if (typeof settings.content === 'function') {
                base.readify(); 
            }

            if (settings.showEvent === settings.hideEvent && settings.showEvent === 'click') {
                $el.toggle(function (e) {
                    if (settings.showEvent === 'click' && el.tagName == 'A') {
                        e.preventDefault();
                    }
                    if (settings.delay > 0) {
                        base.delaytimer = window.setTimeout(function () {
                            base.show(e);
                        }, settings.delay);
                    }
                    else {
                        base.show(e);
                    }
                }, function (e) {
                    if (settings.showEvent === 'click' && el.tagName == 'A') {
                        e.preventDefault();
                    }
                    window.clearTimeout(base.delaytimer);
                    base.delaytimer = null;
                    base.hide(e);
                });
            }
            else {
                $el.bind(settings.showEvent, function (e) {
                    if (settings.showEvent === 'click' && el.tagName == 'A') {
                        e.preventDefault();
                    }
                    base.delaytimer = window.setTimeout(function () {
                        base.show(e);
                    }, settings.delay || 0);
                }).bind(settings.hideEvent, function (e) {
                    if (settings.showEvent === 'click' && el.tagName == 'A') {
                        e.preventDefault();
                    }
                    window.clearTimeout(base.delaytimer);
                    base.delaytimer = null;
                    base.hide(e);
                });
            }
        },

        show: function (e) {
            if (this.ready === false) {
                this.readify();
            }

            var base = this,
                settings = base.settings,
                $tipsy = base.$tipsy,
                $el = base.$el,
                el = $el[0],
                offset = base.offset(el);

            if (base.shown === false) {
                if ((function (o) {
                    var s = 0, k;
                    for (k in o) {
                        if (o.hasOwnProperty(k)) {
                            s++;
                        }
                    }
                    return s;
                })(settings.css) > 0) {
                    base.$tip.css(settings.css);
                }
                base.width = $tipsy.outerWidth();
                base.height = $tipsy.outerHeight();
            }

            if (settings.alignTo === 'cursor' && e) {
                var tip_position = [e.clientX + settings.offset[0], e.clientY + settings.offset[1]];
                if (tip_position[0] + base.width > $(window).width()) {
                    var tip_css = {top: tip_position[1] + 'px', right: tip_position[0] + 'px', left: 'auto'};
                }
                else {
                    var tip_css = {top: tip_position[1] + 'px', left: tip_position[0] + 'px', right: 'auto'};
                }
            }
            else {
                var tip_position = [
                    (function () {
                        if (settings.offset[0] < 0) {
                            return offset.left - Math.abs(settings.offset[0]) - base.width;
                        }
                        else if (settings.offset[0] === 0) {
                            return offset.left - ((base.width - $el.outerWidth()) / 2);
                        }
                        else {
                            return offset.left + $el.outerWidth() + settings.offset[0];
                        }
                    })(),
                    (function () {
                        if (settings.offset[1] < 0) {
                            return offset.top - Math.abs(settings.offset[1]) - base.height;
                        }
                        else if (settings.offset[1] === 0) {
                            return offset.top - ((base.height - base.$el.outerHeight()) / 2);
                        }
                        else {
                            return offset.top + base.$el.outerHeight() + settings.offset[1];
                        }
                    })()
                ];
            }
            $tipsy.css({top: tip_position[1] + 'px', left: tip_position[0] + 'px'});
            base.settings.show(e, $tipsy.stop(true, true));
        },

        hide: function (e) {
            var base = this;

            if (base.ready === false) {
                return;
            }

            if (e && e.relatedTarget === base.$tip[0]) {
                base.$tip.bind('mouseleave', function (e) {
                    if (e.relatedTarget === base.$el[0]) {
                        return;
                    }
                    base.settings.hide(e, base.$tipsy.stop(true, true));
                });
                return;
            }
            base.settings.hide(e, base.$tipsy.stop(true, true));
        },

        readify: function () {
            this.ready = true;
            this.$tipsy = $('<div id="tooltipsy' + this.random + '" style="position:fixed;z-index:2147483647;display:none">').appendTo('body');
            this.$tip = $('<div class="' + this.settings.className + '">').appendTo(this.$tipsy);
            this.$tip.data('rootel', this.$el);
            var e = this.$el;
            var t = this.$tip;
            this.$tip.html(this.settings.content != '' ? (typeof this.settings.content == 'string' ? this.settings.content : this.settings.content(e, t)) : this.title);
        },

        offset: function (el) {
            return this.$el[0].getBoundingClientRect();
        },

        destroy: function () {
            if (this.$tipsy) {
                this.$tipsy.remove();
                $.removeData(this.$el, 'tooltipsy');
            }
        },

        defaults: {
            alignTo: 'element',
            offset: [0, -1],
            content: '',
            show: function (e, $el) {
                $el.fadeIn(100);
            },
            hide: function (e, $el) {
                $el.fadeOut(100);
            },
            css: {},
            className: 'tooltipsy',
            delay: 200,
            showEvent: 'mouseenter',
            hideEvent: 'mouseleave'
        }
    };

    $.fn.tooltipsy = function(options) {
        return this.each(function() {
            new $.tooltipsy(this, options);
        });
    };

})(jQuery);
