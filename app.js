const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let database = null;

let initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error :${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//api 1

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
     SELECT 
        state_id as stateId,
        state_name as stateName,
        population
     FROM 
        state
     order by
        state_id asc;`;
  const states = await database.all(getStatesQuery);
  response.send(states);
});

//api 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesQuery = `
    SELECT * 
    FROM
         state
    WHERE
        state_id = ${stateId};`;
  const states = await database.get(getStatesQuery);
  response.send(states);
});

//API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const addDistrictCovidQuery = `
    INSERT INTO 
        district (district_name,state_id,cases,cured,active,deaths)
    VALUES (
        '${districtName},
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  const dbResponse = await database.run(districtCovidDetails);
  const districtId = dbResponse.lastID;
  response.send({ district_id: districtId });
});

//API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictQuery = `
    SELECT *
        FROM district
    WHERE
        district_id = ${districtId};`;

  const district = await database.get(getDistrictQuery);
  response.send(district);
});

//API 5
app.delete("/districts/:districtId", async (request, respond) => {
  const { districtId } = request.params;
  const DeleteDistrictQuery = `
    DELETE FROM
        district
    WHERE 
        district_id = ${districtId};`;

  await database.run(DeleteDistrictQuery);
  respond.send("District Removed");
});

//API 6

app.put("/districts/:districtId/", async (request, respond) => {
  const { districtId } = request.params;

  const { districtName, stateId, cases, curved, active, deaths } = request.body;

  const addDistrictQuery = `
    UPDATE 
        district 
    SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        curved = ${curved},
        active = ${active},
        deaths = ${deaths}
    WHERE 
        district_id = ${districtId};`;

  await database.run(addDistrictQuery);

  response.send("District Details Updated");
});

// API 7

app.get("/states/:stateId/stats/", async (request, respond) => {
  const { stateId } = request.params;

  const StateStatsQuery = `
    SELECT 
        SUM(cases) as totalCases,
        SUM(cured) as totalCured,
        SUM(active) as totalActive,
        SUM(deaths) as totalDeaths
     FROM 
        district
     WHERE
        state_id = ${stateId};`;

  const stats = await database.get(StateStatsQuery);

  respond.send(stats);
});

//API 8

app.get("/districts/:districtId/details", async (request, respond) => {
  const { districtId } = request.params;

  const getStateDetailsQuery = `
    SELECT 
        state_name as stateName
    FROM 
        district
    NATURAL JOIN
        state
    WHERE
        district_id = ${districtId};`;

  const details = await database.get(getStateDetailsQuery);
  console.log(details);
  respond.send(details);
});

module.export = app;
