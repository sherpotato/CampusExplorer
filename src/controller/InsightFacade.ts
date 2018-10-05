import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {PerformQueryHelper} from "./PerformQueryHelper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    private datasetId: string[];
    private validDataset: Map<string, any[]>;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasetId = new Array();
        this.validDataset = new Map<string, any[]>();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise((fulfill, reject) => {
            let validJSON: any = [];
            let currZip = new JSZip();
            // raw data from unzipping
            const promiseList: Array<Promise<string>> = [];

            // valid course
            const validCourse: { [section: string]: any } = [];

            // check if dataset id is empty or null or invalid dataset type
            if (id === "" || id === null) {
                let e = new InsightError("dataset id is empty or null");
                return reject(e);
            }
            // check if dataset is invalid dataset type
            if (!(kind === InsightDatasetKind.Courses)) {
                let e = new InsightError("invalid dataset type");
                return reject(e);
            }

            // check if dataset already exist
            // To Do: ask TA!!!!!!!!
            for (let key of this.datasetId) {
                if (key === id) {
                    let e = new InsightError("dataset already existed");
                    return reject(e);
                }
            }

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
                    if (kind === InsightDatasetKind.Courses) {
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
                                    this.datasetId.push(id);
                                    this.validDataset.set(id, validJSON);
                                    fulfill(this.datasetId);
                                });
                            } catch {
                                reject(new InsightError("Fail to add this dataset into cache!"));
                            }
                        }

                    }
                });
            }).catch((e) => {
                e = new InsightError("Fail to unzip the file.");
                reject(e);
            });
        });
    }

    public removeDataset(id: string): Promise<string> {
        return new Promise((fulfill, reject) => {
            if (id === "" || id === null || id === undefined) {
                let e = new InsightError("Undefined dataset ID.");
                reject(e);
            }
            // check if dataset already exist, remove this id
            let newArray = [];
            for (let key of this.datasetId) {
                if (key !== id) {
                    newArray.push(key);
                }
            }
            if (this.datasetId.length === newArray.length) {
                let e = new NotFoundError("Unexisted ID.");
                reject(e);
            }
            this.datasetId = newArray;
            this.validDataset.delete(id);

            const fs = require("fs");   // import file system
            fs.unlink("./data/" + id + ".json", (err: any) => {
                if (err) {
                    return reject("failed to delete the file");
                } else {
                    return fulfill(id);
                }
            });
        });
    }

    public performQuery(query: any): Promise<any[]> {
        const helper = new PerformQueryHelper("");
        let results: any[] = [];
        return new Promise((fulfill, reject) => {
            if (helper.isQueryValidOrNot(query)) {
                try {
                    let zhunID = helper.idName;
                    // if cache does not have the dataset, then load from disk
                    if (! this.validDataset.has(zhunID)) {
                        const fs = require("fs");
                        const datasetString = fs.readFileSync("./data/" + zhunID + ".json", "utf8"); // TODO
                        const data = JSON.parse(datasetString);
                        this.datasetId.push(zhunID);
                        this.validDataset.set(zhunID, data);
                    }
                    let ds = this.validDataset.get(zhunID);
                    results = helper.dealWithQuery(query, ds);
                } catch (e) {
                    reject(new InsightError("fail to read or perform"));
                }
                return fulfill(results);
            } else {
                return reject(new InsightError("Query is not valid"));
            }
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let returnSet: InsightDataset[] = [];
        // const pA: any[] = [];
        return new Promise<InsightDataset[]>((fulfill) => {
            for (const key of this.datasetId) {
                let set = {
                    id: key,
                    kind: InsightDatasetKind.Courses,
                    numRows: this.validDataset.get(key).length,
                };
                returnSet.push(set);
            }
            return fulfill(returnSet);
        });
    }
}
