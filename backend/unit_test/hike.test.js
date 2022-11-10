"use strict"

/* UNIT TEST FILE FOR HIKE APIS */
const { expect, assert } = require('chai');
const HikeController = require('../database');
const dbManager = require('../databaseManager')

const hikeController = new HikeController();

/* beforeEach(async () => {
    await dbManager.deleteAllData()
});

afterEach(async () => {
    await dbManager.deleteAllData()
}); */

describe.only('hikeController Tests', () => {

    describe('getAllHikes method test', () => {
        test('successful use of getAllHikes', async () => {
            const result = await hikeController.getHikeWithFilters();
            assert.equal(result.length, 0);
        })
    })

    /* describe('getHike method test', () => {
        let errorValue;
        test('successful use of getHike', async () => {
            const sqlInstruction = `INSERT INTO hike (ID, name, length, expected_time, ascent, difficulty, start_point, end_point, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`;

            await dbManager.genericSqlRun(sqlInstruction, 55, "name1", 10,"05:00", 500, "H", "stPoint", "endPoint", "aDesc")
                .catch(() => { throw error });
            await dbManager.genericSqlRun(sqlInstruction, 100, 50, 10.99, "notes", "first sku", 50)
                .catch(() => { throw error });

            await hikeController.createHike(
                {
                    ID: 65,
                    name: "name65",
                    length: 10,
                    expected_time: "02:00",
                    ascent: 500,
                    difficulty: "T",
                    start_point: "stPoint65",
                    end_point: "endPoint65",
                    description: "Desc65",
                }
            )
            await hikeController.createHike(
                {
                    ID: 66,
                    name: "name66",
                    length: 10,
                    expected_time: "02:00",
                    ascent: 500,
                    difficulty: "T",
                    start_point: "stPoint66",
                    end_point: "endPoint66",
                    description: "Desc66",
                }
            )

            const result = await hikeController.getHike(2);
            assert.equal(result.id, 2)
        })

        test('attempt of getItem with undefined id', async () => {
            await itemController.getItem(undefined, 5).catch(err => errorValue = err);
            assert.equal(errorValue.code, 422)
        })

        test('attempt of getItem with invalid id', async () => {
            await itemController.getItem("hello", 5).catch(err => errorValue = err);
            assert.equal(errorValue.code, 422)
        })

        test('attempt of getItem with non-existant item', async () => {
            await itemController.getItem(1, 5).catch(err => errorValue = err);
            assert.equal(errorValue.code, 404)
        })



    }) */

})