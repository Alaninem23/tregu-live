import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Complete US State Data
const US_LOCATIONS = {
  "CA": { name: "California", code: "CA", cities: ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "Oakland"] },
  "NY": { name: "New York", code: "NY", cities: ["New York City", "Buffalo", "Rochester", "Albany", "Syracuse"] },
  "TX": { name: "Texas", code: "TX", cities: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"] },
  "FL": { name: "Florida", code: "FL", cities: ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale"] },
  "IL": { name: "Illinois", code: "IL", cities: ["Chicago", "Springfield", "Peoria", "Naperville", "Aurora"] },
  "PA": { name: "Pennsylvania", code: "PA", cities: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading"] },
  "OH": { name: "Ohio", code: "OH", cities: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Dayton"] },
  "GA": { name: "Georgia", code: "GA", cities: ["Atlanta", "Augusta", "Savannah", "Athens", "Macon"] },
  "NC": { name: "North Carolina", code: "NC", cities: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem"] },
  "MI": { name: "Michigan", code: "MI", cities: ["Detroit", "Grand Rapids", "Warren", "Ann Arbor", "Lansing"] },
  "NJ": { name: "New Jersey", code: "NJ", cities: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Trenton"] },
  "VA": { name: "Virginia", code: "VA", cities: ["Virginia Beach", "Richmond", "Arlington", "Alexandria", "Roanoke"] },
  "WA": { name: "Washington", code: "WA", cities: ["Seattle", "Spokane", "Tacoma", "Bellevue", "Kent"] },
  "AZ": { name: "Arizona", code: "AZ", cities: ["Phoenix", "Mesa", "Scottsdale", "Chandler", "Tucson"] },
  "MA": { name: "Massachusetts", code: "MA", cities: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell"] },
  "TN": { name: "Tennessee", code: "TN", cities: ["Memphis", "Nashville", "Knoxville", "Chattanooga", "Clarksville"] },
  "MO": { name: "Missouri", code: "MO", cities: ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence"] },
  "IN": { name: "Indiana", code: "IN", cities: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Mishawaka"] },
  "MD": { name: "Maryland", code: "MD", cities: ["Baltimore", "Frederick", "Gaithersburg", "Bowie", "Annapolis"] },
  "WI": { name: "Wisconsin", code: "WI", cities: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine"] },
  "CO": { name: "Colorado", code: "CO", cities: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood"] },
  "MN": { name: "Minnesota", code: "MN", cities: ["Minneapolis", "St. Paul", "Rochester", "Duluth", "St. Cloud"] },
  "SC": { name: "South Carolina", code: "SC", cities: ["Charleston", "Columbia", "Greenville", "Spartanburg", "North Charleston"] },
  "AL": { name: "Alabama", code: "AL", cities: ["Birmingham", "Montgomery", "Mobile", "Huntsville", "Tuscaloosa"] },
  "LA": { name: "Louisiana", code: "LA", cities: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles"] },
  "KY": { name: "Kentucky", code: "KY", cities: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington"] },
  "OR": { name: "Oregon", code: "OR", cities: ["Portland", "Eugene", "Salem", "Gresham", "Hillsboro"] },
  "OK": { name: "Oklahoma", code: "OK", cities: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Lawton"] },
  "CT": { name: "Connecticut", code: "CT", cities: ["Bridgeport", "New Haven", "Hartford", "Waterbury", "Stamford"] },
  "UT": { name: "Utah", code: "UT", cities: ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem"] },
  "KS": { name: "Kansas", code: "KS", cities: ["Wichita", "Overland Park", "Kansas City", "Topeka", "Olathe"] },
  "AR": { name: "Arkansas", code: "AR", cities: ["Little Rock", "Fayetteville", "Jonesboro", "Fort Smith", "Bentonville"] },
  "NV": { name: "Nevada", code: "NV", cities: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks"] },
  "MS": { name: "Mississippi", code: "MS", cities: ["Jackson", "Gulfport", "Hattiesburg", "Biloxi", "Meridian"] },
  "NM": { name: "New Mexico", code: "NM", cities: ["Albuquerque", "Las Cruces", "Santa Fe", "Rio Rancho", "Farmington"] },
  "WV": { name: "West Virginia", code: "WV", cities: ["Charleston", "Huntington", "Morgantown", "Wheeling", "Parkersburg"] },
  "NE": { name: "Nebraska", code: "NE", cities: ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney"] },
  "ID": { name: "Idaho", code: "ID", cities: ["Boise", "Meridian", "Nampa", "Caldwell", "Coeur d'Alene"] },
  "HI": { name: "Hawaii", code: "HI", cities: ["Honolulu", "Pearl City", "Kailua", "Ahuimanu", "Waipahu"] },
  "NH": { name: "New Hampshire", code: "NH", cities: ["Manchester", "Nashua", "Concord", "Portsmouth", "Rochester"] },
  "ME": { name: "Maine", code: "ME", cities: ["Portland", "Lewiston", "Bangor", "Auburn", "Augusta"] },
  "MT": { name: "Montana", code: "MT", cities: ["Billings", "Missoula", "Great Falls", "Bozeman", "Butte"] },
  "RI": { name: "Rhode Island", code: "RI", cities: ["Providence", "Warwick", "Cranston", "Pawtucket", "Woonsocket"] },
  "DE": { name: "Delaware", code: "DE", cities: ["Wilmington", "Dover", "Newark", "Middletown", "Seaford"] },
  "SD": { name: "South Dakota", code: "SD", cities: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown"] },
  "ND": { name: "North Dakota", code: "ND", cities: ["Bismarck", "Fargo", "Grand Forks", "Minot", "Williston"] },
  "AK": { name: "Alaska", code: "AK", cities: ["Anchorage", "Juneau", "Fairbanks", "Ketchikan", "Sitka"] },
  "WY": { name: "Wyoming", code: "WY", cities: ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs"] },
  "VT": { name: "Vermont", code: "VT", cities: ["Burlington", "Rutland", "Essex", "Colchester", "South Burlington"] },
  "DC": { name: "Washington D.C.", code: "DC", cities: ["Washington"] },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const state = searchParams.get("state");

  try {
    // Return all states
    if (!type || type === "states") {
      const states = Object.values(US_LOCATIONS).map(s => ({
        id: s.code,
        code: s.code,
        name: s.name
      }));
      return NextResponse.json(states);
    }

    // Return cities for a specific state
    if (type === "cities" && state) {
      const location = US_LOCATIONS[state as keyof typeof US_LOCATIONS];
      if (!location) {
        return NextResponse.json({ error: "State not found" }, { status: 404 });
      }
      return NextResponse.json(
        location.cities.map(city => ({ id: city, name: city }))
      );
    }

    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("Locations endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
