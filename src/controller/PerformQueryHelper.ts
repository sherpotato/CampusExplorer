import {InsightError} from "./IInsightFacade";
import {error} from "util";
import Log from "../Util";

enum CourseKey {
    Dept = "dept",
    Id = "id",
    Avg = "avg",
    Instructor = "instructor",
    Title = "title",
    Pass = "pass",
    Fail = "fail",
    Audit = "audit",
    Uuid = "uuid",
    Year = "year",
}

enum StringKey {
    Dept = "dept",
    Id = "id",
    Instructor = "instructor",
    Title = "title",
    Uuid = "uuid",
}

enum NumberKey {
    Avg = "avg",
    Pass = "pass",
    Fail = "fail",
    Audit = "audit",
    Year = "year",
}

export class PerformQueryHelper {
    private idName: string = "";
// TODO
    constructor() {/**/}

    public isQueryValidOrNot(query: any): boolean {
        try {
            // check format of WHERE and OPTIONS
            // if (!(query["WHERE"] && query["OPTIONS"])) {
            //     return false;
            // }
            if (!(query.hasOwnProperty("WHERE") && query.hasOwnProperty("OPTIONS"))) {
                return false;
            }

            const options = query["OPTIONS"];
            const where = query["WHERE"];

            // check if there is any invalid key in 1st layer
            for (const key of Object.keys(query)) {
                if (!(key === "WHERE" || key === "OPTIONS")) {
                    return false;
                }
            }

            // check if OPTIONS is invalid
            // check if typeof OPTIONS is not a string, number or array
            if (!this.isItQuery(options)) {
                return false;
            }

            if (Object.keys(options).length === 0 ||    // check if OPTIONS is empty
                Object.keys(options).length > 2 ||      // check if OPTIONS has more than 2
                !options.hasOwnProperty("COLUMNS")) { // check if OPTIONS has COLUMNS
                return false;
            } else {
                // check if there is any invalid key
                for (const keys of Object.keys(options)) {
                    if (!(keys === "COLUMNS" || keys === "ORDER")) {
                        return false;
                    }
                }
                // At this moment, we are sure COLUMNS exists
                // OPTIONS: COLUMNS (ORDER)
                if (!this.isValidInOPTIONS(options)) {
                    return false;
                } else {
                    return this.isValidWHERE(where);
                }
            }
        } catch (e) {
            return false;
        }

    }

    public dealWithQuery(query: any): any[] {
        const fs = require("fs");
        let result: any[] = [];
        try {
            // Log.trace(this.idName);
            const datasetString = fs.readFileSync("./data/" + this.idName + ".json", "utf8");
            // Log.trace(datasetString);
            const data = JSON.parse(datasetString);
            // for (let item of data) {
            //    Log.trace(JSON.stringify(item));
            // }
            if (!Array.isArray(data)) {
                throw new InsightError("dataset is not an array");
            } else if (data.length > 5000) {
                throw new InsightError("> 5000");
            } else {
                return data;
            }
            // if (!Array.isArray(data)) {
            //     throw new InsightError("dataset is not an array");
            // } else {
            //     return data;
            // }

        } catch (e) {
            throw e;
        }
    }

    private isItQuery(q: any): boolean {
        return !(typeof q === "number" || typeof q === "string" || Array.isArray(q));
    }

    private isNumberKey(inputNumberKey: string): boolean {
        try {
            let prefix = inputNumberKey.split("_")[0];
            let postfix = inputNumberKey.split("_")[1];
            if (!(this.idName === prefix)) {
                return false;
            } else {
                if (!(Object.values(NumberKey).includes(postfix))) {
                    return false;
                } else {
                    return true;
                }
            }
        } catch (e) {
            return false;
        }
    }

    private isStringKey(inputStringKey: string): boolean {
        try {
            let prefix = inputStringKey.split("_")[0];
            let postfix = inputStringKey.split("_")[1];
            if (!(this.idName === prefix)) {
                return false;
            } else {
                if (!(Object.values(StringKey).includes(postfix))) {
                    return false;
                } else {
                    return true;
                }
            }
        } catch (e) {
            return false;
        }
    }

    private  isValidStringInIS(inputString: string): boolean {
        return /^((\*)?[^*]*(\*)?)$/.test(inputString);
    }

    private isValidInOPTIONS(options: any): boolean {
        const columns = options["COLUMNS"];
        // let idname: string = "";
        // check if COLUMNS is array and not empty
        if (!(Array.isArray(columns) && columns.length > 0)) {
            return false;
        } else {
            for (let column of columns) {
                // check each item is String
                if (!(typeof column === "string")) {
                    return false;
                } else {
                    // check if it's valid course key
                    try {
                        let prifix = column.split("_")[0];
                        let postfix = column.split("_")[1];
                        if (this.idName.length === 0) {
                            this.idName = prifix;
                        } else if (!(this.idName === prifix)) {
                            return false;
                        } else {
                            if (!(Object.values(CourseKey).includes(postfix))) {
                                return false;
                            }
                        }
                    } catch (e) {
                        return false;
                    }
                }
            }
        }
        // const columnsCopy = options["COLUMNS"];

        if (options.hasOwnProperty("ORDER")) {
            const order = options["ORDER"];
            if (!(typeof order === "string")) {
                return false;
            } else {
                return columns.includes(order);
            }
        } else {
            return true;
        }
    }

    private isValidWHERE(where: any): boolean {
        // check if WHERE is query
        if (!this.isItQuery(where)) {
            return false;
        }
        // check if the idName from COLUMNS is in the ./data

        // check if WHERE is empty
        if (Object.keys(where).length === 0) {
            return true;
        } else if (Object.keys(where).length !== 1) {
            return false;
        } else {
            if (where.hasOwnProperty("LT")
                || where.hasOwnProperty("GT")
                || where.hasOwnProperty("EQ")) {

                const mComparator = Object.keys(where)[0];
                const stuffInComparator = where[mComparator];
                // check type of stuffInComparator is Query or not
                if (!(this.isItQuery(stuffInComparator))) {
                    return false;
                } else if (Object.keys(stuffInComparator).length !== 1) {
                    return false;
                } else {
                    return (this.isNumberKey(Object.keys(stuffInComparator)[0])
                        && (typeof stuffInComparator[Object.keys(stuffInComparator)[0]] === "number"));
                }
            } else if (where.hasOwnProperty("AND") || where.hasOwnProperty("OR")) {
                const logic = Object.keys(where)[0];
                const stuffInLogic = where[logic];
                // check type of stuff
                if (!Array.isArray(stuffInLogic)) {
                    return false;
                } else if (stuffInLogic.length < 1) {
                    return false;
                } else {
                    for (let q of stuffInLogic) {
                        // check empty filter
                        if (Object.keys(q).length === 0) {
                            return false;
                        }
                        if (!this.isValidWHERE(q)) {
                            return false;
                        }
                    }
                    return true;
                }
            } else if (where.hasOwnProperty("IS")) {
                const stuffInIs = where["IS"];
                if (!this.isItQuery(stuffInIs)) {
                    return false;
                } else if (Object.keys(stuffInIs).length !== 1) {
                    return false;
                } else if ((typeof stuffInIs[Object.keys(stuffInIs)[0]] !== "string")) {
                    return false;
                } else {
                    return (this.isStringKey(Object.keys(stuffInIs)[0])
                        && (this.isValidStringInIS(stuffInIs[Object.keys(stuffInIs)[0]])));
                }
            } else if (where.hasOwnProperty("NOT")) {
                const stuffInNOT = where["NOT"];
                if (!this.isItQuery(stuffInNOT)) {
                    return false;
                } else if (Object.keys(stuffInNOT).length !== 1) {
                    return false;
                } else {
                    return this.isValidWHERE(stuffInNOT);
                }
            } else {
                return false;
            }
        }
    }
}
