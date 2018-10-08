import { expect } from "chai";

import {
    InsightDatasetKind,
    InsightError,
    NotFoundError
} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the JSON schema described in test/query.schema.json
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: string | string[];
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the Before All hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        emptyCase: "./test/data/emptyCase.zip",
        brokenJSON: "./test/data/brokenJSON.zip",
        correct: "./test/data/correct.zip",
        zeroCourseSection: "./test/data/zeroCourseSection.zip",
        nonZip: "./test/data/nonZip.pdf",
        pdfInCourses: "./test/data/pdfInCourses.zip",
        emptyJSON: "./test/data/emptyJSON.zip",
        nonJSON: "./test/data/nonJSON.zip",
        noCoursesFolder: "./test/data/noCoursesFolder.zip",
        multipleFolder: "./test/data/multipleFolder.zip",
        manyType: "./test/data/manyType.zip",
        noValidSection: "./test/data/noValidSection.zip",
        noValidInCourses: "./test/data/noValidInCourses.zip",
        missFieldValid: "./test/data/missFieldValid.zip",
        missFieldInvalid: "./test/data/missFieldInvalid.zip",
        correctDataSet: "./test/data/correctDataSet.zip",
    };

    let insightFacade: InsightFacade;
    let datasets: { [id: string]: string };

    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);

        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToLoad)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return { [Object.keys(datasetsToLoad)[i]]: buf.toString("base64") };
            });
            datasets = Object.assign({}, ...loadedDatasets);
            expect(Object.keys(datasets)).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("Should add a valid dataset", async function () {
        const id: string = "courses";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id]);
        }
    });

    it("listDatasets", async () => {
        let response = await insightFacade.listDatasets();
        expect(response.length).to.deep.equal(1);
        expect(response[0].id).to.deep.equal("courses");
    });

    // test case : should fail to add a un-existing dataset, id = empty string
    it("Should fail to add a un-existing dataset, id = empty string", async () => {
        const id: string = "";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : should fail to add the dataset, id = null
    it("Should fail to add a dataset with id = null", async () => {
        const id: string = null;
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : should fail to add the empty dataset, nothing in zipFile
    it("Should fail to add a empty ( invalid ) dataset", async () => {
        const id: string = "emptyCase";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : should fail to add a broken JSON file dataset
    it("Should fail to add a broken JSON file ( invalid ) dataset", async () => {
        const id: string = "brokenJSON";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : Should fail to add a different kind of dataset, e.g courses to Rooms
    it("Should fail to add a different kind of dataset, e.g courses to Rooms", async () => {
        const id: string = "correct";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : should fail to add the same dataset (with same id)
    it("should fail to add the existing dataset with same id", async () => {
        const id: string = "courses";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : should fail to add a zero valid course section dataset
    it("Should fail to add a zero valid course section dataset", async () => {
        const id: string = "zeroCourseSection";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : should fail to add a non zip file dataset, e.g docx
    it("Should fail to add a non zip file dataset, e.g pdf", async () => {
        const id: string = "nonZip";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : should fail to add a dataset with only pdf in courses folder
    it("Should fail to add a dataset with only pdf in courses folder", async () => {
        const id: string = "pdfInCourses";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : should fail to add a empty JSON file dataset, nothing in the JSON file
    it("Should fail to add a empty JSON file dataset", async () => {
        const id: string = "emptyJSON";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : should fail to add a non JSON file dataset, nothing in the courses folder
    it("Should fail to add a non JSON file dataset, onthing in the courses folder", async () => {
        const id: string = "nonJSON";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : should fail to add the dataset which stored in the different folder name
    it("should fail to add the dataset which stored in the different folder name", async () => {
        const id: string = "noCoursesFolder";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : should add the dataset which has multiple folders with valid sections
    it("should add the dataset which has multiple folders with valid sections", async () => {
        const id: string = "multipleFolder";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(["courses", id]);
        }
    });

    it("listDatasets", async () => {
        let response = await insightFacade.listDatasets();
        expect(response.length).to.deep.equal(2);
        expect(response[0].id).to.deep.equal("courses");
        expect(response[1].id).to.deep.equal("multipleFolder");
    });

    // test case : should add the dataset which has multiple types of files but courses with valid sections
    it("Should add a dataset with courses and other files", async () => {
        const id: string = "manyType";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(["courses", "multipleFolder", id]);
        }
    });

    it("listDatasets", async () => {
        let response = await insightFacade.listDatasets();
        expect(response.length).to.deep.equal(3);
        expect(response[0].id).to.deep.equal("courses");
        expect(response[1].id).to.deep.equal("multipleFolder");
        expect(response[2].id).to.deep.equal("manyType");
    });

    // test case : should fail to add the dataset (no valid section in courses folder) with other folders
    it("should fail to add the dataset (no valid section in courses folder) with other folders", async () => {
        const id: string = "noValidSection";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : should fail to add the dataset (no valid section in courses folder) with other files
    it("should fail to add the dataset (no valid section in courses folder) with other files", async () => {
        const id: string = "noValidInCourses";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : should add the dataset which JSON miss several fields but courses with valid section
    it("should add the dataset which JSON miss several fields but courses with valid section", async () => {
        const id: string = "missFieldValid";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(["courses", "multipleFolder", "manyType", id]);
        }
    });

    it("listDatasets", async () => {
        let response = await insightFacade.listDatasets();
        expect(response.length).to.deep.equal(4);
        expect(response[0].id).to.deep.equal("courses");
        expect(response[1].id).to.deep.equal("multipleFolder");
        expect(response[2].id).to.deep.equal("manyType");
        expect(response[3].id).to.deep.equal("missFieldValid");
    });

    // test case : should fail to add the dataset which JSON miss several fields but courses without valid section
    it("should fail to add the dataset which JSON miss several fields but courses without valid section", async () => {
        const id: string = "missFieldInvalid";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // This is an example of a pending test. Add a callback function to make the test run.
    // test case : should remove the existing course dataset
    it("Should remove the existing courses dataset", async () => {
        const id: string = "missFieldValid";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
        }
    });

    it("listDatasets", async () => {
        let response = await insightFacade.listDatasets();
        expect(response.length).to.deep.equal(3);
        expect(response[0].id).to.deep.equal("courses");
        expect(response[1].id).to.deep.equal("multipleFolder");
        expect(response[2].id).to.deep.equal("manyType");
    });

    // test case : should fail to remove the unexisting courses dataset
    it("Should fail to remove the unexisting courses dataset", async () => {
        const id: string = "abc";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(NotFoundError);
        }
    });

    // test case : should fail to remove a dataset with empty id
    it("Should fail to remove a dataset with empty id", async () => {
        const id: string = "";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : should fail to remove a dataset with null id
    it("Should fail to remove a dataset with null id", async () => {
        const id: string = null;
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    // test case : should add two different dataset successfully, e.g add courses and correctDataSet
    it("Should add to two different dataset", async () => {
        const id1: string = "missFieldValid";
        const id2: string = "correctDataSet";
        let response1: string[];
        let response2: string[];

        try {
            response1 = await insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
            response2 = await insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        } catch (err) {
            response1 = err;
            response2 = err;
        } finally {
            expect(response1).to.deep.equal(["courses", "multipleFolder", "manyType", id1, id2]);
            expect(response2).to.deep.equal(["courses", "multipleFolder", "manyType", id1, id2]);
        }
    });

    it("listDatasets", async () => {
        let response = await insightFacade.listDatasets();
        expect(response.length).to.deep.equal(5);
        expect(response[0].id).to.deep.equal("courses");
        expect(response[1].id).to.deep.equal("multipleFolder");
        expect(response[2].id).to.deep.equal("manyType");
        expect(response[3].id).to.deep.equal("missFieldValid");
        expect(response[4].id).to.deep.equal("correctDataSet");
    });

    // it("small dataset", async () => {
    //     let response = await insightFacade.performQuery({
    //         WHERE: {},
    //         OPTIONS: {
    //             COLUMNS: [
    //                 "correctDataSet_dept",
    //                 "correctDataSet_id",
    //                 "correctDataSet_avg",
    //                 "correctDataSet_instructor",
    //                 "correctDataSet_title",
    //                 "correctDataSet_pass",
    //                 "correctDataSet_fail",
    //                 "correctDataSet_audit",
    //                 "correctDataSet_uuid",
    //                 "correctDataSet_year"
    //
    //             ]
    //         }
    //     });
    // });

    // it("wildcards start with *", async () => {
    //     let response: any[] = [];
    //     try {
    //         response = await insightFacade.performQuery({
    //             WHERE: {
    //                 AND: [
    //                     {
    //                         GT: {
    //                             courses_avg: 97
    //                         }
    //                     },
    //                     {
    //                         IS: {
    //                             courses_dept: "*c"
    //                         }
    //                     }
    //                 ]
    //             },
    //             OPTIONS: {
    //                 COLUMNS: [
    //                     "courses_dept",
    //                     "courses_id",
    //                     "courses_avg"
    //                 ],
    //                 ORDER: "courses_avg"
    //             }
    //         });
    //     } catch (e) {
    //         response = e;
    //     } finally {
    //         expect (response).to.deep.equal([{courses_dept: "educ", courses_id: "500", courses_avg: 97.5}]);
    //     }
    //
    // });

});

// This test suite dynamically generates tests from the JSON files in test/queries.
// You should not need to modify it; instead, add additional files to the queries directory.
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Create a new instance of InsightFacade, read in the test queries from test/queries and
    // add the datasets specified in datasetsToQuery.
    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = await TestUtil.readTestQueries();
            expect(testQueries).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${JSON.stringify(err)}`);
        }

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Fail if there is a problem reading ANY dataset.
        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToQuery)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return { [Object.keys(datasetsToQuery)[i]]: buf.toString("base64") };
            });
            expect(loadedDatasets).to.have.length.greaterThan(0);

            const responsePromises: Array<Promise<string[]>> = [];
            const datasets: { [id: string]: string } = Object.assign({}, ...loadedDatasets);
            for (const [id, content] of Object.entries(datasets)) {
                responsePromises.push(insightFacade.addDataset(id, content, InsightDatasetKind.Courses));
            }

            // This try/catch is a hack to let your dynamic tests execute even if the addDataset method fails.
            // In D1, you should remove this try/catch to ensure your datasets load successfully before trying
            // to run you queries.
            try {
                const responses: string[][] = await Promise.all(responsePromises);
                responses.forEach((response) => expect(response).to.be.an("array"));
            } catch (err) {
                Log.warn(`Ignoring addDataset errors. For D1, you should allow errors to fail the Before All hook.`);
            }
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, async function () {
                    let response: any[];

                    try {
                        response = await insightFacade.performQuery(test.query);
                    } catch (err) {
                        response = err;
                    } finally {
                        if (test.isQueryValid) {
                            expect(response).to.deep.equal(test.result);
                        } else {
                            expect(response).to.be.instanceOf(InsightError);
                        }
                    }
                });
            }
        });
    });
});
