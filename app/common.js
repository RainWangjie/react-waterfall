/**
 * Created by gewangjie on 2017/9/20
 */

let base = {
    getRandomColor() {
        let defaultColor = ['#DDC4C4', '#C1BE88', '#D58D8D', '#A2C3AA', '#BAC4D6', '#A9A6D4'];
        return defaultColor[Math.round(Math.random() * 5)];
    },

    // 瀑布流单元translate设置
    setDivStyle(data) {
        if (!data.hasOwnProperty('translateX')) {
            return {
                'opacity': 0
            }
        }
        let x = data.translateX || 0,
            y = data.translateY || 0;

        return {
            'opacity': 1,
            'transform': `translateX(${x}px) translateY(${y}px) translateZ(0)`,
            'WebkitTransform': `translateX(${x}px) translateY(${y}px) translateZ(0)`
        }
    },

    // 获取单元的translateX,Y值
    getDivTranslate(el) {
        let _transform = window.getComputedStyle(el).transform.replace(/[^0-9|\.\-,]/g, '').split(','),
            x = _transform[4] * 1,
            y = _transform[5] * 1;
        return {x, y}
    },

    ossImg(src, w) {
        // 无src，直接跳出
        if (!src || src === null) {
            return;
        }

        let _w = w ? `/resize,w_${Math.floor(w * 1 * (window.devicePixelRatio || 1))}` : '',
            _c = '/format,jpg/interlace,1';
        return `${src}?x-oss-process=image${_w}${_c}`;
    },

    // 获取随机Id
    getRandomId() {
        return `${new Date().getTime()}${Math.random().toString().substr(2, 6)}`
    }
};

export default base;