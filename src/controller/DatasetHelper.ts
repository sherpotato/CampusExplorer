import * as JSZip from "jszip";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";

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
                                        let year = parseInt(eachSection.Year, 10);
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
                                // TO DO: ask TA!!!!!!!
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
            let currZip = new JSZip();
            const promiseList: Array<Promise<string>> = [];
// load dataset
            currZip.loadAsync(content, {base64: true}).then((unzippedFiles: any) => {
                return reject (); // TODO
            }).catch((e) => {
                e = new InsightError("Fail to unzip the file.");
                reject(e);
            });
        });
    }
}