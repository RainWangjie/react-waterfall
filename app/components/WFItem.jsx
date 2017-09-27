import base from '../common';
import React from 'react';
import {LoadImage} from './WFUtils.jsx'

// 可配置多个瀑布流单元块
class WFItem_1 extends React.Component {
    constructor(props) {
        super(props);
    }

    delItem_1() {
        this.props.delItem();
    }

    delItem_2() {
        this.props.delItemExecute();
    }

    render() {
        let data = this.props.data,
            _wfItemStyle = base.setDivStyle(data);
        return (
            <div className='water-fall-item shadow'
                 style={_wfItemStyle}>
                <div className="water-fall-item-img">
                    <LoadImage src={data.mediaUrl}
                               bgColor={data.averageHue}
                               width={data.width} height={data.height} aliWidth={this.props.columnWidth}/>
                    <button className="btn-del-item btn-del-item-1"
                            onClick={this.delItem_1.bind(this)}>X-动画1
                    </button>
                    <button className="btn-del-item btn-del-item-2"
                            onClick={this.delItem_2.bind(this)}>X-动画2
                    </button>
                </div>
            </div>
        );
    }
}

class WFItem_2 extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let data = this.props.data,
            _wfItemStyle = base.setDivStyle(data);
        return (
            <div className='water-fall-item text shadow'
                 style={_wfItemStyle}>
                {data.text}
            </div>
        );
    }
}

export {
    WFItem_1,
    WFItem_2
}