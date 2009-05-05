YUI({
    //base: 'http://github.com/yui/yui3/raw/master/build/',
    base: '../../../yui3/build/',
    combo: false
}).use('node', 'anim', 'dd', 'yql', 'slider', 'stylesheet', function(Y) {
    //Get a reference to the wrapper to use later and add a loading class to it.
    var wrapper = Y.get('#yui-main .yui-g ul').addClass('loading');
    //Set it's height to the height of the viewport so we can scroll it.
    wrapper.setStyle('height', (wrapper.get('winHeight') - 50 )+ 'px');
    //Make the YQL query.
    new Y.yql('select * from flickr.photos.search(50) where user_id = "94309252@N00"', function(e) {
        if (e.query) {
            var photos = e.query.results.photo;
            //Walk the returned photos array
            Y.each(photos, function(v, k) {
                //Create our URL
                var url = 'http:/'+'/static.flickr.com/' + v.server + '/' + v.id + '_' + v.secret + '_m.jpg',
                    //Create the image and the LI
                    img = Y.Node.create('<li class="loading"><img src="' + url + '"></li>'),
                    //Get the image from the LI
                    fc = img.get('firstChild');
                //Append the li to the wrapper
                wrapper.appendChild(img);
                //This little hack moves the tall images to the bottom of the list
                //So they float better ;)
                fc.on('load', function() {
                    //Is the height longer than the width?
                    var c = ((this.get('height') > this.get('width')) ? 'tall' : 'wide');
                    this.addClass(c);
                    if (c === 'tall') {
                        //Love it to the end of the list.
                        this.get('parentNode.parentNode').removeChild(this.get('parentNode'));
                        wrapper.appendChild(this.get('parentNode'));
                    }
                    this.get('parentNode').removeClass('loading');
                });
            });
            //Get all the newly added li's
            wrapper.queryAll('li').each(function(node) {
                //Plugin the Drag plugin
                node.plug(Y.plugin.Drag, {
                    offsetNode: false
                });
                //Plug the Proxy into the DD object
                node.dd.plug(Y.plugin.DDProxy, {
                    resizeFrame: false,
                    moveOnEnd: false,
                    borderStyle: 'none'
                });
            });
            //Create and render the slider
            var sl = new Y.Slider({
                railSize: '200px', value: 20, max: 70, min: 5,
                thumbImage: Y.config.base+'/slider/assets/skins/sam/thumb-classic-x.png'
            }).render('.horiz_slider');
            //Listen for the change
            sl.after('valueChange',function (e) {
                //Insert a dynamic stylesheet rule:
                var sheet = new Y.StyleSheet('image_slider');
                sheet.set('#yui-main .yui-g ul li', {
                    width: e.newVal + '%'
                });
            });
            //Remove the DDM as a bubble target..
            sl._dd.removeTarget(Y.DD.DDM);
            //Remove the wrappers loading class
            wrapper.removeClass('loading');
        }
    });
    //Listen for all mouseup's on the document (selecting/deselecting images)
    Y.on('delegate', function(e) {
        if (!e.shiftKey) {
            //No shift key
            wrapper.queryAll('img.selected').removeClass('selected');
        }
        if (e.target.test('#yui-main .yui-g ul li img')) {
            e.target.addClass('selected');
        }
    }, document, 'mouseup', '*');
    //Listen for all clicks on the '#photoList li' selector
    Y.on('delegate', function(e) {
        //Prevent the click
        e.halt();
        //Add some css
        e.target.get('parentNode').queryAll('li').removeClass('selected');
        e.target.addClass('selected');
        if (e.target.hasClass('all')) {
            wrapper.queryAll('li').removeClass('hidden');
        } else {
            var c = e.target.get('id');
            wrapper.queryAll('li').addClass('hidden');
            wrapper.queryAll('li.' + c).removeClass('hidden');
        }
    }, document, 'click', '#photoList li');
    //On drag start, get all the selected elements
    //Add the count to the proxy element and offset it to the cursor.
    Y.DD.DDM.on('drag:start', function(e) {
        var count = wrapper.queryAll('img.selected').size();
        e.target.get('dragNode').setStyles({
            height: '25px', width: '25px'
        }).set('innerHTML', '<span>' + count + '</span>');
        e.target.deltaXY = [25, 5];
    });
    //We dropped on a drop target
    Y.DD.DDM.on('drag:drophit', function(e) {
        //get the images that are selected.
        var imgs = wrapper.queryAll('img.selected'),
            toXY = e.drop.get('node').getXY();
        imgs.each(function(node) {
            //Clone the image, position it on top of the original and animate it to the drop target
            node.get('parentNode').addClass(e.drop.get('node').get('id'));
            var n = node.cloneNode().set('id', '').setStyle('position', 'absolute');
            Y.get('body').appendChild(n);
            n.setXY(node.getXY());
            new Y.Anim({
                node: n,
                to: {
                    height: 20, width: 20, opacity: 0,
                    top: toXY[1], left: toXY[0]
                },
                from: {
                    width: node.get('offsetWidth'),
                    height: node.get('offsetHeight')
                },
                duration: 1.5
            }).run();
        });
        var count = wrapper.queryAll('li.' + e.drop.get('node').get('id')).size();
        e.drop.get('node').query('span').set('innerHTML', '(' + count + ')');
    });
    //Add drop support to the albums
    Y.all('#photoList li').each(function(node) {
        if (!node.hasClass('all')) {
            node.plug(Y.plugin.Drop);
        }
    });
});
