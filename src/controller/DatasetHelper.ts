import * as JSZip from "jszip";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import Log from "../Util";
import {isNullOrUndefined} from "util";
import set = Reflect.set;

export class DatasetHelper {

    constructor() {/**/}

    public addCourseDataset(id: string, content: string,
                            datasetId: string[], validDataset: Map<string, any[]>): Promise<string[]> {
        return new Promise((fulfill, reject) => {
            let validJSON: any = [];
            let currZip = new JSZip();
            // raw data from unzipping
            const promiseList: Array<Promise<string>> = [];

            // load dataset
            currZip.loadAsync(content, {base64: true}).then((unzippedFiles: any) => {
                try {
                    // try to open courses folder
                    unzippedFiles.folder("courses").forEach((relativePath: string, file: any) => {
                        try {
                            // If it is a JSON file, convert it to text file
                            promiseList.push(file.async("text"));
                            // Log.trace("iterating through each" + relativePath);
                        } catch {
                            let e = new InsightError("Catch a non-JSON file in 'courses' folder");
                            reject(e);
                        }
                    });
                } catch {
                    let e = new InsightError("no 'courses' folder");
                    reject(e);
                }

                Promise.all(promiseList).then((allJSON: any) => {
                    // Log.trace("dealing with all promise...");
                    for (const eachCourse of allJSON) {
                        try {
                            let readableJSON = JSON.parse(eachCourse)["result"];
                            for (let eachSection of readableJSON) {
                                try {
                                    let year = eachSection === "overall" ? 1900 : parseInt(eachSection.Year, 10);
                                    // let uuid = eachSection.id.toString();
                                    if (typeof eachSection.Subject === "string" &&
                                        typeof eachSection.Course === "string" &&
                                        typeof eachSection.Avg === "number" &&
                                        typeof eachSection.Professor === "string" &&
                                        typeof eachSection.Title === "string" &&
                                        typeof eachSection.Pass === "number" &&
                                        typeof eachSection.Fail === "number" &&
                                        typeof eachSection.Audit === "number" &&
                                        typeof eachSection.id.toString() === "string" &&
                                        typeof year === "number" ) {
                                        // Log.trace("Section Keys' Type checked");
                                        const validSection: { [key: string]: string | number } = {
                                            // TO DO: ASK TA!!!
                                            [id + "_dept"]: eachSection.Subject,
                                            [id + "_id"]: eachSection.Course,
                                            [id + "_avg"]: eachSection.Avg,
                                            [id + "_instructor"]: eachSection.Professor,
                                            [id + "_title"]: eachSection.Title,
                                            [id + "_pass"]: eachSection.Pass,
                                            [id + "_fail"]: eachSection.Fail,
                                            [id + "_audit"]: eachSection.Audit,
                                            [id + "_uuid"]: eachSection.id.toString(),
                                            [id + "_year"]: year,
                                        };
                                        validJSON.push(validSection);
                                    }
                                } catch {
                                    // error parsing a section
                                }
                            }

                        } catch {
                            // Something wrong with a JSON
                        }
                    }
                    if (validJSON.length === 0) {
                        let e = new InsightError("Dataset is not valid.");
                        return reject(e);
                    } else {
                        const fs = require("fs");   // import file system
                        try {
                            fs.mkdir("./data", () => {
                                const courseString = JSON.stringify(validJSON, null, " ");
                                fs.writeFile("./data/" + id + ".json", courseString);
                                datasetId.push(id);
                                validDataset.set(id, validJSON);
                                fulfill(datasetId);
                            });
                        } catch {
                            reject(new InsightError("Fail to add this dataset into cache!"));
                        }
                    }

                });
            }).catch((e) => {
                e = new InsightError("Fail to unzip the file.");
                reject(e);
            });

        });
    }

    public addRoomDataset(id: string, content: string,
                          datasetId: string[], validDataset: Map<string, any[]>): Promise<string[]> {
        return new Promise((fulfill, reject) => {
            let roomObs: any = [];
            let validRooms: any = [];
            let buildingmap: Map<string, any> = new Map<string, any>();
            let currZip = new JSZip();
            const parse5 = require("parse5");
            // load dataset
            currZip.loadAsync(content, {base64: true}).then((unzippedFiles: any) => {
                unzippedFiles.file("index.htm").async("text").then((index: any) => {
                    try {
                        const inputIndex = parse5.parse(index);
                        // Log.trace(inputIndex);
                        const tBody = this.traversalTree(inputIndex.childNodes);
                        // tBody is an object with several nodes
                        if (!(isNullOrUndefined(tBody))) {
                            for (let trValid of tBody) {
                                if (trValid.nodeName === "tr") {
                                    let children = trValid.childNodes;
                                    if (!isNullOrUndefined(children)) {
                                        let buildingInfo = {
                                            building_fullname: "",
                                            building_shortname: "",
                                            building_address: "",
                                            building_lat: 0,
                                            building_lon: 0,
                                            building_href: ""
                                        };
                                        let shortname = "";
                                        for (let tdValid of children) {
                                            if (tdValid.nodeName === "td" && tdValid.attrs[0].name === "class") {
                                                if (!isNullOrUndefined(tdValid.attrs)) {
                                                    if (tdValid.attrs[0].value ===
                                                        "views-field views-field-field-building-code") {
                                                        shortname = tdValid.childNodes[0].value.trim();
                                                        buildingInfo["building_shortname"] = shortname;
                                                    }
                                                    if (tdValid.attrs[0].value ===
                                                        "views-field views-field-field-building-address") {
                                                        buildingInfo["building_address"] =
                                                            tdValid.childNodes[0].value.trim();
                                                    }
                                                    if (tdValid.attrs[0].value ===
                                                        "views-field views-field-field-building-title") {
                                                        buildingInfo["building_href"] =
                                                            tdValid.childNodes[0].attrs[0].value;
                                                        buildingInfo["building_fullname"] =
                                                            tdValid.childNodes[0].attrs[1].value;
                                                        // TODO: not sure the index of childNodes
                                                    }
                                                }
                                            }
                                        }
                                        buildingmap.set(shortname, buildingInfo);
                                    }
                                }
                            }
                            async function setGeo() {
                                for (let building  of buildingmap.values()) {
                                    await this.getLatAndLon(building).catch((e: any) => {
                                        // Log.trace(e);
                                    });
                                }

                            }
                            setGeo().then(() => {
                                try {
                                    const promiseArray: any[] = [];
                                    for (let building of buildingmap.values()) {
                                        const realPath = building["rooms_href"].substring(2);
                                        // Log.trace("path is " + realPath);
                                        promiseArray.push(unzippedFiles.file(realPath)
                                            .async("text").then(function (data: any) {
                                                let originalData = parse5.parse(data);
                                                try {
                                                    let span: any = originalData.childNodes[6].childNodes[3]
                                                        .childNodes[31].childNodes[10].childNodes[1].childNodes[3]
                                                        .childNodes[1].childNodes[3].childNodes[1].childNodes[1]
                                                        .childNodes[1].childNodes[1].childNodes[0];
                                                    let bName: any = span.childNodes[0].value.trim();
                                                    if (buildingmap.has(bName)) {
                                                        const validRoom = {
                                                            room_fullname: "",
                                                            room_shortname: "",
                                                            room_number: "",
                                                            room_name: "",
                                                            room_address: "",
                                                            room_lat: 0,
                                                            room_lon: 0,
                                                            room_seats: 0,
                                                            room_type: "",
                                                            room_furniture: "",
                                                            room_href: "",
                                                        };

                                                        try {
                                                            let rnumber: string;
                                                            let seats: number;
                                                            let type: string;
                                                            let furniture: string;
                                                            let rhref: string;
                                                            let tbody2 = this.traversalTree(originalData.childNodes);
                                                            for (let tr of tbody2.childNodes) {
                                                                if (tr.nodeName === "tr") {
                                                                    let child = tr.childNodes;
                                                                    if (!isNullOrUndefined(child)) {
                                                                        for (let td of child) {
                                                                            if (td.nodeName === "td" &&
                                                                                td.attrs[0].name === "class") {
                                                                                    let attr = td.attrs[0].value;
                                                                                    if (attr === "views-field " +
                                                                                        "views-field-field-room-" +
                                                                                        "number") {
                                                                                        rnumber = td.childNodes[1]
                                                                                            .childNodes[0].value.trim();
                                                                                        validRoom["room_number"] =
                                                                                            rnumber;
                                                                                    }
                                                                                    if (attr === "views-field " +
                                                                                        "views-field-field-room-capac" +
                                                                                        "ity") {
                                                                                        seats = td.childNodes[0].value
                                                                                            .trim();
                                                                                        validRoom["room_seats"] = seats;
                                                                                    }
                                                                                    if (attr === "views-field " +
                                                                                        "views-field-field-room-type") {
                                                                                        type = td.childNodes[0].value
                                                                                            .trim();
                                                                                        validRoom["room_type"] = type;
                                                                                    }
                                                                                    if (attr === "views-field " +
                                                                                        "views-field-field-room-furnit"
                                                                                        + "ure") {
                                                                                        furniture = td.childNodes[0]
                                                                                            .value.trim();
                                                                                        validRoom["room_furniture"] =
                                                                                            furniture;
                                                                                    }
                                                                                    if (attr === "views-field views-" +
                                                                                        "field-nothing") {
                                                                                        rhref = td.childNodes[1]
                                                                                            .attrs[0].value;
                                                                                        validRoom["room_href"] =
                                                                                            rhref;
                                                                                    }
                                                                                }
                                                                        }
                                                                    }
                                                                    let tempBuilding = buildingmap.get(bName);
                                                                    validRoom["room_fullname"] =
                                                                        tempBuilding["building_fullname"];
                                                                    validRoom["room_shortname"] =
                                                                        tempBuilding["building_shortname"];
                                                                    validRoom["room_address"] =
                                                                        tempBuilding["building_address"];
                                                                    validRoom["room_href"] =
                                                                        tempBuilding["building_href"];
                                                                    validRoom["room_lat"] =
                                                                        tempBuilding["building_lat"];
                                                                    validRoom["room_lon"] =
                                                                        tempBuilding["building_lon"];
                                                                    validRoom["room_name"] =
                                                                        validRoom["room_shortname"]
                                                                        + "_" + validRoom["room_number"];

                                                                    if (typeof validRoom["room_fullname"] ===
                                                                        "string" &&
                                                                        typeof validRoom["room_shortname"] ===
                                                                        "string"
                                                                        && typeof validRoom["room_number"] ===
                                                                        "string" &&
                                                                        typeof validRoom["room_name"]
                                                                            === "string" &&
                                                                        typeof validRoom["room_address"] ===
                                                                        "string"  &&
                                                                        typeof validRoom["room_lat"] === "number" &&
                                                                        typeof validRoom["room_lon"] === "number" &&
                                                                        typeof validRoom["room_seats"] === "number"  &&
                                                                        typeof validRoom["room_type"]
                                                                         === "string" &&
                                                                        typeof validRoom["room_furniture"]
                                                                        === "string" &&
                                                                        typeof validRoom["room_href"] === "string") {
                                                                        const validRoomSec: { [key: string]:
                                                                                string | number } = {
                                                                            [id + "_fullname"]:
                                                                                validRoom["room_fullname"],
                                                                            [id + "_shortname"]:
                                                                                validRoom["room_shortname"],
                                                                            [id + "_number"]:
                                                                                validRoom["room_number"],
                                                                            [id + "_name"]:
                                                                                validRoom["room_name"],
                                                                            [id + "_address"]:
                                                                                validRoom["room_address"],
                                                                            [id + "_lat"]:
                                                                                validRoom["room_lat"],
                                                                            [id + "_lon"]:
                                                                                validRoom["room_lon"],
                                                                            [id + "_seats"]:
                                                                                validRoom["room_seats"],
                                                                            [id + "_type"]:
                                                                                validRoom["room_type"],
                                                                            [id + "_furniture"]:
                                                                                validRoom["room_furniture"],
                                                                            [id + "_href"]:
                                                                                validRoom["room_href"],
                                                                        };
                                                                        validRooms.push(validRoomSec);
                                                                    }

                                                                }
                                                            }
                                                        } catch {
                                                            let err = new InsightError("cannot find correct " +
                                                                "info for this building " +
                                                                validRoom["room_fullname"]);
                                                        }

                                                    }
                                                } catch {
                                                    // let err = new InsightError("no valid room for this");
                                                    // reject(err);
                                                }
                                            }));

                                        Promise.all(promiseArray)
                                            .then(function () {
                                                if (validRooms.length === 0) {
                                                    reject(new InsightError("Dataset is not valid"));
                                                } else {
                                                    const fs = require("fs");
                                                    try {
                                                        fs.mkdir("./data", () => {
                                                            const roomString = JSON.stringify(validRooms, null, " ");
                                                            fs.writeFile("./data/" + id + ".json", roomString);
                                                            datasetId.push(id);
                                                            validDataset.set(id, validRooms);
                                                            fulfill(datasetId);
                                                        });
                                                    } catch {
                                                        reject(new InsightError("Fail to add dataset into cache."));
                                                    }
                                                }
                                            });

                                    }
                                } catch {
                                    let err = new InsightError("fail to add info");
                                    reject(err);
                                }
                            }).catch(() => {
                                reject(new InsightError("Geo problem maybe???."));
                            });
                        }
                        // TODO
                    } catch (e) {
                        reject(new InsightError("fail do not why."));
                    }
                }).catch(() => {
                    reject(new InsightError("index.htm does not exist."));
                });
            }).catch((e) => {
                e = new InsightError("Fail to unzip the file.");
                reject(e);
            });
        });
    }

    // find the content inside of the "tbody"
    public traversalTree(nodes: any[]): any[] {
        let nodeListObject: any[] = [];
        if (nodes === undefined) {
            return nodeListObject;
        } else {
            for (let eachNode of nodes) {
                if (eachNode.nodeName === "tbody") {
                    nodeListObject = eachNode.childNodes;
                    return nodeListObject;
                } else {
                    nodeListObject = this.traversalTree(eachNode.childNodes);
                    if (nodeListObject.length !== 0) {
                        return nodeListObject;
                    }
                }
            }
            return nodeListObject;
        }
    }

    // get geoLocation of given address
    // TODO : NEED TO MODIFIED!!!!!!!!!!!
    public getLatAndLon(info: any): Promise<any> {
        return new Promise((fulfill, reject) => {
            const addr = info["building_address"];
            const http = require("http");
            const link = "http://cs310.ugrad.cs.ubc.ca:11316/api/v1/project_d9b1b_i4f1b/" + addr.replace(" ", "%20");
            http.get(link, (response: any) => {
                const {statusCode} = response;
                // get server response
                if (statusCode !== 200) {
                    let err = new InsightError("Request Failed.\n" +
                        `Status Code: ${statusCode}`);
                    reject(err);
                }
                response.setEncoding("utf8");
                let originalData = "";
                response.on("data", (chunk: any) => {
                    originalData += chunk;
                });
                response.on("end", () => {
                    try {
                        const parseResult = JSON.parse(originalData);
                        // extract lat/lon
                        info["building_lat"] = parseResult.lat;
                        info["building_lon"] = parseResult.lon;
                        // Log.trace("lat " + restInfo["rooms_lat"]);
                        // Log.trace("lon " + restInfo["rooms_lon"]);
                        fulfill(info);
                    } catch (err) {
                        err = new InsightError("Cannot write to disk");
                        reject(err);
                    }
                });
            });
        });
    }

}
