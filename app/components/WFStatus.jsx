/**
 * Created by gewangjie on 2017/9/19
 */
import React from 'react';

/*
 * 数据请求动画组件
 */
class GetData extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <div className="water-fall-loading">
            <img src="https://deepfashion.oss-cn-hangzhou.aliyuncs.com/static-web/loading2.gif"/>
        </div>;
    }
}

/*
 * 加载中
 */
class Loading extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <div className="water-fall-bottom">加载中...</div>
    }
}

/*
 * 瀑布流触底
 */
class ToBottom extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <div className="water-fall-bottom">end</div>
    }
}

/*
 * 瀑布流查询无数据
 */
class NoResult extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <div className="water-fall-no-result">No Result</div>
    }
}

export {
    GetData,
    Loading,
    ToBottom,
    NoResult
}