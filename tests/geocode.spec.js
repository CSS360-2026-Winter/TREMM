import { expect } from "chai";
import { geocodePlace } from "../src/helpers/geocode.js";

describe("geocode helper", () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
  });

  it("returns null when the geocoding API returns no results", async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => [],
    });

    const result = await geocodePlace("SomeMadeUpPlaceThatShouldNotExist123");
    expect(result).to.equal(null);
  });

  it("returns lat/lon when the geocoding API returns a result", async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => [
        {
          lat: "47.6062",
          lon: "-122.3321",
          display_name: "Seattle, King County, Washington, USA",
        },
      ],
    });

    const result = await geocodePlace("Seattle");
    expect(result).to.be.an("object");
    expect(result.lat).to.equal(47.6062);
    expect(result.lon).to.equal(-122.3321);
    expect(result.displayName).to.include("Seattle");
  });
});
