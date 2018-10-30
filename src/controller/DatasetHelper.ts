import * as JSZip from "jszip";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import Log from "../Util";
import {isNullOrUndefined} from "util";
import set = Reflect.set;

export class DatasetHelper {

    constructor() {/**/
    }

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
                                    let year = (eachSection.Section === "overall" ? 1900
                                        : parseInt(eachSection.Year, 10));
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
                                        typeof year === "number") {
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
            let that = this;
            // let roomObs: any = [];
            let validRooms: any = [];
            let buildingmap: Map<string, any> = new Map<string, any>();
            let currZip = new JSZip();
            const parse5 = require("parse5");
            // load dataset
            currZip.loadAsync(content, {base64: true}).then((unzippedFiles: any) => {
                unzippedFiles.file("index.htm").async("text").then(async (index: any) => {
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
                                        let fullname = "";
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
                                                        "views-field views-field-title") {
                                                        buildingInfo["building_href"] =
                                                            tdValid.childNodes[1].attrs[0].value;
                                                        fullname = tdValid.childNodes[1].childNodes[0].value;
                                                        buildingInfo["building_fullname"] =
                                                            fullname;
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
                                    await that.getLatAndLon(building).catch((e: any) => {
                                        // Log.trace(e);
                                    });
                                }

                            }

                            await setGeo();
                            const promiseArray: any[] = [];
                            // try {
                            for (let building of buildingmap.values()) {
                                const realPath = building["building_href"].substring(2);
                                // Log.trace("path is " + realPath);
                                // let data = await unzippedFiles.file(realPath).async("string");
                                // try {
                                promiseArray.push(unzippedFiles.file(realPath)
                                        .async("text"));
                                // } catch {
                                //     let e = new InsightError("non html");
                                //     reject(e);
                                // }
                            }
                            // } catch {
                            //     let err = new InsightError("fail to add info");
                            //     return reject(err);
                            // }
                            Promise.all(promiseArray)
                                .then((data: any) => {
                                    for (let eachhtm of data) {
                                        try {
                                            let originalData = parse5.parse(eachhtm);
                                            // let span: any = originalData.childNodes[6].childNodes[3]
                                            //     .childNodes[31].childNodes[10].childNodes[1].childNodes[3]
                                            //     .childNodes[1].childNodes[3].childNodes[1].childNodes[1]
                                            //     .childNodes[1].childNodes[1].childNodes[0];
                                            // let bName: any = span.childNodes[0].value.trim();
                                            // Log.trace(bName);
                                            try {
                                                    let rnumber: string;
                                                    let seats: number;
                                                    let type: string;
                                                    let furniture: string;
                                                    let rhref: string;
                                                    let tbody2 = that.traversalTree(originalData.childNodes);
                                                    for (let tr of tbody2) {
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
                                                                            rhref =
                                                                                td.childNodes[1].attrs[0].value.trim();
                                                                        }
                                                                        if (attr === "views-field " +
                                                                            "views-field-field-room-capac" +
                                                                            "ity") {
                                                                            seats = Number(td.childNodes[0].
                                                                            value.trim());
                                                                        }
                                                                        if (attr === "views-field " +
                                                                            "views-field-field-room-type") {
                                                                            type = td.childNodes[0].value
                                                                                .trim();
                                                                        }
                                                                        if (attr === "views-field " +
                                                                            "views-field-field-room-furnit"
                                                                            + "ure") {
                                                                            furniture = td.childNodes[0]
                                                                                .value.trim();
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                            let n = rhref.lastIndexOf("/");
                                                            let result = rhref.substring(n + 1);
                                                            let bName = result.split("-")[0];
                                                            // Log.trace(bName);
                                                            if (buildingmap.has(bName)) {
                                                            let tempBuilding = buildingmap.get(bName);
                                                            // Log.trace(tempBuilding);
                                                            let rname = tempBuilding["building_shortname"]
                                                                + "_" + rnumber;
                                                            if (typeof tempBuilding["building_fullname"] ===
                                                                "string" &&
                                                                typeof tempBuilding["building_shortname"] ===
                                                                "string"
                                                                && typeof rnumber === "string" &&
                                                                typeof rname === "string" &&
                                                                typeof tempBuilding["building_address"] ===
                                                                "string" &&
                                                                typeof tempBuilding["building_lat"] === "number" &&
                                                                typeof tempBuilding["building_lon"] === "number" &&
                                                                typeof seats === "number" &&
                                                                typeof type === "string" &&
                                                                typeof furniture === "string" &&
                                                                typeof rhref === "string") {
                                                                const validRoomSec: {
                                                                    [key: string]:
                                                                        string | number
                                                                } = {
                                                                    [id + "_fullname"]:
                                                                        tempBuilding["building_fullname"],
                                                                    [id + "_shortname"]:
                                                                        tempBuilding["building_shortname"],
                                                                    [id + "_number"]: rnumber,
                                                                    [id + "_name"]:
                                                                    tempBuilding["building_shortname"]
                                                                    + "_" + rnumber,
                                                                    [id + "_address"]:
                                                                        tempBuilding["building_address"],
                                                                    [id + "_lat"]:
                                                                        tempBuilding["building_lat"],
                                                                    [id + "_lon"]:
                                                                        tempBuilding["building_lon"],
                                                                    [id + "_seats"]:
                                                                    seats,
                                                                    [id + "_type"]:
                                                                    type,
                                                                    [id + "_furniture"]:
                                                                    furniture,
                                                                    [id + "_href"]:
                                                                    rhref,
                                                                };
                                                                validRooms.push(validRoomSec);
                                                            }
                                                         }
                                                        }
                                                    }
                                                } catch (e) {
                                                    // Log.trace("fail to give a try");
                                                    // let err = new InsightError("cannot find correct " +
                                                    //     "info for this building " +
                                                    //     validRoom["room_fullname"]);
                                                }

                                        } catch (e) {
                                            // Log.trace("fail to ");
                                            // let err = new InsightError("no valid room for this");
                                            // reject(err);
                                        }
                                    }

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
                                            return reject(new InsightError("Fail to add dataset into cache."));
                                        }
                                    }
                                });

                        }
                        // TODO
                    } catch (e) {
                        return reject(new InsightError("fail do not why."));
                    }
                }).catch(() => {
                    return reject(new InsightError("index.htm does not exist."));
                });
            }).catch((e) => {
                e = new InsightError("Fail to unzip the file.");
                return reject(e);
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
    public getLatAndLon(info: any): Promise<any> {
        return new Promise((fulfill, reject) => {
            const addr = info["building_address"];
            const http = require("http");
            const link = "http://cs310.ugrad.cs.ubc.ca:11316/api/v1/project_d9b1b_i4f1b/" + addr.replace(" ", "%20");
            http.get(link, (response: any) => {
                response.setEncoding("utf8");
                let originalData = "";
                response.on("data", (chunk: any) => {
                    originalData += chunk;
                });
                response.on("end", () => {
                    try {
                        const parseResult = JSON.parse(originalData);
                        if (parseResult["error"]) {
                            return reject(new InsightError("Geo error from geo server"));
                        } else {
                            // extract lat/lon
                            info["building_lat"] = parseResult.lat;
                            info["building_lon"] = parseResult.lon;
                            return fulfill(info);
                        }
                    } catch (err) {
                        err = new InsightError("Cannot write to disk");
                        reject(err);
                    }
                });
            });
        });
    }

}
