import {InsightError} from "./IInsightFacade";

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

    public dealWithQuery(query: any): any {
        // TODO
    }

    private isItQuery(q: any): boolean {
        return !(typeof q === "number" || typeof q === "string" || Array.isArray(q));
    }

    private isNumberKey(numberKey: string): boolean {
        try {
            let prifix = numberKey.split("_")[0];
            let postfix = numberKey.split("_")[1];
            if (!(this.idName === prifix)) {
                return false;
            } else {
                if (!(Object.values(numberKey).includes(postfix))) {
                    return false;
                }
            }
        } catch (e) {
            return false;
        }
    }

    private isValidInOPTIONS(options: any): boolean {
        const columns = options["COLUMNS"];
        // let idname: string = "";
        // check if COLUMNS is array and not empty
        if (!(Array.isArray(columns) && columns.length > 0)) {
            return false;
        } else {
            for (let i in columns) {
                // check each item is String
                if (!(typeof columns[i] === "string")) {
                    return false;
                } else {
                    // check if it's valid course key
                    try {
                        let prifix = columns[i].split("_")[0];
                        let postfix = columns[i].split("_")[1];
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
                    return (this.isNumberKey(stuffInComparator[0])
                        && (typeof stuffInComparator[Object.keys(mComparator)[0]] === "number"));
                }
            } else {
                return false;
            }
        }
    }
}
