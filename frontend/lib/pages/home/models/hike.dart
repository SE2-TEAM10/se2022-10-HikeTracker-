import 'dart:convert';

class Hike {
  Hike({
    required this.id,
    required this.name,
    required this.length,
    required this.expectedTime,
    required this.ascent,
    required this.difficulty,
    required this.startPoint,
    required this.endPoint,
    required this.description,
    required this.startLocation,
    required this.endLocation,
    required this.hikeID,
  });

  final int id;
  final String name;
  final int length;
  final String expectedTime;
  final int ascent;
  final String difficulty;
  final String startPoint;
  final String endPoint;
  final String description;
  final Location startLocation;
  final Location endLocation;
  final int hikeID;

  static Hike fromJson(String jsonString) {
    final res = jsonDecode(jsonString);

    final ls = List<Location>.from(res['location']
        .map((e) => Location(
              name: e['name'] ?? 'NA',
              latitude: e['latitude'] ?? 'NA',
              longitude: e['longitude'] ?? 'NA',
              city: e['city'] ?? 'NA',
              province: e['province'] ?? 'NA',
            ))
        .toList());

    final h = Hike(
      id: res['id'] ?? 0,
      name: res['name'] ?? 'NA',
      length: res['length'] ?? 0,
      expectedTime: res['expected_time'] ?? 'NA',
      ascent: res['ascent'] ?? 0,
      difficulty: res['difficulty'] ?? 'NA',
      startPoint: res['start_point'] ?? 'NA',
      endPoint: res['end_point'] ?? 'NA',
      description: res['description'] ?? 'NA',
      hikeID: res['hike_ID'] ?? 0,
      endLocation: ls.firstWhere((e) => e.name == res['end_point']),
      startLocation: ls.firstWhere((e) => e.name == res['start_point']),
    );

    return h;
  }
}

class Hikes {
  Hikes({
    this.results,
  });

  final List<Hike>? results;

  static Hikes fromJson(String jsonString) {
    final res = jsonDecode(jsonString);
    final results = res as List<dynamic>;

    final result = Hikes(
      results: results.map((p) {
        return Hike.fromJson(
          json.encode(p),
        );
      }).toList(),
    );

    return result;
  }
}

class Location {
  Location({
    required this.name,
    required this.latitude,
    required this.longitude,
    required this.city,
    required this.province,
  });

  String name;
  String latitude;
  String longitude;
  String city;
  String province;

  static Location fromJson(String jsonString) {
    final res = jsonDecode(jsonString);

    return Location(
      name: res['name'] ?? 'NA',
      latitude: res['latitude'] ?? 'NA',
      longitude: res['longitude'] ?? 'NA',
      city: res['city'] ?? 'NA',
      province: res['province'] ?? 'NA',
    );
  }
}