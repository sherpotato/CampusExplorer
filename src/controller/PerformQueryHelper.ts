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
    public idName: string;
    private realSections: any[] = [];

// TODO
    constructor(id: string) {
        this.idName = id;
    }

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

    public dealWithQuery(query: any, ds: any[]): any[] {
        let results: any[] = [];
        try {
            this.realSections = ds;
            results = this.whereHelper(query["WHERE"], ds);
            if (results.length > 5000) {
                throw new InsightError("> 5000");
            } else {
                return results;
            }
        } catch (e) {
            throw new InsightError("fail to perform query");
        }
    }

    private whereHelper(where: any, ds: any[]): any[] {
        let results: any[] = [];
        if (Object.keys(where).length === 0) {
            results = this.realSections;
        } else if (where.hasOwnProperty("LT")
            || where.hasOwnProperty("GT")
            || where.hasOwnProperty("EQ")) {
            results = this.mComparatorHelper(where);
        } else if (where.hasOwnProperty("AND")) {
            results = this.andHelper(where, ds);
        } else if (where.hasOwnProperty("NOT")) {
            results = this.negationHelper(where, ds);
        } else if (where.hasOwnProperty("OR")) {
            results = this.orHelper(where, ds);
        } else {
            results = this.ISHelper(where);
        }
        return results;
    }

    private mComparatorHelper(where: any): any[] {
        let results: any[] = [];
        let ds = this.realSections;
        const mComparator = Object.keys(where)[0];
        const stuffInComparator = where[mComparator];
        let selectKey = Object.keys(stuffInComparator)[0];
        let selectNumber = stuffInComparator[selectKey];
        switch (mComparator) {
            case "LT":
                for (let eachSection of ds) {
                    if (eachSection[selectKey] < selectNumber) {
                        results.push(eachSection);
                    }
                }
                break;
            case "GT":
                for (let eachSection of ds) {
                    if (eachSection[selectKey] > selectNumber) {
                        results.push(eachSection);
                    }
                }
                break;
            case "EQ":
                for (let eachSection of ds) {
                    if (eachSection[selectKey] === selectNumber) {
                        results.push(eachSection);
                    }
                }
                break;
        }
        return results;
    }

    private andHelper(filter: any, ds: any[]): any[] {
        let results: any[] = this.realSections;
        let and = filter["AND"];
        for (let eachFilterInAnd of and) {
            results = this.intersection(this.whereHelper(eachFilterInAnd, results), results);
        }
        return results;
    }

    private intersection(rs1: any[], rs2: any[]): any[] {

        if (rs1.length === 0) {
            return rs1;
        }
        const results: any = [];
        const object: any = {};
        let value: string;
        for (let i in rs1) {
            object[JSON.stringify(rs1[i])] = true;
        }
        for (let j in rs2) {
            value = JSON.stringify(rs2[j]);
            if (value in object) {
                results.push(JSON.parse(value));
            }
        }
        return results;
    }

    private negationHelper(filter: any, ds: any[]): any[] {
        let results: any[] = [];
        let not = filter["NOT"];
        let hold = this.whereHelper(not, ds);
        for (let item of this.realSections) {
            if (!hold.includes(item)) {
                results.push(item);
            }
        }
        return results;
    }

    private orHelper(filter: any, ds: any[]): any[] {
        let results: any[] = [];
        return results;
    }

    private ISHelper(filter: any): any[] {
        let results: any[] = [];
        let substr: string;
        const stuffInIS = filter["IS"];
        const keyInIS = Object.keys(stuffInIS)[0];
        const selectString = stuffInIS[keyInIS];
        // if (selectString.startwith('*')) ;
        if (selectString === "*" || selectString === "**") {
            results = this.realSections;
        } else {
            if (selectString.startsWith("*") && selectString.endsWith("*")) {
                substr = selectString.substring(1, selectString.length - 1);
                for (let item of this.realSections) {
                    if (item[keyInIS].includes(substr)) {
                        results.push(item);
                    }
                }
            } else if ((selectString.startsWith("*") && !selectString.endsWith("*"))) {
                substr = selectString.substring(1);
                for (let item of this.realSections) {
                    if (item[keyInIS].startsWith(substr)) {
                        results.push(item);
                    }
                }
            } else if ((!selectString.startsWith("*") && selectString.endsWith("*"))) {
                substr = selectString.substring(0, selectString.length - 1);
                for (let item of this.realSections) {
                    if (item[keyInIS].endsWith(substr)) {
                        results.push(item);
                    }
                }
            } else {
                substr = selectString;
                for (let item of this.realSections) {
                    if (item[keyInIS] === substr) {
                        results.push(item);
                    }
                }
            }
        }
        return results;
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

    private isValidStringInIS(inputString: string): boolean {
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
