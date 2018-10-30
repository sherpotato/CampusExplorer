import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {PerformQueryHelper} from "./PerformQueryHelper";
import {DatasetHelper} from "./DatasetHelper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    private datasetId: string[] = [];
    private validDataset: Map<string, any[]>;
    private kindMap: Map<string, any> = new Map<string, any>();

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        // this.datasetId = new Array();
        this.validDataset = new Map<string, any[]>();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise((fulfill, reject) => {
            const DsHelper = new DatasetHelper();
            // check if dataset id is empty or null or invalid dataset type
            if (id === "" || id === null || id === undefined) {
                let e = new InsightError("dataset id is empty or null");
                return reject(e);
            }

            // check if dataset already exist
            for (let key of this.datasetId) {
                if (key === id) {
                    let e = new InsightError("dataset already existed");
                    return reject(e);
                }
            }

            if (kind === "courses") {
                DsHelper.addCourseDataset(id, content, this.datasetId, this.validDataset)
                    .then(  (response: string[]) => {
                        this.kindMap.set(id, kind);
                        return fulfill(response);
                    }, (response: string[]) => {
                        return reject(response);
                    });
            } else if (kind === "rooms") {
                DsHelper.addRoomDataset(id, content, this.datasetId, this.validDataset)
                    .then(  (response: string[]) => {
                        this.kindMap.set(id, kind);
                        return fulfill(response);
                    }, (response: string[]) => {
                        return reject(response);
                    });
            }
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
                        const datasetString = fs.readFileSync("./data/" + zhunID + ".json", "utf8");
                        const data = JSON.parse(datasetString);
                        this.datasetId.push(zhunID);
                        this.validDataset.set(zhunID, data);
                    }

                    let gs = this.validDataset.get(zhunID);

                    let cloned = JSON.parse(JSON.stringify(gs));        // copy array without reference

                    results = helper.dealWithQuery(query, cloned, zhunID);

                } catch (e) {
                    // Log.trace("After dealwith:key.length:" +
                    //     Object.keys(this.validDataset.get(helper.idName)[0]).
                    //     length.toString());
                    return reject(new InsightError("fail to read or perform"));
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
                    kind: this.kindMap.get(key),
                    numRows: this.validDataset.get(key).length,
                };
                returnSet.push(set);
            }
            return fulfill(returnSet);
        });
    }
}
