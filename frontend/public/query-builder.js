/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function() {
    let query = {};
    // TODO: implement!

    let content = document.getElementsByClassName("tab-panel active")[0];

    // Find id
    let preFix = content.getAttribute("data-type");

    // For WHERE
    // Find logical type
    let logicalType = findLogicalType(content.getElementsByClassName("control-group condition-type")[0]);

    // Find Logical condition(s)
    let logicalCondition = content.getElementsByClassName("control-group condition");
    if (logicalCondition.length > 1) {
        query["WHERE"] = multipleCondition(logicalCondition, logicalType, preFix);
    } else if (logicalCondition.length === 1) {
        if (logicalType === "NOT"){
            query["WHERE"] = {[logicalType]: oneCondition(logicalCondition[0], preFix)};
        }
        query["WHERE"] = oneCondition(logicalCondition[0], preFix);
    } else {
        // empty where
        query["WHERE"] = {};
    }

    // For OPTIONS
    let options = {};
    // Find Columns
    let columns = content.getElementsByClassName("form-group columns")[0].getElementsByClassName("control-group")[0];
    let columnsKey = columns.getElementsByClassName("control field");
    let columnsApplyKey = columns.getElementsByClassName("control transformation");
    let columnArray = [];
    for (let eachColumnsKey of columnsKey){
        if (eachColumnsKey.getElementsByTagName("input")[0].checked) {
            columnArray.push(preFix + "_" + eachColumnsKey.getElementsByTagName("input")[0].value);
        }
    }
    for (let eachColumnsApplyKey of columnsApplyKey){
        if (eachColumnsApplyKey.getElementsByTagName("input")[0].checked) {
            columnArray.push(eachColumnsApplyKey.getElementsByTagName("input")[0].value);
        }
    }
    options["COLUMNS"] = columnArray;

    // Find Order
    let orderSelection = content.getElementsByClassName("form-group order")[0].getElementsByClassName("control-group")[0];
    let orderKeys = orderSelection.getElementsByClassName("control order fields")[0].getElementsByTagName("select")[0].selectedOptions;
    let controlDescending = orderSelection.getElementsByClassName("control descending")[0].getElementsByTagName("input")[0].checked;

    // Check if the order has to be existed
    if (!(orderKeys.length === 0 && !controlDescending)) {
        let order = {};
        let orderKeyArray = [];
        if (orderKeys.length > 0) {
            for (let eachKey of orderKeys) {
                if (eachKey.className === "transformation") {
                    orderKeyArray.push(eachKey.value);
                } else {
                    orderKeyArray.push(preFix + "_" + eachKey.value);
                }
            }
            if (controlDescending) {
                // DOWN
                order = {["dir"]: "DOWN",
                        ["keys"]: orderKeyArray};
            } else{
                // UP
                order = {["dir"]: "UP",
                        ["keys"]: orderKeyArray};
            }
        } else {
            // (orderKeys.length === 0 && controlDescending)
            order = {["dir"]: "DOWN",
                    ["keys"]: orderKeyArray};

        }
        options["ORDER"] = order;
    }
    query["OPTIONS"] = options;

    // Find Transformation
    // Find Groups
    let groups = content.getElementsByClassName("form-group groups")[0].getElementsByClassName("control-group")[0];
    let checkedGroup = groups.getElementsByTagName("input");
    let groupArray = [];
    for (let eachCheckedGroup of checkedGroup){
        if (eachCheckedGroup.checked){
            groupArray.push(preFix + "_" + eachCheckedGroup.value);
        }
    }
    // Find Apply
    let apply = content.getElementsByClassName("form-group transformations")[0].getElementsByClassName("control-group transformation");
    let applyArray = findApply(apply, preFix);

    // Check if it is not an empty transformation. If it is empty , there is no need to show transformation
    if (!(apply.length === 0 && groupArray.length === 0)){
        query["TRANSFORMATIONS"] = {["GROUP"]: groupArray,
                                    ["APPLY"]: applyArray};
    }

    console.log(JSON.stringify(query));
    return query;
};

// helper for finding logical type
findLogicalType = function(condition){
    // ALL
    if (condition.getElementsByClassName("control conditions-all-radio")[0].getElementsByTagName("input")[0].checked){
        return "AND";
    }
    // ANY
    if (condition.getElementsByClassName("control conditions-any-radio")[0].getElementsByTagName("input")[0].checked){
        return "OR";
    }
    // NOT
    else{
        return "NOT";
    }
};

// According to one condition, return a query
oneCondition = function (oneCondition, preFix) {
    let returnOb = {};
    let controlNot = oneCondition.getElementsByClassName("control not")[0].getElementsByTagName("input")[0].checked;
    let postFix = oneCondition.getElementsByClassName("control fields")[0].getElementsByTagName("select")[0].selectedOptions[0].value;
    let field = preFix + "_" + postFix;
    let operators = oneCondition.getElementsByClassName("control operators")[0].getElementsByTagName("select")[0].selectedOptions[0].value;
    let term = oneCondition.getElementsByClassName("control term")[0].getElementsByTagName("input")[0].value;
    if (operators !== "IS") {
        term = Number(term);
    }
    returnOb = {[operators]: {[field]: term}};
    if (controlNot) {
        returnOb = {["NOT"]: returnOb};
    }
    return returnOb;
};

multipleCondition = function(logicalCondition, logicalType, preFix){
    let returnOb = {};
    let conditionArray = [];
    for (eachLogicalcondition of logicalCondition){
        conditionArray.push(this.oneCondition(eachLogicalcondition, preFix));
    }
    if (logicalType === "NOT"){
        returnOb = {[logicalType]:{["OR"]: conditionArray}};
    } else {
        returnOb = {[logicalType]: conditionArray};
    }
    return returnOb;
};

findApply = function(apply,preFix) {
    let applyArray = [];
    if (apply.length > 0) {
        let applyArray = [];
        for (let eachApply of apply) {
            let applyRule = {};
            let applykey = eachApply.getElementsByClassName("control term")[0].getElementsByTagName("input")[0].value;
            let applyToken = eachApply.getElementsByClassName("control operators")[0].getElementsByTagName("select")[0].selectedOptions[0].value;
            let applyField = preFix + "_" + eachApply.getElementsByClassName("control fields")[0].getElementsByTagName("select")[0].selectedOptions[0].value;
            applyRule = {[applykey]: {[applyToken]: applyField}};
            applyArray.push(applyRule);
        }
    }
    return applyArray;
};


