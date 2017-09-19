/**
 * Created by gewangjie on 2017/9/19
 */
let React = require('react');

class Hello extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <div>Hello，React+webpack+ES6环境搭建</div>
    }
}

module.exports = Hello;