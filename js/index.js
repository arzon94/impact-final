import canvaser from './canvas.js'
import * as dagreD3 from 'dagre-d3'
import * as d3 from 'd3';
import dataGenerator from '../js/dataGenerator.js'
import * as table from './table'
import "regenerator-runtime/runtime";
import json from '../data/x_tables_bv'

const render = dagreD3.render(),
    icons = {
    "job": "\uf013",
    "sas": "\uf70c",
    "xls": "\uf1c3",
    "csv": "\uf6dd",
    "bdat": "\uf0ce",
    "log": "\uf039",
    "mnf": "\uf542",
    "png": "\uf1c5",
    "sas7bdat": "\uf1c0",
    "rtf": "\uf1c2"
};
let graphMap = new Map(),
    fileTypesMap = new Map(),
    orientation = 'TB',
    multipleRoots = true,
    graph = new dagreD3.graphlib.Graph({ compound: true});
graph.setGraph({rankdir: orientation, nodesep: 25, }).setDefaultEdgeLabel(function() { return {}; });

const labelText = ({icon, name, fileType}, color) => {
    //remove filepath to leave only file name in name
    fileType = fileType.trim()
    let i = icons[fileType] || "\uf70c";
    name = name.split("/").pop();
    return '<div class="labelText" style="color: ' + (color || "") + ' "> <i class="fa" style="font-size: 1.3em"> ' + i + ' </i>   '+ name + ' </div>'
};

function populateMap(data) {
    // let initialData = data || json;
    // for (const i in initialData) {
    //     let id = initialData[i]["nodeId"];
    //     if (graphMap.has(id)){
    //         let currentEntry = graphMap.get(id);
    //         currentEntry.inputs = [...currentEntry.inputs, ...initialData[i]["inputs"]];
    //         currentEntry.outputs = [...currentEntry.outputs, ...initialData[i]["outputs"]];
    //     }
    //     else {
    //         graphMap.set(id, {
    //             outputs: initialData[i]["outputs"],
    //             detail: initialData[i]["detail"],
    //             inputs: initialData[i]["inputs"],
    //             display: true
    //         });
    //         let type = initialData[i]["detail"]["fileType"];
    //         if (fileTypesMap.has(type)){
    //             fileTypesMap.get(type).ids.push(id);
    //         }
    //         else {
    //             fileTypesMap.set(type, {
    //                 display: true,
    //                 ids: [id]
    //             })
    //         }
    //     }
    // }
    populateFilter();

    let a = dataGenerator(multipleRoots, new Map());
    graphMap = a[0];
    fileTypesMap = a[1];
    populateFilter();
}
function populateFilter() {
    let select = document.getElementById( 'multi-select-options' ),
        option;
    select.innerHTML = '';
    for (let [key] of fileTypesMap) {
        option = document.createElement( 'li' );
        let label = document.createElement('label');
        let input = document.createElement('input');
        let span = document.createElement('span');
        input.setAttribute("type", "checkbox");
        input.checked = !(fileTypesMap.get(key).display);
        input.setAttribute("name", key);
        input.onclick = () => filter(key);
        span.textContent = key;
        option.appendChild(label);
        label.appendChild(input);
        label.appendChild(span);
        select.appendChild( option );
    }
}

function filter(key){
    let shoulddisplay = !fileTypesMap.get(key).display
    fileTypesMap.get(key).display = shoulddisplay;
    fileTypesMap.get(key).ids.forEach((id) =>{
        graphMap.get(id).display = shoulddisplay
    });
    graph = new dagreD3.graphlib.Graph({compound: true} )
    graph.setGraph({rankdir: orientation, nodesep: 25,});
    generateDAG();
    renderGraph();
}
function highlightNeighbors(d) {
    table.createTable();
    let button = document.getElementById("downloadCSV");
    button.setAttribute("style", "display: block;");
    button.onclick = () => table.exportCSV(graphMap);

    table.addTableRow(d, graphMap.get(d));
    document.getElementById(d).setAttribute("class", "nodeHighlight");

    let children = graphMap.get(d).outputs;
    let parents = graphMap.get(d).inputs;
    const circulardp = children.filter(element => parents.includes(element));
    if (circulardp.length > 0) {
        children = children.filter(element => !circulardp.includes(element))
        parents = parents.filter(element => !circulardp.includes(element))
        circulardp.forEach( d => {
            table.addTableRow(d, graphMap.get(d))
            document.getElementById(d).setAttribute("class", "circulardependency")
        });
        d3.select("svg")
            .select("g")
            .selectAll("g.node")
            .filter(function(d) {
                return circulardp.includes(d);
            })
            .select("rect.label-container")
            .style("fill", "#F7CE5B")
            .style("stroke", "#F7CE5B");
    }

    if (children.length > 0) {
        children.forEach( d => {
            table.addTableRow(d, graphMap.get(d))
            document.getElementById(d).setAttribute("class", "output")
        });
        let nodes = d3.select("svg")
            .select("g")
            .selectAll("g.node")
            .filter(function(d) {
                return children.includes(d);
            })
        nodes.select("rect.label-container")
            .style("stroke", "#78CAD2")
            .style("fill", "#78CAD2")
    }
    if (parents.length > 0) {
        parents.forEach( d => {
            table.addTableRow(d, graphMap.get(d))
            document.getElementById(d).setAttribute("class", "input")
        });
        let nodes =  d3.select("svg")
            .select("g")
            .selectAll("g.node")
            .filter(function(d) {
                return parents.includes(d);
            })
        nodes.select("rect.label-container")
            .style("stroke", "#49D49D")
            .style("fill", "#49D49D")
    }
}

function changeTextFill(selection, color) {
    selection.html(function() {
        let wrapper= document.createElement('div');
        wrapper.innerHTML= selection.html();
        wrapper.firstChild.setAttribute("style", "color: " + color + ";")
        return wrapper.innerHTML
    });
}

function generateDAG() {
    for (const [key, value] of graphMap) {
      if(value.display){
          const label = labelText(value.detail);
          graph.setNode(key, {
              label: label,
              labelType: 'html',
              // label: value.detail.name,
              Edge: value.outputs,
              detail: value.detail
          });
          value.outputs.forEach(edge => {
              if(graphMap.get(edge).display) {
                  graph.setEdge(key, edge, {
                      arrowhead: "normal",
                      curve: d3.curveBasis,
                  });
              }
          });
      }
    }
}

function renderGraph() {
    d3.selectAll("div#canvasqPWKOg > *").remove();
    d3.select("div.tooltip").remove();
    let svg = d3.select("body").append("svg")
            .classed("svg-content", true),
        inner = svg.append("g");
    // Run the renderer. This is what draws the final graph.
    render(inner, graph);

    let tooltip = d3
        .select("body")
        .append("div")
        // .attr("id", "tooltip_template")
        .attr("class", "tooltip")
        .append("span")
        .attr("class", (orientation === 'TB') ? "lefttip tooltiptext" : "toptip tooltiptext ")
        .html("Simple Tooltip...");

    svg
        .selectAll("g.node")
        .on("click", (id) => {
            tooltip.style("visibility", "hidden");
            const newData = dataGenerator(false, fileTypesMap, id, graphMap.get(id), );
            graphMap.delete(id)
            graphMap = new Map(function*() { yield* graphMap; yield* newData[0]; }());
            fileTypesMap = newData[1];
            populateFilter();
            generateDAG();
            renderGraph();
        })
        .attr("data-detail", function(v) {
            let {syncVersion, modDate, name} = graph.node(v).detail;
            return `<table><tr><td>ID:</td><td class='small'> ${v}  </td></tr>` +
                `<tr><td>Version: </td><td> ${syncVersion}</td></tr>` +
                `<tr><td>Modified:</td><td> ${modDate} </td></tr>`+
                `<tr><td>path: </td><td class='filepath' id='path-container'><div > ${name}</div>`  +
                "</td></tr></table>";
        })
        .on("mouseenter", function(d, i) {
            highlightNeighbors(d, i);
            tooltip.style("visibility", "visible");
            let rect = d3.select(this).select("rect").node().getBoundingClientRect();
            // let scale = d3.select("#canvasqPWKOg").select("svg").select("g.panCanvas").node().transform.baseVal.consolidate().matrix.a;
            let mPos = d3.select("#canvasqPWKOg").select("svg").node().getBoundingClientRect()
            tooltip
                .html(this.dataset.detail)
                .style("top", event.pageY - 10 + "px")
                .style("left", event.pageX + 15 + "px");
            // .style("top", () => {
            //     return (orientation === 'TB') ? (rect.y - mPos.top  ) + "px"
            //         : (rect.y + (rect.height)) + 5  + "px";
            // })
            // .style("left", () => {
            //     return (orientation === 'TB') ? (rect.x + (rect.width)) + 5 + "px"
            //         : ((rect.left - (1/(rect.width - rect.height)* 500)) ) + "px";
            // });
        })
        .on("mousemove", function() {
            tooltip
                .html(this.dataset.detail)
                .style("top", event.pageY - 10 + "px")
                .style("left", event.pageX + 15 + "px");
        })
        .on("mouseout", function() {
            d3.selectAll("rect.label-container").style("fill", "white");
            d3.selectAll("rect.label-container").style("stroke", "black");
            tooltip.style("visibility", "hidden");
        })
        .selectAll("rect.label-container")
        .on("mouseenter", function() {
            d3.select(this).style("fill", "#1B4965").style("stroke", "#1B4965");
            let selection = d3.select(this.parentNode).select("g.label").select("div");
            selection.call(changeTextFill, "white")
            // d3.select(this).style("fill", "#62B6CB").style("stroke", "#62B6CB");
        })
        .on("mouseout", function() {
            d3.select(this)
                .style("fill", "white");
            let selection = d3.select(this.parentNode).select("g.label").select("div");
            selection.call(changeTextFill, "black")
        });

    //create canvas object, add to div
    d3.select("#resetButtonqPWKOg").on("click", () => {
        canvas.reset();
    });


    let width = window.innerWidth, height = window.innerHeight;
    let graphWidth = graph.graph().width, graphHeight = graph.graph().height;
    let canvasWidth = width*.75, canvasHeight = height * .75;


    inner.attr("transform", (graphWidth > graphHeight/.75) ? function () {
        let newScale = (canvasWidth > graphWidth) ? 1 : canvasWidth / (graphWidth),
            xOffset = (canvasWidth/newScale - graphWidth)/2,
            yOffset = (canvasHeight/newScale - graphHeight )/2;
        return `scale(${newScale}) translate(${xOffset},${yOffset})`
    } : function () {
        let newScale = (canvasHeight > graphHeight) ? 1 : canvasHeight / (graphHeight) ,
            xOffset = (canvasWidth/newScale - graphWidth) / 2,
            yOffset = (canvasHeight/newScale - graphHeight) / 2;
        return `scale(${newScale}) translate(${xOffset},${yOffset})`
    });

    let canvas = canvaser.width(canvasWidth).height(height*.75);

    // canvas.width(graph.graph().width).height(graph.graph().height);
    d3.select("#canvasqPWKOg").call(canvas);
    canvas.addItem(d3.select(svg.node()));

}
d3.select("#orientationButton").on("click", () => {
    orientation = (orientation === 'TB') ? 'LR' : 'TB';
    document.getElementById("orientationButton").firstElementChild.setAttribute("class",
        (orientation === 'TB') ? "fas fa-arrow-alt-circle-down" : "fas fa-arrow-alt-circle-right"
    )
    graph.graph().rankdir = orientation;
    renderGraph()
    // let height = graph.graph().height, width = graph.graph().width;
    // canvas.width(height).height(width);
    // d3.select("#canvasqPWKOg").call(canvas);
    // canvas.addItem(d3.select(svg.node()));
    // Render the graph into svg g
    // d3.select("svg.svg-content g").call(render, graph);
    // canvas.reset()
});
d3.select("#viewSwitch").on("click", () => {
    multipleRoots = (!multipleRoots);
    document.getElementById("viewSwitch").firstElementChild.setAttribute("class",
        (multipleRoots) ? "fas fa-folder" : "fas fa-file"
    )
    document.getElementById("viewSwitch").children[1].textContent = (multipleRoots) ? " Folder View" : " File View";
    let a = dataGenerator(multipleRoots, new Map());
    graphMap = a[0];
    fileTypesMap = a[1];
    graph = new dagreD3.graphlib.Graph({compound: true} )
    graph.setGraph({rankdir: orientation, nodesep: 25,});
    // graph.graph().transition = function(selection) {
    //     return selection.transition().duration(500);
    // };
    populateFilter();
    generateDAG();
    renderGraph();
});

populateMap();
generateDAG();
renderGraph();

