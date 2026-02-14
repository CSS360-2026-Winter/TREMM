import { expect } from "chai";
import { getFlightOptions } from "../src/helpers/flights.js";

describe("flights helper", () => {
  const oldId = process.env.AMADEUS_CLIENT_ID;
  const oldSecret = process.env.AMADEUS_CLIENT_SECRET;

  beforeEach(() => {
    delete process.env.AMADEUS_CLIENT_ID;
    delete process.env.AMADEUS_CLIENT_SECRET;
  });

  afterEach(() => {
    process.env.AMADEUS_CLIENT_ID = oldId;
    process.env.AMADEUS_CLIENT_SECRET = oldSecret;
  });

  it("returns a clear error when Amadeus credentials are missing", async () => {
    const result = await getFlightOptions({
      origin: "SEA",
      destination: "LAX",
      departureDate: "2026-02-20",
      adults: 1,
    });

    expect(result).to.be.an("object");
    expect(result.ok).to.equal(false);
    expect(result.message).to.include("Amadeus credentials not found");
  });

  it("returns a clear error when required fields are missing", async () => {
    const result = await getFlightOptions({
      origin: "",
      destination: "LAX",
      departureDate: "",
      adults: 1,
    });

    expect(result.ok).to.equal(false);
    expect(result.message).to.include("Missing required fields");
  });
  it("fails if only departureDate is missing", async () => {
  const result = await getFlightOptions({
    origin: "SEA",
    destination: "LAX",
    departureDate: "",
    adults: 1,
  });

  expect(result.ok).to.equal(false);
  expect(result.message).to.include("Missing required fields");
});

});
