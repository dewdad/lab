(function() {

    var lazyLoadTimer,
        isFirstRender = true,
        lastLoadImgTime = 0,
        InfiniteScrollList;

    // var raf = window.requestAnimationFrame
    //     || window.webkitRequestAnimationFrame
    //     || function(func){
    //             setTimeout(function(){
    //                 func && func();
    //             },0)
    //         };

    InfiniteScrollList = {
        init: function(opt) {

            this.scroller = new window.Scroller(this.__scrollRender.bind(this), {
                bouncing: false,
                scrollingX: false,
                scrollingComplete: opt.lazyLoadImgs ? this.__lazyLoadImgs.bind(this) : (function() {})
            });



            this.scrollerContainer = opt.scrollerContainer;
            this.listContainer = opt.listContainer;

            // 所有数据的集合
            this.domList = [];

            // 所有可视列表项的dom列表
            this.visibleDomList = [];

            // 保留的dom内容比容器高度超出多少个列表项的高度
            this.offsetCount = 2;

            // 列表项样式类
            this.listItemClass = opt.listItemClass || 'infinite-item';

            // 当前滚动高度
            this.currentScrollTop = 0;

            // 当前滚动方向
            this.direction = null;

            // 滚动到底部的回调
            this.onScrollToBottom = opt.onScrollToBottom;

            // 滚动到中线的回调
            this.onScrollToMiddle = opt.onScrollToMiddle;

            // 准备开始渲染的回调
            this.onRender = opt.onRender;

            // 是否启用图片懒加载
            this.lazyLoadImgs = opt.lazyLoadImgs;

            // 停下滚动到加载图片之间的时间间隔
            this.lazyLoadDuration = opt.lazyLoadDuration || 400;

            // 是否启用定时加载图片
            this.loadImgsInTime = opt.loadImgsInTime;

            // 定时加载图片的时间间隔
            this.loadImgsInterval = opt.loadImgsInterval || 100;

            // 滚动容器高度
            this.scrollContainerHeight = this.scrollerContainer.height();

            // 滚动容器宽度
            this.scrollerContainerWidth = this.scrollerContainer.width();

            // 列表宽度
            this.listWidth = this.listContainer.width();

            // 列表高度
            this.listHeight = 0;

            // 事件绑定
            this.bind();



        },

        // 滚动区域移动模拟
        __scrollRender: function(left, top) {

            var now = Date.now();

            // 更新当前滚动方向
            if (top > this.currentScrollTop) {
                this.direction = 'down';
            } else if (top < this.currentScrollTop) {
                this.direction = 'up';
            } else {
                this.direction = null;
            }

            // 更新当前滚动高度
            this.currentScrollTop = top;

            // 更新滚动区域位置
            this.listContainer.css({
                '-webkit-transform': 'translate3d(0,' + (-top) + 'px,0)'
            });

            // 滚动检查
            this.check();

            // 懒加载
            if (this.lazyLoadImgs) {
                clearTimeout(lazyLoadTimer);
                lazyLoadTimer = setTimeout(this.__lazyLoadImgs.bind(this), this.lazyLoadDuration);

            // 定时加载
            } else if (this.loadImgsInTime) {
                if (now - lastLoadImgTime > this.loadImgsInterval) {
                    this.__lazyLoadImgs();
                    lastLoadImgTime = now;
                }
            }
        },

        // 懒加载图片
        __lazyLoadImgs: function() {

            var $imgs = $(this.listContainer.find('img')),
                $img;

            $imgs.each(function(i, img) {
                $img = $(img);
                var lazySrc = $img.attr('lazy-src');

                if (lazySrc) {
                    $img.attr('src', lazySrc);
                }
            });
        },

        // 判断列表项是否已经足够撑满一页
        __isFull: function() {
            var itemHeight = this.itemHeight;

            return itemHeight > 0 && this.domList.length * itemHeight >= this.scrollContainerHeight + this.offsetCount * itemHeight;
        },

        // 获取位置最靠顶部的可视列表项
        __getTopItems: function(count) {
            var visibleDomList = this.visibleDomList;

            visibleDomList = visibleDomList.sort(function(d1, d2) {
                return Number(d1.prop('topValue')) - Number(d2.prop('topValue'));
            });
            return visibleDomList.slice(0, count);
        },

        // 获取位置最靠底部的可视列表项
        __getBottomItems: function(count) {
            var visibleDomList = this.visibleDomList;

            visibleDomList = visibleDomList.sort(function(d1, d2) {
                return Number(d2.prop('topValue')) - Number(d1.prop('topValue'));
            });
            return visibleDomList.slice(0, count);
        },

        // 获取可视区域的中线位置
        getViewMiddle: function() {
            return this.currentScrollTop + this.scrollerContainer.height() / 2;
        },

        // 获取所有可视列表项的中线位置
        getItemsMiddle: function() {
            var visibleDomList = this.visibleDomList;

            if (!visibleDomList.length) {
                return 0;
            }

            var items = this.__getTopItems(visibleDomList.length);

            return (Number(items[items.length - 1].prop('topValue')) + Number(items[0].prop('topValue')) + this.itemHeight) / 2;
        },

        // 用现有列表项更新成新列表项的内容
        updateItemContentByIndex: function(item, index) {

            var topValue = index * this.itemHeight;

            item.css({
                '-webkit-transform': 'translateY(' + topValue + 'px) translateZ(0)'
            });
            item.prop('topValue', topValue);
            item.prop('indexValue', index);

            // 替换内容
            // item.prop('outerHTML',this.domList[index].prop('outerHTML'));
            item.html(this.domList[index]);
        },

        // 情况列表
        clear: function() {
            this.domList = [];
            this.listContainer.html('');
            this.visibleDomList = [];

            // 当前滚动高度
            this.currentScrollTop = 0;
            this.scroller.scrollTo(0, 0);

            // 更新滚动区域位置
            this.listContainer.css({
                '-webkit-transform': 'translate3d(0, 0, 0)'
            });

            // 当前滚动方向
            this.direction = null;
            clearTimeout(lazyLoadTimer);

        },

        // 检查列表内容的现实与隐藏
        check: function() {
            var self = this,

            // 可视区域中线
            viewMiddle,
            itemsMiddle,
            currentTopIndex,
            currentLastIndex,

            // 中线之差
            dy,

            // 方向
            direction = this.direction,

            // 列表项高度
            itemHeight = this.itemHeight,

            // 相差个数
            count,

            // 用来填充的列表项
            fillItems,

            item,
            index,
            i,

            // 所有dom
            domList = this.domList,

            // 可视节点的个数
            visibleDomCount = this.visibleDomList.length;

            // 循环检查
            // raf(this.check.bind(this));

            if (!this.domList.length) {
                return;
            }

            if (this.domList.length <= this.visibleDomList.length) {
                return;
            }

            viewMiddle = this.getViewMiddle();
            itemsMiddle = this.getItemsMiddle();



            dy = viewMiddle - itemsMiddle;

            if (direction === 'down' && dy > 0) {
                // 相差个数
                count = Math.ceil(dy / itemHeight);

                // 获取用来补差的列表项
                fillItems = this.__getTopItems(count);

                currentLastIndex = Number(fillItems[0].prop('indexValue')) + visibleDomCount - 1;


                for (i = 0 ; i < fillItems.length; i++) {
                    item = fillItems[i];
                    index = currentLastIndex + i + 1;

                    if (domList[index]) {
                        // 更新内容和现实位置
                        self.updateItemContentByIndex(item, index);
                    }

                }
            } else if (direction === 'up' && dy < 0) {
                // 相差个数
                count = Math.ceil(-dy / itemHeight);

                // 获取用来补差的列表项
                fillItems = this.__getBottomItems(count);

                currentTopIndex = Number(fillItems[0].prop('indexValue')) - visibleDomCount + 1;

                for (i = 0 ; i < fillItems.length; i++) {
                    item = fillItems[i];
                    index = currentTopIndex - i - 1;

                    if (domList[index]) {
                        // 更新内容和现实位置
                        self.updateItemContentByIndex(item, index);
                    }

                }
            }

            // 检查滚动到中线
            if (this.currentScrollTop + this.scrollerContainer.height() * 1.5 >= this.listContainer.height()) {
                this.onScrollToMiddle && this.onScrollToMiddle();
            }

            // 检查滚动到底部
            if (this.currentScrollTop + this.scrollerContainer.height() >= this.listContainer.height()) {
                // 触发滚动到底部的回调
                this.onScrollToBottom && this.onScrollToBottom();
            }



        },
        bind: function() {
            var scroller = this.scroller;

            if ('ontouchstart' in window) {

                this.scrollerContainer.on('touchstart', function(e) {
                    scroller.doTouchStart(e.touches, e.timeStamp);
                    e.preventDefault();
                }, false);

                $(document).on('touchmove', function(e) {
                    scroller.doTouchMove(e.touches, e.timeStamp);
                }, false);

                $(document).on('touchend', function(e) {
                    scroller.doTouchEnd(e.timeStamp);
                }, false);

            }


            // 捕获阶段统一删除lazy-src的属性
            // if(this.lazyLoadImgs){
            //     this.listContainer[0].addEventListener('load', function(e){
            //         var img = $(e.target);
            //         if(img.attr('lazy-src') == img.attr('src')){
            //             img.attr('lazy-src','');
            //         }

            //     },true);
            // }

        },

        // 运行起来
        run: function() {


            // this.check();

        },

        // 渲染首页内容的字符串
        render: function(contentStr, pageIndex) {
            var self = this,
                scrollerContainer,
                listContainer,
                domList,
                $items,
                $item,
                now,
                timeArr;

            // 准备开始渲染的回调
            this.onRender && this.onRender(contentStr, pageIndex);


            // 滚动容器
            scrollerContainer = this.scrollerContainer;

            // 列表内容容器
            listContainer = this.listContainer;

            // 所有元素的集合
            domList = this.domList;

            // 列表集合
            $items = $(contentStr);

            // 没有新的列表项
            if ($items.length === 0) {
                return;
            }

            now = Date.now();
            timeArr = [];



            // 列表项添加到容器，或先缓存起来
            $items.each(function(i, item) {
                $item = $(item);

                if ($item.hasClass(self.listItemClass)) {

                    // 还没撑满一页，则直接渲染到列表内
                    if (!self.__isFull()) {
                        // 添加到dom
                        listContainer.append($item);

                        // 添加到可视dom列表
                        self.visibleDomList.push($item);

                        // 初始化列表项高度
                        if (!self.itemHeight) {
                            self.itemHeight = $item.height();
                        }

                        // 定位到特定高度
                        $item.css({
                            position: 'absolute',
                            width: '100%',
                            '-webkit-transform': 'translateY(' + (domList.length * self.itemHeight) + 'px) translateZ(0)'
                        });

                    }

                    // 记录距离顶部的值
                    $item.prop('topValue', domList.length * self.itemHeight);

                    // 记录索引
                    $item.prop('indexValue', domList.length);

                    // 添加到总dom列表
                    // domList.push(item);
                    domList.push($item.html());

                }

            });


            // 更新列表内容高度
            this.listHeight = this.domList.length * this.itemHeight;

            // 设置内容高度（包括dom不存在的部分）
            listContainer.css({
                height: this.listHeight
            });


            // 更新滚动区域尺寸
            this.scroller.setDimensions(this.scrollerContainerWidth, this.scrollContainerHeight, this.listWidth, this.listHeight);


            // 首次图片懒加载
            if (isFirstRender) {
                this.__lazyLoadImgs();
                isFirstRender = false;
            }



        }

    };

    window.InfiniteScrollList = InfiniteScrollList;

})();
