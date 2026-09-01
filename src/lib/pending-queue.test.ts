import { describe, it, expect } from "vitest";
import { normalizePendingQueue } from "./pending-queue";

describe("normalizePendingQueue", () => {
  it("migra formato antigo booleano (true/false) para { purchased }", () => {
    expect(normalizePendingQueue({ a: true, b: false })).toEqual({
      a: { purchased: true },
      b: { purchased: false },
    });
  });

  it("preserva o formato novo por objeto", () => {
    expect(normalizePendingQueue({ a: { quantity: 3, priceCents: 1500 } })).toEqual({
      a: { quantity: 3, priceCents: 1500 },
    });
  });

  it("preserva priceCents null (≠ ausente)", () => {
    expect(normalizePendingQueue({ a: { priceCents: null } })).toEqual({ a: { priceCents: null } });
  });

  it("descarta lixo e campos desconhecidos", () => {
    expect(normalizePendingQueue({ a: "x", b: 5, c: { foo: 1 }, d: null })).toEqual({});
  });

  it("raw não-objeto vira fila vazia", () => {
    expect(normalizePendingQueue(null)).toEqual({});
    expect(normalizePendingQueue("nope")).toEqual({});
  });

  it("mistura antigo + novo no mesmo blob", () => {
    expect(normalizePendingQueue({ a: true, b: { quantity: 2 } })).toEqual({
      a: { purchased: true },
      b: { quantity: 2 },
    });
  });
});
