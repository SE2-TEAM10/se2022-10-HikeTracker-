"use strict";

const sqlite = require("sqlite3");
const crypto = require("crypto");
const dayjs = require("dayjs");

class Database {
  constructor(dbName) {
    this.db = new sqlite.Database(dbName, (err) => {
      if (err) throw err;
    });
  }

  getHikeWithFilters = (filters) => {
    console.log(filters);
    console.log(Object.keys(filters).length);

    return new Promise((resolve, reject) => {
      let query =
        "SELECT * FROM hike INNER JOIN location ON hike.ID = location.hike_ID";
      let query2 = "";
      if (!(Object.entries(filters) == 0)) {
        query2 = query.concat(" WHERE ");
        for (let entry of Object.entries(filters)) {
          let key = entry[0];
          let value = entry[1];
          if (key == "start_asc" || key == "end_asc") {
            value = parseInt(value);
          }
          if (key == "start_len" || key == "end_len") {
            value = parseInt(value);
          }
          if (typeof value === "string" || value instanceof String) {
            if (key.length !== 0) {
              if (key == "start_time") {
                query2 = query2.concat(
                  "expected_time",
                  " > ",
                  "'" + value + "'"
                );
              } else if (key == "end_time") {
                query2 = query2.concat("expected_time", "<", "'" + value + "'");
              } else {
                query2 = query2.concat(key, "=", "'" + value + "'");
              }
            }
          } else if (typeof value === "number" || value instanceof Number) {
            if (key == "start_asc") {
              query2 = query2.concat("ascent", " > ", value);
            } else if (key == "end_asc") {
              query2 = query2.concat("ascent", " < ", value);
            } else if (key == "start_len") {
              query2 = query2.concat("length", " > ", value);
            } else if (key == "end_len") {
              query2 = query2.concat("length", " < ", value);
            }
          }
          query2 = query2.concat(" AND ");
        }
        query2 = query2.slice(0, query2.length - 4);
        console.log(query2);
      } else {
        query2 = query2.concat(query);
        console.log(query2);
      }

      console.log("final query: ", query2);
      this.db.all(query2, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        const list = rows.map((e) => ({
          id: e.ID,
          name: e.name,
          length: e.length,
          expected_time: e.expected_time,
          ascent: e.ascent,
          difficulty: e.difficulty,
          start_point: e.start_point,
          end_point: e.end_point,
          description: e.description,
          location_name: e.location_name,
          latitude: e.latitude,
          longitude: e.longitude,
          city: e.city,
          province: e.province,
          hike_ID: e.hike_ID,
        }));
        //console.log(list);
        let array = [];
        list.forEach((i) => {
          if (array.find((a) => a.id === i.id) === undefined) {
            let temp = list.filter((course) => course.id === i.id);
            //console.log("temp temp temp temp temp");
            //console.log(temp);
            if (temp.length === 1) {
              array.push(temp[0]);
            } else {
              let location = [];
              temp.map((t) => {
                location.push({
                  name: t.location_name,
                  latitude: t.latitude,
                  longitude: t.longitude,
                  city: t.city,
                  province: t.province,
                });
                return t;
              });
              array.push({
                id: temp[0].id,
                name: temp[0].name,
                length: temp[0].length,
                expected_time: temp[0].expected_time,
                ascent: temp[0].ascent,
                difficulty: temp[0].difficulty,
                start_point: temp[0].start_point,
                end_point: temp[0].end_point,
                description: temp[0].description,
                location: location,
              });
            }
          }
        });
        return resolve(array);
      });
    });
  };

  /*For testing*/
  getHikeById = (id) => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM hike WHERE ID = ?";
      this.db.get(sql, [id], function (err, rows) {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  getLocationByHikeId = (hikeId) => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM location WHERE hike_ID = ?";
      this.db.all(sql, [hikeId], function (err, rows) {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  getLinkUser = (hikeID, userID) => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM hike_user WHERE hike_id=? AND user_id=?";
      this.db.all(sql, [hikeID, userID], function (err, rows) {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  deleteHikeByID = (id) => {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM hike WHERE ID=?";
      this.db.run(sql, [id], function (err) {
        if (err) reject(err);
        else resolve(true);
      });
    });
  };

  deleteLocationByHikeID = (id) => {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM location WHERE hike_ID=?";
      this.db.run(sql, [id], function (err) {
        if (err) reject(err);
        else resolve(true);
      });
    });
  };

  deleteLinkHikeUser = (hikeID, userID) => {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM hike_user WHERE hike_id=? AND user_id=?";
      this.db.run(sql, [hikeID, userID], function (err) {
        if (err) reject(err);
        else resolve(true);
      });
    });
  };

  addNewHike = (hike) => {
    return new Promise((resolve, reject) => {
      try {
        if (
          typeof hike.name !== 'string' ||
          typeof hike.length !== 'number' ||
          typeof hike.expected_time !== 'string' ||
          typeof hike.ascent !== 'number' ||
          typeof hike.difficulty !== 'string' ||
          typeof hike.start_point !== 'string' ||
          typeof hike.end_point !== 'string' ||
          typeof hike.description !== 'string'
        ) {
          return reject(422); /* 422 - UNPROCESSABLE */
        }
      } catch (e) {
        return reject(503); /* 503 - UNAVAILABLE */
      }
      const sql =
        "INSERT INTO hike(name,length,expected_time,ascent,difficulty,start_point,end_point,description) VALUES(?,?,?,?,?,?,?,?)";
      this.db.run(
        sql,
        [
          hike.name,
          hike.length,
          hike.expected_time,
          hike.ascent,
          hike.difficulty,
          hike.start_point,
          hike.end_point,
          hike.description,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  };

  linkHikeUser = (hikeID, userID) => {
    return new Promise((resolve, reject) => {
      try {
        if (
          typeof hikeID !== 'number' ||
          typeof userID !== 'number'
        ) {
          return reject(422); // 422 - UNPROCESSABLE
        }
      } catch (e) {
        return reject(503); // 503 - UNAVAILABLE
      }
      const sql = "INSERT INTO hike_user(hike_id, user_id) VALUES(?,?)";
      this.db.run(sql, [hikeID, userID], function (err) {
        if (err) reject(err);
        else resolve(true);
      });
    });
  };

  addNewLocation = (loc, id) => {
    return new Promise((resolve, reject) => {
      try {
        if (
          typeof loc.location_name !== 'string' ||
          typeof loc.latitude !== 'string' ||
          typeof loc.longitude !== 'string' ||
          typeof loc.city !== 'string' ||
          typeof loc.province !== 'string' ||
          typeof id !== 'number'
        ) {
          return reject(422); // 422 - UNPROCESSABLE
        }
      } catch (e) {
        return reject(503); // 503 - UNAVAILABLE
      }
      const sql =
        "INSERT INTO location(location_name, latitude, longitude, city, province, hike_ID) VALUES(?,?,?,?,?,?)";
      this.db.run(
        sql,
        [
          loc.location_name,
          loc.latitude,
          loc.longitude,
          loc.city,
          loc.province,
          id,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  };

  /* CHECK IF GPX FILE STRING HAS TO BE PARSED OR IT IS CORRECT */
  addNewHikeGPX = (gpx, hikeID) => {
    return new Promise((resolve, reject) => {
      const sql = "INSERT INTO hike_gpx(ID,gpx,hike_id) VALUES(?,?,?)";
      this.db.run(sql, [gpx, hikeID], function (err) {
        if (err) reject(err);
        else
          resolve(
            this.lastID
          ); /* CHECK IF GPX'S ID IS AUTOINCREMENTAL OR NOT */
      });
    });
  };

  addUser = (user) => {
    return new Promise((resolve, reject) => {
      let database = this.db;
      let salt = crypto.randomBytes(16);
      crypto.scrypt(user.password, salt.toString(), 32, function (err, hashedPassword) {

        const sql = "INSERT INTO user(name,surname,mail,password,salt,role,verified) VALUES(?,?,?,?,?,?,?)";
        database.run(
          sql,
          [
            user.name,
            user.surname,
            user.mail,
            hashedPassword,
            salt,
            user.role,
            0,
          ], (err) => {
            if (err) reject(err);
            else {
              resolve(this.lastID);
            }
          });

      });

    });
  };


  setVerified = (user_id) => {
    return new Promise((resolve, reject) => {
      let query = "UPDATE user SET verified = 1 WHERE ID=";

      db.run(query, [user_id], function (err) {
        if (err)
          reject(err);
        else {
          if (this.changes > 0)
            resolve();
          else {
            reject(new Error("Non è stato trovato nessun utente"));
          }

        }

      });
    });
  }

  getUserById = (id) => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM user WHERE id = ?";
      this.db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else if (row === undefined) resolve({ error: "User not found." });
        else {
          // by default, the local strategy looks for "username": not to create confusion in server.js, we can create an object with that property
          const user = {
            id: row.ID,
            username: row.mail,
            name: row.name,
            role: row.role,
          };
          resolve(user);
        }
      });
    });
  };

  login = (username, password) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM user WHERE mail = ?`;
      this.db.get(sql, [username], (err, row) => {
        if (err) {
          resolve(false);
        } else if (row === undefined) {
          resolve(false);
        } else {
          const user = {
            id: row.ID,
            username: row.mail,
            name: row.name,
            role: row.role,
          };

          crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) {
            if (err) reject(err);
            if (
              !crypto.timingSafeEqual(
                Buffer.from(row.password, "hex"),
                hashedPassword
              )
            )
              resolve(false);
            else resolve(user);
          });
        }
      });
    });
  };
}

module.exports = Database;
