"use strict";

const sqlite = require("sqlite3");
const crypto = require("crypto");
const dayjs = require("dayjs");
const GpxParser = require("gpxparser");

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
        let array = [];
        list.forEach((i) => {
          if (array.find((a) => a.id === i.id) === undefined) {
            let temp = list.filter((elem) => elem.id === i.id);
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

  getGpxByHikeId = (hikeId) => {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM hike_gpx WHERE hike_id = ?";
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

  deleteGpxByHikeID = (id) => {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM hike_gpx WHERE hike_id=?";
      this.db.run(sql, [id], function (err) {
        if (err) reject(err);
        else resolve(true);
      });
    });
  };

  addNewHike = (hike, gpx_string) => {
    return new Promise((resolve, reject) => {
      try {
        if (
          typeof hike.name !== 'string' ||
          typeof hike.expected_time !== 'string' ||
          typeof hike.difficulty !== 'string' ||
          typeof hike.description !== 'string' ||
          typeof gpx_string !== 'string'
        ) {
          return reject(422); // 422 - UNPROCESSABLE
        }
      } catch (e) {
        return reject(503); // 503 - UNAVAILABLE
      }
      var gpx = new GpxParser();
      gpx.parse(gpx_string);
      let length = parseInt((gpx.tracks[0].distance.total) / 1000);
      let ascent = parseInt((gpx.tracks[0].elevation.max));
      const sql =
        "INSERT INTO hike(name,length,expected_time,ascent,difficulty,description) VALUES(?,?,?,?,?,?)";
      this.db.run(
        sql,
        [
          hike.name,
          length,
          hike.expected_time,
          ascent,
          hike.difficulty,
          hike.description,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  };

  addNewLocation = (loc, position, hike_ID, gpx_string) => {
    return new Promise((resolve, reject) => {
      try {
        if (
          typeof loc.location_name !== 'string' ||
          typeof loc.city !== 'string' ||
          typeof loc.province !== 'string' ||
          typeof position !== 'string' ||
          typeof hike_ID !== 'number'
        ) {
          return reject(422); // 422 - UNPROCESSABLE
        }
      } catch (e) {
        return reject(503); // 503 - UNAVAILABLE
      }
      let gpx = new GpxParser();
      gpx.parse(gpx_string);
      var lat = gpx.tracks[0].points[0].lat;
      var lon = gpx.tracks[0].points[0].lon;

      let len = gpx.tracks[0].points.length - 1;
      var lat_end = gpx.tracks[0].points[len].lat;
      var lon_end = gpx.tracks[0].points[len].lon;
      let latitude, longitude;
      if (position === 'startp') {
        latitude = lat;
        longitude = lon;
      } else if (position === 'endp') {
        latitude = lat_end;
        longitude = lon_end;
      } else {
        return reject(422); //UNPROCESSABLE
      }
      const sql =
        "INSERT INTO location(location_name, latitude, longitude, city, province, hike_ID) VALUES(?,?,?,?,?,?)";
      this.db.run(
        sql,
        [
          loc.location_name,
          latitude,
          longitude,
          loc.city,
          loc.province,
          hike_ID,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  };


  addNewHikeGPX = (gpx_string, hikeID) => {
    return new Promise((resolve, reject) => {
      try {
        if (
          typeof gpx_string !== 'string' ||
          typeof hikeID !== 'number'
        ) {
          return reject(422); // 422 - UNPROCESSABLE
        }
      } catch (e) {
        return reject(503); // 503 - UNAVAILABLE
      }
      const sql = "INSERT INTO hike_gpx(gpx,hike_id) VALUES(?,?)";
      this.db.run(sql, [gpx_string, hikeID], function (err) {
        if (err) reject(err);
        else
          resolve(this.lastID);
      });
    });
  };

  addUser = (user) => {
    return new Promise((resolve, reject) => {
      try {
        if (
          typeof user.name !== 'string' ||
          typeof user.surname !== 'string' ||
          typeof user.mail !== 'string' ||
          typeof user.role !== 'string' /* ||
          typeof user.password !== 'string' ||
          typeof user.salt !== 'string' ||
          typeof user.verified !== 'number' */
        ) {
          return reject(422); // 422 - UNPROCESSABLE
        }
      } catch (e) {
        return reject(503); // 503 - UNAVAILABLE
      }
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

  addGpx = (gpx1) => {
    return new Promise((resolve, reject) => {
      var gpx = new GpxParser();
      gpx.parse(gpx1);

      /* let track = gpx.tracks[0];
      console.log("track - ", track); */

      let length = parseInt((gpx.tracks[0].distance.total*2) / 1000);
      console.log("LENGTH ", length);

      let ascent = parseInt((gpx.tracks[0].elevation.pos));
      console.log("ASCENT ", ascent);

      var lat = gpx.tracks[0].points[0].lat;
      var lon = gpx.tracks[0].points[0].lon;

      let len = gpx.tracks[0].points.length - 1;
      var lat_end = gpx.tracks[0].points[len].lat;
      var lon_end = gpx.tracks[0].points[len].lon;


      console.log("LATITUDINE START", lat);
      console.log("LONGITUDINE START", lon);
      console.log("LATITUDINE END", lat_end);
      console.log("LONGITUDINE END", lon_end);

    });
  };

  setVerified = (user_id) => {
    return new Promise((resolve, reject) => {
      let query = "UPDATE user SET verified = 1 WHERE ID=?";

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
