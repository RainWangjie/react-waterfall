/**
 * Created by gewangjie on 2017/9/19
 */

import base from '../common';
import React from 'react';

let loadImageSrc = "https://deepfashion.oss-cn-hangzhou.aliyuncs.com/static-web/e5e5e5.jpg";

/* 图片加载组件*/
class LoadImage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            bgColor: this.props.bgColor ? this.props.bgColor.replace('0x', '#') : base.getRandomColor(),
            status: false,
            originalSrc: this.props.src,
            src: this.props.loadImg || loadImageSrc,
        }
    }

    componentDidMount() {
        this._initImage();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.src !== this.state.originalSrc) {
            this.setState({
                originalSrc: nextProps.src,
                src: nextProps.loadImg || loadImageSrc
            }, function () {
                this._initImage();
            });
        }
    }

    // 获取随机颜色
    _initImage(params) {
        let image = new Image(),
            t = this,
            tryCount = 2,
            _originalSrc = base.ossImg(t.state.originalSrc, t.props.aliWidth);
        image.src = _originalSrc || loadImageSrc;

        image.onload = function () {
            image.src === _originalSrc && t.setState({
                status: true,
                src: image.src
            });
        };
        image.onerror = function () {
            if (tryCount-- > 0) {
                image.src = t.state.originalSrc || loadImageSrc;
            } else {
                //图片加载错误，给默认图片
                image.src = loadImageSrc;
            }
        }
    }

    render() {
        let style = {
            'width': this.props.width + 'px',
            'height': this.props.height + 'px',
            'background': this.state.bgColor
        };
        return this.state.status ?
            <img src={this.state.src}
                 width={this.props.width}
                 height={this.props.height}/> : <div style={style}/>;
    }
}

LoadImage.defaultProps = {
    width: 'auto',
    height: 'auto'
};

class ToTop extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let _className = 'btn btn-to-top ' + (this.props.show ? 'show' : '');
        return <div className={_className} onClick={this.props.toTop}>
            <div className="move-pane">
                <div className="white-text"><i className="iconfont">&#xe659;</i></div>
                <div className="red-text"><i className="iconfont">&#xe659;</i>
                </div>
            </div>
        </div>
    }
}

export {
    ToTop,
    LoadImage
}