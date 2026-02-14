import { expect } from "chai";
import { getHotelOptions } from "../src/helpers/hotels.js";

describe("hotels helper", () => {
  it("returns an error when check-out date is before check-in date", async () => {
    const result = await getHotelOptions({
      cityCode: "NYC",
      checkIn: "2026-02-10",
      checkOut: "2026-02-09",
      adults: 2,
    });

    expect(result).to.be.an("object");
    expect(result.ok).to.equal(false);
    expect(result.message).to.include("Check-out date must be after check-in date");
  });

  it("returns an error when check-out date equals check-in date", async () => {
    const result = await getHotelOptions({
      cityCode: "NYC",
      checkIn: "2026-02-10",
      checkOut: "2026-02-10",
      adults: 2,
    });

    expect(result.ok).to.equal(false);
    expect(result.message).to.include("Check-out date must be after check-in date");
  });
  it("returns an error when dates are invalid strings", async () => {
  const result = await getHotelOptions({
    cityCode: "NYC",
    checkIn: "not-a-date",
    checkOut: "still-not-a-date",
    adults: 2,
  });

  expect(result.ok).to.equal(false);
  expect(result.message).to.include("Check-out date must be after check-in date");
  });

});



