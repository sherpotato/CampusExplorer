import {InsightError} from "./IInsightFacade";
import {error} from "util";
import Log from "../Util";

enum AllNumberKey {
    Avg = "avg",
    Pass = "pass",
    Fail = "fail",
    Audit = "audit",
    Year = "year",
    Lat = "lat",
    Lon = "lon",
    Seats = "seats",
}

enum AllStringKey {
    Dept = "dept",
    Id = "id",
    Instructor = "instructor",
    Title = "title",
    Uuid = "uuid",
    FullName = "fullname",
    ShortName = "shortname",
    Number = "number",
    Name = "name",
    Address = "address",
    Type = "type",
    Furniture = "furniture",
    Href = "href",
}
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

enum RoomKey {
    FullName = "fullname",
    ShortName = "shortname",
    Number = "number",
    Name = "name",
    Address = "address",
    Lat = "lat",
    Lon = "lon",
    Seats = "seats",
    Type = "type",
    Furniture = "furniture",
    Href = "href",
}

enum RoomNumberKey {
    Lat = "lat",
    Lon = "lon",
    Seats = "seats",
}

enum applyToken {
    "MAX", "MIN", "AVG", "COUNT", "SUM",
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
    public idName: string = "";
    private realSections: any[] = [];
    private applyKeys: any[] = [];
    private dataType: string = "";
    private keysInTransformation = new Set();
    private transFlag: boolean = false;

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
                if (!(key === "WHERE" || key === "OPTIONS" || key === "TRANSFORMATIONS")) {
                    return false;
                }
            }

            // check TRANSFORMATIONS

            if (query.hasOwnProperty("TRANSFORMATIONS")) {
                this.transFlag = true;
                const transformations = query["TRANSFORMATIONS"];
                if (!this.isItQuery(transformations)) {
                    return false;
                }
                if (!this.isValidTransformations(transformations)) {
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

    } // TODO: validation of token not checked??

    public dealWithQuery(query: any, ds: any[], id: string): any[] {
        let results: any[] = [];
        try {
            // Log.trace("AFTER:key.length:" + Object.keys(ds[0]).length.toString());

            this.realSections = ds;
            this.idName = id;
            results = this.whereHelper(query["WHERE"]);
            if (query.hasOwnProperty("TRANSFORMATIONS")) {
                results = this.transformationHelper(query["TRANSFORMATIONS"], results);
            }
            results = this.optionHelper(query["OPTIONS"], results);

            if (results.length > 5000) {
                throw new InsightError("> 5000");
            } else {
                return results;
            }
        } catch (e) {
            throw new InsightError("fail to perform query");
        }
    }

    private optionHelper(options: any, filteredData: any[]): any[] {
        let results: any[] = [];
        const columnArray = options["COLUMNS"];
        // const keyArray: any[] = [this.idName + "_dept", this.idName + "_id", this.idName + "_avg",
        //     this.idName + "_instructor", this.idName + "_title", this.idName + "_pass",
        //     this.idName + "_fail", this.idName + "_audit", this.idName + "_uuid", this.idName + "_year"];

        // const RoomKeyArray: any[] = [this.idName + "_fullname", this.idName + "_shortname", this.idName + "_number",
        //     this.idName + "_name", this.idName + "_address", this.idName + "_lat",
        //     this.idName + "_lon", this.idName + "_seats", this.idName + "_type", this.idName + "_furniture",
        //     this.idName + "_href"];
        // const CourseKeyArray: any[] = [this.idName + "_dept", this.idName + "_id", this.idName + "_avg",
        //     this.idName + "_instructor", this.idName + "_title", this.idName + "_pass",
        //     this.idName + "_fail", this.idName + "_audit", this.idName + "_uuid", this.idName + "_year"];
        for (let item1 of filteredData) {
            results.push(item1);
        }
        // Log.trace("Before delete:key.length:" + Object.keys(results[0]).length.toString());

        for (let item of results) {
            for (let eachKey of Object.keys(item)) {
                // Log.trace(eachKey);
                if (!columnArray.includes(eachKey)) {
                    // Log.trace("delete " + eachKey);
                    delete item[eachKey];
                }
            }
        }
        // Log.trace("After delete:key.length:" + Object.keys(results[0]).length.toString());

        if (options.hasOwnProperty("ORDER")) {
            if (typeof options["ORDER"] === "string") {
                results = this.sortHelper(filteredData, options["ORDER"]);
            } else {
                results = this.advancedSortHelper(filteredData, options["ORDER"]);

            }
        }

        // let unmentionedIdKeys: string[] = [];
        // for (const key of this.C)
        return results;
    }

    private sortHelper(filterData: any[], sort: string): any[] {
        filterData.sort(function (a: any, b: any) {
            if (a[sort] > b[sort]) {
                return 1;
            } else if (a[sort] < b[sort]) {
                return -1;
            } else {
                return 0;
            }
        });
        return filterData;
    }

    private advancedSortHelper(filterData: any[], sort: any): any[] {
        let direction = sort["dir"];
        let orderKeys = sort["keys"];
        if (direction === "UP") {
            for (let eachKey of orderKeys) {
                filterData.sort((a: any, b: any) => {
                    if (a[eachKey] > b[eachKey]) {
                        return 1;
                    } else if (a[eachKey] < b[eachKey]) {
                        return -1;
                    } else {
                        return 0;
                    }
                });
            }
        } else {
            for (let eachKey of orderKeys) {
                filterData.sort((a: any, b: any) => {
                    if (a[eachKey] > b[eachKey]) {
                        return -1;
                    } else if (a[eachKey] < b[eachKey]) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
            }
        }
        return filterData;
    }

    private whereHelper(where: any): any[] {
        let results: any[] = [];
        if (Object.keys(where).length === 0) {
            results = this.realSections;
        } else if (where.hasOwnProperty("LT")
            || where.hasOwnProperty("GT")
            || where.hasOwnProperty("EQ")) {
            results = this.mComparatorHelper(where);
        } else if (where.hasOwnProperty("AND")) {
            results = this.andHelper(where);
        } else if (where.hasOwnProperty("NOT")) {
            results = this.negationHelper(where);
        } else if (where.hasOwnProperty("OR")) {
            results = this.orHelper(where);
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

    private andHelper(filter: any): any[] {
        let results: any[] = this.realSections;
        let and = filter["AND"];
        for (let eachFilterInAnd of and) {
            results = this.intersection(this.whereHelper(eachFilterInAnd), results);
        }
        return results;
    }

    private intersection(rs1: any[], rs2: any[]): any[] {
        let results: any[] = [];
        const set1 = new Set();
        for (let eachSection of rs1) {
            set1.add(eachSection);
        }
        for (let eachSec of rs2) {
            if (set1.has(eachSec)) {
                results.push(eachSec);
            }
        }
        return results;
    }

    private union(rs1: any[], rs2: any[]): any[] {
        let results: any[] = [];
        const unionSec = new Set();
        for (let eachSection of rs1) {
            unionSec.add(eachSection);
        }
        for (let eachSec of rs2) {
            unionSec.add(eachSec);
        }
        for (let eachSet of unionSec) {
            results.push(eachSet);
        }
        return results;
    }

    private negationHelper(filter: any): any[] {
        let results: any[] = [];
        let not = filter["NOT"];
        let hold = this.whereHelper(not);
        for (let item of this.realSections) {
            if (!hold.includes(item)) {
                results.push(item);
            }
        }
        return results;
    }

    private orHelper(filter: any): any[] {
        let results: any[] = [];
        const orArray = filter["OR"];
        for (let eachFilter of orArray) {
            results = this.union(results, this.whereHelper(eachFilter));
        }
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
                    if (item[keyInIS].endsWith(substr)) {
                        results.push(item);
                    }
                }
            } else if ((!selectString.startsWith("*") && selectString.endsWith("*"))) {
                substr = selectString.substring(0, selectString.length - 1);
                for (let item of this.realSections) {
                    if (item[keyInIS].startsWith(substr)) {
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
        // try {
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
        // } catch (e) {
        //     return false;
        // }
    }

    private isStringKey(inputStringKey: string): boolean {
        // try {
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
        // } catch (e) {
        //     return false;
        // }
    }

    private isValidStringInIS(inputString: string): boolean {
            return /^((\*)?[^*]*(\*)?)$/.test(inputString);
    }

    private isValidInOPTIONS(options: any): boolean {
        const columns = options["COLUMNS"];
        // check if COLUMNS is array and not empty
        if (!(Array.isArray(columns) && columns.length > 0)) {
            return false;
        } else {
            for (let column of columns) {
                // check each item is String
                if (!(typeof column === "string")) {
                    return false;
                } else {
                    if (this.transFlag === false) {
                        if (!this.isIDandKeymatch(column)) {
                            return false;
                        }
                    } else {
                        if (!this.keysInTransformation.has(column)) {
                            return false;
                        }
                    }
                }
            }
        }

        if (options.hasOwnProperty("ORDER")) {
            const order = options["ORDER"];
            if (!this.isItQuery(order)) {
                if (typeof order !== "string") {
                    return false;
                } else {
                    return columns.includes(order);
                }
            } else {
                if (Object.keys(order).length === 2 && order.hasOwnProperty("dir") && order.hasOwnProperty("keys")) {
                    let sort = order["dir"];
                    if (sort !== "UP" && sort !== "DOWN") {
                        return false;
                    }
                    let orderKeys = order["keys"];
                    if (!(Array.isArray(orderKeys) && orderKeys.length > 0)) {
                        return false;
                    } else {
                        // make sure order items appears in columns
                        for (let orderKey of orderKeys) {
                            if (!columns.includes(orderKey)) {
                                return false;
                            }
                        }
                        return true;
                    }

                } else {
                    return false;
                }
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
                    let caKey = Object.keys(stuffInComparator)[0];
                    if (!this.isIDandKeymatch(caKey)) {
                        return false;
                    }
                    let caKeyPostfix = caKey.split("_")[1];
                    return (Object.values(AllNumberKey).includes(caKeyPostfix)
                        && (typeof stuffInComparator[caKey] === "number"));
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
                    let isKey = Object.keys(stuffInIs)[0];
                    if (!this.isIDandKeymatch(isKey)) {
                        return false;
                    }
                    let isKeyPostfix = isKey.split("_")[1];
                    return (Object.values(AllStringKey).includes(isKeyPostfix)
                        && (this.isValidStringInIS(stuffInIs[isKey])));
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

    private isApplyKeys(key: string): boolean {
        if (key.split("_").length === 1 && key.split("_")[0].length > 0) {
            return true;
        } else {
            return false;
        }
    }

    private isValidTransformations(transformations: any): boolean {
        // Check Group and Apply
        if (!(transformations.hasOwnProperty("GROUP") &&
            transformations.hasOwnProperty("APPLY") && Object.keys(transformations).length === 2)) {
            return false;
        }

        // validate Group
        let group = transformations["GROUP"];
        if (!Array.isArray(group) || group.length < 1) {
            return false;
        }

        for (let gKey of group) {
            if (typeof gKey !== "string") {
                return false;
            }
            // ensure it has "_"
            if (this.isApplyKeys(gKey)) {
                return false;
            }
            if (!this.isIDandKeymatch(gKey)) {
                return false;
            }
            this.keysInTransformation.add(gKey);
        }

        // validate Apply
        let apply = transformations["APPLY"];
        if (!Array.isArray(apply)) {
            return false;
        }
        if (apply.length > 0) {
            for (let applyRule of apply) {
                // return false if it is not a query
                if (!this.isItQuery(applyRule)) {
                    return false;
                }
                // check if it has only one applykey in every applyrule
                if (Object.keys(applyRule).length !== 1) {
                    return false;
                }
                let potentialKey = Object.keys(applyRule)[0];
                if (this.isApplyKeys(potentialKey)) {
                    this.applyKeys.push(potentialKey);
                    this.keysInTransformation.add(potentialKey);
                } else {
                    return false;
                }

                let atQuery = applyRule[potentialKey];
                if (Object.keys(atQuery).length !== 1) {
                    return false;
                }
                let tokenName = Object.keys(atQuery)[0];
                if (!Object.values(applyToken).includes(tokenName)) {
                    return false;
                }

                // check token and key match or not
                let keyInToken = atQuery[tokenName];
                if (typeof keyInToken !== "string" || this.isApplyKeys(keyInToken)) {
                    return false;
                } else {
                    if (!this.isIDandKeymatch(keyInToken)) {
                        return false;
                    }
                    if (tokenName !== "COUNT") {
                        let keyToValidate = keyInToken.split("_")[1];
                        if (!Object.values(AllNumberKey).includes(keyToValidate)) {
                            return false;
                        }
                    }
                }
            }
            return true;
        } else {
            return true;
        }

    }

    private isIDandKeymatch(key: string): boolean {
        let prefix = key.split("_")[0];
        let postfix = key.split("_")[1];

        // Check idname stay the same or not
        if (this.idName.length === 0) {
            this.idName = prefix;
        } else {
            if (!(this.idName === prefix)) {    // TODO: potential solution
                return false;
            }
        }

        // Check postkey match idtype or not
        if (this.dataType === "") {
            if (Object.values(CourseKey).includes(postfix)) {
                this.dataType = "courses";
            } else if (Object.values(RoomKey).includes(postfix)) {
                this.dataType = "rooms";
            } else {
                return false;
            }
        } else if (this.dataType === "courses") {
            if (!Object.values(CourseKey).includes(postfix)) {
                return false;
            }
        } else {
            if (!Object.values(RoomKey).includes(postfix)) {
                return false;
            }
        }
        return true;
    }

    private performApplyHelper(applys: any[], singleGroup: any[]): any {
        let returnValue: number = 0;
        let reservedSample = singleGroup[0];
        for (let eachApply of applys) {
            let applyRule = Object.keys(eachApply)[0];
            let tokenName = Object.keys(eachApply[applyRule])[0];
            let columnBesideToken = eachApply[applyRule][tokenName];
            switch (tokenName) {
                case "COUNT":
                    let TempContainer: any[] = [];
                    for (let item of singleGroup) {
                        if (!TempContainer.includes(item[columnBesideToken])) {
                            TempContainer.push(item[columnBesideToken]);
                        }
                    }
                    returnValue = TempContainer.length;
                    break;
                case "AVG":
                    // let answer: number = 0;
                    const Decimal = require("decimal.js");
                    let average = new Decimal(0);
                    for (let item of singleGroup) {
                        let toBeAdded = new Decimal(item[columnBesideToken]);
                        average = Decimal.add(average, toBeAdded);
                    }
                    let avg = average.toNumber();
                    avg = average / (singleGroup.length);
                    returnValue = Number(avg.toFixed(2));
                    break;

                case "SUM":
                    let sum: number = 0;
                    for (let item of singleGroup) {
                        sum += item[columnBesideToken];
                    }
                    returnValue = Number(sum.toFixed(2));
                    break;

                case "MIN":
                    let minimum = singleGroup[0][columnBesideToken];
                    for (let item of singleGroup) {
                        if (item[columnBesideToken] < minimum) {
                            minimum = item[columnBesideToken];
                        }
                    }
                    returnValue = minimum;
                    break;

                case "MAX":
                    let maximum = singleGroup[0][columnBesideToken];
                    for (let item of singleGroup) {
                        if (item[columnBesideToken] > maximum) {
                            maximum = item[columnBesideToken];
                        }
                    }
                    returnValue = maximum;
                    break;

            }
            reservedSample[applyRule] = returnValue;

        }
        // return returnValue;
        return reservedSample;
    }

    private transformationHelper(transformations: any, results: any[]): any[] {
        // let columns: any[] = options["COLUMNS"];

        // gather Apply keys
        let applyArray = transformations["APPLY"];
        let keysInApply = [];
        for (let applyRule of applyArray) {
            let applyRuleName = Object.keys(applyRule)[0];
            // let tokenName = Object.values(applyRule[applyRuleName])[0];
            // let columnBesideToken = applyRule[applyRuleName][tokenName];
            keysInApply.push(applyRuleName);
        }

        // gather Group keys
        let keysInGroup = [];
        let libraryOfCombination: any = {};
        let combination: string = "";
        let groupArray = transformations["GROUP"];

        for (let a of groupArray) {
            keysInGroup.push(a);
        }

        // perform Group
        for (let section of results) {
            for (let keyInGroup of keysInGroup) {
                combination = combination.concat(section[keyInGroup]);
            }
            if (!libraryOfCombination.hasOwnProperty(combination)) {
                libraryOfCombination[combination] = [];
                libraryOfCombination[combination].push(section);
            } else {
                libraryOfCombination[combination].push(section);
            }
            combination = "";
        }
        // set map
        // for (let b of Object.values(libraryOfCombination)) {
        //     groupMap.set(b, libraryOfCombination[b]);
        // }

        // deal with APPLY
        let allCombinations = Object.values(libraryOfCombination);
        let response: any [] = [];
        for (let g of allCombinations) {
            response.push(this.performApplyHelper(applyArray, g));
        }

        // const RoomKeyArray: any[] = [this.idName + "_fullname", this.idName + "_shortname", this.idName + "_number",
        //     this.idName + "_name", this.idName + "_address", this.idName + "_lat",
        //     this.idName + "_lon", this.idName + "_seats", this.idName + "_type", this.idName + "_furniture",
        //     this.idName + "_href"];
        // const CourseKeyArray: any[] = [this.idName + "_dept", this.idName + "_id", this.idName + "_avg",
        //     this.idName + "_instructor", this.idName + "_title", this.idName + "_pass",
        //     this.idName + "_fail", this.idName + "_audit", this.idName + "_uuid", this.idName + "_year"];
        //
        // let toDo: any[];
        // if (this.dataType === "rooms") {
        //     toDo = RoomKeyArray.concat(keysInApply);
        // } else {
        //     toDo = CourseKeyArray.concat(keysInApply);
        // }
        //
        // for (let eachsection of results) {
        //     for (let t of toDo) {
        //         if (!columns.includes(t)) {
        //             delete eachsection[t];
        //         }
        //     }
        // }

        return response;

    }
}
