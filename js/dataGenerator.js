const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min),
    randomFileType = () => fileTypes[Math.floor(Math.random() * fileTypes.length)],
    parseDate = (str) => {return new Date(str.replace(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(\w\w\w)$/, '$4:$5:$6 $2/$3/$1')).toDateString();},
    icons = {"job": "\uf013", "sas": "\uf70c", "xls": "\uf1c3", "csv": "\uf6dd", "sas7bdat": "\uf0ce", "log": "\uf039", "mnf": "\uf542" };

let fileTypes = ["job", "sas", "xls", "sas7bdat", "mnf", "csv", "log"],
    fileTypesMap,
graphMap;

// const fileIcons = [];
const generateId = length => {
    let s = "";
    do {
        s += Math.random().toString(36).substr(2);
    } while (s.length < length);
    s = s.substr(0, length);
    return s;
};

function createRootNode() {
    const id = generateId(16);
    const inputs = [], outputs = [];
    for (let i = 0; i < rand(0,7); i++) {
        inputs.push(createInputNode(id));
    }
    for (let i = 0; i < rand(0,7); i++) {
        outputs.push(createOutputNode(id));
    }
    const fileType = randomFileType();
    const icon = icons[fileType];
    const name = 'file';

    updateFileTypesMap(fileType, id);
    graphMap.set(id, {
        detail: {
            name: (name+ '.' + fileType),
            size: rand(100, 70000),
            syncVersion: "13.0",
            modDate: parseDate("20170623120856EDT"),
            fileType: fileType,
            icon: icon,
        },
        inputs: inputs,
        outputs: outputs,
        display: fileTypesMap.get(fileType).display
    });
    return id;
}

function createInputNode(rootId) {
    const id = generateId(16);
    const fileType = randomFileType();
    const icon = icons[fileType];
    const name = 'in41';
    updateFileTypesMap(fileType, id);
    graphMap.set(id, {
        detail: {
            name: (name+ '.' + fileType),
            size: rand(100, 70000),
            syncVersion: "13.0",
            modDate: parseDate("20170827120856EDT"),
            fileType: fileType,
            icon: icon,
        },
        inputs: [],
        outputs: [rootId],
        display: fileTypesMap.get(fileType).display
    });
    return id;
}

function createOutputNode(rootId) {
    const id = generateId(16)
    , fileType = randomFileType()
    , icon = icons[fileType]
    , name = 'adsl';
    updateFileTypesMap(fileType, id);
    graphMap.set(id, {
        detail: {
            name: (name+ '.' + fileType),
            size: rand(100, 70000),
            syncVersion: "13.0",
            modDate: parseDate("20171005120856EDT"),
            fileType: fileType,
            icon: icon,
        },
        inputs: [rootId],
        outputs: [],
        display: fileTypesMap.get(fileType).display
    });
    return id;
}

function updateFileTypesMap(type, id){
    if (fileTypesMap.has(type)){
        fileTypesMap.get(type).ids.push(id);
    }
    else {
        fileTypesMap.set(type, {
            display: true,
            ids: [id]
        })
    }
}



export default function dataGenerator(multipleRoots, fmap, id, currentData) {
    //if an ID is passed in, add children
    fileTypesMap = fmap;
    graphMap = new Map();
    if (id !== undefined){
        for (let i = 0; i < rand(0,7); i++) {
            currentData.inputs.push(createInputNode(id));
        }
        for (let i = 0; i < rand(0,7); i++) {
            currentData.outputs.push(createOutputNode(id));
        }
        graphMap.set(id, currentData);
        return  [graphMap, fileTypesMap];
    }
    //multiple roots simulates a folder level series of unconnected graphs
    if (multipleRoots) {
        for (let i = 0; i < rand(3,10); i++) {
            (createRootNode());
        }
        return [graphMap, fileTypesMap];
    }
    // a single root simulates a single files impact and dependencies
    createRootNode();
    return [graphMap, fileTypesMap];
};

