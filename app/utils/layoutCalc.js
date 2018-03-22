/**
 * Created by gewangjie on 2017/9/19
 */
class LayoutCalc {
    constructor(options) {
        this.init(options);
    }

    // 默认数据
    defaultData() {
        return {
            columnWidth: 288, // 列宽
            itemSelector: '.water-fall-item',    // 要布局的网格元素
            gutter: 20,                   // 网格间水平方向边距，垂直方向边距使用css的margin-bottom设置
            columnNum: 4,
            initColumnHeight: [0],
            columnHeight: [0, 0, 0, 0], // 列高
        }
    }

    // 初始化
    init(options) {
        this.options = this.defaultData();
        for (let i in options) {
            if (!this.options.hasOwnProperty(i)) {
                console.error('配置方法不含', i);
                return;
            }
            this.options[i] = options[i];
        }

        // 配置初始高度
        for (let i = 0, len = this.options.initColumnHeight.length; i < len; i++) {
            this.options.columnHeight[i] = this.options.initColumnHeight[i];
        }

        console.log('布局配置', this.options);
    }

    // 计算下一个,返回坐标
    calc(w, h) {
        let x, y, colIndex = 0,// 列索引
            col = Math.floor(w / this.options.columnWidth);

        // 单列元素
        if (col === 1) {
            let minH = Math.min.apply(null, this.options.columnHeight);

            colIndex = this.options.columnHeight.indexOf(minH);
            // 计算新值
            x = colIndex * (this.options.columnWidth + this.options.gutter);
            y = minH;

            // 更新列高
            this.options.columnHeight[colIndex] = y + h;
        }

        // 2列元素
        if (col === 2) {
            for (let i = 0, len = this.options.columnNum - 1; i < len; i++) {
                let h1 = this.options.columnHeight[i],
                    h2 = this.options.columnHeight[i + 1];
                if (h1 >= h2) {
                    x = i * (this.options.columnWidth + this.options.gutter);
                    y = h1;
                    this.options.columnHeight[i] = y + h;
                    this.options.columnHeight[i + 1] = y + h;
                    colIndex = -1;
                    break;
                }
            }
        }

        // 宽度占据整行
        if (w === -1 || col === this.options.columnNum) {
            let maxH = Math.max.apply(null, this.options.columnHeight),
                columnHeight_new = maxH + h;

            // 计算新值
            x = 0;
            y = maxH;
            colIndex = -1;

            // 更新列高,所有列高均为maxH + h
            for (let i = 0; i < this.options.columnNum; i++) {
                this.options.columnHeight[i] = columnHeight_new;
            }
        }

        return {x, y, colIndex}
    }

    getElWH(el) {
        // height+padding+border+margin,padding,border包含在height
        let w = el.offsetWidth,
            h = el.offsetHeight;

        // 设置盒模型，不需要累加padding、border
        let elStyle = window.getComputedStyle(el),
            paddingTop = this.dealNum(elStyle.paddingTop),
            paddingBottom = this.dealNum(elStyle.paddingBottom),
            borderTop = this.dealNum(elStyle.borderTopWidth),
            borderBottom = this.dealNum(elStyle.borderBottomWidth),
            marginTop = this.dealNum(elStyle.marginTop),
            marginBottom = this.dealNum(elStyle.marginBottom);
        h = h + marginTop + marginBottom;
        return {w, h}
    }

    dealNum(num) {
        return num.replace('px', '') * 1;
    }

    // 更新列高
    updateColHeight(col, num) {
        this.options.columnHeight[col] += num;
    }

    // 获取最大height
    getMaxHeight() {
        return Math.max.apply(null, this.options.columnHeight)
    }

    // 重置
    reset(options) {
        this.init(options);
    }
}

export default LayoutCalc;