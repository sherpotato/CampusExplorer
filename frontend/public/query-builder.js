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

    // Find logical type
    let logicalType = findLogicalType(content.getElementsByClassName("control-group condition-type")[0]);

    // Find Logical condition(s)
    let condition = content.getElementsByClassName("control-group condition");
    // if (condition.length === 0){
    // empty where
    // } else if (condition.length)



    console.log("CampusExplorer.buildQuery not implemented yet.");
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

