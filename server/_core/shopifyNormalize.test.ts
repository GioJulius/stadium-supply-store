import { describe, expect, it } from "vitest";
import { orderGalleryImages } from "./shopifyNormalize";

const cdn = "https://cdn.shopify.com/s/files/1/0841/4127/7399/files";

describe("orderGalleryImages", () => {
  it("moves the supplier size chart to the end and leads with the first product shot", () => {
    const gallery = [
      { url: `${cdn}/182235606_01.jpg?v=1788003062` },
      { url: `${cdn}/182235606_02.jpg?v=1788003062` },
      { url: `${cdn}/182235606_03.jpg?v=1788003062` },
    ];
    expect(orderGalleryImages(gallery).map(i => i.url)).toEqual([
      gallery[1].url,
      gallery[2].url,
      gallery[0].url,
    ]);
  });

  it("leaves galleries that don't use supplier numbering alone", () => {
    const gallery = [{ url: `${cdn}/iGYDZHOFtnRlBbTh.jpg` }, { url: `${cdn}/ENTuTkcdBntGdZFv.jpg` }];
    expect(orderGalleryImages(gallery)).toBe(gallery);
  });

  it("never empties a lead image when the chart is the only image", () => {
    const gallery = [{ url: `${cdn}/182235606_01.jpg` }];
    expect(orderGalleryImages(gallery)).toBe(gallery);
  });
});

describe("orderGalleryImages and the shape of a size chart", () => {
  // The client raised this on 5 Sep 2026: several listings led on a close-up
  // because their `_01` is the garment, not a chart. Charts are non-square.
  it("keeps a square _01, which is a garment photo and not a chart", () => {
    const gallery = [
      { url: `${cdn}/215918880_01.jpg`, width: 1400, height: 1400 },
      { url: `${cdn}/215918880_02.jpg`, width: 1400, height: 1400 },
    ];
    expect(orderGalleryImages(gallery)).toBe(gallery);
  });

  it("still demotes a wide _01, which is a measurement table", () => {
    const gallery = [
      { url: `${cdn}/182235606_01.jpg`, width: 1540, height: 1000 },
      { url: `${cdn}/182235606_02.jpg`, width: 1400, height: 1400 },
    ];
    expect(orderGalleryImages(gallery).map(i => i.url)).toEqual([gallery[1].url, gallery[0].url]);
  });

  it("falls back to the filename when a caller did not ask for dimensions", () => {
    const gallery = [{ url: `${cdn}/182235606_01.jpg` }, { url: `${cdn}/182235606_02.jpg` }];
    expect(orderGalleryImages(gallery).map(i => i.url)).toEqual([gallery[1].url, gallery[0].url]);
  });
});
