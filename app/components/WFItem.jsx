import base from '../common';
import React from 'react';
import {LoadImage} from './WFUtils.jsx'

// 可配置多个瀑布流单元块
class WFItem_1 extends React.Component {
    constructor(props) {
        super(props);
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
                </div>
            </div>
        );
    }
}

class WFItem_2 extends React.Component {
    render() {
        return null
    }
}

export {
    WFItem_1,
    WFItem_2
}