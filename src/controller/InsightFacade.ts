import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise(function (fulfill, reject) {
            const fs = require("fs");   // import file system
            // check if dataset id is empty or null or invalid dataset type
            if (id === "" || id === null ) {
                let e = new InsightError("dataset id is empty or null");
                reject(e);
            }
            // check if dataset is invalid dataset type
            if (kind === InsightDatasetKind.Courses) {
                let e = new InsightError("invalid dataset type");
                reject(e);
            }
            // check if dataset already exist
            if (this.datasetId.includes(id, 0)) {
                let e = new InsightError("dataset id already exist");
                reject(e);
            }

            // check if dataset is valid
            let currZip = new JSZip();
            currZip.loadAsync(content, {base64: true}).then(function (files) {
                // raw data from unzipping
                const promiseList: Array<Promise<string>> = [];
                // valid course
                const course: { [section: string]: any } = [];
                // valid section
                // const validSection: ;

                // open courses folder
                currZip.folder("courses").forEach(function (relativePath: string, file: JSZipObject) {
                    promiseList.push(file.async("text"));
                    Log.trace("iterating through each" + relativePath);
                });

                Promise.all(promiseList).then(function (datas: string[]) {
                    Log.trace("s");
                });
            });
        });
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise<any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}
