/**
 * Created by gewangjie on 2017/9/19
 */

import LayoutCalc from '../utils/LayoutCalc'

// 瀑布流单元块组件
import {
    WFItem_1,
    WFItem_2
} from './WFItem'

// 瀑布流状态组件
import {
    GetData,
    Loading,
    ToBottom,
    NoResult
} from 'WFStatus'

/*
 * 瀑布流
 */
class WaterFall extends React.Component {
    constructor(props) {
        super(props);
        // 默认数据
        this.state = {
            _firstMasonry: true, // 布局组件，首次布局与重新布局flag
            queryData: {
                q: this.props.q || '', // 查询条件，搜索字段
                pageSize: this.props.pageSize || 30, // 每次请求数据，默认30
            },
            start: 0, // 后台记录使用
            page: 0, // 下一页
            totalPage: 0, // 翻页总页数

            columnNum: 0, // 列数
            columnWidth: this.props.columnWidth || 288, // 列宽
            initColumnHeight: this.props.initColumnHeight || [0], // 瀑布流初始高度
            index: 0, // 已添加数量
            waterFallData: [], // 瀑布流全部数据
            waterFallExtraDataTotal: 0, // 瀑布流额外数据(时间分割线，广告位...)
            waterFallTotal: 0, // 数据总数，
            wfHeight: 0, // 当前瀑布流高度

            showResultCount: this.props.showResultCount || false, // 是否显示实际总数，默认false
            resultCount: 0, // 实际总数，精选操作会改变该值

            statusFlag: 1, // 瀑布流状态 ，1：初次加载，2：初次查询无结果，3：加载中，4：加载完成,等待滑动，5：加载完成,触底
            wfType: this.props.wfType || 'blog', // 单元块类型

            initContainerTop: 0, // 容器初始Top
            initContainerWidth: 0, // 容器初始width

            scrollTop: 0, // 滚动距离
            scrollTopPre: 0,
            containerTimeStamp: 0, // 定时任务

            isScroll: false, // 滚动加载开启状态
            scrollFlag: false, // 滚动事件处理状态

            toTop: false, // 置顶按钮状态

            msnryCount: 0, // 布局插件计算布局数量，避免数量不变时重复布局操作造成资源浪费
            msnryCountOriginal: 0,// 布局插件计算布局'前'数量

            showItemStart: 0, // 显示节点开始位置
            showItemEnd: 0, // 显示节点开始位置
            resizeFlag: false, // 布局状态
        }
    }

    // 监听props
    componentWillReceiveProps(nextProps) {
        // 强制重置瀑布流
        if (nextProps.reset) {
            this._reset();
            return;
        }

        // 正常流程，重置瀑布流
        if (nextProps.dataUrl !== this.props.dataUrl
            || (nextProps.q || '') !== this.state.queryData.q
            || nextProps.wfType !== this.state.wfType) {
            console.log('重置瀑布流');
            this.state.queryData.q = nextProps.q;
            this.state.wfType = nextProps.wfType;
            this._reset();
        }
    }

    // 第一次渲染前调用
    componentWillMount() {
        this.init();
    }

    // 第一次渲染后调用
    componentDidMount() {
        // 置顶按钮消隐
        this.renderToTop();
        this.toTopShowHide();

        // 添加滚动事件，定时监听，获取初始top
        let pos = this.getContainerPos();
        console.log('初始位置：', pos);
        this.state.initContainerTop = pos.t;
        this.state.initContainerWidth = pos.w;

        this.containerTimeOut();

        // 获取列数
        this._columnNum(pos.w);

        // 获取数据
        this._initGetData();
    }

    // 每次渲染后调用
    componentDidUpdate() {
        // 单元数量变化才引起重新布局
        // console.log(this.state.msnryCount, this.state.msnryCountOriginal);
        if (this.state.msnryCount === this.state.msnryCountOriginal) {
            // console.log('单元数量未变化');
            return;
        }

        /* 瀑布流配置 */
        if (this.state._firstMasonry) {
            console.log('首次布局');
            this.state._firstMasonry = false;

            this._initLayout(this.state.columnNum);

            this.calcWFItem(this.state.msnryCountOriginal, this.state.msnryCount);
        } else {
            console.log('重新布局');
            // 重新计算列数
            this.calcWFItem(this.state.msnryCountOriginal, this.state.msnryCount);
        }
        this.state.msnryCountOriginal = this.state.msnryCount;
    }

    // 组件被卸载,清除定时器
    componentWillUnmount() {
        this.state.containerTimeStamp = -1;
    }

    // 初始化
    init() {

    }

    // 初次获取数据
    _initGetData() {
        console.log('瀑布流初始化');
        let self = this;
        // 初次获取数据
        self.getData((status) => {
            // 配置参数，只请求一次
            if (self.props.oneGetData) {
                // 回调参数为4（可继续加载数据），强制修改瀑布流状态为结束
                self.setState({
                    statusFlag: status === 4 ? 5 : status
                });
                return;
            }

            // 开启下拉加载
            self.state.loadType === 1 && self.startScroll();
        });
    }

    // 初始化布局模块
    _initLayout(columnNum) {
        this.layoutCalc = new LayoutCalc({
            columnWidth: this.state.columnWidth,
            itemSelector: '.water-fall-item',    // 要布局的网格元素
            gutter: this.state.columnWidth === 288 ? 20 : 10,
            columnNum: columnNum,
            initColumnHeight: this.state.initColumnHeight,
            columnHeight: new Array(columnNum).fill(0), // 列高默认0
        });
    }

    // 重置布局模块
    _resetLayout(columnNum) {
        if (typeof this.layoutCalc !== 'object') {
            return;
        }
        if (!'reset' in this.layoutCalc) {
            return;
        }
        this.layoutCalc.reset({
            columnWidth: this.state.columnWidth,
            itemSelector: '.water-fall-item',    // 要布局的网格元素
            gutter: this.state.columnWidth === 288 ? 20 : 10,
            columnNum: columnNum,
            initColumnHeight: this.state.initColumnHeight,
            columnHeight: new Array(columnNum).fill(0), // 列高
        });
    }

    // 计算列数 并 触发启动布局
    _calcColumnNum(w) {
        let width = w || this.getContainerPos().w;
        return Math.floor(width / this.state.columnWidth);
    }

    _columnNum(w) {
        let _columnNum = this._calcColumnNum(w);
        _columnNum !== this.state.columnNum && this.setState({
            columnNum: _columnNum
        });
    }

    // 获取容器top
    getContainerPos() {
        let pos = this.refs.container.getBoundingClientRect();
        return {
            t: pos.top,
            w: pos.width
        };
    }

    // 计算单元块translate
    calcWFItem(start, end) {
        let _list = this.state.waterFallData;

        console.log('计算区间', start, end);

        for (let i = start; i < end; i++) {
            let item = _list[i], w, h;

            // 计算该节点宽高
            if (!item.nodeWidth) {
                let el = this.refs.container.getElementsByClassName('water-fall-item')[i - this.state.showItemStart],
                    node = this.layoutCalc.getElWH(el);
                w = node.w === this.state.initContainerWidth ? -1 : node.w;
                h = node.h;
                item.nodeWidth = w;
                item.nodeHeight = h;
            } else {
                w = item.nodeWidth;
                h = item.nodeHeight;
            }

            let {x, y} = this.layoutCalc.calc(w, h);
            item.translateX = x;
            item.translateY = y;
        }

        this.setState({
            waterFallData: _list,
            wfHeight: this.layoutCalc.getMaxHeight()
        }, () => {
            // 布局完成
            typeof this.props.onLayoutOut === 'function' && this.props.onLayoutOut();
        });
    }

    // 请求数据
    getData(callback, loop) {
        console.log('获取数据');
        // 触发渲染，显示loading
        this.state.statusFlag !== 1 && this.setState({
            statusFlag: 3
        });
        let self = this,
            _queryData = self.state.queryData;

        _queryData.boundaryId = '';
        // 分页数据必备，前一批数据最后一项的id，start开始项
        if (self.state.page !== 0
            && self.state.wfType !== 'owner'
            && self.state.wfType !== 'insOwner') {
            _queryData.boundaryId = self.state.waterFallData[self.state.waterFallTotal - 1].id
        }

        // 灵感页排序，首次请求增加decrease参数
        if (self.state.page === 0 && self.state.wfType === 'index') {
            _queryData.decrease = self.props.decrease || 0;
        }

        // 我的ins关注列表，增加pageSize参数
        if (self.state.wfType === 'insOwner') {
            _queryData.pageNo = self.state.page + 1;
        }

        // start为0，则赋0，非0则累加pageSize
        _queryData.start = (self.state.page === 0 ? 0 : self.state.start + self.state.queryData.pageSize);

        base.request({
            url: base.baseUrl + self.props.dataUrl,
            type: 'POST',
            data: _queryData
        }).done(function (d) {
            let result = '',
                _total = 0,
                _status_flag = 4,
                isComplete = false;// 数据完整性

            // 防止后端不给数据
            if (d.success && d.result) {
                result = ('resultList' in d.result) ? d.result.resultList : d.result;
                _total = result ? result.length : 0;
                self.state.totalPage = d.result.totallPageCount || 0;
            }

            // 处理并存储数据
            if (_total) {
                // 准备数据
                let preData = self.dataPreProcessing(result),
                    _temp = self.state.waterFallData.concat(preData.data),
                    _waterFallTotal = self.state.waterFallTotal + preData.data.length,
                    _page = self.state.page + 1;

                console.log(preData);

                isComplete = preData.isComplete;
                self.setState({
                    waterFallData: _temp,
                    waterFallTotal: _waterFallTotal,
                    resultCount: d.result.resultCount || _waterFallTotal,
                    page: _page,
                    start: d.result.start,
                    showItemEnd: _waterFallTotal
                }, () => {
                    // 回调，数据请求成功
                    self.props.getDataSuccess && self.props.getDataSuccess(self.state);
                })
            }

            // 返回数据为空 or 接口异常，数据异常
            if (!isComplete) {
                _status_flag = self.changeWFStatus(_status_flag);

                // 数据加载完，or无数据 则移除滚动事件
                self.removeScroll();
            }

            // 修改瀑布流状态
            self.setState({
                statusFlag: _status_flag,
            }, () => {
                // 等待加载过程,loop为true,则加载完全部数据，在精选集全选操作中使用
                (loop && _status_flag === 4) ? self.getData(callback, loop)
                    : (callback && callback(_status_flag));
            });
        }).fail(function () {
            self.state.statusFlag = -1;
            // alert('获取数据失败');
        });
    }

    // 处理瀑布流新状态与当前状态
    changeWFStatus(status) {
        // 瀑布流状态为2,5,-1,保持旧值
        if (this.state.statusFlag !== 2
            && this.state.statusFlag !== 5
            && this.state.statusFlag !== -1) {
            return (this.state.statusFlag === 1 && this.state.page === 0) ? 2 : 5;
        }

        return status
    }

    // 滑动加载数据
    appendDetect() {//添加瀑布流单元
        let self = this,
            _el_height = this.refs.container.offsetHeight,//瀑布流高度
            screenH = document.documentElement.clientHeight;

        // 加载等待过程
        if (this.state.statusFlag === 4
            && _el_height - screenH <= self.state.scrollTop + screenH) {
            self.getData();//请求数据
        }
    }

    // 数据预处理
    dataPreProcessing(data) {
        let self = this,
            newData = [],
            _length = data.length,
            item;

        for (let i = 0; i < _length; i++) {
            item = data[i];

            // 额外数据填充，目前只有灵感页
            let __key = i + self.state.waterFallTotal + '';
            if (self.props.extraData && self.props.extraData.hasOwnProperty(__key)) {
                let item = self.props.extraData[__key],
                    {width, height} = self.preImgWH(item.width, item.height);
                // 默认按照单列宽计算，*size列宽
                item.width = width * item.size + 20 * (item.size - 1);
                item.height = height * item.size;
                newData.push(item);
            }

            // 足迹时间一个月，强制截断数据
            if (self.state.historyEndFlag) {
                break;
            }

            // 根据单元块类型处理数据
            switch (self.state.wfType) {
                case 'index':
                case 'blog':
                case 'folder':
                case 'folderSelect':
                case 'followBlog':
                case 'folderShare':
                case 'folderPublic':
                case 'ownerId':
                case 'history':
                case 'classify':
                case 'recommendBlog':
                    // 足迹模块不包含足迹时间，跳出
                    if (this.state.wfType === 'history' && !item.footprintTime) {
                        break;
                    }

                    // 订阅模块不包含postTime，跳出
                    if (this.state.wfType === 'followBlog' && !item.postTime) {
                        break;
                    }

                    // 处理时间线
                    if (self.props.timeLine) {
                        let time;
                        self.props.timeLine === 'history' && (time = item.footprintTime);
                        self.props.timeLine === 'followBlog' && (time = item.postTime);

                        let _timeTemp = base.dealTime(time);

                        // 足迹事件超过一个月，截断
                        if (self.state.wfType === 'history' && base.isMonth(self.state.todayTime, time)) {
                            self.state.statusFlag =
                                (self.state.waterFallTotal === 0 && newData.length === 0) ? 2 : 5;

                            console.log('足迹数据截断');

                            self.state.statusFlag === 5 && newData.push({
                                isBlogCover: false,
                                wfItemType: 'end'
                            });

                            self.state.historyEndFlag = true;
                            break;
                        }

                        // 时间对比，插入时间轴
                        if (self.state._time !== _timeTemp) {
                            newData.push({
                                wfItemType: `timeline`,
                                postTime: time,
                                isBlogCover: false,
                                time: _timeTemp
                            });
                        }
                        self.state._time = _timeTemp;
                    }

                    // 订阅模块，导入ins关系模块特殊处理
                    if (this.state.wfType === 'followBlog'
                        && i === 0
                        && self.state.waterFallData.length === 0) {
                        newData.push({
                            wfItemType: `userInfo`,
                            isBlogCover: false
                        });
                        // break;
                    }

                    // 订阅模块，秀场部分特殊处理
                    if (this.state.wfType === 'followBlog' && item.platformId === 2) {
                        newData.push({
                            id: item.showId,
                            designerId: item.designerId,
                            showImgList: item.showImgList,
                            city: item.city,
                            season: item.season,
                            designerName: item.designerName,
                            wfItemType: platformList[2],
                            postTime: item.postTime,
                            isBlogCover: false
                        });
                        break;
                    }

                    // 异常数据跳出本次循环
                    if (!item.width || !item.blogger) {
                        break;
                    }

                    // 图片宽高自适应
                    let imgWH = self.preImgWH(item.width, item.height);

                    newData.push({
                        id: item.id,
                        mediaUrl: item.mediaUrl,
                        width: imgWH.width,
                        height: imgWH.height,
                        postTime: item.postTime,
                        bloggerId: item.blogger.id,
                        nickname: item.blogger.nickname,
                        headImg: item.blogger.headImg,
                        averageHue: item.averageHue || '',
                        favoriteId: item.favoriteId || 0,
                        footprintTime: item.footprintTime || '',
                        wfItemType: platformList[item.blogger.platformId + ''] || 'ins',
                        shared: item.shared || 1
                    });

                    break;
                case 'owner':
                case 'insOwner':
                case 'followOwner':
                    // 非库内博主无ID，使用13位时间戳代替
                    newData.push({
                        id: item.id || new Date().getTime(),
                        nickname: item.nickname,
                        headImg: item.headImg,
                        fansNum: item.fansNum,
                        postNum: item.postNum,
                        isVerified: item.isVerified || 0,
                        followId: item.followId || 0,
                        wfItemType: platformList[item.platformId + ''] || 'ins',
                        source: item.source || 1,
                        status: item.status || 1, // ins关注订阅状态
                        intro: item.introduction || '', // 博主简介
                        spiderStatus: item.hasOwnProperty('spiderStatus') ?
                            item.spiderStatus : 8 // 爬虫状态，默认8，正常爬取
                    });
                    break;
                case 'runwayDetail':
                    if (!item.mediaUrl) {
                        break;
                    }

                    // 换算新宽高
                    let runwayImgWH = self.preImgWH(item.width, item.height);

                    newData.push({
                        id: item.id,
                        mediaUrl: item.mediaUrl,
                        width: runwayImgWH.width,
                        height: runwayImgWH.height,
                        averageHue: item.averageHue || '',
                        showId: item.showId,
                        wfItemType: 'runway'
                    });

                    break;
            }
        }

        // 特殊处理，订阅页面，请求参数增加postTime
        if (this.state.wfType === 'followBlog') {
            let len = newData.length;
            this.state.queryData.postTime = newData[len - 1].postTime;
        }

        return {
            data: newData,
            // isComplete: data.length >= self.state.queryData.pageSize
            isComplete: data.length > 0
        };
    }

    // 预处理图片宽高
    preImgWH(w, h) {
        let _scale = this.state.columnWidth / w;
        return {
            width: w * _scale,
            height: h * _scale
        };
    }

    // 定时任务，监听容器的width、top
    containerTimeOut() {
        // 约定containerTimeStamp=-1时，组件已被卸载
        if (this.state.containerTimeStamp === -1) {
            return;
        }

        // rAF,40帧后执行,16.67ms*40
        if (this.state.containerTimeStamp < 40) {
            this.state.containerTimeStamp++;
            requestAnimationFrame(() => {
                this.containerTimeOut();
            });
            return;
        }

        this.state.containerTimeStamp = 0;

        let {w, t} = this.getContainerPos(),
            scrollTop = this.state.initContainerTop - t;

        // console.log(w, scrollTop, t);
        // 滚动事件
        this.scrollEvent(scrollTop);

        // resize事件
        this.resizeEvent(w);

        // 重新开启定时任务
        this.containerTimeOut();
    }

    // 滚动事件
    scrollEvent(scrollTop) {
        // 下拉触发
        if (this.state.isScroll) {
            (scrollTop - this.state.scrollTop >= 0) && this.appendDetect();
        }

        // 滚动定时任务，不受isScroll影响，选择显示区间
        this.state.scrollTop = scrollTop;
        this.state.scrollFlag || this.scrollTimeOut();
    }

    scrollTimeOut() {
        let self = this,
            scrollTop = self.state.scrollTop;
        self.state.scrollFlag = true;
        setTimeout(() => {
            // 节点替换
            if (Math.abs(scrollTop - self.state.scrollTopPre) > 500) {
                self.state.scrollTopPre = scrollTop;
                self._calcShowItem();
            }
            self.state.scrollFlag = false;
        }, 10);
    }

    startScroll() {
        this.state.isScroll = true;
        console.log('添加滚动事件');
    }

    removeScroll() {
        this.state.isScroll = false;
        console.log('移除滚动事件');
    }

    // 计算显示区间
    _calcShowItem(cb) {
        let calcWFData = this.state.waterFallData,
            currentScrollTop = this.state.scrollTop,
            sentryScrollTop = Math.max(currentScrollTop - 2500 - this.state.initContainerTop, 0),
            len = calcWFData.length,
            showItemStart = 0,
            showItemEnd = 0;

        for (let i = 0; i < len; i++) {
            let item = calcWFData[i];
            if (item.translateY >= sentryScrollTop) {
                showItemStart = i;
                showItemEnd = Math.min(len, showItemStart + this.state.queryData.pageSize * 3);
                break;
            }
        }

        console.log('调整显示', showItemStart, showItemEnd);

        // 更新显示区间
        this.setState({
            showItemStart: showItemStart,
            showItemEnd: showItemEnd
        }, () => {
            cb && cb();
        })
    }

    // 开启下拉加载
    startAutoLoad() {
        console.log('开启下拉加载');
        this.setState({
            loadType: 1
        }, function () {
            this.startScroll();
            this.getData();
        })
    }

    // 置顶按钮消隐
    toTopShowHide() {
        let self = this;
        document.addEventListener('scroll', function () {
            let scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            // 置顶按钮消隐
            scrollTop > 300 !== self.state.toTop && (self.state.toTop = (scrollTop > 300));
            ReactDOM.render(<ToTop show={self.state.toTop}
                                   toTop={self.toTop.bind(self)}/>, document.getElementById('btn-to-top'));
        });
    }

    // 置顶
    renderToTop() {
        let toTopEl = document.getElementById('btn-to-top'),
            parentEl = document.getElementById('df-side-wrapper');

        if (!parentEl) {
            // 无节点则创建
            parentEl = document.createElement('div');
            parentEl.id = 'df-side-wrapper';
            document.getElementById('content').appendChild(parentEl);
        }

        // 置顶按钮已存在则跳出
        if (toTopEl) {
            return;
        }

        toTopEl = document.createElement('div');

        let firstEl = parentEl.getElementsByClassName('btn')[0];
        toTopEl.id = 'btn-to-top';
        // 置顶按钮插在第一位
        if (firstEl) {
            parentEl.insertBefore(toTopEl, firstEl);
        } else {
            parentEl.appendChild(toTopEl);
        }
        ReactDOM.render(<ToTop show={this.state.toTop} toTop={this.toTop.bind(this)}/>,
            document.getElementById('btn-to-top'));
    }

    toTop() {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        this.state.scrollTop = 0;
        this._calcShowItem();
    }

    // 重置瀑布流
    _reset(page = 0) {
        // 固定容器高度，避免置顶
        // let el = this.refs.container,
        //     _height = Math.floor(el.offsetHeight);
        // el.style.minHeight = _height + 'px';

        this._resetLayout(this.state.columnNum);

        this.setState({
            statusFlag: 1,
            scrollTop: 0, //滚动距离(事件绑在window上)
            page: page, //当前页
            index: 0, //已添加数量
            start: 0,
            waterFallData: [],//瀑布流全部数据
            waterFallTotal: 0,//数据总数
            waterFallDataCurrent: [],
            showItemStart: 0, // 显示节点开始位置
            showItemEnd: 0, // 显示节点开始位置
            isScroll: false, // 滚动加载开启状态
            scrollFlag: false, // 滚动事件处理状态
        }, function () {
            this._initGetData();
        })
    }

    // 渲染组装，单元块区分，时间线
    _renderWaterFallItem() {
        let self = this,
            _list = [],
            _length = self.state.waterFallData.length,
            _start = Math.min(self.state.showItemStart, _length),
            _end = Math.min(self.state.showItemEnd, _length);

        console.log('组装单元', _start, _end);

        for (let i = _start; i < _end; i++) {
            let _key = `item_${i}`,
                _data = self.state.waterFallData[i],
                _id = _data.id;

            // 根据瀑布流单元块类型，选择相应组件
            switch (`${this.state.wfType}-${_data.wfItemType}`) {
                // 默认
                default:
                    _list.push(<WFItemIns wfType={self.state.wfType}
                                          handleClickImg={self.handleImg.bind(self, i, _id)}
                                          handleSelectPop={self.handleSelectPop.bind(self, i, _id)}
                                          isFolderBtn={self.state.isFolderBtn}
                                          isCancelFolder={self.state.isCancelFolder}
                                          columnWidth={self.state.columnWidth}
                                          key={_key}
                                          data={_data}/>);
            }
        }

        // 组装完，修改布局插件计算布局数量
        self.state.msnryCount = _length;

        return _list;
    }

    // 选择渲染状态组件
    _renderWaterFallStatus() {
        let html = '';
        switch (this.state.statusFlag) {
            case 1:
                html = <GetData/>;
                break;
            case 2:
                html = <NoResult wfType={this.state.wfType}
                                 noResultTip={this.props.noResultTip}
                                 columnNum={this.state.columnNum}
                                 q={this.state.queryData.q}/>;
                break;
            case 3:
                html = <Loading/>;
                break;
            case 4:
                html = '';
                break;
            case 5:
                html = this.state.noBottom ? '' : <ToBottom wfType={this.state.wfType}/>;
                break;
            case -1:
            default:
                html = <div>系统异常，请刷新</div>
        }
        return html;
    }

    render() {
        let column_html = this.state.statusFlag === 2 ? '' : this._renderWaterFallItem(),
            status_html = this._renderWaterFallStatus(),
            _containerStyle = this.state.wfHeight === 0 ?
                {} : {'height': `${this.state.wfHeight}px`};
        return <div className="water-fall-container">
            <div className="water-fall-tab">
                {this.state.showResultCount &&
                <div className="total-num-tab float-l">共{this.state.waterFallTotal}枚</div>}
            </div>
            <div className="clearfix"/>
            {this.state.statusFlag === 1 && status_html}
            <div id="container" ref="container" style={_containerStyle}>
                {column_html}
            </div>
            {this.state.statusFlag !== 1 && status_html}
        </div>
    }

    // 视窗修改，resize
    resizeEvent(w) {
        // 宽度未改变
        if (this.state.initContainerWidth === w) {
            return;
        }

        // 子元素为0
        if (this.state.waterFallData.length === 0) {
            return;
        }

        if (this.state.resizeFlag) {
            return;
        }

        this.state.resizeFlag = true;
        let _columnNum = this._calcColumnNum(w),
            currentColumnNum = this.state.columnNum;

        // 列数不变，不更新
        if (_columnNum === currentColumnNum) {
            this.state.resizeFlag = false;
            return;
        }

        console.log('视窗resize');
        this.state.columnNum = _columnNum;
        this.state.initContainerWidth = w;
        this._resetLayout(_columnNum);

        this.calcWFItem(0, this.state.waterFallData.length);
        this.state.resizeFlag = false;

        // 重新计算显示区间
        this._calcShowItem();
    }
}

export default WaterFall;

