import * as d3 from 'd3';

let minimapScale = 0.15,
    host = null,
    base = null,
    target = null,
    width = 0,
    height = 0,
    x = 0,
    y = 0;

export default function minimap(selection) {

    base = selection;

    const zoom = d3.zoom()
        .scaleExtent([0.1, 5]);

    // updates the zoom boundaries based on the current size and scale
    const updateMinimapZoomExtents = () => {
        const scale = container.property("__zoom").k;
        const targetWidth = parseInt(target.attr("width"));
        const targetHeight = parseInt(target.attr("height"));
        const viewportWidth = host.width();
        const viewportHeight = host.height();
        zoom.translateExtent([
            [-viewportWidth / scale, -viewportHeight / scale],
            [(viewportWidth / scale + targetWidth), (viewportHeight / scale + targetHeight)]
        ]);
    };

    const zoomHandler = () => {
        frame.attr("transform", d3.event.transform);
        // here we filter out the emitting of events that originated outside of the normal ZoomBehavior; this prevents an infinite loop
        // between the host and the minimap
        if (d3.event.sourceEvent instanceof MouseEvent || d3.event.sourceEvent instanceof WheelEvent) {
            // invert the outgoing transform and apply it to the host
            const transform = d3.event.transform;
            // ordering matters here! you have to scale() before you translate()
            const modifiedTransform = d3.zoomIdentity.scale(1 / transform.k).translate(-transform.x, -transform.y);
            host.update(modifiedTransform);
        }

        updateMinimapZoomExtents();
    };

    zoom.on("zoom", zoomHandler);

    const container = selection.append("g")
        .attr("class", "minimap");

    container.call(zoom);

    minimap.node = container.node();

    const frame = container.append("g")
        .attr("class", "frame");

    frame.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height)
        .attr("filter.less", "url(#minimapDropShadow_qPWKOg)");


    minimap.update = hostTransform => {
        // invert the incoming zoomTransform; ordering matters here! you have to scale() before you translate()
        const modifiedTransform = d3.zoomIdentity.scale((1 / hostTransform.k)).translate(-hostTransform.x, -hostTransform.y);
        // call this.zoom.transform which will reuse the handleZoom method below
        zoom.transform(frame, modifiedTransform);
        // update the new transform onto the minimapCanvas which is where the zoomBehavior stores it since it was the call target during initialization
        container.property("__zoom", modifiedTransform);

        updateMinimapZoomExtents();
    };


    /** RENDER **/
    minimap.render = () => {
        // update the placement of the minimap
        container.attr("transform", `translate(${x},${y})scale(${minimapScale})`);
        // update the visualization being shown by the minimap in case its appearance has changed
        const node = target.node().cloneNode(true);
        node.removeAttribute("id");
        base.selectAll(".minimap .panCanvas").remove();
        minimap.node.appendChild(node); // minimap node is the container's node
        d3.select(node).attr("transform", "translate(0,0)");
        // keep the minimap's viewport (frame) sized to match the current visualization viewport dimensions
        frame.select(".background")
            .attr("width", width)
            .attr("height", height);
        frame.node().parentNode.appendChild(frame.node());
    };

    updateMinimapZoomExtents();
    return minimap;
}

//============================================================
// Accessors
//============================================================
minimap.width = function (value) {
    if (!arguments.length) return width;
    width = parseInt(value, 10);
    return this;
};
minimap.height = function (value) {
    if (!arguments.length) return height;
    height = parseInt(value, 10);
    return this;
};
minimap.x = function (value) {
    if (!arguments.length) return x;
    x = parseInt(value, 10);
    return this;
};
minimap.y = function (value) {
    if (!arguments.length) return y;
    y = parseInt(value, 10);
    return this;
};
minimap.host = function (value) {
    if (!arguments.length) {
        return host;
    }
    host = value;
    return this;
};
minimap.minimapScale = function (value) {
    if (!arguments.length) {
        return minimapScale;
    }
    minimapScale = value;
    return this;
};
minimap.target = function (value) {
    if (!arguments.length) {
        return target;
    }
    target = value;
    width = parseInt(target.attr("width"), 10);
    height = parseInt(target.attr("height"), 10);
    return this;
};
