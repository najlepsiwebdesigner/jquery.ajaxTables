 /*!
 * jQuery ajax-tables plugin
 * Original author: @benopeter
 * Further changes, comments: @benopeter
 * Licensed under the MIT license
 */


// the semi-colon before the function invocation is a safety 
// net against concatenated scripts and/or other plugins 
// that are not closed properly.
;(function ( $, window, document, undefined ) {

    // Create the defaults once
    var pluginName = 'ajaxTables',
        defaults = {
            // propertyName: "value"
            pagenumber : 1,
            maxpage : null,
            minpage : 1,
            activeclassname : 'active',
            initialpage : 1,
            sourceurl : '',
            countsourceurl : '',
            onpage : 10,
            buildGetData : function (offset, limit){
                return {
                    "filter": JSON.stringify({offset:offset, limit:limit})
                }
            },
            onOutOfRange : function (requestedPage){
                alert('Out of range!');
            }

        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;
        this.$element = $(this.element);

        this.options = $.extend( {}, defaults, this.$element.data(), options) ;
        console.log(this.options);
        
        this._defaults = defaults;
        this._name = pluginName;
        
        this.init();
    }

    // plugin initialization
    Plugin.prototype.init = function () {
        var that = this;
        // setup navigation for oomponent
        


        this.loadRowCount(function(rowCount){
            // alert('all loaded! count: '+rowCount);
            that.options.rowCount = rowCount;

            that.setupPagingNavigation();
            // navigate to initial page
            that.navigateTo(that.options.initialpage);
        })

    };

    Plugin.prototype.loadPage = function (pageNum){
        var that = this;

        $.ajax({
            type: "GET",
            url: this.options.sourceurl,
            data: this.options.buildGetData((this.options.pagenumber - 1) * this.options.onpage, this.options.onpage),
            success : function(rows) { 
                that.buildTableBody(JSON.parse(rows));
            }
        });     
    }



    Plugin.prototype.loadRowCount = function (callback) {
        var that = this;
        $.get(this.options.countsourceurl).done(function(data){
            if (!that.isNumber(data)) {
                throw ('Invalid data count format!');
            }
            else {
                if (callback) callback(data);
            }
        }).error(function(){
            throw ('Could not load count from dataCountSource');
        });
    }


    Plugin.prototype.buildTableBody = function (rows) {
        $tbody = this.$element.find('tbody')

        var headings = this.$element.find('thead th');
        var dataOrder = new Array();

        headings.each(function(i, v){
            dataOrder.push($(v).attr('data-column'));
        });

        var trs = new Array();
        for (i in rows){
            var tr = new Array();

            for (j in dataOrder){
                tr.push(rows[i][dataOrder[j]]);
            }

            trs.push('<td>'+tr.join('</td><td>')+'</td>');
        }
        $tbody.html('<tr>'+trs.join('</tr><tr>')+'</tr>');
    }





    Plugin.prototype.isNumber = function(input) {
        return !isNaN(input);
    };

    Plugin.prototype.setActivePage = function (pageNum) {
        var link = this.$element.find('a[data-navigate-to]:eq('+((pageNum*1)-1)+')');
        if (link.length > 0){
            link.parent().siblings().removeClass(this.options.activeclassname);
            link.parent().addClass(this.options.activeclassname);
        }
    }


    Plugin.prototype.navigateTo = function (pageNum) {
        // console.log(pageNum, this);
        // verify input argument
        if (!this.isNumber(pageNum)){
            throw ('Wrong input argument!' + pageNum);
        }

        if (!(pageNum >= this.options.minpage && pageNum <= this.options.maxpage)){
            console.log(this.options.minpage, this.options.maxpage);
            this.options.onOutOfRange(pageNum);
            throw ('Out of navigation range!');
        }
        else {
            // here should be the magic placed
            this.options.pagenumber = pageNum;
            this.loadPage(pageNum);
            this.setActivePage(pageNum);
            return true;
        }
        return false;
    }


    Plugin.prototype.navigateBack = function () {
        return this.navigateTo((this.options.pagenumber*1) - 1);
    }

    Plugin.prototype.navigateNext = function () {
        return this.navigateTo((this.options.pagenumber*1) + 1);
    }

    // attach events to table navigation (paging)
    Plugin.prototype.setupPagingNavigation = function () {
        var that = this;
        // basic component error handling
        var hasNavigation = this.$element.find('a[data-navigate-prev],a[data-navigate-next],a[data-navigate-to]').length > 0 ? true : false;

        if (!hasNavigation) throw ('Component with index passed to ajaxTable doesnt include any paging elements! At least some required!');

        // try to build the navigation
        var counter = Math.ceil(that.options.rowCount / that.options.onpage);
        var pagingContent = new Array;
        var pattern = this.$element.find('*[data-to-pattern]');


        this.$element.find('a[data-navigate-to]').each(function(i, v){
            var val = $(v).html();
            if (!that.isNumber(val)) {
                throw ('Error in component paging, navigation link has not a valid numeric value!');
            }
            else {
                if (val > that.options.maxpage){
                    that.options.maxpage = (val*1)+1;
                }
            }
        });

        if (pattern.length > 0 ){

            pattern.siblings().has('a[data-navigate-to]').remove();

            for (var i = 1; i <= counter; i++) {
                var newEl = pattern.clone();
                newEl.find('a[data-navigate-to]').html(i);
                newEl.insertBefore(pattern);
            }    

            pattern.remove();        
        }
        that.options.maxpage = (i*1)-1;








        // attach events
        this.$element.find('a[data-navigate-prev]').click(function(e) {
            that.navigateBack();
            e.preventDefault();
        });

        this.$element.find('a[data-navigate-next]').click(function(e) {
            that.navigateNext();
            e.preventDefault();
        });

        this.$element.find('a[data-navigate-to]').click(function(e) {
            that.navigateTo($(this).html());
            e.preventDefault();
        });
    }




    // A really lightweight plugin wrapper around the constructor, 
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, 
                new Plugin( this, options ));
            }
        });
    }

})( jQuery, window, document );
