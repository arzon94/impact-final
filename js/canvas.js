import * as d3 from 'd3';
import minimaper from './minimap.js'

let width = 500,
    height = 500,
    base = null,
    wrapperBorder = 0,
    minimap = null,
    minimapPadding = 10,
    minimapScale = 0.25;

export default function canvas(selection) {
    base = selection;

    const svgWidth = (width + (wrapperBorder * 2) + minimapPadding * 2 + (width * minimapScale));
    const svgHeight = (height + (wrapperBorder * 2) + minimapPadding * 2);
    const svg = selection.append("svg")
        .attr("class", "svg canvas")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("shape-rendering", "auto");

    let padding = 20,
        boundWidth = d3.select("div#canvasqPWKOg").node().getBoundingClientRect().width,
        boundHeight = d3.select("div#canvasqPWKOg").node().getBoundingClientRect().height,
        bBox = svg.node().getBoundingClientRect(),
        hRatio = boundWidth / (bBox.height + padding),
        wRatio = boundHeight / (bBox.width + padding);

    // console.log("boundwidth: ", boundWidth)
    // console.log("boundHeight: ", boundHeight)
    // console.log("svgWidth", svgWidth, "svgHeight", svgHeight)
    // console.log("width", width, "height", height)


    const svgDefs = svg.append("defs");
    svgDefs.append("clipPath")
        .attr("id", "wrapperClipPath_qwpyza")
        .attr("class", "wrapper clipPath")
        .append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);
    svgDefs.append("clipPath")
        .attr("id", "minimapClipPath_qwpyza")
        .attr("class", "minimap clipPath")
        .attr("width", width)
        .attr("height", height)
        .append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);

    const filter = svgDefs.append("svg:filter")
        .attr("id", "minimapDropShadow_qwpyza")
        .attr("x", "-20%")
        .attr("y", "-20%")
        .attr("width", "150%")
        .attr("height", "150%");
    filter.append("svg:feOffset")
        .attr("result", "offOut")
        .attr("in", "SourceGraphic")
        .attr("dx", "1")
        .attr("dy", "1");

    const outerWrapper = svg.append("g")
    // .attr("class", "wrapper outer")
        .attr("transform", `translate(0, ${minimapPadding})`);
    outerWrapper.append("rect")
        .attr("class", "background")
        .attr("width", width + wrapperBorder * 2)
        .attr("height", height + wrapperBorder * 2);

    const innerWrapper = outerWrapper.append("g")
    // .attr("class", "wrapper inner")
    // .attr("clip-path", "url(#wrapperClipPath_qwpyza)")
    // .attr("transform", `translate(${wrapperBorder},${wrapperBorder})`);

    const panCanvas = innerWrapper.append("g")
        .attr("class", "panCanvas")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(0,0)");
    //
    panCanvas.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);

    const zoom = d3.zoom()
        .scaleExtent([0.1, 5]);

    // updates the zoom boundaries based on the current size and scale
    const updateCanvasZoomExtents = () => {
        const scale = innerWrapper.property("__zoom").k;
        const targetWidth = svgWidth;
        const targetHeight = svgHeight;
        const viewportWidth = width;
        const viewportHeight = height;
        zoom.translateExtent([
            [-viewportWidth / scale, -viewportHeight / scale],
            [(viewportWidth / scale + targetWidth), (viewportHeight / scale + targetHeight)]
        ]);
    };

    const zoomHandler = () => {
        panCanvas.attr("transform", d3.event.transform);
        // here we filter out the emitting of events that originated outside of the normal ZoomBehavior; this prevents an infinite loop
        // between the host and the minimap
        if (d3.event.sourceEvent instanceof MouseEvent || d3.event.sourceEvent instanceof WheelEvent) {
            minimap.update(d3.event.transform);
        }
        updateCanvasZoomExtents();
    };

    zoom.on("zoom", zoomHandler);

    innerWrapper.call(zoom);

    // initialize the minimap, passing needed references
    minimap = minimaper
        .host(canvas)
        .target(panCanvas)
        .minimapScale(minimapScale)
        .x(width + minimapPadding)
        .y(minimapPadding);
    // .y(minimapPadding);

    svg.call(minimap);

    /** ADD SHAPE **/
    canvas.addItem = item => {
        if (item != null) {
            panCanvas.node().appendChild(item.node());
        }
        minimap.render();
    };

    /** RENDER **/
    canvas.render = () => {
        svgDefs
            .select(".clipPath .background")
            .attr("width", width)
            .attr("height", height);

        svg
            .attr("width", width + (wrapperBorder * 2) + minimapPadding * 2 + (width * minimapScale))
            .attr("height", height + (wrapperBorder * 2));

        outerWrapper
            .select(".background")
            .attr("width", width + wrapperBorder * 2)
            .attr("height", height + wrapperBorder * 2);

        innerWrapper
            .attr("transform", `translate(${wrapperBorder},${wrapperBorder})`)
            .select(".background")
            .attr("width", width)
            .attr("height", height);

        panCanvas
            .attr("width", width)
            .attr("height", height)
            .select(".background")
            .attr("width", width)
            .attr("height", height);

        minimap
        // .x(minimapPadding)
            .x(width + minimapPadding)
            .y(minimapPadding)
            .render();
    };

    canvas.reset = () => {
        //svg.call(zoom.event);
        zoom.transform(panCanvas, d3.zoomIdentity);
        svg.property("__zoom", d3.zoomIdentity);
        minimap.update(d3.zoomIdentity);
    };

    canvas.update = minimapZoomTransform => {
        zoom.transform(panCanvas, minimapZoomTransform);
        // update the '__zoom' property with the new transform on the rootGroup which is where the zoomBehavior stores it since it was the
        // call target during initialization
        innerWrapper.property("__zoom", minimapZoomTransform);

        updateCanvasZoomExtents();
    };

    updateCanvasZoomExtents();

    return canvas;
}

//============================================================
// Accessors
//============================================================

canvas.width = function (value) {
    if (!arguments.length) return width;
    width = parseInt(value, 10);
    return this;
};

canvas.height = function (value) {
    if (!arguments.length) return height;
    height = parseInt(value, 10);
    return this;
};
